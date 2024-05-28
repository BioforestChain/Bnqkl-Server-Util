import { Module, forwardRef } from "@nestjs/common";
import { RequestStatRedisEntity } from "./entity";

@Module({
    imports: [],
    providers: [RequestStatRedisEntity],
    exports: [RequestStatRedisEntity],
})
export class RedisBaseModule {}
