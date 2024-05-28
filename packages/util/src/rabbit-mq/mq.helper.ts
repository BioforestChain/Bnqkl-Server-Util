import { Channel, ConfirmChannel, Options } from "amqplib";
import { DEAD_LETTER_POSTFIX, DELAY_RETRY_POSTFIX, ExchangeType, MQ_CONSUME_MAX_SPEED } from "./mq.constants";
import { PromiseOut } from "@bnqkl/util-node";
import { Logger } from "../log4j/log4j";
import { rabbitMQCore } from "./rabbit-mq.core";

export class MqHelper {
    private __initQueuePromiseMap = new Map<string, PromiseOut<void>>();
    private __consumeChannelPromise?: PromiseOut<Channel>;
    private __publishChannelPromise?: PromiseOut<ConfirmChannel>;

    private __config: ServerUtil.Mq.ServerConfig;

    constructor(config: ServerUtil.Mq.ServerConfig) {
        this.__config = config;
    }

    /**
     * 获取交换机名字
     * @param exchangeName
     * @param bTemp
     * @param mqId
     */
    getExchangeName(exchangeName: string, bTemp: boolean, mqId: string) {
        return `${bTemp ? "temp_" : ""}${exchangeName}_${mqId}`;
    }

    /**
     * 获取普通队列名字
     * @param routingKey
     * @param bTemp
     * @param mqId
     */
    getNormalQueueName(routingKey: string, bTemp: boolean, mqId: string) {
        return `${bTemp ? "temp_" : ""}queue_${routingKey}_${mqId}`;
    }

    /**
     * 获取死信队列名字
     * @param routingKey
     * @param bTemp
     * @param mqId
     */
    getDLXQueueName(routingKey: string, bTemp: boolean, mqId: string) {
        return `${bTemp ? "temp_" : ""}queue_${routingKey}_${DEAD_LETTER_POSTFIX}_${mqId}`;
    }

    /**
     * 获取延迟重试队列名字
     * @param routingKey
     * @param bTemp
     * @param mqId
     */
    getDelayRetryQueueName(routingKey: string, bTemp: boolean, mqId: string) {
        return `${bTemp ? "temp_" : ""}queue_${routingKey}_${DELAY_RETRY_POSTFIX}_${mqId}`;
    }

    private async __getConsumeChannel() {
        if (this.__consumeChannelPromise) {
            return this.__consumeChannelPromise.promise;
        }
        this.__consumeChannelPromise = new PromiseOut();
        const connection = await rabbitMQCore.getConnection(this.__config);
        const channel = await connection.createChannel();
        channel.on("close", () => {
            Logger.error(`consume channel close.`);
            this.__consumeChannelPromise = undefined;
            this.__initQueuePromiseMap.clear();
        });
        channel.on("error", async (error) => {
            Logger.error(`consume channel error =`, error);
            await channel.close();
        });
        await channel.prefetch(MQ_CONSUME_MAX_SPEED);
        this.__consumeChannelPromise.resolve(channel);
        return this.__consumeChannelPromise.promise;
    }

    private async __getPublishChannel() {
        if (this.__publishChannelPromise) {
            return this.__publishChannelPromise.promise;
        }
        this.__publishChannelPromise = new PromiseOut();
        const connection = await rabbitMQCore.getConnection(this.__config);
        const channel = await connection.createConfirmChannel();
        channel.on("close", () => {
            Logger.error(`publish channel close.`);
            this.__publishChannelPromise = undefined;
            this.__initQueuePromiseMap.clear();
        });
        channel.on("error", async (error) => {
            Logger.error(`publish channel error =`, error);
            await channel.close();
        });
        this.__publishChannelPromise.resolve(channel);
        return this.__publishChannelPromise.promise;
    }

    /**
     * 获取生产者信道
     * @param exchangeName
     * @param dlxExchangeName
     * @param routingKey
     * @param bTemp
     * @param mqId
     */
    async getPublishChannel(exchangeName: string, dlxExchangeName: string, routingKey: string, bTemp: boolean, mqId: string) {
        const channel = await this.__getPublishChannel();
        await this.__initQueues(channel, exchangeName, dlxExchangeName, routingKey, bTemp, mqId);
        return channel;
    }

    /**
     * 获取消费者信道
     * @param exchangeName
     * @param dlxExchangeName
     * @param routingKey
     * @param bTemp
     * @param mqId
     */
    async getConsumeChannel(exchangeName: string, dlxExchangeName: string, routingKey: string, bTemp: boolean, mqId: string) {
        const channel = await this.__getConsumeChannel();
        await this.__initQueues(channel, exchangeName, dlxExchangeName, routingKey, bTemp, mqId);
        return channel;
    }

    /**
     * 初始化队列
     * @param channel
     * @param exchangeName
     * @param dlxExchangeName
     * @param routingKey
     * @param bTemp
     * @param mqId
     */
    private async __initQueues(channel: Channel, exchangeName: string, dlxExchangeName: string, routingKey: string, bTemp: boolean, mqId: string) {
        const key = `${exchangeName}_${routingKey}`;
        let channelPromise = this.__initQueuePromiseMap.get(key);
        if (channelPromise) {
            return channelPromise.promise;
        }
        channelPromise = new PromiseOut();
        this.__initQueuePromiseMap.set(key, channelPromise);
        const realExchangeName = this.getExchangeName(exchangeName, bTemp, mqId);
        const realDlxExchangeName = this.getExchangeName(dlxExchangeName, bTemp, mqId);
        const exchangeOpts: Options.AssertExchange = bTemp ? { durable: false, autoDelete: true } : { durable: true };
        const initNormal = async () => {
            // 声明交换机
            await channel.assertExchange(realExchangeName, ExchangeType.DIRECT, exchangeOpts);
            // 声明消息队列
            const queueName = this.getNormalQueueName(routingKey, bTemp, mqId);
            await channel.assertQueue(
                queueName,
                bTemp
                    ? { durable: false, autoDelete: true, exclusive: true, deadLetterExchange: realDlxExchangeName, deadLetterRoutingKey: routingKey }
                    : {
                          durable: true,
                          deadLetterExchange: realDlxExchangeName,
                          deadLetterRoutingKey: routingKey,
                      },
            );
            // 绑定消费者到队列关系
            await channel.bindQueue(queueName, realExchangeName, routingKey);
        };
        const initDLX = async () => {
            // 声明死信交换机
            await channel.assertExchange(realDlxExchangeName, ExchangeType.DIRECT, exchangeOpts);
            // 声明死信消息队列
            const queueName = this.getDLXQueueName(routingKey, bTemp, mqId);
            await channel.assertQueue(queueName, bTemp ? { durable: false, autoDelete: true, exclusive: true } : { durable: true });
            // 绑定消费者到死信队列关系
            await channel.bindQueue(queueName, realDlxExchangeName, routingKey);
        };
        const initDelayRetry = async () => {
            // 声明延迟重试队列
            const queueName = this.getDelayRetryQueueName(routingKey, bTemp, mqId);
            // 超时后自动发给普通队列
            await channel.assertQueue(
                queueName,
                bTemp
                    ? { durable: false, autoDelete: true, exclusive: true, deadLetterExchange: realExchangeName, deadLetterRoutingKey: routingKey }
                    : {
                          durable: true,
                          deadLetterExchange: realExchangeName,
                          deadLetterRoutingKey: routingKey,
                      },
            );
        };
        await initNormal();
        await initDLX();
        await initDelayRetry();
        channelPromise.resolve();
        return channelPromise.promise;
    }
}
