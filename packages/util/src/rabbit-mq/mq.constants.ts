/**mq的消费者最大同时获取消息数 */
export const MQ_CONSUME_MAX_SPEED = 200;
/**mq的死信队列默认重试间隔（10分钟） */
export const MQ_DLX_DEFAULT_RETRY_INTERVAL = 10 * 60 * 1000;

/**死信队列的后缀 */
export const DEAD_LETTER_POSTFIX = "deadLetter";
/**延迟重试队列的后缀 */
export const DELAY_RETRY_POSTFIX = "delayRetry";

/**交换机类型 */
export enum ExchangeType {
    /**直接 */
    DIRECT = "direct",
    /**主题订阅 */
    TOPIC = "topic",
    /**广播 */
    FANOUT = "fanout",
}
