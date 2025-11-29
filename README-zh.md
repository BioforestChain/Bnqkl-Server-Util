# Bnqkl-Server-Util（中文）
英文版请参见 [README](README.md)。

## 简介
Bnqkl/BFMeta 后端的工具 monorepo：Redis 策略/模型、MQ 辅助、强类型配置加载及相关脚本。

## 架构
- 工作区 `packages/`：按模块拆分（Redis 策略与模型、MQ、配置、通用工具）。
- 工具链：`lerna.json`、`pnpm-workspace.yaml`、`tsconfig.build.json` 统一构建。
- 脚本：`scripts/`、`fix-import.ts` 等维护/构建脚本。

## 快速开始
```bash
pnpm install
pnpm build   # 构建所有包
pnpm lsts    # 列出工作区文件（辅助）
```
使用要点：
- 继承 `RedisBaseStrategy` 定义自有 Redis 类型；用 `RedisModel` 封装业务实体（可选 bloom）。
- MQ 的交换机/路由 key 放在业务模块定义，保持基础设施通用。
- 配置：`StaticConfigFactory` 从 JSON 加载强类型配置。

## 贡献规范
- 工具层（Apache 2.0）：TS 严格，避免 `any`/`@ts-ignore`。
- 优先复用已有策略/模型，新增包前先评估 DRY/SRP。
- 新增适配需补测试，并在各包 README 记录必填 env/config。
- 分支：`feature/<scope>`、`fix/<issue>`；提交用简短动词短语。
