import { Configuration } from "log4js";
const baseLogPath = process.cwd() + "/logs";

const Log4jsConfig: Configuration = {
    appenders: {
        console: {
            type: "console",
        }, // 控制打印至控制台
        // 统计日志
        access: {
            type: "dateFile", // 写入文件格式，并按照日期分类
            filename: `${baseLogPath}/access/access-${process.env["workerName"]}.log`, // 日志文件名，会命名为：access.2021-04-01.log
            alwaysIncludePattern: true, // 为true, 则每个文件都会按pattern命名，否则最新的文件不会按照pattern命名
            pattern: "yyyy-MM-dd", // 日期格式
            // maxLogSize: 10485760,  // 日志大小
            daysToKeep: 60, // 文件保存日期30天
            numBackups: 10, //  配置日志文件最多存在个数
            // compress: true, // 配置日志文件是否压缩
            // category: "http", // category 类型
            keepFileExt: true, // 是否保留文件后缀
        },
        // 异常日志
        errorFile: {
            type: "dateFile",
            filename: `${baseLogPath}/error/error-${process.env["workerName"]}.log`,
            alwaysIncludePattern: true,
            // layout: {
            //     type: "pattern",
            //     pattern: "[%d{yyyy-MM-dd hh:mm:ss SSS}] [%p] -h: %h -pid: %z  msg: %m ",
            // },
            pattern: "yyyy-MM-dd",
            daysToKeep: 60,
            numBackups: 10,
            keepFileExt: true,
        },
        errorFilter: {
            type: "logLevelFilter",
            level: "ERROR",
            maxLevel: "ERROR",
            appender: "errorFile",
        },
        accessFilter: {
            type: "logLevelFilter",
            level: "DEBUG",
            maxLevel: "ERROR",
            appender: "access",
        },
    },
    categories: {
        default: {
            appenders: ["console", "accessFilter", "errorFilter"],
            level: "DEBUG",
        },
        http: { appenders: ["access"], level: "DEBUG" },
    },
    pm2: true,
    pm2InstanceVar: "INSTANCE_ID",
};

export default Log4jsConfig;
