import { createClient, RedisClientType, RedisDefaultModules } from "redis";
import type { $PromiseMaybe } from "@bnqkl/util-node";
import { Logger } from "../log4j/log4j";
export interface $RedisClient extends RedisClientType<RedisDefaultModules> {}
class RedisCore {
    private __redis!: $RedisClient;
    private __redisForSubPub!: $RedisClient;

    async connect(server: ServerUtil.Redis.ServerConfig) {
        try {
            this.__redis = createClient({
                url: `redis://${server.host}:${server.port}`,
                // family: config.redis.server.family,
                password: server.password,
                database: server.db,
                socket: {
                    reconnectStrategy: (retries) => Math.min(retries * 50, 500),
                },
            });
            this.__redis.on("error", (err) => Logger.error(err));
            this.__redisForSubPub = createClient({
                url: `redis://${server.host}:${server.port}`,
                password: server.password,
                database: server.db,
                socket: {
                    reconnectStrategy: (retries) => Math.min(retries * 50, 500),
                },
            });
            this.__redisForSubPub.on("error", (err) => Logger.error(err));
            await Promise.all([this.__redis.connect(), this.__redisForSubPub.connect()]);
            Logger.debug(`connect to redis success`);
            return this.__redis;
        } catch (error) {
            Logger.error(`connect redis error = ${error}`);
        }
    }

    get redis() {
        return this.__redis;
    }

    get redisForSubPub() {
        return this.__redisForSubPub;
    }

    async getJson<T>(key: string | Buffer) {
        const json = await this.redis.get(key);
        try {
            return json ? (JSON.parse(json) as T) : null;
        } catch {
            console.error(`invalid redis cache format(json): ${key}`);
            return null;
        }
    }

    async loadJson<T>(
        key: string | Buffer,
        reader: () => $PromiseMaybe<T | null>,
        writter: (json: T) => unknown = (json) => this.redis.set(key, JSON.stringify(json)),
    ) {
        let json = await this.getJson<T>(key);
        if (json === null) {
            json = await reader();
            if (json) {
                // 默认不需要对writter进行等待
                void writter(json);
            }
        }
        return json;
    }
}

export const redisCore = new RedisCore();
