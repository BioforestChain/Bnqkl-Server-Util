# Bnqkl-Server-Util（中文）
英文版请参见 [README](README.md)。

## 简介
服务端工具集，提供 Redis 策略封装、MQ 辅助、配置加载等能力，供 Bnqkl/BFMeta 服务复用。

## 使用
- 通过继承 `RedisBaseStrategy` 定义自有 Redis 类型。
- 使用 `RedisModel` 定义业务模型，可按需启用 bloom 过滤。
- MQ：交换机与路由 key 放在业务模块内定义。
- 配置：用 `StaticConfigFactory` 从 JSON 加载强类型配置。

## 贡献
- 作为工具库（Layer 3）：保持开源友好，TS 严格模式。
- 复用已有策略/模型，避免重复封装 Redis/MQ。
- 新增适配需补小型测试，并写明所需环境变量/配置键。
- 分支：`feature/<scope>`、`fix/<issue>`；提交简洁明了。
