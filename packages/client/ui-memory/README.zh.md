---
description: "适用于每个会话的已保存记忆：Host 部分把列表加入每个会话的运行时上下文，设置中的“记忆”分区负责编辑，面向保存长期事实的用户与组合 DSHC 配置档的维护者。"
kind: "package-reference"
---

# @deepseek-ai/dsh-client-ui-memory

[English](README.md) | 中文

## 概述

有了 `dsh-client-ui-memory`，用户只需在设置中保存一次事实、偏好与更正，智能体就会在每个会话中遵循它们。Host 部分把列表渲染进每个会话的运行时上下文；浏览器部分在设置中加入“记忆”分区，用于添加、编辑与删除条目。列表保存在本插件的 Config 中，因此随配置档持久化，每个会话看到的都是同一版本。旁边的“你的 {product}”分区保存用户希望被称呼的名字以及对每次对话的指令，Host 部分会把它们渲染在记忆之前。

## 目录

- [使用本包](#use-this-package)
- [理解实现](#understand-the-implementation)
- [进一步探索](#further-exploration)
- [模型体验](#model-experience)
- [已知限制与延期工作](#known-limitations-and-deferred-work)
- [开发备注](#dev-note)

-----

<a id="use-this-package"></a>
## 使用本包

以行 id `ui-memory` 挂载本插件；设置分区编辑该行的 Config。`dsh-dshc` bundle 在 `dshc` 配置档中挂载它。

```yaml
- insert:
    - id: ui-memory
      name: '@deepseek-ai/dsh-client-ui-memory'
      config:
        maxChars: 8000
```

| 字段 | 默认值 | 含义 |
|---|---|---|
| `memories` | `[]` | 有序的已保存记忆，每条为 `{ id, text }`；在设置中编辑并写入配置档补丁 |
| `profileName` | `''` | 用户希望被称呼的名字；在“你的 {product}”分区中编辑 |
| `instructions` | `''` | 用户对每次对话的指令；在同一分区中编辑 |
| `maxChars` | `8000` | 每段渲染后完整上下文文本（个人资料与记忆）的上限，包含标题与省略行；至少为 `200` |

空白条目不产生任何内容。当整个列表放不进 `maxChars` 时，按顺序保留记忆，跳过每条放不下的记忆，并在最后一行说明省略了多少条。

-----

<a id="understand-the-implementation"></a>
## 理解实现

<details>
<summary>实现内部细节——点击展开</summary>

Host 部分注册一个 `systemPrompt.context` 条目 `memory:saved`，顺序为 `300`，位于上游运行时上下文分配之后；其文本在每次组装时根据实时 Config 求值，并关闭提示变量插值，使包含花括号的记忆保持原样。它还调用 `settings.configure({ auto: false })`，避免自动生成的插件页面与设置分区重复。浏览器部分通过 `ctx.configForms.get('ui-memory')` 读写同一 Config，并且只在 Host 提供该条目时显示分区。设置了名字时，浏览器部分会占用 `settings.launcher.badge` 槽位，使未登录时侧栏底部的账号启动器显示名字的首字母，侧栏展开时还显示名字。

| 文件 | 角色 |
|---|---|
| [`src/index.ts`](src/index.ts) | Host 部分：Config schema 与运行时上下文注册 |
| [`src/memory.ts`](src/memory.ts) | 共享类型、条目 id 与有上限的上下文文本 |
| [`src/client/index.ts`](src/client/index.ts) | 浏览器部分：词典、设置分区注册及其导航图标 |
| [`src/client/MemorySection.tsx`](src/client/MemorySection.tsx) | 可编辑列表 |

</details>

-----

<a id="further-exploration"></a>
## 进一步探索

- [system-prompt](../../core/system-prompt/README.zh.md) — 运行时上下文条目如何成为持久化的上下文快照。
- [ui-settings](../ui-settings/README.zh.md) — 配置表单与设置分区。
- [dsh-dshc](../../bundle/dshc/README.zh.md) — 挂载本插件的配置档层。

-----

<a id="model-experience"></a>
## 模型体验

### 个人资料

#### 模型看到的内容

设置了名字或指令时，运行时上下文快照会在已保存的记忆之前携带此段；放不进 `maxChars` 的指令会被截短，并由最后一行说明。

##### `memory:profile` 上下文

```markdown
The person set these in Settings. They apply to this and every session; follow them unless the person says otherwise in this conversation:
- Call them <name>.
- Their instructions:
<instructions>
(Instructions shortened to fit the limit.)
```

#### Token 影响

每个快照最多 `maxChars` 个字符；名字与指令都为空时不产生任何 token。

#### KV Cache 影响

与已保存的记忆一样只追加：编辑会在下一次请求时追加新的快照，而不会改动已缓存的前缀。

### 已保存的记忆

#### 模型看到的内容

当列表中至少有一条非空白记忆时，运行时上下文快照会在其他活动上下文之间携带这一段；只有当列表超过 `maxChars` 时才会出现省略行。

##### `memory:saved` 上下文

```markdown
Memories the person saved in Settings. They apply to this and every session; follow them unless the person says otherwise in this conversation:
- <memory>
- <memory>
(<count> more saved memories omitted to fit the limit.)
```

#### Token 影响

每个快照最多 `maxChars` 个字符；空列表贡献零 token。

#### KV Cache 影响

仅追加：快照以持久化的用户角色消息进入派生历史，因此编辑会在下一次请求时追加新快照，而不会改变已缓存的前缀。

## 已知限制与延期工作

<a id="known-limitations-and-deferred-work"></a>


这些限制界定了记忆列表的作用。它们是当前的包约束。

- **记忆只能由用户写入** — 智能体无法自行保存记忆。
- **所有会话共用一个列表** — 没有按项目的记忆，也没有在单个会话中排除记忆的开关。

<a id="dev-note"></a>
### 开发备注

<details>
<summary>面向维护者的工作上下文——点击展开</summary>

#### 未来：智能体保存的记忆与项目范围

允许智能体提议记忆的工具，以及按工作区区分的项目级列表，将与 Claude 产品的记忆功能相匹配；两者都需要一个审核步骤，由用户批准保存内容。

</details>
