// 用于审核的内容程度，一共分为5种程度，默认普通
// 非法内容分别是👇
// Abuse - 辱骂 | Porn - 色情 | Illegal - 非法 | Politics - 政治敏感 | Ads - 广告 | Terrorism - 暴恐
// 注意：每增加一种类型审核则会多一次审核次数
// 当前不支持视频审核
export const enum TEXT_AUDIT_LEVEL {
    SLIGHTLY = "Abuse",
    SOFT = "Abuse,Porn,Illegal",
    NORMAL = "Abuse,Porn,Illegal,Politics",
    STRONGLY = "Abuse,Porn,Illegal,Politics,Ads",
    EXTREMELY = "Abuse,Porn,Illegal,Politics,Terrorism,Ads",
}

export const enum IMAGE_AUDIT_LEVEL {
    SLIGHTLY = "Porn",
    SOFT = "Porn,Ads",
    NORMAL = "Porn,Ads,Politics",
    STRONGLY = "Porn,Ads,Politics,Ads",
    EXTREMELY = "Porn,Ads,Politics,Ads,TerrorismInfo",
}

/**身份证OCR信息在redis的过期时间（秒） */
export const REDIS_ID_CARD_OCR_EXPIRE_TIME = 60 * 60 * 24;
