import * as amqp from "amqplib";
import * as events from "events";
import { Logger } from "../log4j/log4j.js";
import { PromiseOut } from "@bnqkl/util-node";

class RabbitMQCore extends events.EventEmitter {
    private __connectionPromise?: PromiseOut<amqp.ChannelModel>;
    private __isReconnect = false;

    async getConnection(config: ServerUtil.Mq.ServerConfig) {
        if (this.__connectionPromise) {
            return this.__connectionPromise.promise;
        }
        this.__connectionPromise = new PromiseOut();
        const { hostname, port, username, password } = config;
        // 创建连接对象
        const connection = await amqp.connect({ hostname, port, username, password, heartbeat: 30 });
        Logger.debug(`connect to rabbitMQ success`);
        connection.on("close", async () => {
            Logger.error(`rabbitMQ close`);
            this.__connectionPromise = undefined;
            this.__isReconnect = true;
            await this.getConnection(config);
        });
        connection.on("error", async (error) => {
            Logger.error(`rabbitMQ error = `, error);
            await connection.close();
        });
        this.emit("connect");
        if (this.__isReconnect) {
            this.emit("reconnect");
        }
        this.__connectionPromise.resolve(connection);
        return this.__connectionPromise.promise;
    }
}

export const rabbitMQCore = new RabbitMQCore();
