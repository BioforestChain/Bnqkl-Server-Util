export {};
declare global {
    export namespace ServerUtil {
        export namespace Redis {
            export type ServerConfig = {
                host: string;
                port: number;
                password: string;
                db: number;
            };

            export type EventEmitterPro<EM = {}, EM2 = never> = import("@bnqkl/util-node").EventEmitterPro<EM, EM2>;
            export type RedisDataType = import("./redis.constant").REDIS_DATA_TYPE;

            export interface RedisConfig {
                /**是否使用布隆过滤器 */
                useBloom?: boolean;
            }

            export type ZMember = {
                score: number;
                value: string;
            };

            export type RedisPageData<T> = import("./redis.constant").RedisPageData<T>;

            export interface ZInterOptions {
                WEIGHTS?: Array<number>;
                AGGREGATE?: "SUM" | "MIN" | "MAX";
            }

            export type ZInterStoreOptions = ZInterOptions;
            export type ZUnionOptions = ZInterOptions;
            export type ZUnionStoreOptions = ZUnionOptions;

            /**RedisRepository */
            export interface RedisRepository {
                /**
                 * 忽略某个对象的数据变化
                 */
                ignoreDataChange(entityId: string, value: boolean): void;

                /**
                 * 获取redis里data的key
                 * @param entityId
                 * @returns
                 */
                getDataKey(entityId: string): string;

                /**
                 * 获取redis里布隆过滤器的key
                 * @param entityId
                 * @param keyType
                 * @returns
                 */
                getBloomKey(entityId: string, keyType: string): string;

                /**
                 * 获取redis里zSet的key
                 * @param entityId
                 * @param keyType
                 * @returns
                 */
                getZSetKey(entityId: string, keyType: string): string;

                /**
                 * 获取redis里set的key
                 * @param entityId
                 * @param keyType
                 * @returns
                 */
                getSetKey(entityId: string, keyType: string): string;

                /**
                 * 获取redis里hash的key
                 * @param entityId
                 * @param keyType
                 * @returns
                 */
                getHashKey(entityId: string, keyType: string): string;

                /**
                 * 获取符合模式的所有key
                 * @param pattern
                 */
                keys(pattern: string): Promise<string[]>;

                /**
                 * 删除一个或多个Key
                 * @param keys
                 */
                del(keys: string | string[]): Promise<number>;

                /**
                 * 设置key的过期时间
                 * @param key
                 * @param seconds
                 * @param mode
                 * @returns
                 */
                expire(key: string, seconds: number, mode?: "NX" | "XX" | "GT" | "LT"): Promise<boolean>;

                /**
                 * 重命名一个key
                 * @param key
                 * @param newKey
                 * @returns
                 */
                rename(key: string, newKey: string): Promise<string>;

                /**
                 * 设置普通key
                 * @param entityId
                 * @param hKey
                 * @param hValue
                 */
                setKeyValue(entityId: string, hKey: string, hValue: string | number): Promise<number>;
                /**
                 * 设置多个普通key
                 * @param entityId
                 * @param hArgs
                 * @returns
                 */
                setMultiKeyValue(entityId: string, ...hArgs: [string, string | number][]): Promise<number>;

                /**
                 * 获取普通key的值
                 * @param entityId
                 * @param hKey
                 * @returns
                 */
                getKeyValue(entityId: string, hKey: string): Promise<string>;

                /**
                 * 获取多个普通key的值
                 * @param entityId
                 * @param keyTypes
                 * @returns
                 */
                getMultiKeyValue(entityId: string, keyTypes: string[]): Promise<string[]>;

                /**
                 * 删除普通key
                 * @param entityId
                 * @param hKeys
                 * @returns
                 */
                delKeyValue(entityId: string, hKeys: string[]): Promise<boolean>;

                /**
                 * 设置计数器的值
                 * @param entityId
                 * @param hKey
                 * @param hValue
                 */
                setCounterNum(entityId: string, hKey: string, hValue: number): Promise<number>;

                /**
                 * 设置多个计数器的值
                 * @param entityId
                 * @param hArgs
                 */
                setMultiCounterNum(entityId: string, ...hArgs: [string, number][]): Promise<number>;

                /**
                 * 获取计数器的值
                 * @param entityId
                 * @param hKey
                 * @returns
                 */
                getCounterNum(entityId: string, hKey: string): Promise<number>;

                /**
                 * 获取多个计数器的值
                 * @param entityId
                 * @param hKeys
                 * @returns
                 */
                getMultiCounterNum(entityId: string, hKeys: string[]): Promise<number[]>;

                /**
                 * 增加或减少计数器的值
                 * @param entityId
                 * @param hKey
                 * @param increment
                 */
                incrbyCounterNum(entityId: string, hKey: string, increment: number): Promise<number>;

                /**
                 * 删除counter
                 * @param entityId
                 * @param hKeys
                 * @returns
                 */
                delCounter(entityId: string, hKeys: string[]): Promise<boolean>;

                /**
                 * 获取ZSet里成员的值
                 * @param entityId
                 * @param keyType
                 * @param member
                 * @param increment
                 * @returns
                 */
                getZSetScore(entityId: string, keyType: string, member: string): Promise<number>;

                /**
                 * 获取ZSet里成员的值
                 * @param entityId
                 * @param keyType
                 * @param member
                 * @param increment
                 * @returns
                 */
                mGetZSetScore(entityId: string, keyType: string, members: string[]): Promise<number[]>;

                /**
                 * 增加或减少ZSet里成员的值
                 * @param entityId
                 * @param keyType
                 * @param member
                 * @param increment
                 * @returns
                 */
                incrbyZSet(entityId: string, keyType: string, member: string, increment: number): Promise<number>;

                /**
                 * 向zSet里加入成员
                 * @param entityId
                 * @param keyType
                 * @param members
                 * @param NX
                 */
                addToZSet(entityId: string, keyType: string, members: ZMember | ZMember[], NX: boolean): Promise<boolean>;

                /**
                 * 从zSet里删除成员
                 * @param entityId
                 * @param keyType
                 * @param members
                 */
                delFromZSet(entityId: string, keyType: string, members: string | string[]): Promise<boolean>;

                /**
                 * 以score范围来删除zSet成员
                 * @param keyType
                 * @param min
                 * @param max
                 * @returns
                 */
                delRangeByScoreFromZSet(entityId: string, keyType: string, min: number, max: number): Promise<number>;

                /**
                 * 获得zSet的某一页成员数据
                 * @param entityId
                 * @param keyType
                 * @param page
                 * @param pageSize 0表示取所有成员数据
                 * @param minScore 取>=minScore的所有成员
                 * @param maxScore 取<=maxScore的所有成员
                 * @param rev 结果是否按score的倒序
                 * @returns
                 */
                getZSetRange(
                    entityId: string,
                    keyType: string,
                    page: number,
                    pageSize: number,
                    minScore?: number,
                    maxScore?: number,
                    rev?: true,
                ): Promise<ZMember[]>;

                /**
                 * 获得zSet的所有成员
                 * @param entityId
                 * @param keyType
                 * @returns
                 */
                getZSetRangeByScore(entityId: string, keyType: string, min: number, max: number): Promise<ZMember[]>;

                /**
                 * 是否是zSet里的成员
                 * @param entityId
                 * @param keyType
                 * @param member
                 * @returns
                 */
                isZSetMember(entityId: string, keyType: string, member: string): Promise<boolean>;

                /**
                 * zSet是否存在
                 * @param entityId
                 * @param keyType
                 * @returns
                 */
                hasZSetKey(entityId: string, keyType: string): Promise<boolean>;

                /**
                 * 获得zSet里<=maxScore的成员总数
                 * @param entityId
                 * @param keyType
                 * @param maxScore
                 * @returns
                 */
                getZSetMemberCount(entityId: string, keyType: string, maxScore: number): Promise<number>;

                /**
                 * 获得zSet的所有成员
                 * @param entityId
                 * @param keyType
                 * @returns
                 */
                getZSetAllMembers(entityId: string, keyType: string): Promise<string[]>;

                /**
                 * 清空zSet
                 * @param entityId
                 * @param keyType
                 */
                clearZSet(entityId: string, keyType: string): Promise<number>;

                /**
                 * 获取zSet下最大的score
                 * @param entityId
                 * @param keyType
                 */
                getZSetMaxScore(entityId: string, keyType: string): Promise<number | undefined>;

                /**
                 * 获取zSet下最大的score的value
                 * @param entityId
                 * @param keyType
                 */
                getZSetMaxScoreValue(entityId: string, keyType: string): Promise<string | undefined>;

                /**
                 * 获取zSet下最小的score
                 * @param entityId
                 * @param keyType
                 */
                getZSetMinScore(entityId: string, keyType: string): Promise<number | undefined>;

                /**
                 * 获取zSet下最小的score的value
                 * @param entityId
                 * @param keyType
                 */
                getZSetMinScoreValue(entityId: string, keyType: string): Promise<string | undefined>;

                /**
                 * 获取zSet分页数据
                 * @param entityId
                 * @param keyType
                 * @param page
                 * @param pageSize
                 * @param valueFunc 结果集处理函数
                 * @param filter 结果集过滤函数，不符合的值会从zSet中删除
                 * @param minScore 只筛选score>=minScore
                 * @param maxScore 只筛选score<=maxScore
                 * @param rev 是否逆序获取结果
                 * @returns
                 */
                getZSetPageData<T>(
                    entityId: string,
                    keyType: string,
                    page: number,
                    pageSize: number,
                    valueFunc: (values: string[], scores: number[]) => Promise<T[]>,
                    filter?: (keyType: string) => Promise<boolean>,
                    minScore?: number,
                    maxScore?: number,
                    rev?: true,
                ): Promise<RedisPageData<T>>;

                /**
                 * 弹出zSet最小的n个成员
                 * @param entityId
                 * @param keyType
                 * @param count
                 */
                popZSetMinCount(entityId: string, keyType: string, count: number): Promise<ZMember[]>;

                /**
                 * 取多个zSet的交集
                 * @param keys
                 * @param options
                 * @returns
                 */
                interZSets(keys: string | string[], options?: ZInterOptions): Promise<string[]>;

                /**
                 * 取多个zSet的交集，并存到一个目标key中
                 * @param destination
                 * @param keys
                 * @param options
                 * @returns
                 */
                interStoreZSets(destination: string, keys: string | string[], options?: ZInterStoreOptions): Promise<number>;

                /**
                 * 取多个zSet的并集
                 * @param keys
                 * @param options
                 * @returns
                 */
                unionZSets(keys: string | string[], options?: ZUnionOptions): Promise<string[]>;

                /**
                 * 取多个zSet的并集，并存到一个目标key中
                 * @param destination
                 * @param keys
                 * @param options
                 * @returns
                 */
                unionStoreZSets(destination: string, keys: string | string[], options?: ZUnionStoreOptions): Promise<number>;

                /**
                 * 取多个zSet的差集
                 * @param keys
                 * @returns
                 */
                diffZSets(keys: string | string[]): Promise<string[]>;

                /**
                 * 取多个zSet的差集，并存到一个目标key中
                 * @param destination
                 * @param keys
                 * @returns
                 */
                diffStoreZSets(destination: string, keys: string | string[]): Promise<number>;

                /**
                 * 是否存在布隆过滤器
                 * @param entityId
                 * @param keyType
                 * @returns
                 */
                hasBloomKey(entityId: string, keyType: string): Promise<boolean>;

                /**
                 * 向布隆过滤器添加值value，重复的value不会被添加
                 * @param entityId
                 * @param keyType
                 * @param value
                 */
                bloomAdd(entityId: string, keyType: string, value: string): Promise<boolean>;

                /**
                 * 向布隆过滤器批量添加值value，重复的value不会被添加
                 * @param entityId
                 * @param keyType
                 * @param values
                 */
                bloomMultiAdd(entityId: string, keyType: string, values: string[]): Promise<void>;

                /**
                 * 从布隆过滤器里删除值value
                 * @param entityId
                 * @param keyType
                 * @param value
                 * @returns
                 */
                bloomDel(entityId: string, keyType: string, value: string): Promise<boolean>;

                /**
                 * 值value是否存在于布隆过滤器key中
                 * @param keyType
                 * @param value
                 * @returns
                 */
                bloomExists(entityId: string, keyType: string, value: string): Promise<boolean>;

                /**
                 * 把redis里的bloom循环dump成小份的chunk，用于存文件
                 * @param entityId
                 * @param keyType
                 * @returns
                 */
                bloomDump(entityId: string, keyType: string): Promise<{ index: number; data: Buffer }[]>;

                /**
                 * 把bloom加载到redis里
                 * @param entityId
                 * @param keyType
                 * @param datas
                 * @returns
                 */
                bloomLoad(entityId: string, keyType: string, datas: { index: number; data: Buffer }[]): Promise<boolean>;

                /**
                 * 把布隆过滤器存到文件
                 * @param entityId
                 * @param keyType
                 */
                saveBloomToFile(entityId: string, keyType: string): Promise<boolean>;

                /**
                 * 从文件中加载Bloom，存到redis
                 * @param entityId
                 * @param keyType
                 */
                loadBloomFromFile(entityId: string, keyType: string): Promise<boolean>;

                /**
                 * 删除Bloom文件
                 * @param entityId
                 * @param keyType
                 */
                deleteBloomFile(entityId: string, keyType: string): boolean;

                /**
                 * 向Set里加入成员
                 * @param entityId
                 * @param keyType
                 * @param members
                 */
                addToSet(entityId: string, keyType: string, members: string | string[]): Promise<boolean>;

                /**
                 * 从Set里删除成员
                 * @param keyType
                 * @param members
                 */
                delFromSet(entityId: string, keyType: string, members: string | string[]): Promise<boolean>;
                /**
                 * 是否是Set里的成员
                 * @param entityId
                 * @param keyType
                 * @param member
                 * @returns
                 */
                isSetMember(entityId: string, keyType: string, member: string): Promise<boolean>;

                /**
                 * 获得Set的成员总数
                 * @param entityId
                 * @param keyType
                 * @returns
                 */
                getSMemberCount(entityId: string, keyType: string): Promise<number>;

                /**
                 * 获得Set的所有成员
                 * @param entityId
                 * @param keyType
                 * @returns
                 */
                getSAllMembers(entityId: string, keyType: string): Promise<string[]>;

                /**
                 * 向Hash里设置成员
                 * @param entityId
                 * @param keyType
                 * @param hArgs
                 * @returns
                 */
                setToHash(entityId: string, keyType: string, ...hArgs: [string, string | number][]): Promise<number>;

                /**
                 * 向Hash里设置一个成员，只添加新成员
                 * @param entityId
                 * @param keyType
                 * @param hKey
                 * @param hValue
                 * @returns
                 */
                setToHashNx(entityId: string, keyType: string, hKey: string, hValue: string | number): Promise<boolean>;

                /**
                 * 从Hash里删除成员
                 * @param entityId
                 * @param keyType
                 * @param hKeys
                 * @returns
                 */
                delFromHash(entityId: string, keyType: string, hKeys: string[]): Promise<boolean>;

                /**
                 * 获取Hash里成员的值
                 * @param entityId
                 * @param keyType
                 * @param hKey
                 * @returns
                 */
                getFromHash(entityId: string, keyType: string, hKey: string): Promise<string | undefined>;

                /**
                 * 获取Hash里所有成员的值
                 * @param entityId
                 * @param keyType
                 * @returns
                 */
                getAllHash(entityId: string, keyType: string): Promise<{ [keyType: string]: string }>;

                /**
                 * 增加或减少Hash里成员的值
                 * @param entityId
                 * @param keyType
                 * @param hKey
                 * @param increment
                 * @returns
                 */
                incrbyHash(entityId: string, keyType: string, hKey: string, increment: number): Promise<number>;

                /**
                 * 增加或减少Hash里成员的值
                 * @param entityId
                 * @param keyType
                 * @param hKey
                 * @param increment
                 * @returns
                 */
                incrbyFloatHash(entityId: string, keyType: string, hKey: string, increment: number): Promise<number>;

                /**
                 * List是否存在
                 * @param entityId
                 * @param keyType
                 * @returns
                 */
                hasListKey(entityId: string, keyType: string): Promise<boolean>;

                /**
                 * 插入值到List
                 * @param entityId
                 * @param keyType
                 * @param values
                 * @returns
                 */
                addToList(entityId: string, keyType: string, values: string | string[]): Promise<boolean>;

                /**
                 * 从List删除值
                 * @param entityId
                 * @param keyType
                 * @param value
                 * @returns
                 */
                delFromList(entityId: string, keyType: string, value: string): Promise<boolean>;

                /**
                 * 循环获取List的下一个值
                 * @param entityId
                 * @param keyType
                 * @returns
                 */
                getNextFromList(entityId: string, keyType: string): Promise<string | null>;

                /**
                 * 获取List的所有值
                 * @param entityId
                 * @param keyType
                 * @returns
                 */
                getAllValuesFromList(entityId: string, keyType: string): Promise<string[]>;

                /**
                 * 获取List的长度
                 * @param entityId
                 * @param keyType
                 * @returns
                 */
                getListLength(entityId: string, keyType: string): Promise<number>;
            }

            /**Redis存储策略 */
            export interface RedisStrategy extends EventEmitterPro<RedisStrategyEvents> {
                /**
                 * 获取对应dataType的存储选项
                 * @param dataType
                 * @param keyType
                 */
                getSaveOption(dataType: RedisDataType, keyType: string): unknown;

                /**
                 * 对应dataType的keyType是否需要存储
                 * @param dataType
                 * @param keyType
                 */
                isNeedSave(dataType: RedisDataType, keyType: string): boolean;

                // /**
                //  * 构造数据变化map的批处理语句
                //  *
                //  * @param changMap
                //  * @param filter
                //  * @param update
                //  * @returns
                //  */
                // buildOpArrByChangeMap<Schema extends import("mongodb").Document = import("mongodb").Document>(
                //     changMap: { [x: string]: string },
                //     filter: (key: string) => import("mongodb").Filter<Schema>,
                //     update: (key: string, value: string) => import("mongodb").UpdateFilter<Schema>[] | import("mongodb").UpdateFilter<Schema>
                // ): { opArr: import("mongodb").AnyBulkWriteOperation<Schema>[]; addNum: number; deleteNum: number };

                /**
                 * 获取数据变化的key
                 * @param dataType
                 * @param entityId
                 * @param keyType
                 * @returns
                 */
                getDataChangeKey(dataType: RedisDataType, entityId: string, keyType: string): string;

                /**
                 * 获取数据变化信息
                 * @param dataType
                 * @param entityId
                 * @param keyType
                 * @returns
                 */
                getDataChangeInfo(dataType: RedisDataType, entityId: string, keyType: string): Promise<{ [x: string]: string }>;

                /**
                 * 保存变动的数据到磁盘
                 * @param dataType
                 * @param entityId
                 * @param keyType
                 * @returns
                 */
                saveChange(dataType: RedisDataType, entityId: string, keyType: string): Promise<boolean>;
            }

            /**Redis选项类型 */
            export type RedisOptionType = {
                /**普通key */
                key?: { [key: string]: void };
                /**计数器 */
                counter?: { [key: string]: void };
                /**无序集合set */
                set?: { [key: string]: string[] | void };
                /**有序集合zset */
                zSet?: { [key: string]: string[] | void };
                /**哈希表 */
                hash?: { [key: string]: string[] | void };
                /**列表 */
                list?: { [key: string]: string[] | void };
            };

            /**Redis选项类型定义 */
            export type RedisOptionDef<OptionType extends RedisOptionType, SaveOption = unknown> = {
                [P in keyof OptionType]?: { [key: string]: SaveOption };
            };

            /**Redis选项的普通key定义 */
            export type RedisOptKey<T extends RedisOptionType> = T[import("./redis.constant").REDIS_DATA_TYPE.KEY];
            /**Redis选项的计数器定义 */
            export type RedisOptCounter<T extends RedisOptionType> = T[import("./redis.constant").REDIS_DATA_TYPE.COUNTER];
            /**Redis选项的布隆过滤器定义 */
            export type RedisOptBloom<T extends RedisOptionType> = T[import("./redis.constant").REDIS_DATA_TYPE.SET];
            /**Redis选项的无序集合定义 */
            export type RedisOptSet<T extends RedisOptionType> = T[import("./redis.constant").REDIS_DATA_TYPE.SET];
            /**Redis选项的有序集合（zset）定义 */
            export type RedisOptZSet<T extends RedisOptionType> = T[import("./redis.constant").REDIS_DATA_TYPE.ZSET];
            /**Redis选项的哈希表定义 */
            export type RedisOptHash<T extends RedisOptionType> = T[import("./redis.constant").REDIS_DATA_TYPE.HASH];
            /**Redis选项的列表定义 */
            export type RedisOptList<T extends RedisOptionType> = T[import("./redis.constant").REDIS_DATA_TYPE.LIST];

            export type UnknownMutArg = unknown[];
            export type FlatArray<T> = T extends UnknownMutArg ? { [P in keyof T]: [T[P], string] } : never;
            /**复合参数 */
            export type MultiRedisArg<K extends keyof T, T> = T[K] extends UnknownMutArg ? [K, ...FlatArray<T[K]>] : K;

            /**Redis布隆过滤器的复合参数 */
            export type MultiRedisBloomArg<K extends keyof RedisOptBloom<T>, T extends RedisOptionType> = MultiRedisArg<K, RedisOptBloom<T>>;
            /**Redis无序集合的复合参数 */
            export type MultiRedisSetArg<K extends keyof RedisOptSet<T>, T extends RedisOptionType> = MultiRedisArg<K, RedisOptSet<T>>;
            /**Redis有序集合的复合参数 */
            export type MultiRedisZSetArg<K extends keyof RedisOptZSet<T>, T extends RedisOptionType> = MultiRedisArg<K, RedisOptZSet<T>>;
            /**Redis哈希表的复合参数 */
            export type MultiRedisHashArg<K extends keyof RedisOptHash<T>, T extends RedisOptionType> = MultiRedisArg<K, RedisOptHash<T>>;
            /**Redis列表的复合参数 */
            export type MultiRedisListArg<K extends keyof RedisOptList<T>, T extends RedisOptionType> = MultiRedisArg<K, RedisOptList<T>>;

            /**Redis策略事件 */
            export type RedisStrategyEvents = {
                /**普通key变化 */
                onKeyChanged: [string, ...[string, string | number][]];
                /**计数器变化 */
                onCouterChanged: [string, ...[string, number][]];
                /**无序集合增加 */
                onSetAdd: [string, string, string | string[]];
                /**无序集合删除 */
                onSetDelete: [string, string, string | string[]];
                /**有序集合增加 */
                onZSetAdd: [string, string, ZMember | ZMember[]];
                /**有序集合删除 */
                onZSetDelete: [string, string, string | string[]];
                /**哈希表变化 */
                onHashChanged: [string, string, ...[string, string | number][]];
            };

            /**
             * Redis标签分页筛选后的处理数据
             */
            export type RedisZSetPageFilterResult<T> =
                | {
                      success: true;
                      /**返回的处理后的数据 */
                      datas: T[];
                  }
                | {
                      success: false;
                      /**有效数据长度 */
                      validDataNum: number;
                      /**需要删除的无效value */
                      delArray: string[];
                  };
        }
    }
}
