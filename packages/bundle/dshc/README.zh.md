---
description: "DSHC bundle：将 Web 配置档转为 DSHC 的补丁层，提供 Claude 应用配色、DSHC 品牌与免密钥 SearXNG 搜索，面向启动 DSHC 的用户与扩展该层的维护者。"
kind: "package-bundle"
---

# @deepseek-ai/dsh-dshc

[English](README.md) | 中文

## 概述

本 bundle 是 `dshc` 配置档的补丁层，该配置档将它叠加在 `dsh-base` 与 `dsh-web-app` 之上。它以 [`ui-brand-dshc`](../../client/ui-brand-dshc/README.zh.md) 替换官方品牌，后者的配色层在浅色、深色与跟随系统模式下为 Web 客户端提供 Claude 应用的颜色；它还挂载免密钥的 [`web-search-searxng`](../../web/web-search-searxng/README.zh.md) 提供方。它不包含自己的代码，也不改变其他配置档。

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

将 `$SEARXNG_URL` 设为启用了 JSON 输出的 SearXNG 实例，即可使搜索提供方可用。未设置时提供方保持不可用，web 服务继续在其他可用的搜索提供方中选择。当有多个搜索提供方可用时，用 `$DSH_WEB_SEARCH_PROVIDER` 固定其中一个，例如 `searxng`。

-----

<a id="understand-the-implementation"></a>
## 理解实现

<details>
<summary>实现内部细节——点击展开</summary>

[`cordis.patch.yml`](cordis.patch.yml) 禁用 Web 层中的 `ui-brand-official` 行，因为两个品牌包占用相同的单一槽位，并插入 `ui-brand-dshc` 与 `web-search-searxng` 行。每个被插入的包都是本 bundle 的运行时依赖，本 bundle 又是 `dsh` 安装的依赖，因此配置档从安装中解析它们。[`src/index.ts`](src/index.ts) 是一个空模块，为包提供入口点。

</details>

-----

<a id="further-exploration"></a>
## 进一步探索

阅读这些页面，了解本层组合的包及其使用的配置档机制。

- [ui-brand-dshc](../../client/ui-brand-dshc/README.zh.md) — 配色层与品牌占位组件。
- [web-search-searxng](../../web/web-search-searxng/README.zh.md) — 免密钥搜索提供方及其实例要求。
- [配置档 bundle](../README.zh.md) — 其他 bundle 层以及配置档如何叠加它们。
- [app-boot 配置档](../../boot/app-boot/README.zh.md#profiles) — 配置档模板、bundle 与用户补丁如何组合。

-----

<a id="model-experience"></a>
## 模型体验

间接通过被插入的行体现：`web-search-searxng` 在成为所选提供方时提供 `web_search` 来源，`ui-brand-dshc` 不进入任何模型请求。

#### KV Cache 影响

无直接失效；由被插入的包负责任何请求前缀变化。

## 已知限制与延期工作

<a id="known-limitations-and-deferred-work"></a>


这些限制界定了本层所做的改变。它们是当前的包约束。

- **智能体人设未改变** — 从 `dsh-web-app` 继承的预设保留各自的人设文本，因此模型不会自称 DSHC。
- **上游产品文案仍然保留** — Web 层的通知与引导文本仍然提及 DeepSeek Harness。

<a id="dev-note"></a>
### 开发备注

<details>
<summary>面向维护者的工作上下文——点击展开</summary>

#### 未来：DSHC 界面预设

带有 DSHC 人设的 Chat、Cowork 与 Code 预设应作为预设补丁文件放在本层，并在 Web 预设之后注册。

</details>
