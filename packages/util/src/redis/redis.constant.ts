/**redis数据结构类型 */
export const enum RedisDataType {
    /**普通key */
    KEY = "key",
    /**计数器 */
    COUNTER = "counter",
    /**集合 */
    SET = "set",
    /**有序集合 */
    ZSET = "zSet",
    /**哈希表 */
    HASH = "hash",
    /**列表 */
    LIST = "list",
}

/**RedisBaseEntity名字 */
export const enum RedisBaseEntityName {
    /**全局信息 */
    GLOBAL_VALUE = "globalValue",
}

/**redis数据添加 */
export const CHANGE_ADD_FLAG = 1;

/**redis数据删除 */
export const CHANGE_DEL_FLAG = -1;

/**Redis页信息 */
export class RedisPageData<T> {
    constructor(
        public page = 1,
        public pageSize = 10,
        public dataList: T[] = [],
        public total = 0,
        public hasMore = total - (page - 1) * pageSize > pageSize,
        public skip = (page - 1) * pageSize,
    ) {}
}

/**全局唯一id枚举 */
export const enum GlobalValueBaseEntityId {
    /**每日接口统计信息 */
    API_STAT_INFO = "apiStatInfo",
    /**ip每日调用接口次数的统计信息 */
    IP_CALL_INTERFACE_STATINFO = "ipCallInterfaceStatInfo",
    /**配置相关 */
    CONFIG = "config",
    /**mq相关 */
    MQ = "mq",
}

/**mq相关key类型 */
export const enum MqBaseKeyType {
    /**消费者已消费完成集合 */
    CONSUME_COMPLETE = "consumeComplete",
}
