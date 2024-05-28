export {};
declare global {
    export namespace ServerUtil {
        export namespace Mq {
            type ServerConfig = {
                hostname: string;
                port: number;
                username: string;
                password: string;
            };

            /**mq处理者 */
            export interface MqProcessor {
                /**
                 * 处理mq任务
                 */
                processMqTask(): void;
                /**
                 * 处理mq连接事件
                 */
                processMqConnect(): Promise<void>;

                /**
                 * 处理mq重连事件
                 */
                processMqReConnect(): Promise<void>;
            }

            /**消费订单事件数据 */
            export interface ConsumeOrderEventData {
                orderId: string;
            }
        }
    }
}
