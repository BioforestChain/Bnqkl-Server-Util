import * as uuid from "uuid";
import BigNumber from "bignumber.js";

export class CommonHelper {
    /**
     * 获取UUID
     *
     * @returns {string}
     */
    static getUuid(): string {
        return uuid.v4().replace(/-/g, "");
    }

    /**
     * 判断v1与v2的大小。前面的版本比较高返回1，后面比较高返回-1 相同返回0
     * @param v1
     * @param v2
     */
    static compareVersion(v1: string, v2: string) {
        if (v1[0] === "v" || v1[0] === "V") {
            v1 = v1.substring(1);
        }
        if (v2[0] === "v" || v2[0] === "V") {
            v2 = v2.substring(1);
        }
        if (v1 === v2) {
            return 0;
        }
        const vs1 = v1.split(".").map((a) => parseInt(a));
        const vs2 = v2.split(".").map((a) => parseInt(a));
        const length = Math.min(vs1.length, vs2.length);
        for (let i = 0; i < length; i++) {
            if (vs1[i] > vs2[i]) {
                return 1;
            } else if (vs1[i] < vs2[i]) {
                return -1;
            }
        }
        if (length === vs1.length) {
            return -1;
        } else {
            return 1;
        }
    }

    /**
     * 判断输入值是否是正整数
     * @param value
     */
    static isPositiveInteger(value: any): value is number {
        return Number.isInteger(value) && value > 0;
    }

    static formatData(data: any) {
        for (const key in data) {
            const value = data[key];
            if (typeof value === "bigint") {
                data[key] = value.toString();
                continue;
            }
            if (typeof value === "object" && !Buffer.isBuffer(value) && !(value instanceof Uint8Array)) {
                this.formatData(value);
            }
        }
        return data;
    }

    static random(min: number, max: number) {
        return Math.round(Math.random() * (max - min)) + min;
    }

    /**
     * 获取n位随机字符
     * @param  n 默认为6
     * @returns
     */
    static getRandomChar(n = 6) {
        const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";
        const maxPos = chars.length;

        let res = "";
        for (let i = 0; i < n; i++) {
            res += chars.charAt(Math.floor(Math.random() * maxPos));
        }
        return res;
    }

    /**
     * 给字符串加0前缀
     * @param num
     * @param length
     * @returns
     */
    static addZero(num: string, length: number): string {
        for (let len = num.length; len < length; len = num.length) {
            num = "0" + num;
        }
        return num;
    }

    /**
     * 按页循环
     * @param pageSize 页大小
     * @param getTotal 取得数据总条数的函数
     * @param getDataPage 取得某一页数据的函数
     * @param processData 处理单个数据的函数
     * @param onPageFinish 本页处理结束的回调函数
     * @param onFinish 所有数据处理结束的回调函数
     * @param series 顺序执行，不并发
     */
    static async pageLoop<T>(
        pageSize: number,
        getTotal: () => Promise<number>,
        getDataPage: (page: number, pageSize: number) => Promise<T[]>,
        processData: (data: T) => Promise<void>,
        onPageFinish?: (page: number, pageTimeStart: number, datas: T[]) => Promise<void>,
        onFinish?: (timeStart: number) => void,
        series = false,
    ) {
        const timeStart = Date.now();
        const total = await getTotal();
        const page = Math.floor(total / pageSize);
        for (let i = 0; i <= page; i++) {
            const pageTimeStart = Date.now();
            const datas = await getDataPage(i, pageSize);
            if (i === page && datas.length === 0) {
                // 最后一页没数据，可能是total/pageSize为整数，则不需要走onPageFinish，直接break
                break;
            }
            if (series) {
                for (const data of datas) {
                    await processData(data);
                }
            } else {
                const promises = datas.map((data) => processData(data));
                await Promise.all(promises);
            }
            onPageFinish && (await onPageFinish(i, pageTimeStart, datas));
        }
        onFinish && onFinish(timeStart);
    }

    /**
     * 获取分布式锁的key
     * @param lockName
     * @returns
     */
    static getLockCacheKey(lockName: string) {
        return `lock:${lockName}`;
    }

    /**
     * bigint转为精度为decimals的number
     * @param value
     * @param decimals
     * @returns
     */
    static transformBigIntToNumber(value: string | number | bigint, decimals: number = 8) {
        // 只取小数点后8位
        return new BigNumber(value.toString())
            .div(10 ** decimals)
            .decimalPlaces(8)
            .toNumber();
    }

    /**
     * bigint转为精度为decimals的string
     * @param value
     * @param decimals
     * @returns
     */
    static transformBigIntToString(value: string | number | bigint, decimals: number = 8) {
        return new BigNumber(value.toString()).div(10 ** decimals).toFixed();
    }

    /**
     * 小数字符串保留N位小数
     * @param value
     * @param decimalPlaces
     */
    static toFixed(value: string, decimalPlaces: number = 8) {
        return new BigNumber(value).toFixed(decimalPlaces);
    }

    /**
     * 把obj的所有key的小数字符串保留N位小数
     * @param value
     * @param decimalPlaces
     */
    static objToFixed(values: { [x: string]: string }, decimalPlaces: number = 8) {
        for (const key in values) {
            values[key] = this.toFixed(values[key], decimalPlaces);
        }
        return values;
    }

    static isVaildSHA256(str: string) {
        const sha256Pattern = /^[0-9a-fA-F]{64}$/;
        return sha256Pattern.test(str);
    }
}
