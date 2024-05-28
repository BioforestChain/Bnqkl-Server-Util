import { MqHelper } from "./mq.helper";

export class MqPublisher {
    private __mqHelper: MqHelper;
    constructor(config: ServerUtil.Mq.ServerConfig) {
        this.__mqHelper = new MqHelper(config);
    }

    /**
     * 生产事件
     * @param exchangeName
     * @param dlxExchangeName
     * @param routingKey
     * @param data
     * @param mqId
     * @param bTemp
     * @param timeOffset
     * @returns
     */
    async publishEvent<RoutingKey extends string, EventDataType extends {}>(
        exchangeName: string,
        dlxExchangeName: string,
        routingKey: RoutingKey,
        data: EventDataType,
        mqId: string,
        bTemp = false,
        timeOffset?: number,
    ) {
        const channel = await this.__mqHelper.getPublishChannel(exchangeName, dlxExchangeName, routingKey, bTemp, mqId);
        const message = JSON.stringify(data);
        return new Promise<boolean>((resolve, reject) => {
            channel.publish(
                this.__mqHelper.getExchangeName(exchangeName, bTemp, mqId),
                routingKey,
                Buffer.from(message),
                {
                    persistent: true,
                    expiration: timeOffset,
                },
                (err) => {
                    if (err) {
                        return reject(err);
                    }
                    resolve(true);
                },
            );
        });
    }
}
