import COS from "cos-nodejs-sdk-v5";
import { TEXT_AUDIT_LEVEL } from "../constants";
import { Logger } from "../log4j/log4j";
import { memTimeCache, MEM_TIME_CACHE_STRATEGY } from "./function.helper";

export class AuditHelper {
    constructor(private __auditConfig: ServerUtil.Config.CustomerConfig["audit"]) {}

    @memTimeCache({ time: MEM_TIME_CACHE_STRATEGY.FOREVER })
    getTencentConfig() {
        const { secretId, secretKey, bucketName, bucketRegion } = this.__auditConfig;
        return {
            cos: new COS({ SecretId: secretId, SecretKey: secretKey }),
            config: { bucketName, bucketRegion },
            textAuditUrl: `https://${bucketName}.ci.${bucketRegion}.myqcloud.com/text/auditing`,
        };
    }

    async audit(text: string, auditLevel = TEXT_AUDIT_LEVEL.NORMAL): Promise<void> {
        if (!text) {
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
     * 文本审核方法
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
}
