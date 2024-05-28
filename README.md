## 1.redis 使用

### 1.1.需要重写策略类

```typescript
export class RedisBaseStrategy<OptionType extends Redis.RedisOptionType, RedisType extends string = string> extends RedisStrategy<OptionType> {
    constructor(redisType: RedisType, options: PlusMeta.RedisOptionDef<OptionType>) {
        super(redisType, options);
    }

    ...
}
```

### 1.2.定义业务操作类

```typescript
export class GlobalValueRedisModel extends RedisModel<GlobalValueRedisOptionType, GlobalValueEntityId> {
    constructor() {
        super({useBloom: false}, RedisType.globalValue, new RedisBaseStrategy(RedisType.globalValue, globalValueOptions));
    }

    async getXX() {

    }

    async setXX() {

    }

    ...
}
```

## 2.mq 使用

原先的交换机名称和路由 key 都应该放在业务模块里面去定义

## 3.config 使用

```typescript
import { StaticConfigFactory } from "@bnqkl/server-util";

const staticConfigFactory = new StaticConfigFactory<PlusMeta.CONFIG.ServerConfig>("config/serverConfig.json");
export const staticConfig = staticConfigFactory.getConfig();
```
