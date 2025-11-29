# Bnqkl-Server-Util (English)
For Chinese version please see [README-zh](README-zh.md).

## Overview
Monorepo of server-side utilities for Bnqkl/BFMeta backends: Redis strategies/models, MQ helpers, typed config loader, and supporting scripts.

## Architecture
- Workspaces under `packages/` (see package names for specific modules: redis strategies/models, mq helpers, config loaders, shared utils).
- Tooling: `lerna.json`, `pnpm-workspace.yaml`, `tsconfig.build.json` for multi-package builds.
- Scripts: `fix-import.ts`, `scripts/` for build/maintenance tasks.

## Getting Started
```bash
pnpm install
pnpm build        # build all packages
pnpm lsts         # list workspace files (helper script)
```
Usage patterns:
- Extend `RedisBaseStrategy` for custom redis types; use `RedisModel` to wrap business entities (bloom optional).
- MQ routing/exchange keys stay in business modules to keep infra generic.
- Load typed configs via `StaticConfigFactory` from JSON.

## Contribution Guide
- Layer 3 toolkit (Apache 2.0): keep TS strict, avoid `any`/`@ts-ignore`.
- Prefer reusing core strategies/models; add new package only when reuse is exhausted (DRY/SRP).
- Document required env/config keys in each package README; add small tests for new adapters.
- Branches: `feature/<scope>` / `fix/<issue>`; concise verb commits.
