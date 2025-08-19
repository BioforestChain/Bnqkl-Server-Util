import type { NestMiddleware } from "@nestjs/common";
import { forwardRef, Inject, Injectable } from "@nestjs/common";
import type { NextFunction, Request, Response } from "express";
import { Logger } from "../../log4j/log4j.js";
import { RequestStatRedisRepository } from "../../redis/index.js";

@Injectable()
export class HttpRequestMiddleware implements NestMiddleware {
    @Inject(forwardRef(() => RequestStatRedisRepository))
    private __requestStatRedisRepository!: RequestStatRedisRepository;

    async use(req: Request, res: Response, next: NextFunction) {
        const start = Date.now();
        res.on("finish", () => {
            this.printLog(req, start);
        });
        next();
        const logFormat = {
            IP: req.headers?.remoteip ? String(req.headers.remoteip) : req.ip?.split(":").pop(),
            // Url: `${req.headers.host}${req.url}`,
            URL: `${req.path}`,
            Method: req.method,
            HttpCode: res.statusCode,
            Params: req.params,
            Query: req.query,
            Body: req.body,
        };

        if (res.statusCode >= 500) {
            Logger.error(JSON.stringify(logFormat, null, 2));
        } else if (res.statusCode >= 400) {
            Logger.warn(JSON.stringify(logFormat, null, 2));
        } else {
            // Logger.access(JSON.stringify(logFormat, null, 2));
        }
        await this.__requestStatRedisRepository.incrApiDailyCount(req.path);
        if (req.ip) {
            await this.__requestStatRedisRepository.incrIpCallInterfaceDailyCount(req.ip);
        }
    }

    /**打印日志 */
    printLog(req: Request, startTimestamp: number) {
        const costTime = Date.now() - startTimestamp;
        const msg = `path:${req.path} costTime:${costTime} ms`;
        if (costTime > 200) {
            Logger.warn(msg);
        }
    }
}
