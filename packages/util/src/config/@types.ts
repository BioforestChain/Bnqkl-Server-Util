export {};
declare global {
    export namespace ServerUtil {
        export namespace Config {
            /** 所有配置信息 */
            export interface CustomerConfig {
                /**配置文件的版本号，用于自动升级配置 */
                version: number;
                mysql: {
                    host: string;
                    port: number;
                    dbName: string;
                    username: string;
                    password: string;
                };
                redis: {
                    server: ServerUtil.Redis.ServerConfig;
                    useBloom?: boolean;
                };
                rabbitMQ: {
                    enable: boolean;
                    server: {
                        hostname: string;
                        port: number;
                        username: string;
                        password: string;
                    };
                };
                log4j: {
                    // 写入日志文件的最低级别，默认为 DEBUG
                    level: string;
                    // 写入 access 日志文件的最大级别，默认为 ERROR，可选 WARN
                    maxLevel: string;
                };
                audit: {
                    /**审核文本和图片的账号信息 */
                    secretId: string;
                    secretKey: string;
                    bucketName: string;
                    bucketRegion: string;
                    /**验证手机号运营商三要素的账号信息 */
                    phone3Element: {
                        secretId: string;
                        secretKey: string;
                    };
                };
                /**短信 */
                sms: {
                    url: string;
                    apikey: string;
                    sign: string;
                };
            }
        }
    }
}
