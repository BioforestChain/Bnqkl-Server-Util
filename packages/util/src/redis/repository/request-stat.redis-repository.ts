import { Injectable } from "@bnqkl/util-node";
import { timeFormaterToDate } from "../../helper/index.js";
import { GLOBAL_VALUE_BASE_ENTITY_ID, REDIS_BASE_REPOSITORY_NAME } from "../redis.constant.js";
import { redisCore } from "../redis.core.js";
import { RedisRepository } from "../redis.repository.js";

@Injectable()
export class RequestStatRedisRepository extends RedisRepository {
    constructor() {
        super(REDIS_BASE_REPOSITORY_NAME.GLOBAL_VALUE);
    }

    /**
     * 增加接口每日调用次数
     * @param path
     * @returns
     */
    async incrApiDailyCount(path: string) {
        const key = `${GLOBAL_VALUE_BASE_ENTITY_ID.API_STAT_INFO}:${timeFormaterToDate()}`;
        return await this.incrbyCounterNum(key, path, 1);
    }

    /**
     * 增加ip的每日调用接口次数
     * @param ip
     * @returns
     */
    async incrIpCallInterfaceDailyCount(ip: string) {
        const key = `${GLOBAL_VALUE_BASE_ENTITY_ID.IP_CALL_INTERFACE_STATINFO}:${timeFormaterToDate()}`;
        return await this.incrbyCounterNum(key, ip, 1);
    }

    /**
     * 获取所有ip的每日调用接口次数
     */
    async getIpCallInterfaceStatInfo(): Promise<{ [key: string]: string }> {
        const key = `${GLOBAL_VALUE_BASE_ENTITY_ID.IP_CALL_INTERFACE_STATINFO}:${timeFormaterToDate()}`;
        return await redisCore.redis.hGetAll(this.getDataKey(key));
    }
}
