import { redisCore } from "../redis/index.js";

export abstract class BasePatch {
    get redis() {
        return redisCore.redis;
    }
}
