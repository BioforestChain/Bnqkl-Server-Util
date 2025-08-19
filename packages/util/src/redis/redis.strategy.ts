import { EventEmitterPro } from "@bnqkl/util-node";
import { CHANGE_ADD_FLAG, CHANGE_DEL_FLAG, REDIS_DATA_TYPE } from "./redis.constant.js";
import { redisCore } from "./redis.core.js";
import { RedisHelper } from "./redis.helper.js";

/**Redis存储策略 */
export abstract class RedisStrategy<OptionType extends ServerUtil.Redis.RedisOptionType>
    extends EventEmitterPro<ServerUtil.Redis.RedisStrategyEvents>
    implements ServerUtil.Redis.RedisStrategy
{
    constructor(protected __redisType: string, protected __options: ServerUtil.Redis.RedisOptionDef<OptionType>) {
        super();

        /**
         * 普通key变化
         */
        this.on("onKeyChanged", async (entityId: string, ...hArgs: [string, string | number][]) => {
            if (!(hArgs instanceof Array)) {
                hArgs = [hArgs];
            }
            const dataType = REDIS_DATA_TYPE.KEY;
            const promises = hArgs.map(async (arg) => {
                const keyType = arg[0];
                if (!this.isNeedSave(dataType, keyType)) {
                    return;
                }
                const value = arg[1];
                this.__redis.hSet(this.getDataChangeKey(dataType, entityId), keyType, value);
            });
            await Promise.all(promises);
        });

        /**
         * 计数器变化
         */
        this.on("onCouterChanged", async (entityId: string, ...hArgs: [string, number][]) => {
            if (!(hArgs instanceof Array)) {
                hArgs = [hArgs];
            }
            const dataType = REDIS_DATA_TYPE.COUNTER;
            const promises = hArgs.map(async (arg) => {
                const keyType = arg[0];
                if (!this.isNeedSave(dataType, keyType)) {
                    return;
                }
                const value = arg[1];
                this.__redis.hSet(this.getDataChangeKey(dataType, entityId), keyType, value);
            });
            await Promise.all(promises);
        });

        /**
         * 无序列表数据增加
         */
        this.on("onSetAdd", async (entityId: string, keyType: string, members: string | string[]) => {
            const dataType = REDIS_DATA_TYPE.SET;
            if (!this.isNeedSave(dataType, keyType)) {
                return;
            }
            if (!(members instanceof Array)) {
                members = [members];
            }
            const promises = members.map(async (member) => {
                const key = this.getDataChangeKey(dataType, entityId, keyType);
                const curValue = await this.__redis.hGet(key, member);
                if (!curValue) {
                    await this.__redis.hSet(key, member, CHANGE_ADD_FLAG);
                } else if (parseInt(curValue) === CHANGE_DEL_FLAG) {
                    //已经删除的再增加，则无变化
                    await this.__redis.hDel(key, member);
                }
            });
            await Promise.all(promises);
        });

        /**
         * 无序列表数据删除
         */
        this.on("onSetDelete", async (entityId: string, keyType: string, members: string | string[]) => {
            const dataType = REDIS_DATA_TYPE.SET;
            if (!this.isNeedSave(dataType, keyType)) {
                return;
            }
            if (!(members instanceof Array)) {
                members = [members];
            }
            const promises = members.map(async (member) => {
                const key = this.getDataChangeKey(dataType, entityId, keyType);
                const curValue = await this.__redis.hGet(key, member);
                if (!curValue) {
                    await this.__redis.hSet(key, member, CHANGE_DEL_FLAG);
                } else if (parseInt(curValue) === CHANGE_ADD_FLAG) {
                    //已经增加的再删除，则无变化
                    await this.__redis.hDel(key, member);
                }
            });
            await Promise.all(promises);
        });

        /**
         * 有序列表数据增加
         */
        this.on("onZSetAdd", async (entityId: string, keyType: string, members: ServerUtil.Redis.ZMember | ServerUtil.Redis.ZMember[]) => {
            const dataType = REDIS_DATA_TYPE.ZSET;
            if (!this.isNeedSave(dataType, keyType)) {
                return;
            }
            if (!(members instanceof Array)) {
                members = [members];
            }
            const promises = members.map(async (member) => {
                const key = this.getDataChangeKey(dataType, entityId, keyType);
                const curValue = await this.__redis.hGet(key, member.value);
                if (!curValue) {
                    await this.__redis.hSet(key, member.value, member.score);
                } else if (parseInt(curValue) === CHANGE_DEL_FLAG) {
                    //已经删除的再增加，则无变化
                    await this.__redis.hDel(key, member.value);
                }
            });
            await Promise.all(promises);
        });

        /**
         * 有序列表数据删除
         */
        this.on("onZSetDelete", async (entityId: string, keyType: string, members: string | string[]) => {
            const dataType = REDIS_DATA_TYPE.ZSET;
            if (!this.isNeedSave(dataType, keyType)) {
                return;
            }
            if (!(members instanceof Array)) {
                members = [members];
            }
            const promises = members.map(async (member) => {
                const key = this.getDataChangeKey(dataType, entityId, keyType);
                const curValue = await this.__redis.hGet(key, member);
                if (!curValue) {
                    await this.__redis.hSet(key, member, CHANGE_DEL_FLAG);
                } else if (parseInt(curValue) !== CHANGE_DEL_FLAG) {
                    //已经增加的再删除，则无变化
                    await this.__redis.hDel(key, member);
                }
            });
            await Promise.all(promises);
        });

        /**
         * 哈希表变化
         */
        this.on("onHashChanged", async (entityId: string, keyType: string, ...hArgs: [string, string | number][]) => {
            const dataType = REDIS_DATA_TYPE.HASH;
            if (!this.isNeedSave(dataType, keyType)) {
                return;
            }
            if (!(hArgs instanceof Array)) {
                hArgs = [hArgs];
            }
            const promises = hArgs.map(async (arg) => {
                const hKey = arg[0];
                const hValue = arg[1];
                this.__redis.hSet(this.getDataChangeKey(dataType, entityId, keyType), hKey, hValue);
            });
            await Promise.all(promises);
        });
    }

    protected get __redis() {
        return redisCore.redis;
    }

    getSaveOption(dataType: REDIS_DATA_TYPE, keyType: string) {
        return this.__options[dataType]?.[keyType];
    }

    isNeedSave(dataType: REDIS_DATA_TYPE, keyType: string) {
        const saveOption = this.getSaveOption(dataType, keyType);
        return saveOption !== undefined;
    }

    /**
     * 获取数据变化的key
     * @param dataType
     * @param entityId
     * @param keyType
     * @returns
     */
    getDataChangeKey(dataType: REDIS_DATA_TYPE, entityId: string, keyType?: string) {
        return RedisHelper.getDataChangeKey(this.__redisType, dataType, entityId, keyType);
    }

    /**
     * 获取数据变化信息
     * @param dataType
     * @param entityId
     * @param keyType
     * @returns
     */
    async getDataChangeInfo(dataType: REDIS_DATA_TYPE, entityId: string, keyType: string) {
        return await this.__redis.hGetAll(this.getDataChangeKey(dataType, entityId, keyType));
    }

    /**
     * 保存变动的数据到磁盘
     * @param dataType
     * @param entityId
     * @param keyType
     * @returns
     */
    abstract saveChange(dataType: REDIS_DATA_TYPE, entityId: string, keyType: string): Promise<boolean>;
}
