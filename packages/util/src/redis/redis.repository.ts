import * as fs from "fs-extra";
import { PageData } from "../helper";
import { redisCore } from "./redis.core";
import { RedisHelper } from "./redis.helper";

/**RedisRepository */
export class RedisRepository implements ServerUtil.Redis.RedisRepository {
    /**忽略数据变化的对象集合 */
    private __ignoreDataChangeSet = new Set<string>();

    constructor(protected __name: string, protected __redisConfig?: ServerUtil.Redis.RedisConfig, protected __strategy?: ServerUtil.Redis.RedisStrategy) {}

    private get __redis() {
        return redisCore.redis;
    }

    get useBloom() {
        return this.__redisConfig?.useBloom;
    }

    /**
     * 获取redis存储策略
     * @param entityId
     * @returns
     */
    getStrategy(entityId: string) {
        if (this.__ignoreDataChangeSet.has(entityId)) {
            //忽略数据变化的id，不存储
            return;
        }
        return this.__strategy;
    }

    /**
     * 忽略某个对象的数据变化
     * @param entityId
     * @param value
     */
    ignoreDataChange(entityId: string, value: boolean) {
        if (value) {
            this.__ignoreDataChangeSet.add(entityId);
        } else {
            this.__ignoreDataChangeSet.delete(entityId);
        }
    }

    getDataKey(entityId: string) {
        return RedisHelper.getDataKey(this.__name, entityId);
    }

    getZSetKey(entityId: string, keyType: string) {
        return RedisHelper.getZSetKey(this.__name, entityId, keyType);
    }

    getBloomKey(entityId: string, keyType: string) {
        if (!this.useBloom) {
            return this.getSetKey(entityId, keyType);
        }
        return RedisHelper.getBloomKey(this.__name, entityId, keyType);
    }

    getSetKey(entityId: string, keyType: string) {
        return RedisHelper.getSetKey(this.__name, entityId, keyType);
    }

    getHashKey(entityId: string, keyType: string) {
        return RedisHelper.getHashKey(this.__name, entityId, keyType);
    }

    getListKey(entityId: string, keyType: string) {
        return RedisHelper.getListKey(this.__name, entityId, keyType);
    }

    getBloomDirName(entityId: string, keyType: string) {
        const bloomKey = this.getBloomKey(entityId, keyType);
        return RedisHelper.getBloomDirName(this.__name, bloomKey);
    }

    /**
     * 获取符合模式的所有key
     * @param pattern
     */
    async keys(pattern: string) {
        return await this.__redis.keys(pattern);
    }

    /**
     * 删除一个或多个Key
     * @param keys
     */
    async del(keys: string | string[]) {
        return await this.__redis.del(keys);
    }

    /**
     * 设置key的过期时间
     * @param key
     * @param seconds
     * @returns
     */
    async expire(key: string, seconds: number) {
        return await this.__redis.expire(key, seconds);
    }

    /**
     * 重命名一个key
     * @param key
     * @param newKey
     * @returns
     */
    async rename(key: string, newKey: string) {
        return await this.__redis.rename(key, newKey);
    }

    /**
     * 设置普通key
     * @param entityId
     * @param hKey
     * @param hValue
     */
    async setKeyValue(entityId: string, hKey: string, hValue: string | number): Promise<number> {
        return await this.setMultiKeyValue(entityId, [hKey, hValue]);
    }

    /**
     * 设置多个普通key
     * @param entityId
     * @param hArgs
     * @returns
     */
    async setMultiKeyValue(entityId: string, ...hArgs: [string, string | number][]): Promise<number> {
        if (hArgs.length === 0) {
            return 0;
        }
        const num = await this.__redis.hSet(this.getDataKey(entityId), hArgs as [string, string | number][]);
        this.getStrategy(entityId)?.emit("onKeyChanged", entityId, ...(hArgs as [string, string | number][]));
        return num;
    }

    /**
     * 获取普通key的值
     * @param entityId
     * @param hKey
     * @returns
     */
    async getKeyValue(entityId: string, hKey: string): Promise<string> {
        return (await this.getMultiKeyValue(entityId, [hKey]))[0];
    }

    /**
     * 获取多个普通key的值
     * @param entityId
     * @param hKeys
     * @returns
     */
    async getMultiKeyValue(entityId: string, hKeys: string[]): Promise<string[]> {
        const values = await this.__redis.hmGet(this.getDataKey(entityId), hKeys);
        return values.map((v) => v || "");
    }

    /**
     * 删除普通key
     * @param entityId
     * @param hKeys
     * @returns
     */
    async delKeyValue(entityId: string, hKeys: string[]): Promise<boolean> {
        if (hKeys.length === 0) {
            return false;
        }
        const delNum = await this.__redis.hDel(this.getDataKey(entityId), hKeys);
        return delNum > 0;
    }

    /**
     * 获取entityId下所有普通key
     * @param entityId
     * @returns
     */
    async getAllKeys(entityId: string): Promise<string[]> {
        return await this.__redis.hKeys(this.getDataKey(entityId));
    }

    /**
     * 设置计数器的值
     * @param entityId
     * @param hKey
     * @param hValue
     */
    async setCounterNum(entityId: string, hKey: string, hValue: number): Promise<number> {
        return await this.setMultiCounterNum(entityId, [hKey, hValue]);
    }

    /**
     * 设置多个计数器的值
     * @param entityId
     * @param hArgs
     * @returns
     */
    async setMultiCounterNum(entityId: string, ...hArgs: [string, number][]): Promise<number> {
        if (hArgs.length === 0) {
            return 0;
        }
        const num = await this.__redis.hSet(this.getDataKey(entityId), hArgs as [string, number][]);
        this.getStrategy(entityId)?.emit("onCouterChanged", entityId, ...(hArgs as [string, number][]));
        return num;
    }

    /**
     * 获取计数器的值
     * @param entityId
     * @param hKey
     * @returns
     */
    async getCounterNum(entityId: string, hKey: string): Promise<number> {
        return (await this.getMultiCounterNum(entityId, [hKey]))[0];
    }

    /**
     * 获取多个计数器的值
     * @param entityId
     * @param hKeys
     * @returns
     */
    async getMultiCounterNum(entityId: string, hKeys: string[]): Promise<number[]> {
        const nums = await this.__redis.hmGet(this.getDataKey(entityId), hKeys);
        return nums.map((v) => Number(v));
    }

    /**
     * 增加或减少计数器的值
     * @param entityId
     * @param hKey
     * @param increment
     * @returns
     */
    async incrbyCounterNum(entityId: string, hKey: string, increment: number): Promise<number> {
        const curValue = await this.__redis.hIncrBy(this.getDataKey(entityId), hKey.toString(), increment);
        this.getStrategy(entityId)?.emit("onCouterChanged", entityId, [hKey.toString(), curValue]);
        return curValue;
    }

    /**
     * 删除counter
     * @param entityId
     * @param hKeys
     * @returns
     */
    async delCounter(entityId: string, hKeys: string[]): Promise<boolean> {
        if (hKeys.length === 0) {
            return false;
        }
        const delNum = await this.__redis.hDel(this.getDataKey(entityId), hKeys);
        return delNum > 0;
    }

    /**
     * 获取ZSet里成员的值
     * @param entityId
     * @param keyType
     * @param member
     * @param increment
     * @returns
     */
    async getZSetScore(entityId: string, keyType: string, member: string) {
        return (await this.mGetZSetScore(entityId, keyType, [member]))[0];
    }

    /**
     * 获取ZSet里成员的值
     * @param entityId
     * @param keyType
     * @param member
     * @param increment
     * @returns
     */
    async mGetZSetScore(entityId: string, keyType: string, members: string[]) {
        const scores = await this.__redis.zmScore(this.getZSetKey(entityId, keyType), members);
        return scores.map((v) => v || 0);
    }

    /**
     * 增加或减少ZSet里成员的值
     * @param entityId
     * @param keyType
     * @param member
     * @param increment
     * @returns
     */
    async incrbyZSet(entityId: string, keyType: string, member: string, increment: number) {
        const curValue = await this.__redis.zIncrBy(this.getZSetKey(entityId, keyType), increment, member);
        return curValue;
    }

    /**
     * 向zSet加入成员
     * @param entityId
     * @param keyType
     * @param members
     * @param NX { NX: true } 默认只能新增
     */
    async addToZSet(entityId: string, keyType: string, members: ServerUtil.Redis.ZMember | ServerUtil.Redis.ZMember[], NX: boolean = true) {
        if (members instanceof Array && members.length === 0) {
            return false;
        }
        const addNum = await this.__redis.zAdd(this.getZSetKey(entityId, keyType), members, {
            NX: NX ? true : undefined,
        });
        if (addNum > 0) {
            this.getStrategy(entityId)?.emit("onZSetAdd", entityId, keyType, members);
            return true;
        }
        return false;
    }

    /**
     * 从zSet里删除成员
     * @param entityId
     * @param keyType
     * @param members
     */
    async delFromZSet(entityId: string, keyType: string, members: string | string[]): Promise<boolean> {
        if (members instanceof Array && members.length === 0) {
            return false;
        }
        const delNum = await this.__redis.zRem(this.getZSetKey(entityId, keyType), members);
        if (delNum > 0) {
            this.getStrategy(entityId)?.emit("onZSetDelete", entityId, keyType, members);
            return true;
        }
        return false;
    }

    /**
     * 以score范围来删除zSet成员
     * @param entityId
     * @param keyType
     * @param min
     * @param max
     * @returns
     */
    async delRangeByScoreFromZSet(entityId: string, keyType: string, min: number, max: number) {
        return await this.__redis.zRemRangeByScore(this.getZSetKey(entityId, keyType), min, max);
    }

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
    async getZSetRange(
        entityId: string,
        keyType: string,
        page: number,
        pageSize: number,
        minScore = -Infinity,
        maxScore = Infinity,
        rev = true,
    ): Promise<ServerUtil.Redis.ZMember[]> {
        const key = this.getZSetKey(entityId, keyType);
        const min = rev ? maxScore : minScore;
        const max = rev ? minScore : maxScore;
        const results = await this.__redis.zRangeWithScores(key, min, max, {
            REV: rev ? true : undefined,
            BY: "SCORE",
            LIMIT: { offset: (page - 1) * pageSize, count: pageSize },
        });
        return results;
    }

    /**
     * 获得zSet的所有成员
     * @param entityId
     * @param keyType
     * @returns
     */
    async getZSetRangeByScore(entityId: string, keyType: string, min: number, max: number): Promise<ServerUtil.Redis.ZMember[]> {
        return await this.__redis.zRangeByScoreWithScores(this.getZSetKey(entityId, keyType), min, max);
    }

    /**
     * 是否是zSet里的成员
     * @param entityId
     * @param keyType
     * @param member
     * @returns
     */
    async isZSetMember(entityId: string, keyType: string, member: string): Promise<boolean> {
        return (await this.__redis.zRank(this.getZSetKey(entityId, keyType), member)) !== null;
    }

    /**
     * zSet是否存在
     * @param entityId
     * @param keyType
     * @returns
     */
    async hasZSetKey(entityId: string, keyType: string): Promise<boolean> {
        return (await this.__redis.exists(this.getZSetKey(entityId, keyType))) === 1;
    }

    /**
     * 获得zSet里<=maxScore的成员总数
     * @param entityId
     * @param keyType
     * @param minScore
     * @param maxScore
     * @returns
     */
    async getZSetMemberCount(entityId: string, keyType: string, minScore = -Infinity, maxScore = Infinity): Promise<number> {
        return await this.__redis.zCount(this.getZSetKey(entityId, keyType), minScore, maxScore);
    }

    /**
     * 获得zSet的所有成员
     * @param entityId
     * @param keyType
     * @returns
     */
    async getZSetAllMembers(entityId: string, keyType: string): Promise<string[]> {
        return await this.__redis.zRange(this.getZSetKey(entityId, keyType), 0, -1);
    }

    /**
     * 清空zSet
     * @param entityId
     * @param keyType
     */
    async clearZSet(entityId: string, keyType: string): Promise<number> {
        return await this.__redis.del(this.getZSetKey(entityId, keyType));
    }

    /**
     * 获取zSet下最大的score
     * @param entityId
     * @param keyType
     */
    async getZSetMaxScore(entityId: string, keyType: string): Promise<number | undefined> {
        const ret = await this.__redis.zRangeWithScores(this.getZSetKey(entityId, keyType), -1, -1);
        if (!ret || !ret[0]) {
            return;
        }
        return ret[0].score;
    }

    /**
     * 获取zSet下最大的score的value
     * @param entityId
     * @param keyType
     */
    async getZSetMaxScoreValue(entityId: string, keyType: string): Promise<string | undefined> {
        const ret = await this.__redis.zRangeWithScores(this.getZSetKey(entityId, keyType), -1, -1);
        if (!ret || !ret[0]) {
            return;
        }
        return ret[0].value;
    }

    /**
     * 获取zSet下最小的score
     * @param entityId
     * @param keyType
     */
    async getZSetMinScore(entityId: string, keyType: string): Promise<number | undefined> {
        const ret = await this.__redis.zRangeWithScores(this.getZSetKey(entityId, keyType), 0, 0);
        if (!ret || !ret[0]) {
            return;
        }
        return ret[0].score;
    }

    /**
     * 获取zSet下最小的score的value
     * @param entityId
     * @param keyType
     */
    async getZSetMinScoreValue(entityId: string, keyType: string): Promise<string | undefined> {
        const ret = await this.__redis.zRangeWithScores(this.getZSetKey(entityId, keyType), 0, 0);
        if (!ret || !ret[0]) {
            return;
        }
        return ret[0].value;
    }

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
    async getZSetPageData<T>(
        entityId: string,
        keyType: string,
        page: number,
        pageSize: number,
        valueFunc: (values: string[], scores: number[]) => Promise<T[]>,
        filter?: (key: string) => Promise<boolean>,
        minScore = -Infinity,
        maxScore = Infinity,
        rev = true,
    ): Promise<PageData<T>> {
        const total = await this.getZSetMemberCount(entityId, keyType, minScore, maxScore);
        const zSetPageData = await this.__getZSetPageData(entityId, keyType, page, pageSize, valueFunc, filter, minScore, maxScore, rev);
        if (zSetPageData.success === true) {
            const pageData = new PageData<T>(page, pageSize, zSetPageData.datas, total);
            return pageData;
        }
        // 有需要删除的无效值，直到返回数据足够
        let dataNum = zSetPageData.validDataNum;
        let allDelArray = zSetPageData.delArray;
        const maxPage = Math.floor(total / pageSize);
        //下标从page+1开始，要到maxPage+1
        for (let idx = page + 1; idx <= maxPage + 1; idx++) {
            const curzSetPageData = await this.__getZSetPageData(entityId, keyType, idx, pageSize, valueFunc, filter, minScore, maxScore, rev);
            if (curzSetPageData.success === true) {
                // page返回数据已经足够，退出循环
                break;
            }
            dataNum += curzSetPageData.validDataNum;
            allDelArray = allDelArray.concat(curzSetPageData.delArray);
            if (dataNum >= pageSize) {
                // page返回数据已经足够，退出循环
                break;
            }
        }
        // 删除无效值
        await this.delFromZSet(entityId, keyType, allDelArray);
        // 删除后再次查询page页
        const newTotal = await this.getZSetMemberCount(entityId, keyType, minScore, maxScore);
        const newzSetPageData = await this.__getZSetPageData(entityId, keyType, page, pageSize, valueFunc, filter, minScore, maxScore, rev);
        if (!newzSetPageData.success) {
            throw new Error(`getzSetPageData entityId:${entityId} keyType:${keyType.toString()} error`);
        }
        const pageData = new PageData<T>(page, pageSize, newzSetPageData.datas, newTotal);
        return pageData;
    }

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
    private async __getZSetPageData<T>(
        entityId: string,
        keyType: string,
        page: number,
        pageSize: number,
        valueFunc: (values: string[], scores: number[]) => Promise<T[]>,
        filter?: (key: string) => Promise<boolean>,
        minScore = -Infinity,
        maxScore = Infinity,
        rev = true,
    ): Promise<ServerUtil.Redis.RedisZSetPageFilterResult<T>> {
        const results = await this.getZSetRange(entityId, keyType, page, pageSize, minScore, maxScore, rev);
        const delArray: string[] = [];
        if (filter) {
            await Promise.all(
                results.map(async (result) => {
                    if (!(await filter(result.value))) {
                        delArray.push(result.value);
                    }
                }),
            );
        }
        if (delArray.length > 0) {
            return { success: false, delArray, validDataNum: results.length - delArray.length };
        }
        const datas = await valueFunc(
            results.map((v) => v.value),
            results.map((v) => v.score),
        );
        return { success: true, datas };
    }

    /**
     * 弹出zSet最小的n个成员
     * @param entityId
     * @param keyType
     * @param count
     */
    async popZSetMinCount(entityId: string, keyType: string, count: number): Promise<ServerUtil.Redis.ZMember[]> {
        return await this.__redis.zPopMinCount(this.getZSetKey(entityId, keyType), count);
    }

    /**
     * 取多个zSet的交集
     * @param keys
     * @param options
     * @returns
     */
    async interZSets(keys: string | string[], options?: ServerUtil.Redis.ZInterOptions) {
        return await this.__redis.zInter(keys, options);
    }

    /**
     * 取多个zSet的交集，并存到一个目标key中
     * @param destination
     * @param keys
     * @param options
     * @returns
     */
    async interStoreZSets(destination: string, keys: string | string[], options?: ServerUtil.Redis.ZInterStoreOptions) {
        return await this.__redis.zInterStore(destination, keys, options);
    }

    /**
     * 取多个zSet的并集
     * @param keys
     * @param options
     * @returns
     */
    async unionZSets(keys: string | string[], options?: ServerUtil.Redis.ZUnionOptions) {
        return await this.__redis.zUnion(keys, options);
    }

    /**
     * 取多个zSet的并集，并存到一个目标key中
     * @param destination
     * @param keys
     * @param options
     * @returns
     */
    async unionStoreZSets(destination: string, keys: string | string[], options?: ServerUtil.Redis.ZUnionStoreOptions) {
        return await this.__redis.zUnionStore(destination, keys, options);
    }

    /**
     * 取多个zSet的差集
     * @param keys
     * @returns
     */
    async diffZSets(keys: string | string[]) {
        return await this.__redis.zDiff(keys);
    }

    /**
     * 取多个zSet的差集，并存到一个目标key中
     * @param destination
     * @param keys
     * @returns
     */
    async diffStoreZSets(destination: string, keys: string | string[]) {
        return await this.__redis.zDiffStore(destination, keys);
    }

    /**
     * 重置布隆过滤器
     * @param entityId
     * @param keyType
     * @param capacity
     * @returns
     */
    async bloomReserve(entityId: string, keyType: string, capacity: number): Promise<boolean> {
        if (!this.useBloom) {
            return false;
        }
        return (await this.__redis.cf.reserve(this.getBloomKey(entityId, keyType), capacity)) === "OK";
    }

    /**
     * 是否存在布隆过滤器
     * @param entityId
     * @param keyType
     * @returns
     */
    async hasBloomKey(entityId: string, keyType: string): Promise<boolean> {
        return (await this.__redis.exists(this.getBloomKey(entityId, keyType))) === 1;
    }

    /**
     * 向布隆过滤器添加值value，重复的value不会被添加
     * @param entityId
     * @param keyType
     * @param value
     */
    async bloomAdd(entityId: string, keyType: string, value: string): Promise<boolean> {
        if (value === undefined) {
            return false;
        }
        if (!this.useBloom) {
            return await this.addToSet(entityId, keyType, value);
        }
        return await this.__redis.cf.addNX(this.getBloomKey(entityId, keyType), value);
    }

    /**
     * 向布隆过滤器批量添加值value，重复的value不会被添加
     * @param entityId
     * @param keyType
     * @param value
     * @param values
     */
    async bloomMultiAdd(entityId: string, keyType: string, values: string[]): Promise<void> {
        if (!values || values.length === 0) {
            return;
        }
        if (!this.useBloom) {
            await this.addToSet(entityId, keyType, values);
            return;
        }
        await Promise.all(values.map((v) => this.__redis.cf.addNX(this.getBloomKey(entityId, keyType), v)));
    }

    /**
     * 从布隆过滤器里删除值value
     * @param entityId
     * @param keyType
     * @param value
     * @returns
     */
    async bloomDel(entityId: string, keyType: string, value: string): Promise<boolean> {
        if (value === undefined) {
            return false;
        }
        if (!this.useBloom) {
            return await this.delFromSet(entityId, keyType, value);
        }
        const bloomKey = this.getBloomKey(entityId, keyType);
        if (!(await this.__redis.cf.exists(bloomKey, value))) {
            return false;
        }
        return await this.__redis.cf.del(bloomKey, value);
    }

    /**
     * 值value是否存在于布隆过滤器key中
     * @param entityId
     * @param keyType
     * @param value
     * @returns
     */
    async bloomExists(entityId: string, keyType: string, value: string): Promise<boolean> {
        if (value === undefined) {
            return false;
        }
        if (!this.useBloom) {
            return await this.isSetMember(entityId, keyType, value);
        }
        return await this.__redis.cf.exists(this.getBloomKey(entityId, keyType), value);
    }

    /**
     * 把redis里的bloom循环dump成小份的chunk，用于存文件
     * @param entityId
     * @param keyType
     * @returns
     */
    async bloomDump(entityId: string, keyType: string): Promise<{ index: number; data: Buffer }[]> {
        if (!this.useBloom) {
            const allMembers = await this.getSAllMembers(entityId, keyType);
            return RedisHelper.getBloomDumpBySet(allMembers);
        }
        let index = 0;
        const dumps: { index: number; data: Buffer }[] = [];
        while (true) {
            const { iterator, chunk } = await this.__redis.cf.scanDump(
                this.__redis.commandOptions({ returnBuffers: true }),
                this.getBloomKey(entityId, keyType),
                index,
            );
            index = iterator;
            if (index === 0 || chunk === null) {
                break;
            }
            dumps.push({ index, data: chunk });
        }
        return dumps;
    }

    /**
     * 把bloom加载到redis里
     * @param entityId
     * @param keyType
     * @param datas
     * @returns
     */
    async bloomLoad(entityId: string, keyType: string, datas: { index: number; data: Buffer }[]): Promise<boolean> {
        if (datas.length === 0) {
            return false;
        }
        if (!this.useBloom) {
            const data = datas[0].data;
            const members: string[] = JSON.parse(data.toString());
            return await this.addToSet(entityId, keyType, members);
        }
        for (const { index, data } of datas) {
            const ret = await this.__redis.cf.loadChunk(this.getBloomKey(entityId, keyType), index, data);
            if (ret !== "OK") {
                return false;
            }
        }
        return true;
    }

    /**
     * 查看bloom的信息
     * @param entityId
     * @param keyType
     * @returns
     */
    async bloomInfo(entityId: string, keyType: string) {
        if (!this.useBloom) {
            return;
        }
        return await this.__redis.cf.info(this.getBloomKey(entityId, keyType));
    }

    /**
     * 把布隆过滤器存到文件
     * @param entityId
     * @param keyType
     */
    async saveBloomToFile(entityId: string, keyType: string): Promise<boolean> {
        if (!(await this.hasBloomKey(entityId, keyType))) {
            return false;
        }
        const fileDir = this.getBloomDirName(entityId, keyType);
        const dumps = await this.bloomDump(entityId, keyType);
        RedisHelper.saveBloomToFile(fileDir, dumps);
        return true;
    }

    /**
     * 从文件中加载Bloom，存到redis
     * @param entityId
     * @param keyType
     */
    async loadBloomFromFile(entityId: string, keyType: string): Promise<boolean> {
        const fileDir = this.getBloomDirName(entityId, keyType);
        const datas = RedisHelper.loadBloomFromFile(fileDir);
        await this.bloomLoad(entityId, keyType, datas);
        return true;
    }

    /**
     * 从文件中加载Bloom，存到redis
     * @param entityId
     * @param keyType
     */
    deleteBloomFile(entityId: string, keyType: string): boolean {
        const fileDir = this.getBloomDirName(entityId, keyType);
        if (!fs.existsSync(fileDir)) {
            return false;
        }
        fs.rmSync(fileDir, { force: true, recursive: true });
        return true;
    }

    /**
     * 向Set里加入成员
     * @param entityId
     * @param keyType
     * @param members
     */
    async addToSet(entityId: string, keyType: string, members: string | string[]): Promise<boolean> {
        if (members instanceof Array && members.length === 0) {
            return false;
        }
        const addNum = await this.__redis.sAdd(this.getSetKey(entityId, keyType), members);
        if (addNum > 0) {
            this.getStrategy(entityId)?.emit("onSetAdd", entityId, keyType, members);
            return true;
        }
        return false;
    }

    /**
     * 从Set里删除成员
     * @param entityId
     * @param keyType
     * @param members
     */
    async delFromSet(entityId: string, keyType: string, members: string | string[]): Promise<boolean> {
        if (members instanceof Array && members.length === 0) {
            return false;
        }
        const delNum = await this.__redis.sRem(this.getSetKey(entityId, keyType), members);
        if (delNum > 0) {
            this.getStrategy(entityId)?.emit("onSetDelete", entityId, keyType, members);
            return true;
        }
        return false;
    }

    /**
     * 是否是Set里的成员
     * @param entityId
     * @param keyType
     * @param member
     * @returns
     */
    async isSetMember(entityId: string, keyType: string, member: string): Promise<boolean> {
        return await this.__redis.sIsMember(this.getSetKey(entityId, keyType), member);
    }

    /**
     * 获得Set的成员总数
     * @param entityId
     * @param keyType
     * @returns
     */
    async getSMemberCount(entityId: string, keyType: string): Promise<number> {
        return await this.__redis.sCard(this.getSetKey(entityId, keyType));
    }

    /**
     * 获得Set的所有成员
     * @param entityId
     * @param keyType
     * @returns
     */
    async getSAllMembers(entityId: string, keyType: string): Promise<string[]> {
        return await this.__redis.sMembers(this.getSetKey(entityId, keyType));
    }

    /**
     * 向Hash里设置成员
     * @param entityId
     * @param keyType
     * @param hArgs
     * @returns
     */
    async setToHash(entityId: string, keyType: string, ...hArgs: [string, string | number][]): Promise<number> {
        if (hArgs.length === 0) {
            return 0;
        }
        const num = await this.__redis.hSet(this.getHashKey(entityId, keyType), hArgs);
        this.getStrategy(entityId)?.emit("onHashChanged", entityId, keyType, ...hArgs);
        return num;
    }

    /**
     * 向Hash里设置一个成员，只添加新成员
     * @param entityId
     * @param keyType
     * @param hKey
     * @param hValue
     * @returns
     */
    async setToHashNx(entityId: string, keyType: string, hKey: string, hValue: string | number): Promise<boolean> {
        const success = await this.__redis.hSetNX(this.getHashKey(entityId, keyType), hKey, hValue.toString());
        if (success) {
            this.getStrategy(entityId)?.emit("onHashChanged", entityId, keyType, [hKey, hValue]);
        }
        return success;
    }

    /**
     * 从Hash里删除成员
     * @param entityId
     * @param keyType
     * @param hKeys
     * @returns
     */
    async delFromHash(entityId: string, keyType: string, hKeys: string[]): Promise<boolean> {
        if (hKeys.length === 0) {
            return false;
        }
        const delNum = await this.__redis.hDel(this.getHashKey(entityId, keyType), hKeys);
        if (delNum > 0) {
            //删除某个成员，存mongo时只需将值变成0即可
            const args: [string, number][] = hKeys.map((keyType) => [keyType, 0]);
            this.getStrategy(entityId)?.emit("onHashChanged", entityId, keyType, ...args);
            return true;
        }
        return false;
    }

    /**
     * 获取Hash里成员的值
     * @param entityId
     * @param keyType
     * @param hKey
     * @returns
     */
    async getFromHash(entityId: string, keyType: string, hKey: string): Promise<string | undefined> {
        return await this.__redis.hGet(this.getHashKey(entityId, keyType), hKey);
    }

    /**
     * 获取Hash里所有成员的值
     * @param entityId
     * @param keyType
     * @returns
     */
    async getAllHash(entityId: string, keyType: string): Promise<{ [key: string]: string }> {
        return await this.__redis.hGetAll(this.getHashKey(entityId, keyType));
    }

    /**
     * 增加或减少Hash里成员的值
     * @param entityId
     * @param keyType
     * @param hKey
     * @param increment
     * @returns
     */
    async incrbyHash(entityId: string, keyType: string, hKey: string, increment: number): Promise<number> {
        const curValue = await this.__redis.hIncrBy(this.getHashKey(entityId, keyType), hKey, increment);
        this.getStrategy(entityId)?.emit("onHashChanged", entityId, keyType, [hKey, curValue]);
        return curValue;
    }

    /**
     * 增加或减少Hash里成员的值
     * @param entityId
     * @param keyType
     * @param hKey
     * @param increment
     * @returns
     */
    async incrbyFloatHash(entityId: string, keyType: string, hKey: string, increment: number): Promise<number> {
        const curValue = await this.__redis.hIncrByFloat(this.getHashKey(entityId, keyType), hKey, increment);
        this.getStrategy(entityId)?.emit("onHashChanged", entityId, keyType, [hKey, curValue]);
        return curValue;
    }

    /**
     * List是否存在
     * @param entityId
     * @param keyType
     * @returns
     */
    async hasListKey(entityId: string, keyType: string): Promise<boolean> {
        return (await this.__redis.exists(this.getListKey(entityId, keyType))) === 1;
    }

    /**
     * 插入值到List
     * @param entityId
     * @param keyType
     * @param values
     * @returns
     */
    async addToList(entityId: string, keyType: string, values: string | string[]): Promise<boolean> {
        if (values instanceof Array && values.length === 0) {
            return false;
        }
        const listLength = await this.__redis.lPush(this.getListKey(entityId, keyType), values);
        if (listLength > 0) {
            return true;
        }
        return false;
    }

    /**
     * 从List删除值
     * @param entityId
     * @param keyType
     * @param value
     * @returns
     */
    async delFromList(entityId: string, keyType: string, value: string): Promise<boolean> {
        const delNum = await this.__redis.lRem(this.getListKey(entityId, keyType), 0, value);
        if (delNum > 0) {
            return true;
        }
        return false;
    }

    /**
     * 循环获取List的下一个值
     * @param entityId
     * @param keyType
     * @returns
     */
    async getNextFromList(entityId: string, keyType: string): Promise<string | null> {
        const listKey = this.getListKey(entityId, keyType);
        return await this.__redis.rPopLPush(listKey, listKey);
    }

    /**
     * 获取List的所有值
     * @param entityId
     * @param keyType
     * @returns
     */
    async getAllValuesFromList(entityId: string, keyType: string): Promise<string[]> {
        return await this.__redis.lRange(this.getListKey(entityId, keyType), 0, -1);
    }

    /**
     * 获取List的长度
     * @param entityId
     * @param keyType
     * @returns
     */
    async getListLength(entityId: string, keyType: string): Promise<number> {
        return await this.__redis.lLen(this.getListKey(entityId, keyType));
    }
}
