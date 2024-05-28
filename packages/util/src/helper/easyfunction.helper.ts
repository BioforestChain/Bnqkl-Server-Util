/**
 * 严格的混合， props 必须是 obj 的子集
 * 与 Object.assign 不同， Object.assign 是宽松的子集，适合用于对 HashMap 的混合
 *
 * @param obj
 * @param props
 * @param strict
 */
export const $assign = <T extends {}>(obj: T, props: Partial<T>, strict = true) => {
    /**@TODO 进行严格的参数检查 */
    for (const key in props) {
        obj[key] = props[key]!;
    }
    return obj;
};

export const $ifThenElse = <T = void, E = void>(condition: boolean, thener = () => undefined as unknown as T, elser = () => undefined as unknown as E) => {
    return condition ? thener() : elser();
};

export const $noEmptyObject = <T>(object: T): object is NonNullable<T> => {
    if (typeof object === "object" && object !== null) {
        for (const key in object) {
            return true;
        }
    }
    return false;
};

export const $omit = <T, K extends keyof T>(object: T, ...keys: K[]) => {
    const omitedObj = { ...object };
    for (const key of keys) {
        delete (omitedObj as unknown as Partial<T>)[key];
    }
    return omitedObj as Omit<T, K>;
};
export const $pick = <T, K extends keyof T>(object: T, ...keys: K[]) => {
    const pickedObj: Partial<T> = {};
    for (const key of keys) {
        pickedObj[key] = object[key];
    }
    return object as Pick<T, K>;
};
export const $getSort = <T>(sortStr: string, targetSortArray: string[], realTargetMap: { [key: string]: string }) => {
    let sortIsEmpty = true;
    const sort: { [key: string]: number } = {};
    const sortSplitStr = "||";
    const sortDirectionSplitStr = "|";
    const sortArray = sortStr.split(sortSplitStr);
    sortArray.forEach((element) => {
        const sortInfoArray = element.split(sortDirectionSplitStr);
        if (sortInfoArray.length === 2) {
            if (targetSortArray.includes(sortInfoArray[0])) {
                sort[realTargetMap[sortInfoArray[0]]] = parseInt(sortInfoArray[1]);
                sortIsEmpty = false;
            }
        }
    });
    // 如果排序内容不为空，则最后加上_id升序，避免分页重复错误
    if (!sortIsEmpty) {
        sort["_id"] = 1;
    }
    return sort;
};

/**
 *
 * @param content 原字符串
 * @param n 保留n位字符串
 * @param tailStr 结尾符号
 * @returns
 */
export const $cutString = (content: string, n: number, tailStr: string = "...") => {
    if (content.length <= n) {
        return content;
    } else {
        return content.substring(0, n) + tailStr;
    }
};
