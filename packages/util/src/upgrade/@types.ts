export {};
declare global {
    export namespace ServerUtil {
        export namespace Upgrade {
            export type MysqlUpdateList = {
                /**版本号 */
                version: string;
                /**更新描述 */
                describe: string;
                /**执行的sql文件名 */
                fileName: string;
            }[];

            export type PatchVersionArray = {
                /**版本号 */
                version: string;
                /**更新描述 */
                describe: string;
                /**执行的函数名 */
                method: string;
            };
        }
    }
}
