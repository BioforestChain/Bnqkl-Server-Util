import { redisCore } from "../redis";

export abstract class BasePatch {
    get redis() {
        return redisCore.redis;
    }
}
