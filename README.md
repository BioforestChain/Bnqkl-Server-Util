# Bnqkl-Server-Util (English)
For Chinese version please see [README-zh](README-zh.md).

## Overview
Server-side utility toolkit (Redis strategies, MQ helpers, config loader) for Bnqkl/BFMeta services.

## Usage
- Extend `RedisBaseStrategy` for custom Redis types.
- Define business models via `RedisModel` and enable bloom filters as needed.
- MQ: keep exchange and routing keys defined in business modules.
- Config: `StaticConfigFactory` to load typed configs from JSON.

## Contribution
- Treat as toolkit (Layer 3): prefer Apache-style openness; keep TS strict.
- Reuse shared strategies/models; avoid duplicated Redis/MQ wrappers.
- Add small tests for new adapters; document required env/config keys.
- Branches: `feature/<scope>`, `fix/<issue>`; concise commits.
