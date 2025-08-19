import { Logger } from "../log4j/log4j.js";

export const $let = <I, O>(input: I, output: (input: I) => O) => output(input);
export const $also = <I>(input: I, output: (input: I) => unknown) => (output(input), input);
export const $iflet = <I, O>(input: I, output: (input: NonNullable<I>) => O) => {
    if (input !== undefined) {
        return output(input as NonNullable<I>);
    }
};
export const $hasOwn = <T extends {}>(obj: T, key: PropertyKey): key is keyof T => Object.prototype.hasOwnProperty.call(obj, key);
export const $checkNever = (shouldNever: never) => shouldNever;

type NonNullableArray<A extends unknown[]> = A extends Array<infer T> ? Array<NonNullable<T>> : A;
export const $notNullArray = <A extends unknown[]>(arr: A) => {
    return arr.filter((item) => item !== undefined) as NonNullableArray<A>;
};

export const $asyncNoNullMap = async <I, O>(sourceArr: I[], mapper: (item: I, index: number) => O, throwError = false) => {
    const resArr: NonNullable<Awaited<O>>[] = [];
    for (let i = 0; i < sourceArr.length; i++) {
        try {
            const item = await mapper(sourceArr[i], i);
            if (item !== undefined) {
                resArr.push(item as NonNullable<Awaited<O>>);
            }
        } catch (e) {
            if (throwError) {
                throw e;
            }
            Logger.error(e);
        }
    }
    return resArr;
};

export const $asyncAllNoNullMap = async <I, O>(sourceArr: I[], mapper: (item: I, index: number) => O, throwError = false) => {
    const resArr: Promise<O | undefined>[] = [];
    for (let i = 0; i < sourceArr.length; i++) {
        const tryMapper = async () => {
            try {
                return await mapper(sourceArr[i], i);
            } catch (e) {
                if (throwError) {
                    throw e;
                }
                Logger.error(e);
            }
        };
        resArr.push(tryMapper());
    }
    const result = (await Promise.all(resArr)).filter((v) => v) as NonNullable<Awaited<O>>[];
    return result;
};

export const $noNullMap = <I, O>(sourceArr: I[], mapper: (item: I, index: number) => O) => {
    const resArr: NonNullable<O>[] = [];
    for (let i = 0; i < sourceArr.length; i++) {
        try {
            const item = mapper(sourceArr[i], i);
            if (item !== undefined) {
                resArr.push(item as NonNullable<O>);
            }
        } catch (e) {
            Logger.error(e);
        }
    }
    return resArr;
};

type $MemTimeCacheOptions = {
    time?: number;
    argsToKey?: (args: unknown[]) => unknown;
};
/**基于时间的缓存策略 */
export const memTimeCache = (options: $MemTimeCacheOptions = {}) => {
    const { time = MEM_TIME_CACHE_STRATEGY.ONE_SECOND, argsToKey = (args) => JSON.stringify(args) } = options;
    return (target: any, funName: string, desp: PropertyDescriptor) => {
        if (typeof desp.value === "function") {
            const sourceFun = desp.value;
            const cacheMap = new Map<
                unknown,
                {
                    value: unknown;
                    startTime: number;
                    endTime: number;
                }
            >();
            desp.value = function (...args: any[]) {
                const key = argsToKey(args);
                let cache = cacheMap.get(key);
                if (cache === undefined) {
                    const value = Reflect.apply(sourceFun, this, args);
                    const now = Date.now();
                    cache = { value, startTime: now, endTime: now + time };
                    cacheMap.set(key, cache);
                    /**@TODO 这类不要放太多定时器，而是统一一个定时器去轮询大家的endTime是否超时了 */
                    if (time < MEM_TIME_CACHE_STRATEGY.FOREVER) {
                        setTimeout(() => {
                            cacheMap.delete(key);
                        }, time);
                    }
                }
                return cache.value;
            };
            Reflect.set(desp.value, "__source__", sourceFun);
        } else {
            throw new Error(`memTimeCache no support ${funName} desp`);
        }
        Object.defineProperty(target, funName, desp);
    };
};
export const enum MEM_TIME_CACHE_STRATEGY {
    /**1秒 */
    ONE_SECOND = 1000,
    /**15秒 */
    FIFTEEN_SECOND = 15 * 1000,
    /**1分钟 */
    ONE_MINUTE = 60 * 1000,
    /**10分钟 */
    TEN_MINUTE = 600 * 1000,
    /**1小时 */
    ONE_HOUR = 3600 * 1000,
    /**永久 */
    FOREVER = 9007199254740991,
}
