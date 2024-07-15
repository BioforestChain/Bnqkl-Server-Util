import { Module, forwardRef } from "@nestjs/common";
import { RequestStatRedisRepository } from "./repository";

@Module({
    imports: [],
    providers: [RequestStatRedisRepository],
    exports: [RequestStatRedisRepository],
})
export class RedisBaseModule {}
