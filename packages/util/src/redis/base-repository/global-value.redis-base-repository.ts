import { Injectable } from "@bnqkl/util-node";
import { memTimeCache, MEM_TIME_CACHE_STRATEGY, sleep } from "../../helper";
import { BFMetaSignUtil } from "@bfmeta/sign-util";
import { PromiseOut } from "@bnqkl/util-node";
import { GLOBAL_VALUE_BASE_ENTITY_ID, MQ_BASE_KEY_TYPE, REDIS_BASE_REPOSITORY_NAME } from "../redis.constant";
import { RedisRepository } from "../redis.repository";
import { Logger } from "../../log4j/log4j";

/**全局的Redis数据操作模型基类 */
@Injectable()
export abstract class GlobalValueRedisBaseRepository<BusinessConfig extends {} = {}> extends RedisRepository {
    constructor() {
        super(REDIS_BASE_REPOSITORY_NAME.GLOBAL_VALUE);
        const k = process.env["serverKey"];
        if (this.getBfmetaSignUtil() && k) {
            this.getBfmetaSignUtil()
                .createKeypair(k)
                .then((v) => {
                    this.__serverKeyPair.resolve(v);
                });
        }
    }

    abstract getBfmetaSignUtil(): BFMetaSignUtil;

    private __serverKeyPair = new PromiseOut<BFMetaSignUtil.Keypair>();
    async getServerKeypair() {
        return this.__serverKeyPair.promise;
    }

    async verifyKey(key: string) {
        const clientPublicKey = process.env["clientPublicKey"] as string;
        const serverKeypair = await this.getServerKeypair();
        const decryptConfigBytes = this.getBfmetaSignUtil().asymmetricDecrypt(
            Buffer.from(key, "base64"),
            new Uint8Array(Buffer.from(clientPublicKey, "hex")),
            serverKeypair.secretKey,
        );
        if (!decryptConfigBytes) {
            throw Error(`config decrypt fail`);
        }
        return decryptConfigBytes;
    }

    async saveConfig(config: BusinessConfig) {
        for (const key in config) {
            await this.saveConfigByKey(config[key], key);
        }
    }

    async saveConfigByKey<T extends keyof BusinessConfig>(config: BusinessConfig[T], hkey: T) {
        const serverKeypair = await this.getServerKeypair();
        const result = this.getBfmetaSignUtil().asymmetricEncrypt(
            new Uint8Array(Buffer.from(JSON.stringify(config))),
            serverKeypair.publicKey,
            serverKeypair.secretKey,
        );
        // 这个值存到redis
        await this.setKeyValue(GLOBAL_VALUE_BASE_ENTITY_ID.CONFIG, hkey as string, Buffer.from(result.encryptedMessage).toString("base64"));
        return true;
    }

    @memTimeCache({ time: MEM_TIME_CACHE_STRATEGY.ONE_SECOND })
    async getConfig(): Promise<BusinessConfig> {
        let allKeys = await this.getAllKeys(GLOBAL_VALUE_BASE_ENTITY_ID.CONFIG);
        const config = {};
        for (const key of allKeys) {
            if (key === "businessConfig") {
                // 忽略旧key
                continue;
            }
            config[key] = await this.getConfigByKey(key as keyof BusinessConfig);
        }
        return config as BusinessConfig;
    }

    async getConfigByKeyForce<T extends keyof BusinessConfig>(hkey: T): Promise<BusinessConfig[T]> {
        let config = await this.getConfigByKey<T>(hkey);
        if (!config) {
            Logger.debug(`配置文件未找到 等待配置`);
            await sleep(5000);
            return this.getConfigByKeyForce(hkey);
        }
        return config;
    }

    @memTimeCache({ time: MEM_TIME_CACHE_STRATEGY.ONE_SECOND })
    async getConfigByKey<T extends keyof BusinessConfig>(hkey: T): Promise<BusinessConfig[T] | undefined> {
        let encryptConfig = await this.getKeyValue(GLOBAL_VALUE_BASE_ENTITY_ID.CONFIG, hkey as string);
        if (!encryptConfig) {
            return;
        }
        const serverKeypair = await this.getServerKeypair();
        const configBytes = this.getBfmetaSignUtil().asymmetricDecrypt(Buffer.from(encryptConfig, "base64"), serverKeypair.publicKey, serverKeypair.secretKey);
        if (!configBytes) {
            return;
        }
        var config = JSON.parse(Buffer.from(configBytes).toString());
        return config;
    }

    private __getConsumerKey(routingKey: string, data: object) {
        return `${routingKey}-${JSON.stringify(data)}`;
    }

    /**
     * 获取已消费完成标记
     * @param routingKey
     * @param data
     * @returns
     */
    async isConsumeComplete(routingKey: string, data: object) {
        return await this.isSetMember(GLOBAL_VALUE_BASE_ENTITY_ID.MQ, MQ_BASE_KEY_TYPE.CONSUME_COMPLETE, this.__getConsumerKey(routingKey, data));
    }

    /**
     * 设置已消费完成标记
     * @param routingKey
     * @param data
     * @returns
     */
    async setConsumeComplete(routingKey: string, data: object) {
        return await this.addToSet(GLOBAL_VALUE_BASE_ENTITY_ID.MQ, MQ_BASE_KEY_TYPE.CONSUME_COMPLETE, this.__getConsumerKey(routingKey, data));
    }

    /**
     * 删除已消费完成标记
     * @param routingKey
     * @param data
     * @returns
     */
    async delConsumeComplete(routingKey: string, data: object) {
        return await this.delFromSet(GLOBAL_VALUE_BASE_ENTITY_ID.MQ, MQ_BASE_KEY_TYPE.CONSUME_COMPLETE, this.__getConsumerKey(routingKey, data));
    }
}
