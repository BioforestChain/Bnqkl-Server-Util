export const precisionReplace = (amount: string | number, decimals: number, add?: string | number) => {
    if (decimals <= 0 || isNaN(+amount)) {
        throw new Error(`amount:${amount} or decimals:${decimals} is error`);
    }
    /// 已经确定是数字了，直接分割，整数部分乘精确度，小数部分补充位数，在相加就行
    const numArr = String(amount).split(".");
    /// 是否负数
    const hasNegative = String(amount).startsWith("-");
    const integerPart = BigInt(numArr[0]) * BigInt(10) ** BigInt(decimals);
    const decimalPart = (numArr[1] || "").padEnd(decimals, "0");

    let value = hasNegative == false ? integerPart + BigInt(decimalPart) : integerPart - BigInt(decimalPart);

    if (add !== undefined && isNaN(+add) === false) {
        value = value + BigInt(add);
    }
    return value.toString();
};

const randomDic = "0123456789abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ";
const getRandomIndex = () => {
    return Math.floor(Math.random() * randomDic.length);
};
export const generateRandomInviteCode = (length: number) => {
    let str = "";
    for (let i = 0; i < length; i++) {
        str += randomDic[getRandomIndex()];
    }
    return str;
};
