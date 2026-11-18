# deers-dsh-agent-team 设计规格

- **日期**：2026-09-29
- **状态**：设计已获批准（用户授权自行审核后直接开发）
- **基座**：fork `@nanmicoder/dsh-agent-teams` 0.1.22（MIT），源码来自 `github.com/NanmiCoder/dsh-agent-teams` `--depth 1`
- **路径**：`C:\Users\17359\.dsh\plugins\deers-dsh-agent-team\`
- **上游许可**：MIT ✓（fork 合法）

---

## 1. 目标

以本地已安装的 `dsh-agent-teams` 插件源码为基座，fork 为 `deers-dsh-agent-team`，实现：

1. **版本迁移**：状态 schema 版本化 + 迁移钩子 + 导入现存存档。
2. **独立人设编辑**：staged 阶段按成员粒度编辑人设（批准后冻结）。
3. **模型设定**：成员创建后可改模型路由 + 团队默认/成员覆盖层级。
4. **skill 使用指定**：v1 = 指派（人设注入），M1 验证限制（按成员过滤目录）。
5. **自带技能与工具脚本**：纳入 superpowers 42 个技能，布局支持后续补充。
6. **官方能力吸收**：durable wait、CAS 任务语义、工具形状对齐。
7. **替换旧插件**：稳定后卸载 `@nanmicoder/dsh-agent-teams`（D10 落地）。

## 2. 非目标（Not Doing）

- 官方 GUI 树监控投影（M1）
- post-approval 人设编辑（用户选择了冻结）
- 按成员过滤技能目录（M1 宿主验证）
- 消息投递语义重写（inbox/*.jsonl 已近似）
- 兼容其它插件的数据格式
- `src/loader/*` 对应的宿主加载器改动
- 每任务模型覆盖（列 M1）
- 回退策略可配置（列 M1）
- 从官方 agentTeams 投影导入

## 3. 已锁定决策

| # | 决策 | 取值 |
|---|---|---|
| D1 | 基座 | fork 旧插件（MIT）+ 吸收官方栈部分能力 |
| D2 | 源码位置 | `~/.dsh/plugins/deers-dsh-agent-team/` |
| D3 | 版本迁移 | schema 版本化 + 迁移现存存档；不做其它插件兼容 |
| D4 | 人设编辑 | 仅 staged 阶段可编辑，批准后冻结 |
| D5 | 模型设定 | 创建后可改 + 团队默认/成员覆盖层级 |
| D6 | skill 使用指定 | v1 = 指派（人设/执行提示注入）；限制 = M1 宿主验证 |
| D7 | 旧插件去留 | 替换（稳定后卸载 @nanmicoder/dsh-agent-teams） |
| D8 | 官方能力吸收 | durable wait + CAS 任务 + 工具形状对齐（不含：面板投影、消息重写） |

## 4. 已验证事实

1. 旧插件 MIT，0.1.18 安装 / 0.1.22 上游 HEAD。
2. 上游源码 `src/` 含完整 TS：`tools.ts`(2248 行运行时对应)、`members.ts`、`state.ts`、`profiles.ts`、`scheduler.ts`、`quality-gates.ts`、`capabilities.ts`、`command.ts`、`events.ts`、`harness-compat.ts`、`snapshot.ts`、`mailbox.ts`、`web-routes.ts`、`tool-names.ts`、`types.ts`、`index.ts`、`client/`。
3. `src/tool-names.ts` 集中定义 14 个 `agent_teams_*` 工具名（ renaming 只改此文件 + 引用）。
4. 旧插件成员生命周期基于 `ctx.subagents` provider `spawn`，要求 `capabilities.persona` + `capabilities.toolFilter` + `prepareContinuable`。
5. 每成员 persona（系统提示替换）+ 每成员 provider/model/reasoning_effort（含回退路由切换 + catalog 校验）均为旧插件已有能力。
6. 官方 `SpawnTeammateRequest = { name, description, prompt, context: 'fresh'|'fork', provider, signal }` —— **无 model**，成员模型继承队长。
7. 上游 `skills/` 含 11 个 DSH 插件开发技能（`plugin-*`、`dsh-*`）——是本插件自身开发的 meta 技能，不是成员的通用开发流程技能。
8. `@firefly0621/dsh-superpowers` 0.1.0-rc.30（MIT）含 **42 个通用开发流程技能**（79 文件 / 454 KB），以 `skills/<name>/SKILL.md` 布局 + cordis 插件注册（`inject = ['skills', 'systemPrompt']`）提供。
9. 迁移源：`.agent-teams/archive/deerszero-baseline/`（team.json 顶层键：name/id/description/captainSessionId/createdAt/phase/planReviewState/members[2]/tasks[2]/taskSeq + 空 inbox/）。
10. profile 仍挂载两套团队实现：官方 `agent-team-profile` + 第三方 `@nanmicoder/dsh-agent-teams`。
11. 本机 node v24.13.0、pnpm 12.4.2、bun 1.3.13、git 2.52。

## 5. 基座继承范围

**保留**（fork 的核心价值——不经审查不重建）：
- 状态持久化（`.deers-agent-team/<teamId>/team.json` + `inbox/*.jsonl`）
- 成员生命周期（staged 计划 → 批准 → spawn → 协作 → 完成）
- 分级报告与质量门（quality-gates.ts）
- 船长协议（system prompt 注入 + 工具面）
- 模型路由（per-member provider/model/reasoning_effort + catalog 校验 + 回退切换）
- 快照与恢复（snapshot.ts、resumeTeamState）
- 13 个工具的行为语义

**替换**：
- 包名 / 插件 id / 工具前缀 / 状态目录 → 全部改名（见 §6）
- 技能目录内容 → superpowers 42 个（见 §8）

**新增**：
- schema 版本化与迁移（§7）
- post-creation 模型编辑 + 团队默认层级（§9）
- per-member skill 指定（§10）
- durable wait 工具（§11）
- superpowers 技能纳入（§12）

## 6. 改名清单

| 旧 | 新 |
|---|---|
| `@nanmicoder/dsh-agent-teams` | `deers-dsh-agent-team` |
| 插件 id `agent-teams` | `deers-agent-team` |
| 工具前缀 `agent_teams_` | `deers_team_` |
| 状态目录 `.agent-teams` | `.deers-agent-team` |
| cordis.patch.yml id | `deers-agent-team` |
| 系统提示段名 `skill:agent-teams` 等 | `skill:deers-agent-team` 等 |

`src/tool-names.ts` 是唯一工具名来源，改名只改此文件 + grep 全局替换引用。

## 7. 版本迁移

### 7.1 schema 版本化
- `team.json` 新增顶层字段 `schemaVersion: number`。
- 旧数据无此字段 = 版本 0。
- `src/migrations/index.ts` 导出 `migrate(state: unknown): TeamState`，内部按版本号依序应用 `migrations/step-<N>-to-<N+1>.ts`。
- 每步是纯函数 `(state: V<N>) => V<N+1>`，无 IO；写回由调用者负责。
- 无法识别的版本 → 抛错，不静默降级。

### 7.2 迁移源导入
- 新工具 `deers_team_import`（参数 `sourceDir`）：读取旧格式 `team.json`（无 `schemaVersion` = v0），经迁移链到当前版本，写入 `.deers-agent-team/<teamId>/`。
- 导入的团队落在 **staged** 阶段（`phase: 'staged'`），成员/任务完整保留，等待用户编辑人设后批准。
- 首个用例：`.agent-teams/archive/deerszero-baseline/`（2 成员 2 任务）。

### 7.3 M0 不做
- 迁移官方 `agentTeams` 服务的会话日志数据（无此需求）。
- 自动迁移（启动时隐式触发）——v1 只做显式工具调用。

## 8. 独立人设编辑（staged 阶段）

### 8.1 成员档案块
staged 阶段每个成员的完整定义：

```yaml
name: string          # 稳定 id
persona: string       # 成员人设文本（注入为该成员的系统提示替换段）
description: string   # 一行描述
modelRoute:
  provider: string
  model: string
  reasoningEffort?: string
skills: string[]      # 使用的技能名列表
```

### 8.2 编辑工具
`deers_team_edit_member`（`phase === 'staged'` 时有效；其他阶段拒绝并报 `TEAM_FROZEN`）：
- 参数：`teamId`、`memberName`、`patch`（`{ persona?, description?, modelRoute?, skills? }` 的部分覆盖）。
- 只改指定字段，不动其他成员。
- 批准后调用 → 报 `TEAM_FROZEN`，不执行。

### 8.3 与 edit_plan 的关系
`deers_team_edit_plan`（原 `agent_teams_edit_plan`）保留，用于整计划结构性变更（增删成员/任务、改依赖图）。`deers_team_edit_member` 是按成员粒度的独立编辑——两者互补，不替代。

## 9. 模型设定（创建后可改 + 团队默认层级）

### 9.1 路由层级
```
成员显式路由（modelRoute）
  ↓ 未指定时
团队默认路由（team.defaultRoute，批准时从船长路由快照）
  ↓ 未指定时
船长当前路由
```

### 9.2 创建后改模型
`deers_team_set_model`（`phase === 'active'` 时有效）：
- 参数：`teamId`、`memberName`、`route {provider, model, reasoningEffort?}`。
- 行为：更新 `team.json` 中该成员的 `modelRoute`，下一次该成员被唤醒时用新路由。
- 机制：复用旧插件已有的 mid-life 路由切换（fallback switching），需验证队长驱动的变更路径。

### 9.3 团队默认路由
`team.defaultRoute` 在批准时从船长当前路由快照。成员未显式指定时使用。

## 10. skill 使用指定

### 10.1 成员档案
`skills: string[]` —— 该成员应使用的技能名列表。

### 10.2 注入
spawn 时与任务指派时，把技能清单与用法指引写进成员 persona / 执行提示的尾部：

```
## Skills you must use
- <skill-name>: <from the skill's description>
```

### 10.3 校验
编辑时（`deers_team_edit_member` / `deers_team_edit_plan`）对 `skills[]` 中的每个名字，查询宿主技能目录确认存在；不存在 → 报 `UNKNOWN_SKILL`（新增 reason code）。

为此插件 `inject` 需增加 `'skills'`（旧插件为 `['tools', 'llm', 'subagents', 'systemPrompt', 'agents', 'commands']`，不含技能注册表），使 `ctx.skills` 可用于目录查询。

### 10.5 工具数量
上游 `tool-names.ts` 列出 14 个工具名。实际挂载数量以运行时为准（安装版本 0.1.18 的 `agent_teams_delete` 报 unknown tool），fork 后以 `deers_team_*` 前缀注册全部 `tool-names.ts` 列出的名称，数量不硬编码。

### 10.4 限制（M1）
按成员过滤技能目录。机制存在（技能注册表按 scope 分层），但动态按成员 scope 注册技能需要宿主 API 验证。M1 第一项宿主验证任务。

## 11. 官方能力吸收

### 11.1 durable wait
新工具 `deers_team_wait`（参数 `teamId`、`timeoutMs?`）：
- 阻塞等待团队状态变化（任务更新、消息到达、成员状态变化）。
- 超时返回 `{ timedOut: true }`；有变化返回 `{ changed: true, summary }`。
- 实现：复用旧插件的文件监听（`fs.watch` on `team.json` + `inbox/`）或短间隔轮询。

### 11.2 CAS 任务语义
`deers_team_update_task` 增加 `expectedRevision: number` 参数：
- 与 `team.json` 中该任务的当前 revision 不匹配 → 报 `TASK_REVISION_CONFLICT`（新增 reason code，12 → 13）。
- 写回时递增 revision。

### 11.3 工具形状对齐
工具参数风格向官方 `team_task_*` 系列看齐（参数名、返回结构），但**工具名保持 `deers_team_*`**（不与官方 `team_task_*` 撞名——官方栈仍在挂载）。

## 12. 自带技能与工具脚本

### 12.1 来源
`@firefly0621/dsh-superpowers` 0.1.0-rc.30 的 `skills/` 目录（42 个技能 / 79 文件 / 454 KB），MIT。

### 12.2 纳编方式
- fork 后将 superpowers `skills/` 的 42 个技能目录**复制**到本插件 `skills/`，替换上游的 11 个插件开发 meta 技能。
- `src/index.ts` 的 `skillsRoot` 指向打包 `skills/` 目录（同 superpowers 的做法）。
- config 可覆盖 `skillsRoot`，指向任意目录即可补充技能。

### 12.3 工具脚本
顶层 `scripts/` 目录存放独立工具脚本（不依附单个技能）。成员人设注入时告知脚本位置与调用方式。后续补充 = 放进 `scripts/` 即可。

### 12.4 归属
README/NOTICE 注明技能内容源自 `@firefly0621/dsh-superpowers`（MIT）。保留上游 LICENSE 副本。

### 12.5 与 superpowers 并存
技能名重复由 dsh-skill 的层优先级去重（内容为逐字节拷贝，行为一致）。如需单一来源，可卸载 `@firefly0621/dsh-superpowers`（用户决定，不在本期）。

## 13. rollout（D10 落地）

项目 setup 第一步：`dsh plugin --profile web remove @nanmicoder/dsh-agent-teams`。由用户重启后生效。效果：`agent_teams_*` 工具遮蔽消失、官方栈成为唯一团队基座、我们的插件成为用户自己的团队实现。

**附带收益**：这次重启同时激活 dsh-archon 的 `archon_workflow_list`。

## 14. 测试与验收

### 14.1 单测
- 迁移：0→1（含坏数据）、版本不识别报错、原子写回。
- staged 编辑门禁：非 staged 拒绝 / partial patch 只改指定字段。
- 模型路由变更：生效于下一轮、团队默认层级。
- 技能名校验：未知报 `UNKNOWN_SKILL`。
- CAS：revision 冲突报错、匹配时更新。
- 工具改名后无冲突（不与官方 `team_task_*` 重叠）。

### 14.2 集成
- 导入现存存档 → staged 编辑人设 → 批准 → 成员按新路由 spawn → 改模型 → 生效。
- 全流程在临时工作区运行，不碰真实数据。

### 14.3 黄金文件
迁移前后状态对比、工具名清单快照。

## 15. 交付顺序

- **M0-T1** 改名基座：package/cordis.patch/tool-names/stateDir 全部改名 + 安装验证。
- **M0-T2** schema 版本化与迁移：migrations + `deers_team_import` + 导入现存存档。
- **M0-T3** 独立人设编辑：`deers_team_edit_member`（staged 门禁）。
- **M0-T4** 模型设定：`deers_team_set_model` + 团队默认层级。
- **M0-T5** skill 使用指定：成员档案 `skills[]` + 编辑时校验 + 人设注入。
- **M0-T6** 官方能力吸收：durable wait + CAS + 工具形状对齐。
- **M0-T7** superpowers 技能纳入：vendor 42 个 + provider 注册 + `scripts/`。
- **M0-T8** 终审 + rollout（卸载旧插件 + 用户重启）。

## 16. M1 入口

- 官方面板投影（需要官方投影词汇）
- 按成员过滤技能目录（宿主验证）
- 会话工作区传入（dsh-archon Ruling N 的 M1 项）
- `report.ts` catch 收窄（dsh-archon 终审 Minor 1）
- 每任务模型覆盖
- 回退策略可配置
- `archon_run` 之前裁定"空节点 workflow"处理
