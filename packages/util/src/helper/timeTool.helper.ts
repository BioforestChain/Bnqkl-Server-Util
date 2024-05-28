import dayjs from "dayjs";
import timezone from "dayjs/plugin/timezone";
import utc from "dayjs/plugin/utc";
import weekday from "dayjs/plugin/weekday";
import "dayjs/locale/zh-cn";

dayjs.extend(utc);
dayjs.extend(timezone);
dayjs.tz.setDefault("Asia/Shanghai");
dayjs.extend(weekday);
dayjs.locale("zh-cn");

export function timeTool(date?: dayjs.ConfigType, format?: dayjs.OptionType, locale?: string, strict?: boolean): dayjs.Dayjs {
    return dayjs(date, format, locale, strict).tz();
}

export function timeFormater(time: Date) {
    return timeTool(new Date(time)).format("YYYY-MM-DD HH:mm:ss");
}

export function timeFormaterToDate(time?: Date) {
    return timeTool(time ? new Date(time) : new Date()).format("YYYY-MM-DD");
}
