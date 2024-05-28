import { forwardRef, Inject, Injectable, NestMiddleware } from "@nestjs/common";
import { NextFunction, Request, Response } from "express";
import { Logger } from "../../log4j/log4j";
import { RequestStatRedisEntity } from "../../redis";

@Injectable()
export class HttpRequestMiddleware implements NestMiddleware {
    @Inject(forwardRef(() => RequestStatRedisEntity))
    private __requestStatRedisEntity!: RequestStatRedisEntity;

    async use(req: Request, res: Response, next: NextFunction) {
        const start = Date.now();
        res.on("finish", () => {
            const costTime = Date.now() - start;
            const msg = `path:${req.path} costTime:${costTime} ms`;
            if (costTime > 200) {
                Logger.warn(msg);
            }
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
        await this.__requestStatRedisEntity.incrApiDailyCount(req.path);
        if (req.ip) {
            await this.__requestStatRedisEntity.incrIpCallInterfaceDailyCount(req.ip);
        }
    }
}
