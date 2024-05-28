import { Injectable } from "@bnqkl/util-node";
import { timeFormaterToDate } from "../../helper";
import { GlobalValueBaseEntityId, RedisBaseEntityName } from "../redis.constant";
import { redisCore } from "../redis.core";
import { RedisEntity } from "../redis.entity";

@Injectable()
export class RequestStatRedisEntity extends RedisEntity {
    constructor() {
        super(RedisBaseEntityName.GLOBAL_VALUE);
    }

    /**
     * 增加接口每日调用次数
     * @param path
     * @returns
     */
    async incrApiDailyCount(path: string) {
        const key = `${GlobalValueBaseEntityId.API_STAT_INFO}:${timeFormaterToDate()}`;
        return await this.incrbyCounterNum(key, path, 1);
    }

    /**
     * 增加ip的每日调用接口次数
     * @param ip
     * @returns
     */
    async incrIpCallInterfaceDailyCount(ip: string) {
        const key = `${GlobalValueBaseEntityId.IP_CALL_INTERFACE_STATINFO}:${timeFormaterToDate()}`;
        return await this.incrbyCounterNum(key, ip, 1);
    }

    /**
     * 获取所有ip的每日调用接口次数
     */
    async getIpCallInterfaceStatInfo(): Promise<{ [key: string]: string }> {
        const key = `${GlobalValueBaseEntityId.IP_CALL_INTERFACE_STATINFO}:${timeFormaterToDate()}`;
        return await redisCore.redis.hGetAll(this.getDataKey(key));
    }
}
