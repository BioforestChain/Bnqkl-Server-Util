type BI = bigint | number | string;

interface FractionJSON<T extends BI = number> {
    /**分子 */
    numerator: T;
    /**分母 */
    denominator: T;
}

/**
 * 格式化参数
 *
 * @param param
 */
function formatParam(param: BI) {
    try {
        if (typeof param === "string") {
            if (/^[0-9-]*$/.test(param) === false) {
                throw new Error("QAQ");
            }
            param = parseInt(param);
        } else if (typeof param === "number") {
            param = Math.floor(param);
        } else {
            return param;
        }
        return BigInt(param);
    } catch (err) {
        throw new Error(`param ${param} is invalid`);
    }
}

export class JSBIHelper {
    /**
     * 求最大公约数，欧几里得 - 辗转相除
     *
     * @param prev
     * @param next
     * @returns
     */
    static greatestCommonDivisor(prev: bigint, next: bigint): bigint {
        return next === BigInt(0) ? prev : this.greatestCommonDivisor(next, prev % next);
    }

    /**
     * 将数转成分数
     *
     * @param value
     * @returns
     */
    static toFraction(value: string) {
        if (value.includes(".")) {
            const items = value.split(".");
            let numerator = BigInt(items[0] + items[1]);
            let denominator = BigInt("1" + "0".repeat(items[1].length));
            const gcd = this.greatestCommonDivisor(numerator, denominator);
            return {
                numerator: (numerator / gcd).toString(),
                denominator: (denominator / gcd).toString(),
            };
        } else {
            return {
                numerator: value,
                denominator: "1",
            };
        }
    }

    /**
     * 比较两个分数的大小
     *
     * @return 0: fraction1 === fraction2
     * @return 1: fraction1 > fraction2
     * @return -1: fraction1 < fraction2
     *
     * @param fraction1
     * @param fraction2
     */
    static compareFraction(fraction1: FractionJSON<BI>, fraction2: FractionJSON<BI>) {
        const frac1Numerator = formatParam(fraction1.numerator);
        const frac1Denominator = formatParam(fraction1.denominator);
        const frac2Numerator = formatParam(fraction2.numerator);
        const frac2Denominator = formatParam(fraction2.denominator);
        const frac1 = frac1Numerator * frac2Denominator;
        const frac2 = frac2Numerator * frac1Denominator;
        return frac1 === frac2 ? 0 : frac1 > frac2 ? 1 : -1;
    }

    /**
     * 两个分数相减
     *
     * @param fraction1
     * @param fraction2
     * @returns
     */
    static minusFraction(fraction1: FractionJSON<BI>, fraction2: FractionJSON<BI>) {
        const frac1Numerator = formatParam(fraction1.numerator);
        const frac1Denominator = formatParam(fraction1.denominator);
        const frac2Numerator = formatParam(fraction2.numerator);
        const frac2Denominator = formatParam(fraction2.denominator);
        const denominator = frac1Denominator * frac2Denominator;
        const numerator = frac1Numerator * frac2Denominator - frac2Numerator * frac1Denominator;
        const gcd = this.greatestCommonDivisor(numerator, denominator);
        return {
            numerator: (numerator / gcd).toString(),
            denominator: (denominator / gcd).toString(),
        };
    }

    /**
     * 与分数相乘，向下取整
     *
     * @param z
     */
    static multiplyFloorFraction(x: BI, y: FractionJSON<BI>) {
        const formatX = formatParam(x);
        const numerator = BigInt(y.numerator);
        const denominator = BigInt(y.denominator);
        /// 乘分子，除分母。自动丢失精度
        const xn = formatX * numerator;
        return xn / denominator;
    }

    /**
     * 与分数相乘，向上取整
     *
     * @param z
     */
    static multiplyCeilFraction(x: BI, y: FractionJSON<BI>) {
        const formatX = formatParam(x);
        const numerator = BigInt(y.numerator);
        const denominator = BigInt(y.denominator);
        /// 乘分子，除分母
        const xn = formatX * numerator;
        const result = xn / denominator;
        // 如果能够正确还原，说明是整除
        if (result * denominator === xn) {
            return result;
        }
        return result + BigInt(1);
    }

    /**
     * 与分数相乘，四舍五入
     *
     * @param z
     */
    static multiplyRoundFraction(x: BI, y: FractionJSON<BI>) {
        const z = this.multiplyFloorFraction(x, {
            numerator: BigInt(y.numerator) * BigInt(10),
            denominator: BigInt(y.denominator),
        });
        const result = z / BigInt(10);
        if (z % BigInt(10) >= BigInt(5)) {
            return result + BigInt(1);
        }
        return result;
    }
}
