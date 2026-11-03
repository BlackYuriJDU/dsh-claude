---
description: "按工作区的项目：Host 部分把会话所在工作区的指令与知识文件加入其运行时上下文，设置中的“项目”分区负责编辑，面向为每个工作区提供长期上下文的用户与组合 DSHC 配置档的维护者。"
kind: "package-reference"
---

# @deepseek-ai/dsh-client-ui-projects

[English](README.md) | 中文

## 概述

有了 `dsh-client-ui-projects`，每个工作区都成为一个拥有自己指令与知识文件的项目，智能体会在该工作区中运行的每个会话里遵循它们。Host 部分找到包含会话工作目录的工作区，并把该项目渲染进会话的运行时上下文；浏览器部分在设置中加入“项目”分区，每个工作区一张卡片。项目以工作区 id 为键保存在本插件的 Config 中，因此随配置档持久化。

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

在同时挂载 `dsh-workspace` 的配置档中，以行 id `ui-projects` 挂载本插件；设置分区编辑该行的 Config。`dsh-dshc` bundle 在 `dshc` 配置档中挂载它。

```yaml
- insert:
    - id: ui-projects
      name: '@deepseek-ai/dsh-client-ui-projects'
      config:
        maxFileChars: 20000
        maxTotalChars: 60000
```

| 字段 | 默认值 | 含义 |
|---|---|---|
| `projects` | `{}` | 以工作区 id 为键的项目内容，每项为 `{ instructions, files: [{ id, path }] }`；在设置中编辑并写入配置档补丁 |
| `maxFileChars` | `20000` | 单个知识文件保留的字符数（UTF-16 码元）；至少为 `100` |
| `maxTotalChars` | `60000` | 完整项目文本的上限，包括开头与文件标题；至少为 `200` |

知识文件路径可以是绝对路径，或相对于工作区文件夹的路径。分区接受手动输入的路径，不提供文件选择器。无法读取的文件会附带其错误码出现，放不进 `maxTotalChars` 的文件会被列为已省略。

-----

<a id="understand-the-implementation"></a>
## 理解实现

<details>
<summary>实现内部细节——点击展开</summary>

Host 部分注册一个 `systemPrompt.context` 条目 `project:content`，顺序为 `310`，位于 `ui-memory` 的已保存记忆之后。每次组装时，它从 `workingDirectory` 读取会话的当前目录，在 `workspaceRegistry.list()` 中选出文件夹包含该目录的工作区（最长匹配优先），并在关闭插值的情况下渲染该工作区的条目。知识文件以 `3 × maxFileChars` 字节为上限同步读取，每次读取按路径缓存，直到文件的大小或修改时间改变。它还调用 `settings.configure({ auto: false })`，避免自动生成的插件页面与设置分区重复。浏览器部分通过 `ctx.configForms.get('ui-projects')` 读写同一 Config，并用 `useWorkspaces` 列出工作区。

| 文件 | 角色 |
|---|---|
| [`src/index.ts`](src/index.ts) | Host 部分：Config schema 与运行时上下文注册 |
| [`src/projects.ts`](src/projects.ts) | 共享类型、工作区匹配与有上限的上下文文本 |
| [`src/knowledge.ts`](src/knowledge.ts) | 有上限且带缓存的知识文件读取 |
| [`src/client/index.ts`](src/client/index.ts) | 浏览器部分：词典与设置分区注册 |
| [`src/client/ProjectsSection.tsx`](src/client/ProjectsSection.tsx) | 每个工作区的卡片 |

</details>

-----

<a id="further-exploration"></a>
## 进一步探索

- [system-prompt](../../core/system-prompt/README.zh.md) — 运行时上下文条目如何成为持久化的上下文快照。
- [workspace](../../workspace/workspace/README.zh.md) — 工作区注册表及其文件夹。
- [ui-memory](../ui-memory/README.zh.md) — 适用于每个会话的已保存记忆。
- [dsh-dshc](../../bundle/dshc/README.zh.md) — 挂载本插件的配置档层。

-----

<a id="model-experience"></a>
## 模型体验

### 项目内容

#### 模型看到的内容

当会话运行在某个工作区中，且该工作区的项目有指令或知识文件时，运行时上下文快照会在其他活动上下文之间携带这一段；截断、读取失败与省略行只在相应情况下出现。

##### `project:content` 上下文

```markdown
Project context for this workspace, set by the person in Settings. Follow the instructions unless the person says otherwise in this conversation.

Instructions:
<instructions>

Knowledge file <path>:
<file text>
[Truncated to <maxFileChars> characters.]

Knowledge file <path>:
[Could not read this file: <error code>]

Knowledge file <path>: [omitted to fit the project context limit]
```

#### Token 影响

每个快照最多 `maxTotalChars` 个字符；不在任何工作区中的会话，或所在工作区没有项目内容的会话，贡献零 token。

#### KV Cache 影响

仅追加：快照以持久化的用户角色消息进入派生历史，因此编辑项目或知识文件变化会在下一次请求时追加新快照，而不会改变已缓存的前缀。

## 已知限制与延期工作

<a id="known-limitations-and-deferred-work"></a>


这些限制界定了项目的作用。它们是当前的包约束。

- **知识文件按 UTF-8 文本读取** — PDF、图片与其他二进制文件会以解码后的字节出现，而不是其内容。
- **保持大小与修改时间不变的改写不会被察觉** — 只有两者之一改变时，缓存才会重新读取文件。
- **已移除的工作区保留其条目** — 其项目仍留在 Config 中；分区只显示当前工作区，也不提供删除它的方式。

<a id="dev-note"></a>
### 开发备注

<details>
<summary>面向维护者的工作上下文——点击展开</summary>

#### 未来：项目记忆与文件上传

Claude 产品为每个项目提供独立记忆并接受上传文件；两者在这里都需要一个持久化的所有者，前者是以工作区为键的 `ui-memory`，后者通过 `dsh-attachment`。

</details>
