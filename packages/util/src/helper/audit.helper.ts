import COS from "cos-nodejs-sdk-v5";
import { HTTP_TIME_OUT_INTERVAL, IMAGE_AUDIT_LEVEL, REDIS_ID_CARD_OCR_EXPIRE_TIME, TEXT_AUDIT_LEVEL } from "../constants";
import { Logger } from "../log4j/log4j";
import { redisCore } from "../redis";
import { memTimeCache, MEM_TIME_CACHE_STRATEGY } from "./function.helper";
import * as request from "request";
import * as CryptoJS from "crypto-js";
import * as tencentcloud from "tencentcloud-sdk-nodejs-ocr";
import { IDCardOCRResponse } from "tencentcloud-sdk-nodejs-ocr/tencentcloud/services/ocr/v20181119/ocr_models";

export class AuditHelper {
    constructor(private __auditConfig: ServerUtil.Config.CustomerConfig["audit"]) {}

    @memTimeCache({ time: MEM_TIME_CACHE_STRATEGY.FOREVER })
    getTencentConfig() {
        const { secretId, secretKey, bucketName, bucketRegion } = this.__auditConfig;
        const OcrClient = tencentcloud.ocr.v20181119.Client;
        return {
            cos: new COS({ SecretId: secretId, SecretKey: secretKey }),
            config: { bucketName, bucketRegion },
            ocrClient: new OcrClient({
                credential: { secretId, secretKey },
                region: bucketRegion,
                profile: { httpProfile: { endpoint: "ocr.tencentcloudapi.com" } },
            }),
            textAuditUrl: `https://${bucketName}.ci.${bucketRegion}.myqcloud.com/text/auditing`,
            idCheckUrl: "https://service-4epp7bin-1300755093.ap-beijing.apigateway.myqcloud.com/release/phone3element",
        };
    }

    /**
     * 文本审核
     * @param text
     * @param auditLevel
     * @returns
     */
    async auditText(text: string, auditLevel = TEXT_AUDIT_LEVEL.NORMAL): Promise<void> {
        if (!text) {
            return;
        }
        if (process.env.NODE_ENV === "dev") {
            // 开发环境直接跳过
            return;
        }
        const auditResult = await this.__auditTextContent(text, auditLevel);
        if (auditResult.statusCode !== 200 && !auditResult.Response) {
            throw Error(`审核不通过，网络错误，错误内容：${JSON.stringify(auditResult)}`);
        }
        const jobsDetail = auditResult.Response.JobsDetail;
        const result = jobsDetail.Result;
        let errMsg = "";
        if (result === "0") {
            // Logger.debug(`审核通过`);
            return;
        }
        const section = jobsDetail.Section;
        const label = section.Label;
        switch (label) {
            case "Politics":
                errMsg = `违规关键字${section.PoliticsInfo.Keywords}`;
                break;
            case "Abuse":
                errMsg = `违规关键字${section.AbuseInfo.Keywords}`;
                break;
            case "Porn":
                errMsg = `违规关键字${section.PornInfo.Keywords}`;
                break;
            case "Illegal":
                errMsg = `违规关键字${section.IllegalInfo.Keywords}`;
                break;
            case "Terrorism":
                errMsg = `违规关键字${section.TerrorismInfo.Keywords}`;
                break;
            case "Ads":
                errMsg = "违规具有广告";
                break;
            default:
                errMsg = "无法检测到违规关键字";
        }
        throw Error(`智能审核不通过，errMsg:${errMsg}, subLable:${jobsDetail.SubLabel}`);
    }

    /**
     * 文本审核
     *
     * @param textContent
     * @param auditLevel
     * @returns
     */
    private async __auditTextContent(textContent: string, auditLevel: TEXT_AUDIT_LEVEL) {
        const { cos, config, textAuditUrl } = this.getTencentConfig();
        try {
            const data = await cos.request({
                Url: textAuditUrl,
                Method: "POST",
                Headers: {
                    "content-type": "application/xml",
                },
                Bucket: config.bucketName,
                Region: config.bucketRegion,
                Body: COS.util.json2xml({
                    Request: {
                        Input: {
                            Content: Buffer.from(textContent).toString("base64"),
                        },
                        Conf: {
                            DetectType: auditLevel,
                        },
                    },
                }),
            });
            return data;
        } catch (err) {
            Logger.error(`审核失败，失败内容：${JSON.stringify(err)}`);
            throw err;
        }
    }

    /**
     * 图片审核标准分的键名
     */
    private __getAuditImageUrlScoreKey() {
        return `audit:image:score`;
    }

    /**
     * 设置图片审核标准分
     * @param score
     */
    async setAuditImageUrlScore(score: number): Promise<void> {
        await redisCore.redis.set(this.__getAuditImageUrlScoreKey(), score);
    }

    /**
     * 图片审核
     * @param imageUrl
     * @param auditLevel
     * @returns
     */
    async auditImageUrl(imageUrl: string, auditLevel = IMAGE_AUDIT_LEVEL.SOFT): Promise<void> {
        // 从缓存中获取审核标准分数，默认为50
        const ret = await redisCore.redis.get(this.__getAuditImageUrlScoreKey());
        const checkScore = ret ? Number(ret) : 50;
        const auditResult = await this.__auditImageUrlContent(imageUrl, auditLevel);
        if (auditResult.statusCode !== 200 && !auditResult.Response) {
            throw Error(`审核不通过，网络错误，错误内容：${JSON.stringify(auditResult)}`);
        }
        const result = (auditResult as any).RecognitionResult;
        const score = Number(result.Score);
        if (score > checkScore) {
            throw Error(`图片审核不通过，score:${score} > checkScore:${checkScore}}`);
        }
    }

    /**
     * 图片审核
     *
     * @param imageUrl
     * @param auditLevel
     * @returns
     */
    private async __auditImageUrlContent(imageUrl: string, auditLevel: IMAGE_AUDIT_LEVEL) {
        const { cos, config } = this.getTencentConfig();
        try {
            const data = await cos.request({
                Bucket: config.bucketName,
                Region: config.bucketRegion,
                Method: "GET",
                Query: {
                    "ci-process": "sensitive-content-recognition",
                    "detect-url": imageUrl,
                    "detect-type": auditLevel.toLowerCase(),
                    "large-image-detect": 1,
                },
            });
            return data;
        } catch (err) {
            Logger.error(`审核失败，失败内容：${JSON.stringify(err)}`);
            throw err;
        }
    }

    /**
     * 验证手机号运营商三要素
     *
     * @param idCard 身份证号
     * @param phone 手机号
     * @param realName 真实姓名
     */
    async checkPhone3Element(idCard: string, phone: string, realName: string): Promise<void> {
        if (process.env.NODE_ENV === "dev") {
            // 开发环境直接跳过
            return;
        }
        const { secretId, secretKey } = this.__auditConfig.phone3Element;
        const { idCheckUrl } = this.getTencentConfig();
        const source = "market";
        // Logger.debug(`secertId is ${secretId}, secretKey is ${secretKey}`);
        const datetime = new Date().toUTCString();
        const signStr = "x-date: " + datetime + "\n" + "x-source: " + source;
        const sign = CryptoJS.enc.Base64.stringify(CryptoJS.HmacSHA1(signStr, secretKey));
        const auth = `hmac id="${secretId}", algorithm="hmac-sha1", headers="x-date x-source", signature="${sign}"`;
        return new Promise<void>((resolve, reject) => {
            request.post(
                {
                    url: idCheckUrl,
                    timeout: HTTP_TIME_OUT_INTERVAL,
                    body: new URLSearchParams({
                        idCard,
                        mobile: phone,
                        realName,
                    }).toString(),
                    headers: {
                        "X-Source": source,
                        "X-Date": datetime,
                        Authorization: auth,
                        "Content-Type": "application/x-www-form-urlencoded",
                    },
                },
                (err, res, body) => {
                    if (err) {
                        return reject(err);
                    }
                    if (!body) {
                        return reject(new Error(`验证运营商三要素出现错误，未收到返回数据`));
                    }
                    let bodyObj = body;
                    if (typeof body === "string") {
                        bodyObj = JSON.parse(body);
                    }
                    if (bodyObj.error_code === 10025) {
                        return reject(new Error(`验证运营商三要素失败，运营商返回库中无此号，${bodyObj.reason}`));
                    }
                    if (bodyObj.error_code !== 0) {
                        return reject(new Error(`验证运营商三要素返回错误，错误码${bodyObj.error_code}，内容为 ${JSON.stringify(bodyObj)}`));
                    }
                    switch (bodyObj.result.VerificationResult) {
                        case "0": {
                            // `运营商中不存在`
                            return reject(new Error(`验证运营商三要素失败，不存在该记录，手机号${phone}`));
                        }
                        case "-1": {
                            // `不匹配`
                            return reject(new Error(`验证运营商三要素失败，结果不匹配，手机号${phone}`));
                        }
                        case "1": {
                            // `匹配`
                            Logger.debug(`验证运营商三要素成功，手机号${phone}`);
                            return resolve();
                        }
                        default: {
                            // `unknown`
                            return reject(new Error(`验证运营商三要素失败，原因不明，返回结果为${JSON.stringify(bodyObj)}，手机号${phone}`));
                        }
                    }
                },
            );
        });
    }

    /**
     * 获取身份证图片OCR信息的key
     * @param imageUrl
     * @returns
     */
    static getIdCardOCRKey(imageUrl: string) {
        return `idCardOCR:${imageUrl}`;
    }

    /**
     * 获取身份证图片识别信息
     * @param param
     * @returns
     */
    async getIdCardOCRInfo(param: { imageUrlFront?: string; imageUrlBack?: string }): Promise<ServerUtil.IDCardOCRInfo> {
        const { imageUrlFront, imageUrlBack } = param;
        let ocrInfo: ServerUtil.IDCardOCRInfo = {};
        if (imageUrlFront) {
            const ocrString = await redisCore.redis.get(AuditHelper.getIdCardOCRKey(imageUrlFront));
            if (ocrString) {
                ocrInfo = Object.assign(ocrInfo, JSON.parse(ocrString ?? "{}"));
            } else {
                const frontInfo = await this.__idCardOCR(imageUrlFront, "FRONT");
                ocrInfo.name = frontInfo.Name;
                ocrInfo.birth = frontInfo.Birth;
                ocrInfo.idNum = frontInfo.IdNum;
                ocrInfo.address = frontInfo.Address;
                await redisCore.redis.set(AuditHelper.getIdCardOCRKey(imageUrlFront), JSON.stringify(ocrInfo, null, 2), { EX: REDIS_ID_CARD_OCR_EXPIRE_TIME });
            }
        }
        if (imageUrlBack) {
            const ocrString = await redisCore.redis.get(AuditHelper.getIdCardOCRKey(imageUrlBack));
            if (ocrString) {
                ocrInfo = Object.assign(ocrInfo, JSON.parse(ocrString ?? "{}"));
            } else {
                const backInfo = await this.__idCardOCR(imageUrlBack, "BACK");
                ocrInfo.validDate = backInfo.ValidDate;
                await redisCore.redis.set(AuditHelper.getIdCardOCRKey(imageUrlBack), JSON.stringify(ocrInfo, null, 2), { EX: REDIS_ID_CARD_OCR_EXPIRE_TIME });
            }
        }
        return ocrInfo;
    }

    /**
     * s
     * @param imageUrl
     * @param cardSide
     * @returns
     */
    private async __idCardOCR(imageUrl: string, cardSide?: "FRONT" | "BACK"): Promise<IDCardOCRResponse> {
        if (process.env.NODE_ENV === "dev") {
            // 开发环境直接跳过
            return { Name: "呵呵", IdNum: "666", Birth: "2024/08/12", ValidDate: "2020.11.11-2030.11.11", Address: "中国" };
        }
        const { ocrClient } = this.getTencentConfig();
        try {
            const result = await ocrClient.IDCardOCR({
                ImageUrl: imageUrl,
                CardSide: cardSide,
            });
            return result;
        } catch (error) {
            Logger.error(`Error recognizing ID Card:`, error);
            throw error;
        }
    }
}
