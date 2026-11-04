---
description: "DSHC bundle：将 Web 配置档转为 DSHC 的补丁层，提供 Claude 应用配色、DSHC 品牌、保存的记忆、按工作区的项目与免密钥 SearXNG 搜索，面向启动 DSHC 的用户与扩展该层的维护者。"
kind: "package-bundle"
---

# @deepseek-ai/dsh-dshc

[English](README.md) | 中文

## 概述

本 bundle 是 `dshc` 配置档的补丁层，该配置档将它叠加在 `dsh-base` 与 `dsh-web-app` 之上。它以 [`ui-brand-dshc`](../../client/ui-brand-dshc/README.zh.md) 替换官方品牌，后者的配色层在浅色、深色与跟随系统模式下为 Web 客户端提供 Claude 应用的颜色；它还挂载免密钥的 [`web-search-searxng`](../../web/web-search-searxng/README.zh.md) 提供方，加入 [`ui-memory`](../../client/ui-memory/README.zh.md) 保存的记忆与 [`ui-projects`](../../client/ui-projects/README.zh.md) 按工作区的项目，并以 DSHC 的 Chat、Cowork 与 Code 预设替换上游智能体预设。它不包含自己的代码，也不改变其他配置档。

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

启动 `dshc` 配置档；其模板列出 `dsh-base`、`dsh-web-app` 与本 bundle，并在首次使用时创建于 `$DSH_HOME/profiles/dshc`。

```sh
dsh dshc
```

### Chat、Cowork 与 Code

新会话从 Chat 开始；工作区选择器旁的预设标签可在三者间切换，设置中的默认值会覆盖起始选择。每个预设的人设都以相同的身份开头——由所配置模型驱动的 DSHC，而不是 Claude——并以相同的沟通规则结尾：温和而直接，默认使用散文、只在需要时使用列表，投入与请求相称，每次回复最多一个问题，坦诚面对不确定与错误，在有争议的话题上保持平衡，并使用对方的语言回复。

| 预设 | 用途 | 工具 | 人设重点 |
|---|---|---|---|
| Chat | 对话、提问、写作、学习 | 读取文件、网页搜索与抓取、技能、压缩；没有 shell，也不写文件 | 在对话中作答，任务需要命令或文件时指向 Cowork 或 Code |
| Cowork | 在工作区文件夹中的多步骤知识工作 | 上游 standard 工具集：shell、文件、搜索、作业、日程、技能、目标、计划模式、子智能体、提问、待办、网页、`present` | 澄清目标，用待办清单可见地规划，通过 `present` 交付成品文件，删除或向外发送任何内容前先询问 |
| Code | 工作区中的软件工程 | 相同的 standard 工具集 | 收集上下文、行动、用真实测试结果验证；做最小的根因修改；只在被要求时提交 |

上游的 Standard、PTC 与 Minimal 预设被禁用，因为它们以 Standard 为参照描述自身；Creator 仍在三者之后可用。

将 `$SEARXNG_URL` 设为启用了 JSON 输出的 SearXNG 实例，即可使搜索提供方可用。未设置时提供方保持不可用，web 服务继续在其他可用的搜索提供方中选择。当有多个搜索提供方可用时，用 `$DSH_WEB_SEARCH_PROVIDER` 固定其中一个，例如 `searxng`。

-----

<a id="understand-the-implementation"></a>
## 理解实现

<details>
<summary>实现内部细节——点击展开</summary>

[`cordis.patch.yml`](cordis.patch.yml) 禁用 Web 层中的 `ui-brand-official` 行，因为两个品牌包占用相同的单一槽位；插入 `ui-brand-dshc`、`web-search-searxng`、`ui-memory` 与 `ui-projects` 行；禁用 Standard、PTC 与 Minimal 预设；将 `chat` 设为注册表默认值；并将上游 DeepSeek Harness 欢迎通知标记为已在当前版本确认，由测试保持与 `ui-settings-models` 一致。[`presets/`](presets/) 下的三个文件在 `dsh.bundle.patch` 中紧随其后；除人设外，Cowork 与 Code 原样复用上游 standard 行，并由测试保持两者一致。每个被插入的包都是本 bundle 的运行时依赖，本 bundle 又是 `dsh` 安装的依赖，因此配置档从安装中解析它们。[`src/index.ts`](src/index.ts) 是一个空模块，为包提供入口点。

</details>

-----

<a id="further-exploration"></a>
## 进一步探索

阅读这些页面，了解本层组合的包及其使用的配置档机制。

- [ui-brand-dshc](../../client/ui-brand-dshc/README.zh.md) — 配色层与品牌占位组件。
- [web-search-searxng](../../web/web-search-searxng/README.zh.md) — 免密钥搜索提供方及其实例要求。
- [ui-memory](../../client/ui-memory/README.zh.md) — 保存的记忆列表及其运行时上下文文本。
- [ui-projects](../../client/ui-projects/README.zh.md) — 按工作区的指令、知识文件及其运行时上下文文本。
- [配置档 bundle](../README.zh.md) — 其他 bundle 层以及配置档如何叠加它们。
- [app-boot 配置档](../../boot/app-boot/README.zh.md#profiles) — 配置档模板、bundle 与用户补丁如何组合。

-----

<a id="model-experience"></a>
## 模型体验

间接地，通过本 bundle 组合的人设、工具与上下文插件体现：每个预设的 `persona` 前缀成为该预设会话的 `deployment:persona-prefix` 系统段，预设的工具行决定模型能看到哪些工具（Chat 没有 shell 与写入工具），`ui-memory` 将保存的记忆加入每个会话的运行时上下文，`ui-projects` 加入会话所在工作区的项目，`web-search-searxng` 在成为所选提供方时提供 `web_search` 来源，`ui-brand-dshc` 不进入任何模型请求。

#### KV Cache 影响

人设文本按预设固定，因此在各轮之间保留在缓存前缀中；切换会话的预设会改变系统提示与工具列表，并开始新的前缀。

## 已知限制与延期工作

<a id="known-limitations-and-deferred-work"></a>


这些限制界定了本层所做的改变。它们是当前的包约束。

- **人设只做引导，不做再训练** — 所配置的模型在其遵循指令的程度内遵循这些书面规则；不同模型的行为不同。
- **输入框内没有 Chat/Cowork/Code 切换** — 预设标签位于工作区选择器旁，这是 Web 层的布局。
- **上游产品文案仍然保留** — Web 层的通知与引导文本仍然提及 DeepSeek Harness。

<a id="dev-note"></a>
### 开发备注

<details>
<summary>面向维护者的工作上下文——点击展开</summary>

#### 未来：人设的免密钥快照

人设目前只有结构测试；为每个预设录制免密钥回放快照，可以固定渲染后的系统提示，并发现上游预设变更带来的偏移。

</details>
