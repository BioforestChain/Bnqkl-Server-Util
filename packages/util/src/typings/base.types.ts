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

        /**身份证识别信息 */
        export interface IDCardOCRInfo {
            /**姓名 */
            name?: string;
            /**出生日期 */
            birth?: string;
            /**身份证号 */
            idNum?: string;
            /**证件有效期 */
            validDate?: string;
            /**地址 */
            address?: string;
        }
    }
}
