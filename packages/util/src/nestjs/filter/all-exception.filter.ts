import type { ArgumentsHost, ExceptionFilter} from "@nestjs/common";
import { Catch, HttpException, HttpStatus } from "@nestjs/common";
import type { Request, Response } from "express";
import { timeFormater } from "../../helper/index.js";
import { Logger } from "../../log4j/log4j.js";

/**
 * 全局异常捕获过滤器
 */
@Catch()
export class AllExceptionFilter implements ExceptionFilter {
    catch(exception: any, host: ArgumentsHost) {
        const ctx = host.switchToHttp();
        const request = ctx.getRequest<Request>();
        const response = ctx.getResponse<Response>();
        const status = exception instanceof HttpException ? exception.getStatus() : HttpStatus.INTERNAL_SERVER_ERROR;

        // 自定义异常信息
        const error_info = exception.response ? exception.response : exception;
        const error_msg = exception?.response?.message ?? exception?.error?.message ?? exception?.message;
        const error_code = exception.code ? exception.code : 500;

        const data = {
            timestamp: timeFormater(new Date()),
            ip: request.ip,
            url: request.url,
            method: request.method,
            httpcode: status,
            param: request.params,
            query: request.query,
            body: request.body,
            errorCode: error_code,
            errorMsg: error_msg,
            errorInfo: error_info,
        };
        // 404异常响应
        if (status === HttpStatus.NOT_FOUND) {
            data.errorMsg = `资源不存在！接口 ${request.method} -> ${request.url} 无效！`;
        }
        this.printLog(data);

        // 处理返回页面的错误信息
        let errorCode = error_code;
        let errorMessag = error_msg;

        response.status(200).json({
            success: false,
            error: {
                code: errorCode,
                message: errorMessag,
                info: error_info instanceof Error ? error_info.stack : error_info,
            },
            timeStamp: new Date().getTime(),
            path: request.url,
            version: process.env["VERSION"] as string,
        });
    }

    /**打印日志 */
    printLog(data: any) {
        if (data.body && data.body.secret) {
            // 不打印私钥
            delete data.body.secret;
        }
        Logger.error(data);
    }
}
