import { Module, forwardRef } from "@nestjs/common";
import { RequestStatRedisRepository } from "./repository/index.js";

@Module({
    imports: [],
    providers: [RequestStatRedisRepository],
    exports: [RequestStatRedisRepository],
})
export class RedisBaseModule {}
