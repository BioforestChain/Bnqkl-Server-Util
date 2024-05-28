export {};
declare global {
    export namespace ServerUtil {
        //api返回类型
        export type ApiReturn = ApiSuccessReturn | ApiFailReturn;
        export type ApiSuccessReturn = {
            success: true;
            result: any; //成功时的返回结果
        };
        export type ApiFailReturn = {
            success: false;
            error: {
                message: string; //失败的message
                code?: number; //失败的CODE
            };
            timeStamp: number;
            path: string;
            version: string;
        };
    }
}
