import dayjs from "dayjs";
import { createRequire } from "node:module";
const require = createRequire(import.meta.url);
const timezone = require("dayjs/plugin/timezone");
const utc = require("dayjs/plugin/utc");
const weekday = require("dayjs/plugin/weekday");
require("dayjs/locale/zh-cn");

dayjs.extend(utc);
dayjs.extend(timezone);
//@ts-ignore
dayjs.tz.setDefault("Asia/Shanghai");
dayjs.extend(weekday);
dayjs.locale("zh-cn");

export function timeTool(date?: dayjs.ConfigType, format?: dayjs.OptionType, locale?: string, strict?: boolean): dayjs.Dayjs {
    //@ts-ignore
    return dayjs(date, format, locale, strict).tz();
}

export function timeFormater(time: Date) {
    return timeTool(new Date(time)).format("YYYY-MM-DD HH:mm:ss");
}

export function timeFormaterToDate(time?: Date) {
    return timeTool(time ? new Date(time) : new Date()).format("YYYY-MM-DD");
}
