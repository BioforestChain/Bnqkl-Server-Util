import * as fs from "fs-extra";
import * as path from "path";
import type { REDIS_DATA_TYPE } from "./redis.constant.js";

export class RedisHelper {
    static getDataKey(name: string, entityId: string) {
        return `data:${name}:${entityId}`;
    }

    static getZSetKey(name: string, entityId: string, keyType: string) {
        return `zSet:${name}:${entityId}:${keyType}`;
    }

    static getBloomKey(name: string, entityId: string, keyType: string) {
        return `bloom:${name}:${entityId}:${keyType}`;
    }

    static getSetKey(name: string, entityId: string, keyType: string) {
        return `set:${name}:${entityId}:${keyType}`;
    }

    static getHashKey(name: string, entityId: string, keyType: string) {
        return `hash:${name}:${entityId}:${keyType}`;
    }

    static getListKey(name: string, entityId: string, keyType: string) {
        return `list:${name}:${entityId}:${keyType}`;
    }

    static getDataChangeKey(name: string, dataType: REDIS_DATA_TYPE, entityId: string, keyType?: string) {
        return `dataChange:${name}:${entityId}:${dataType}${keyType ? `:${keyType}` : ""}`;
    }

    static getBloomDirName(name: string, bloomKey: string, rootPath = "redisCache") {
        // :改成-，因为dir不能有:
        return path.join(process.cwd(), rootPath, name, bloomKey.replace(/:/g, "-"));
    }

    /**
     * 保存布隆过滤器到dp
     * @param fileDir
     * @param dumps
     */
    static saveBloomToFile(fileDir: string, dumps: { index: number; data: Buffer }[]): void {
        if (!fs.existsSync(fileDir)) {
            fs.mkdirsSync(fileDir);
        }
        for (const { index, data } of dumps) {
            const filePath = path.join(fileDir, `${index}`);
            fs.writeFileSync(filePath, data);
        }
    }

    /**
     * 从文件中加载布隆过滤器
     * @param fileDir
     */
    static loadBloomFromFile(fileDir: string): { index: number; data: Buffer }[] {
        if (!fs.existsSync(fileDir)) {
            return [];
        }
        const files = fs.readdirSync(fileDir);
        const datas: { index: number; data: Buffer }[] = [];
        for (const fileName of files) {
            const data = fs.readFileSync(path.join(fileDir, fileName));
            datas.push({ index: Number(fileName), data });
        }
        return datas;
    }

    /**
     * 从set得到布隆过滤器的dump内容
     * @param allMembers
     * @returns
     */
    static getBloomDumpBySet(allMembers: string[]) {
        return [{ index: 1, data: Buffer.from(JSON.stringify(allMembers)) }];
    }
}
