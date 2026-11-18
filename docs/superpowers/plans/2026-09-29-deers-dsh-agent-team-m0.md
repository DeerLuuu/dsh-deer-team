# deers-dsh-agent-team M0 实施计划

> **For agentic workers:** REQUIRED SUB-SKILL: Use subagent-driven-development (recommended) or executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Fork `@nanmicoder/dsh-agent-teams` 0.1.22 为 `deers-dsh-agent-team`，完成改名、版本迁移、人设编辑、模型设定、skill 指定、官方能力吸收，以及 superpowers 技能纳入。

**Architecture:** fork 上游 TypeScript 源码（`src/` 18 文件），保留其状态持久化 / 成员生命周期 / 分级报告 / 质量门 / staged 两阶段流程。增量：改名（工具前缀、状态目录、插件 id）、schema 版本化迁移、post-creation 模型编辑、per-member skill 注入、durable wait、CAS 任务。

**Tech Stack:** TypeScript 5（ESM）、Node 24、pnpm、vitest、`yaml` v2。上游用 `tsc` + `tsdown` 构建。

**Spec:** `docs/superpowers/specs/2026-09-29-deers-dsh-agent-team-design.md`

## Global Constraints

- 包名 `deers-dsh-agent-team`；插件 id `deers-agent-team`；工具前缀 `deers_team_`；状态目录 `.deers-agent-team`。
- 工具命名不得与官方 `team_task_*` / `spawn_teammate` / `send_message` / `list_agents` / `wait_agent` 撞名（官方栈仍在挂载）。
- 人设编辑仅 `phase === 'staged'`；其他阶段拒绝并报 `TEAM_FROZEN`。
- 模型路由层级：成员显式 > 团队默认 > 队长当前。
- skill 指定 v1 = 指派（persona/执行提示注入）；限制 = M1。
- `ReasonCode` 最终集 13 项（上游 11 + `UNKNOWN_SKILL` + `TASK_REVISION_CONFLICT`）。
- `src/loader/*`（即 `src/load.ts`，如存在）不得改动。
- 迁移步骤是纯函数；原子写回（temp + rename）。
- 本机 pnpm 12.4.2、node v24.13.0、bun 1.3.13。

---

## Task 1: 改名基座

**Files:** `package.json`, `cordis.patch.yml`, `src/tool-names.ts`, `src/index.ts`（inject/config 引用）, `src/state.ts`（stateDir 常量）, 全局 grep 替换。

- [ ] grep 全局 `agent_teams_` / `agent-teams` / `.agent-teams` / `@nanmicoder/dsh-agent-teams`，逐一替换为 `deers_team_` / `deers-agent-team` / `.deers-agent-team` / `deers-dsh-agent-team`。
- [ ] `package.json` name → `deers-dsh-agent-team`，去掉 `repository`/`bugs` 上游链接。
- [ ] `cordis.patch.yml` id → `deers-agent-team`，name → `deers-dsh-agent-team`。
- [ ] `src/index.ts` 导出名 `deers-agent-team`。
- [ ] `pnpm install && pnpm typecheck && pnpm build` 全部退出码 0。
- [ ] 提交。

## Task 2: schema 版本化与迁移

**Files:** `src/migrations/index.ts`, `src/migrations/step-0-to-1.ts`, `test/migrations.test.ts`

- [ ] `step-0-to-1.ts`：v0（无 `schemaVersion`）→ v1（加 `schemaVersion: 1`，字段不变）。
- [ ] `migrations/index.ts`：`migrate(raw: unknown): TeamState`——检测版本、依序应用、版本不识别抛错。
- [ ] 测试：v0 数据迁移成功、版本不识别抛错、字段不丢失。
- [ ] 接入 `state.ts` 的 `readTeam`：读入后先 `migrate` 再返回。
- [ ] 提交。

## Task 3: 导入现存存档

**Files:** `src/tools/import.ts`, `test/import.test.ts`

- [ ] `deers_team_import(sourceDir: string)`：读旧格式 `team.json` → `migrate` → 写入 `.deers-agent-team/<teamId>/`。
- [ ] 导入后 `phase: 'staged'`。
- [ ] 测试：fixture v0 目录导入成功、不存在的目录报错。
- [ ] 提交。

## Task 4: 独立人设编辑

**Files:** `src/tools/edit-member.ts`, `test/edit-member.test.ts`

- [ ] `deers_team_edit_member` 工具：`phase === 'staged'` 时允许按成员粒度修改 persona/modelRoute/skills；其他阶段报 `TEAM_FROZEN`。
- [ ] 测试：staged 可编辑、active 拒绝、partial patch 不影响其他字段。
- [ ] 提交。

## Task 5: 模型设定

**Files:** `src/tools/set-model.ts`, `test/set-model.test.ts`

- [ ] `deers_team_set_model` 工具：`phase === 'active'` 时修改成员 modelRoute。
- [ ] 团队默认路由 `team.defaultRoute` 在批准时从队长路由快照。
- [ ] 测试：修改生效、默认层级正确。
- [ ] 提交。

## Task 6: skill 使用指定

**Files:** `src/validator/skills.ts`, `src/tools/edit-member.ts`（集成）, `test/skills.test.ts`

- [ ] `inject` 增加 `'skills'`。
- [ ] `deers_team_edit_member` 编辑 `skills[]` 时校验技能名存在性；未知报 `UNKNOWN_SKILL`。
- [ ] spawn 时把 `skills[]` 注入成员 persona。
- [ ] 测试：已知技能通过、未知报错。
- [ ] 提交。

## Task 7: durable wait + CAS

**Files:** `src/tools/wait.ts`, `src/state.ts`（CAS 修改）, `test/wait.test.ts`, `test/cas.test.ts`

- [ ] `deers_team_wait` 工具：等待团队变化或超时。
- [ ] `deers_team_update_task` 增加 `expectedRevision`；不匹配报 `TASK_REVISION_CONFLICT`。
- [ ] 测试：wait 超时、CAS 冲突、CAS 成功。
- [ ] 提交。

## Task 8: superpowers 技能纳入

**Files:** `scripts/vendor-superpowers.ps1`, `skills/**`（替换上游 11 个 meta 技能为 superpowers 42 个）, `test/skills-inventory.test.ts`

- [ ] vendor 脚本：从 `@firefly0621/dsh-superpowers` 复制 `skills/` 42 个目录到本插件 `skills/`，替换上游的 11 个 plugin-dev meta 技能。
- [ ] `skillsRoot` 指向打包 `skills/`。
- [ ] 测试：技能目录数 ≥ 42。
- [ ] 提交。
