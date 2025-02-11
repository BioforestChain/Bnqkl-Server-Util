import { COUNTRY_CODE, HTTP_TIME_OUT_INTERVAL, MSG_CODE_EXPIRE_TIME, MSG_CODE_INTERVAL } from "../constants";
import { Logger } from "../log4j/log4j";
import * as request from "request";
import { redisCore } from "../redis";
import { CommonHelper } from "./common.helper";
import { RedisLock } from "./redis-lock.helper";

export class SmsHelper {
    constructor(private __smsConfig: ServerUtil.Config.CustomerConfig["sms"]) {}

    /**
     * 手机号国际化处理
     * @param countryCode
     * @param phone
     * @returns
     */
    i18nPhone(countryCode: string, phone: string) {
        if (countryCode === "86") {
            return phone;
        }
        // 国外手机号国际化处理
        return `+${COUNTRY_CODE[countryCode].code}${phone}`;
    }

    /**
     * 获取短信验证码的key
     * @param i18nPhone
     * @returns
     */
    getMsgCodeKey(i18nPhone: string) {
        return `msgCode:${i18nPhone}`;
    }

    /**
     * 向目标手机发送验证码
     * @param countryCode
     * @param phone
     * @returns
     */
    async sendMsgCode(countryCode: string, phone: string): Promise<string | boolean> {
        const i18nPhone = this.i18nPhone(countryCode, phone);
        // 加锁解决并发问题
        const msgCode = await RedisLock.processByLock("sendMsgCode", async () => {
            // 限制一定时间内的发送次数
            await this.__limit(i18nPhone);
            return await this.__create(i18nPhone);
        });
        try {
            /**发送短信模板 */
            const msg = `【${this.__smsConfig.sign}】您的验证码是：${msgCode}，有效期5分钟，请勿向他人泄露。如非本人操作，请忽略本消息。`;
            Logger.debug(`sendMsg to:${i18nPhone}, msg:${msg}`);
            return await this.sendMsg(i18nPhone, msg);
        } catch (e) {
            if (process.env.NODE_ENV === "dev" || process.env.NODE_ENV === "test") {
                // 开发和外网测试环境直接返回验证码
                return msgCode;
            }
            throw e;
        }
    }

    /**
     * 限制短信验证码发送
     * @param i18nPhone
     * @returns
     */
    private async __limit(i18nPhone: string): Promise<boolean> {
        const key = this.getMsgCodeKey(i18nPhone);
        const surplusMS = await redisCore.redis.pTTL(key);
        if (surplusMS >= (MSG_CODE_EXPIRE_TIME - MSG_CODE_INTERVAL) * 1000) {
            throw Error(`发送太频繁，请稍后再试`);
        }
        return true;
    }

    /**
     * 生成短信验证码
     * @param i18nPhone
     * @returns
     */
    private async __create(i18nPhone: string): Promise<string> {
        const key = this.getMsgCodeKey(i18nPhone);
        const existCode = await redisCore.redis.get(key);
        if (existCode) {
            await redisCore.redis.expire(key, MSG_CODE_EXPIRE_TIME);
            return existCode;
        }
        const newCode = CommonHelper.getRandomNum(6);
        await redisCore.redis.set(key, newCode, { EX: MSG_CODE_EXPIRE_TIME });
        return newCode;
    }

    /**
     * 校验短信验证码
     * @param countryCode
     * @param phone
     * @param msgCode
     * @param delAfterVerify 校验通过后是否使其失效
     * @returns
     */
    async verify(countryCode: string, phone: string, msgCode: string, delAfterVerify = true): Promise<boolean> {
        if (process.env.NODE_ENV === "dev") {
            // 开发环境直接跳过
            return true;
        }
        const key = this.getMsgCodeKey(this.i18nPhone(countryCode, phone));
        const existCode = await redisCore.redis.get(key);
        if (!existCode) {
            throw Error(`无效的短信验证码`);
        }
        if (msgCode !== existCode) {
            throw Error(`短信验证码错误`);
        }
        // 校验后从缓存删除
        if (delAfterVerify) {
            await redisCore.redis.del(key);
        }
        return true;
    }

    /**
     * 发送短信
     *
     * @param {string} to
     * @param {string} msg
     */
    async sendMsg(to: string, msg: string) {
        return new Promise<boolean>(async (resolve, reject) => {
            const url = this.__smsConfig.url;
            const apikey = this.__smsConfig.apikey;
            const formData = {
                apikey: apikey,
                mobile: to,
                text: msg,
            };
            try {
                request.post({ url: url, form: formData, timeout: HTTP_TIME_OUT_INTERVAL }, (err, resp, body) => {
                    if (err || !body) {
                        return reject(err);
                    }
                    body = JSON.parse(body);
                    if (body.code !== 0) {
                        Logger.debug(`send sms error, error_code: ${body.code} reason: ${body.msg}`);
                        if (body.code == 53) {
                            return reject(new Error(`发送短信失败，已达到当天发送的短信数量上限`));
                        }
                        return reject(new Error(`发送短信失败`));
                    }
                    resolve(true);
                });
            } catch (e) {
                reject(e);
            }
        });
    }
}
