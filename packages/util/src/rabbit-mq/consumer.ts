import { Logger } from "../log4j/log4j";
import { MQ_DLX_DEFAULT_RETRY_INTERVAL } from "./mq.constants";
import { MqHelper } from "./mq.helper";

export class MqConsumer {
    private __mqHelper: MqHelper;
    constructor(config: ServerUtil.Mq.ServerConfig) {
        this.__mqHelper = new MqHelper(config);
    }

    /**
     * 查看上链事件队列的信息
     * @param routingKey
     * @param mqId
     * @param bTemp
     * @returns
     */
    async checkEventQueue<RoutingKey extends string>(exchangeName: string, dlxExchangeName: string, routingKey: RoutingKey, mqId: string, bTemp = false) {
        const channel = await this.__mqHelper.getConsumeChannel(exchangeName, dlxExchangeName, routingKey, bTemp, mqId);
        return await channel.checkQueue(this.__mqHelper.getNormalQueueName(routingKey, bTemp, mqId));
    }

    /**
     * 消费事件
     * @param exchangeName
     * @param dlxExchangeName
     * @param routingKey
     * @param onConsumeNormalCallback 消费普通队列的回调函数
     * @param mqId
     * @param bTemp
     * @param dlxOpts 死信队列选项
     * @param afterAckNormalCallback 确认消费普通队列之后的回调函数
     */
    async consumeEvent<RoutingKey extends string, EventDataType extends {}>(
        exchangeName: string,
        dlxExchangeName: string,
        routingKey: RoutingKey,
        onConsumeNormalCallback: (args: EventDataType) => Promise<void>,
        mqId: string,
        bTemp = false,
        dlxOpts?: {
            expiration?: number;
            onConsumeDLXCallback?: (args: EventDataType) => Promise<void>;
        },
        afterAckNormalCallback?: (args: EventDataType) => Promise<void>,
    ) {
        const channel = await this.__mqHelper.getConsumeChannel(exchangeName, dlxExchangeName, routingKey, bTemp, mqId);
        // 消费普通队列
        await channel.consume(this.__mqHelper.getNormalQueueName(routingKey, bTemp, mqId), async (msg) => {
            if (!msg) {
                return;
            }
            const args: EventDataType = JSON.parse(msg.content.toString());
            try {
                Logger.debug(`consume: ${routingKey}. ${JSON.stringify(args)}`);
                await onConsumeNormalCallback(args);
                Logger.debug(`ack: ${routingKey}. ${JSON.stringify(args)}}`);
                channel.ack(msg);
                if (afterAckNormalCallback) {
                    await afterAckNormalCallback(args);
                }
            } catch (error) {
                // reject，不影响其他msg
                Logger.error(error);
                Logger.debug(`reject: ${routingKey}. ${JSON.stringify(args)}`);
                channel.reject(msg, false);
            }
        });
        // 消费死信队列
        await channel.consume(this.__mqHelper.getDLXQueueName(routingKey, bTemp, mqId), async (msg) => {
            if (!msg) {
                return;
            }
            const args: EventDataType = JSON.parse(msg.content.toString());
            try {
                Logger.debug(`consume dlx: ${routingKey}. ${JSON.stringify(args)}`);
                const onConsumeCallback =
                    dlxOpts?.onConsumeDLXCallback ??
                    (async () => {
                        // 放入重试队列中等待
                        channel.sendToQueue(this.__mqHelper.getDelayRetryQueueName(routingKey, bTemp, mqId), msg.content, {
                            persistent: !bTemp,
                            expiration: dlxOpts?.expiration ?? MQ_DLX_DEFAULT_RETRY_INTERVAL,
                        });
                    });
                await onConsumeCallback(args);
                Logger.debug(`ack dlx: ${routingKey}. ${JSON.stringify(args)}`);
                channel.ack(msg);
            } catch (error) {
                // 不ack，只报错，不影响其他msg
                Logger.error(error);
            }
        });
    }
}
