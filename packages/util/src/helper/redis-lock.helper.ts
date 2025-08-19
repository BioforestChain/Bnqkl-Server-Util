import { Logger } from "../log4j/log4j.js";
import { redisCore } from "../redis/index.js";
import { CommonHelper } from "./common.helper.js";
import { $asyncAllNoNullMap, $asyncNoNullMap } from "./function.helper.js";
import { sleep } from "./timers.helper.js";

const lockExpireTime = 60; // 默认锁过期时间60秒，低于30秒将重新续期到60
const lockTimeoutMs = 3 * 60 * 1000; // 上锁重试超时时间3分钟

export class RedisLock {
    /**
     * 加锁调用
     * @param lockKey
     * @param processFunc
     * @param expire
     */
    static async processByLock<T>(lockKey: string, processFunc: () => Promise<T>, expire?: number): Promise<T> {
        const lockId = await this.__lock(lockKey, expire);
        try {
            return await processFunc();
        } finally {
            await this.__unLock(lockKey, lockId);
        }
    }

    /**
     * 上锁
     * @param {string}
     * @param {number} expire 单位秒，给空将一直续期
     * @returns {Promise<string>} lockId（解锁用）
     */
    private static async __lock(lockKey: string, expire?: number): Promise<string> {
        const lockCacheKey = CommonHelper.getLockCacheKey(lockKey);
        const lockId = CommonHelper.getUuid();
        if (!(await this.__doLock(lockCacheKey, lockId, expire))) {
            throw new Error("lock time out");
        }
        if (!expire) {
            // 如果未设置失效时间，则开启看门狗一直续期
            setTimeout(() => {
                this.__startWatchDog(lockCacheKey);
            }, (lockExpireTime / 2) * 1000);
        }
        return lockId;
    }

    private static async __doLock(key: string, val: string, expire?: number): Promise<boolean> {
        const start = Date.now();
        do {
            const result = await redisCore.redis.set(key, val, { EX: expire || lockExpireTime, NX: true });
            // 上锁成功
            if (result === "OK") {
                return true;
            }
            // 锁超时
            if (Date.now() - start > lockTimeoutMs) {
                Logger.debug(`上锁超时结束：${key} ${val}`);
                return false;
            }
            // 循环等待重试
            await sleep(100);
        } while (true);
    }

    /**
     * 解锁
     * @param {string} lockKey
     * @param {string} lockId
     * @returns {Promise<boolean>}
     */
    private static async __unLock(lockKey: string, lockId: string): Promise<boolean> {
        return await this.__doUnLock(CommonHelper.getLockCacheKey(lockKey), lockId);
    }

    private static async __doUnLock(key: string, val: string): Promise<boolean> {
        const script = "if redis.call('get',KEYS[1]) == ARGV[1] then" + "   return redis.call('del',KEYS[1]) " + "else" + "   return 0 " + "end";
        return (await redisCore.redis.eval(script, { keys: [key], arguments: [val] })) === 1;
    }

    /**
     * 批量加锁调用
     * @param lockKeyArray
     * @param processFunc
     * @param expire
     */
    static async processByMultiLock<T>(lockKeyArray: string[], processFunc: () => Promise<T>, expire?: number): Promise<T> {
        const lockInfoArray = await this.__multiLock(lockKeyArray, expire);
        try {
            return await processFunc();
        } finally {
            await this.__multiUnLock(lockInfoArray);
        }
    }

    /**
     * 批量加锁
     * @param lockKeyArray
     * @param expire
     * @returns
     */
    private static async __multiLock(lockKeyArray: string[], expire?: number) {
        // 串行按顺序上锁，防止死锁
        return await $asyncNoNullMap(lockKeyArray, async (lockKey) => {
            return { lockKey, lockId: await this.__lock(lockKey, expire) };
        });
    }

    /**
     * 批量解锁
     * @param lockInfoArray
     * @returns
     */
    private static async __multiUnLock(lockInfoArray: { lockKey: string; lockId: string }[]) {
        return await $asyncAllNoNullMap(lockInfoArray, async ({ lockKey, lockId }) => {
            return await this.__unLock(lockKey, lockId);
        });
    }

    private static async __startWatchDog(lockCacheKey: string) {
        do {
            const ttl = await redisCore.redis.ttl(lockCacheKey);
            if (ttl < 0) {
                break;
            }
            if (ttl < lockExpireTime / 2) {
                // 过了一半时间续期到原时间
                await redisCore.redis.expire(lockCacheKey, lockExpireTime);
            }
            await sleep(1000);
        } while (true);
    }
}
