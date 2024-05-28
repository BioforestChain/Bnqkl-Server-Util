import * as path from "path";
import * as fs from "fs";
import { InjectDataSource } from "@nestjs/typeorm";
import { DataSource } from "typeorm";
import { redisCore } from "../redis";
import { CommonHelper, sleep } from "../helper";
import { Logger } from "../log4j/log4j";

const upgradeRootPath = path.join(process.cwd(), "DB");

export abstract class BaseUpgradeService {
    @InjectDataSource()
    private readonly __dataSource: DataSource;

    /**mysql版本号 */
    MYSQL_VERSION_KEY = "mysqlVersionKey";
    /**更新补丁版本号 */
    PATCH_VERSION_KEY = "patchVersionKey";

    private __mysqlUpdateList: ServerUtil.Upgrade.MysqlUpdateList;

    constructor() {
        const updateFile = fs.readFileSync(path.join(upgradeRootPath, "mysql-upgrade.json")).toString("utf-8");
        this.__mysqlUpdateList = JSON.parse(updateFile);
    }

    /**
     * 更新
     */
    async upgrade() {
        // 先更新sql
        await this.__mysqlUpgrade();
        // 再更新补丁
        await this.__patchUpgrade();
    }

    /**
     * 等待更新完成
     */
    async waitUpgradeDone() {
        await this.__waitMysqlUpgradeDone();
        await this.__waitPatchUpgradeDone();
    }

    /**
     * 更新mysql的sql文件
     */
    private async __mysqlUpgrade() {
        const localMysqlVersion = this.__getLocalMysqlVersion();
        if (!localMysqlVersion) {
            return;
        }
        const remoteMysqlVersion = await redisCore.redis.get(this.MYSQL_VERSION_KEY);
        if (remoteMysqlVersion && CommonHelper.compareVersion(localMysqlVersion, remoteMysqlVersion) === 0) {
            return;
        }
        await this.__upgradeSql();
    }

    /**
     * 更新补丁
     */
    private async __patchUpgrade() {
        const localPatchVersion = this.__getLocalPatchVersion();
        if (!localPatchVersion) {
            return;
        }
        const remotePatchVersion = await redisCore.redis.get(this.PATCH_VERSION_KEY);
        if (remotePatchVersion && CommonHelper.compareVersion(localPatchVersion, remotePatchVersion) === 0) {
            return;
        }
        await this.__upgradePatch();
    }

    private __getLocalMysqlVersion() {
        if (this.__mysqlUpdateList.length === 0) {
            return;
        }
        return this.__mysqlUpdateList[this.__mysqlUpdateList.length - 1].version;
    }

    // 将版本往下累加
    abstract patchVersionsArray: ServerUtil.Upgrade.PatchVersionArray[];
    private __getLocalPatchVersion() {
        if (this.patchVersionsArray.length === 0) {
            return;
        }
        return this.patchVersionsArray[this.patchVersionsArray.length - 1].version;
    }

    /**
     * 更新mysql的sql文件
     */
    private async __upgradeSql() {
        let currentVersion = await redisCore.redis.get(this.MYSQL_VERSION_KEY);
        Logger.info(`current mysql version: ${currentVersion}`);
        for (const { version, describe, fileName } of this.__mysqlUpdateList) {
            if (!currentVersion || CommonHelper.compareVersion(currentVersion, version) < 0) {
                Logger.info(`当前sql版本号为 ${currentVersion}, 正在更新 ${version} ${describe}`);
                const sqlFile = fs.readFileSync(path.join(upgradeRootPath, fileName)).toString("utf-8");
                if (!sqlFile) {
                    const msg = `没有找到更新sql ${fileName}`;
                    Logger.warn(msg);
                    throw msg;
                }
                for (const query of sqlFile.split(";")) {
                    if (query && query.trim()) {
                        await this.__dataSource.query(query);
                    }
                }
                await redisCore.redis.set(this.MYSQL_VERSION_KEY, version);
                currentVersion = version;
            }
        }
    }

    /**
     * 更新补丁
     */
    private async __upgradePatch() {
        let currentVersion = await redisCore.redis.get(this.PATCH_VERSION_KEY);
        Logger.info(`current mysql patch version: ${currentVersion}`);
        for (const { version, describe, method } of this.patchVersionsArray) {
            if (!currentVersion || CommonHelper.compareVersion(currentVersion, version) < 0) {
                Logger.info(`当前补丁版本号为 ${currentVersion}, 正在更新 ${version} ${describe}`);
                if (!this[method]) {
                    const msg = `没有找到更新函数 ${method}`;
                    Logger.warn(msg);
                    throw msg;
                }
                await this[method]();
                await redisCore.redis.set(this.PATCH_VERSION_KEY, version);
                currentVersion = version;
            }
        }
    }

    /**
     * 等待mysql版本号更新
     */
    private async __waitMysqlUpgradeDone() {
        const localMysqlVersion = this.__getLocalMysqlVersion();
        if (localMysqlVersion) {
            while (true) {
                const remoteMysqlVersion = await redisCore.redis.get(this.MYSQL_VERSION_KEY);
                if (remoteMysqlVersion) {
                    if (CommonHelper.compareVersion(localMysqlVersion, remoteMysqlVersion) < 0) {
                        //本地版本号比远端低，说明服务端过旧，禁止启动
                        throw Error(
                            `localMysqlVersion: ${localMysqlVersion} is less than remoteMysqlVersion: ${remoteMysqlVersion}. version is lower. please use latest version.`,
                        );
                    }
                    if (CommonHelper.compareVersion(localMysqlVersion, remoteMysqlVersion) === 0) {
                        //版本号相等时，表示远端global初始化完毕
                        break;
                    }
                }
                await sleep(1000);
            }
        }
        Logger.info("mysql upgrade done!");
    }

    /**
     * 等待补丁版本号更新
     */
    private async __waitPatchUpgradeDone() {
        const localPatchVersion = this.__getLocalPatchVersion();
        if (localPatchVersion) {
            while (true) {
                const remotePatchVersion = await redisCore.redis.get(this.PATCH_VERSION_KEY);
                if (remotePatchVersion) {
                    if (CommonHelper.compareVersion(localPatchVersion, remotePatchVersion) < 0) {
                        //本地版本号比远端低，说明服务端过旧，禁止启动
                        throw Error(
                            `localPatchVersion: ${localPatchVersion} is less than remotePatchVersion: ${remotePatchVersion}. version is lower. please use latest version.`,
                        );
                    }
                    if (CommonHelper.compareVersion(localPatchVersion, remotePatchVersion) === 0) {
                        //版本号相等时，表示远端global初始化完毕
                        break;
                    }
                }
                await sleep(1000);
            }
        }
        Logger.info("patch upgrade done!");
    }
}
