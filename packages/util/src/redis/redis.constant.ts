/**redis数据结构类型 */
export const enum REDIS_DATA_TYPE {
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

/**RedisBaseRepository名字 */
export const enum REDIS_BASE_REPOSITORY_NAME {
    /**全局信息 */
    GLOBAL_VALUE = "globalValue",
}

/**redis数据添加 */
export const CHANGE_ADD_FLAG = 1;

/**redis数据删除 */
export const CHANGE_DEL_FLAG = -1;

/**全局唯一id枚举 */
export const enum GLOBAL_VALUE_BASE_ENTITY_ID {
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
export const enum MQ_BASE_KEY_TYPE {
    /**消费者已消费完成集合 */
    CONSUME_COMPLETE = "consumeComplete",
}
