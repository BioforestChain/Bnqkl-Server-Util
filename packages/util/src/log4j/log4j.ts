import Chalk from "chalk";
import * as Log4js from "log4js";
import * as Util from "util";
import { timeFormater } from "../helper/timeTool.helper.js";
import Log4jsConfig from "./log4jConfig.js";

// 定义日志级别
export enum LoggerLevel {
    ALL = "ALL",
    MARK = "MARK",
    TRACE = "TRACE",
    DEBUG = "DEBUG",
    INFO = "INFO",
    WARN = "WARN",
    ERROR = "ERROR",
    FATAL = "FATAL",
    OFF = "OFF",
}

// 内容跟踪类
export class ContextTrace {
    constructor(public readonly context: string, public readonly path?: string, public readonly lineNumber?: number, public readonly columnNumber?: number) {}
}

// 添加用户自定义的格式化布局函数。 可参考: https://log4js-node.github.io/log4js-node/layouts.html
Log4js.addLayout("json", (logConfig: any) => {
    return (logEvent: Log4js.LoggingEvent): string => {
        let moduleName = "";
        let position = "";

        // 日志组装
        const messageList: string[] = [];
        logEvent.data.forEach((value: any) => {
            if (value instanceof ContextTrace) {
                moduleName = value.context;
                // 显示触发日志的坐标（行，列）
                if (value.lineNumber && value.columnNumber) {
                    position = `${value.lineNumber}, ${value.columnNumber}`;
                }
                return;
            }

            if (typeof value !== "string") {
                value = Util.inspect(value, false, 3, true);
            }

            messageList.push(value);
        });

        // 日志组成部分
        const messageOutput: string = messageList.join(" ");
        const positionOutput: string = position ? ` [${position}]` : "";
        const typeOutput = `[${logConfig.type}] ${logEvent.pid.toString()}   - `;
        const dateOutput = `${timeFormater(logEvent.startTime)}`;
        const moduleOutput: string = moduleName ? `[${moduleName}] ` : "[LoggerService] ";
        let levelOutput = `[${logEvent.level}] ${messageOutput}`;

        // 根据日志级别，用不同颜色区分
        switch (logEvent.level.toString()) {
            case LoggerLevel.DEBUG:
                levelOutput = Chalk.green(levelOutput);
                break;
            case LoggerLevel.INFO:
                levelOutput = Chalk.cyan(levelOutput);
                break;
            case LoggerLevel.WARN:
                levelOutput = Chalk.yellow(levelOutput);
                break;
            case LoggerLevel.ERROR:
                levelOutput = Chalk.red(levelOutput);
                break;
            case LoggerLevel.FATAL:
                levelOutput = Chalk.hex("#DD4C35")(levelOutput);
                break;
            default:
                levelOutput = Chalk.grey(levelOutput);
                break;
        }

        return `${Chalk.green(typeOutput)}${dateOutput}  ${Chalk.yellow(moduleOutput)}${levelOutput}${positionOutput}`;
    };
});

// 注入配置
Log4js.configure(Log4jsConfig);
// 实例化
const logger = Log4js.getLogger("default");

// 定义log类方法
export class Logger {
    static Log4js = Log4js;
    static debug(...args: any) {
        logger.debug(this.getStackTrace(), ...args);
    }

    static log(...args: any) {
        logger.info(this.getStackTrace(), ...args);
    }

    static info(...args: any) {
        logger.info(this.getStackTrace(), ...args);
    }

    static warn(...args: any) {
        logger.warn(this.getStackTrace(), ...args);
    }

    static error(...args: any) {
        logger.error(this.getStackTrace(), ...args);
    }

    static access(...args: any) {
        const customLogger = Log4js.getLogger("http");
        customLogger.info(this.getStackTrace(), ...args);
    }

    // 日志追踪，可以追溯到哪个文件、第几行第几列
    // StackTrace 可参考 https://www.npmjs.com/package/stacktrace-js
    static getStackTrace(): string {
        return `[${process.env["workerName"] ?? ""}]`;
    }
}
