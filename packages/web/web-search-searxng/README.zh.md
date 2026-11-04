---
description: "ctx.web 的 SearXNG 免密钥搜索提供方：部署方如何在无需 API 密钥的情况下，针对自托管或受信任的 SearXNG 实例挂载 web 搜索。"
kind: "package-reference"
---

# @deepseek-ai/dsh-web-search-searxng

[English](README.md) | 中文

## 概述

有了 `dsh-web-search-searxng`，harness 可以通过 SearXNG 实例搜索 web，且无需 API 密钥。当部署运行自己的 SearXNG（或信任某个实例）、并希望使用免密钥的元搜索获得可引用来源时选择它。SearXNG 不返回生成答案，因此结果不携带 `content`——只产出来源。没有 http(s) URL 或非空白摘录的结果会被丢弃，来自不同引擎的重复 URL 只保留首次出现，因此一次调用返回的来源可能少于请求数量。面向模型的 `web_search` 工具位于 `dsh-tool-web`。

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

在已加载 web 服务的组合中挂载本提供方；它以 `searxng` 搜索提供方身份注册，因此当它是唯一可用的搜索后端时，`ctx.web.search()` 会自动解析到它——也可以用 `searchProvider: searxng` 固定。

### 何时选择

当部署可以访问一个在 `search.formats` 中启用了 `json` 格式的 SearXNG 实例，并希望在没有厂商密钥的情况下进行 web 搜索时，选择此后端。基址为空、无法解析或不是 http(s) 时，提供方不可用——每次搜索调用都会以结构化错误失败。

### 最小配置

加载 web 服务与本提供方；基址回退到启动环境中的 `$SEARXNG_URL`，其余字段默认采用实例自身的设置。

```yaml
- name: '@deepseek-ai/dsh-web'
- name: '@deepseek-ai/dsh-web-search-searxng'
  config:
    baseURL: http://127.0.0.1:8888
```

| 字段 | 默认值 | 含义 |
|---|---|---|
| `baseURL` | `$SEARXNG_URL` | 实例基址；追加 `/search`。为空、无法解析或非 http(s) 时提供方不可用 |
| `language` | （实例默认） | 以 `language` 发送的搜索语言，例如 `pt-BR` |
| `categories` | （实例默认） | 以 `categories` 发送的逗号分隔 SearXNG 分类，例如 `general,news` |
| `safeSearch` | （实例默认） | 以 `safesearch` 发送的安全搜索级别：`0` 关闭、`1` 中等、`2` 严格 |

四个字段都是实时的：对配置档配置（**Settings → Open configuration file**）的修改会在下一次可用性检查与搜索时生效，无需重新加载。`baseURL` 为空时回退到 `$SEARXNG_URL`。提供方以标题 **SearXNG** 和本地化描述注册，因此 **Web search and fetch** 会在搜索提供方菜单中列出它；在那里选择它，或设置 `$DSH_WEB_SEARCH_PROVIDER=searxng`，即可让它成为搜索提供方。

生成的[配置目录](../../../docs/config-catalog.zh.md#deepseek-aidsh-web-search-searxng)是每个受支持字段及其 JSDoc 的穷尽式真源。

### 搜索返回什么

每项 SearXNG 结果映射为 `WebSearchSource`：`url`、去除首尾空白的 `title`、去除首尾空白的 `content` 摘录作为 `snippet`、`publishedDate` 作为 `publishedAt`。SearXNG 没有结果数量参数，因此由服务通过截断并标记来执行请求的 `maxResults` 上限。结果不携带 `content`。

### 失败与恢复

提供方失败——HTTP 错误、网络失败、无法解析或结构错误的响应体——都以 `WebError` `WEB_PROVIDER_ERROR` 呈现；被中止的请求以 `WEB_ABORTED` 呈现。HTTP `403` 会附加启用 `json` 格式的提示，因为这是 SearXNG 在禁用 JSON 输出时的响应。HTTP 重定向会在联系 `Location` 目标之前被拒绝，并以 `WEB_PROVIDER_ERROR` 呈现。

-----

<a id="understand-the-implementation"></a>
## 理解实现

<details>
<summary>实现内部细节——点击展开</summary>

本节解释提供方背后的设计决策；可观察行为已在[使用本包](#use-this-package)中完整覆盖。

### 设计理念

本提供方是 SearXNG JSON 输出之上的薄适配层，遵循三条规则：

- **只产出可引用来源。** 来源需要 http(s) URL 与真实摘录；其他协议（磁力链接、`javascript:`）和缺少摘录的条目会被丢弃，而不是编造 snippet。
- **每个 URL 一条。** SearXNG 合并多个引擎，因此 URL 的首次出现胜出。
- **不编造答案。** SearXNG 的即时答案因引擎与版本而异，因此省略 `content`。

### 源码地图

| 文件 | 角色 |
|---|---|
| [`src/index.ts`](src/index.ts) | 插件入口：实时配置 schema、环境回退、提供方注册 |
| [`src/provider.ts`](src/provider.ts) | `SearxngSearchProvider`：URL 构建、请求分发、中止分类、结果映射 |
| [`src/types.ts`](src/types.ts) | SearXNG 线上类型：`SearxngSearchResponse`、`SearxngResult` |

### 请求与映射流程

`search()` 发送 `GET {baseURL}/search?q=…&format=json`，附带已配置的 `language`、`categories` 与 `safesearch`，并设置 `redirect: 'error'`，因此重定向会使请求失败而不联系目标。解析后的 `results[]` 逐条映射，丢弃不可引用与重复的条目，服务在返回途中执行最终的 `maxResults` 上限。中止——名为 `AbortError` 的 `DOMException`——变为 `WEB_ABORTED`；其他情况变为 `WEB_PROVIDER_ERROR`。

</details>

-----

<a id="further-exploration"></a>
## 进一步探索

当包级契约不够用时阅读这些页面。它们从共享词汇出发，依次覆盖服务、面向模型的工具与设计依据。

- [Web 子系统](../../../docs/subsystems/web.zh.md) — 穷尽式的搜索请求/结果词汇与错误码。
- [Web 包地图](../README.zh.md) — web 包家族及各自角色。
- [dsh-web](../web/README.zh.md) — 本提供方注册进入的 web 服务。
- [dsh-tool-web](../tool-web/README.zh.md) — 渲染本提供方来源、面向模型的 `web_search` 工具。
- [生成的配置目录](../../../docs/config-catalog.zh.md#deepseek-aidsh-web-search-searxng) — 每个受支持的配置字段及其源声明。
- [Web 能力接缝决策](../../../.agents/notes/implemented/architecture/2026-06-24-web-capability-seam.zh.md) — 为什么搜索与抓取共享同一个提供方选择服务。

-----

<a id="model-experience"></a>
## 模型体验

间接通过 `dsh-tool-web` 体现：它保留本提供方受 `maxResults` 约束的 URL、标题、摘录与发布日期，或其确切的 `SearXNG search aborted`、`SearXNG search request failed: <error>`、`SearXNG API error (HTTP <status>)` 与 `SearXNG returned an unprocessable response body: <error>` 失败，并包裹在消费方的错误包装中。

#### KV Cache 影响

无直接失效；由所列消费方负责任何请求前缀变化。

## 已知限制与延期工作

<a id="known-limitations-and-deferred-work"></a>


这些限制界定了本提供方何时不适用。它们是当前的包约束。

- **实例必须启用 JSON 输出** — SearXNG 默认在 `search.formats` 中禁用 `json`；公共实例通常保持禁用并对自动化客户端限流，因此受支持的部署是自托管实例。
- **结果质量取决于实例的引擎** — 本提供方不发送引擎选择；实例的 `engines` 设置决定覆盖面与排序。
- **尚无设置页面** — Plugins 页面没有 SearXNG 页面，因此这些字段只能在配置档配置中修改；搜索提供方菜单仍会列出并选择 SearXNG。
- **中止分类基于错误形状** — 只有名为 `AbortError` 的 `DOMException` 映射为 `WEB_ABORTED`；携带自定义原因的中止以 `WEB_PROVIDER_ERROR` 呈现。

<a id="dev-note"></a>
### 开发备注

<details>
<summary>面向维护者的工作上下文——点击展开</summary>

本开发备注是面向维护者的工作上下文：开放问题与未定方向。它明确不具权威性——已发布的行为、限制与依据以上方各节及所链接的 Agent Notes 为准。

#### 未来：将即时答案作为 `content`

SearXNG 的 `answers[]` 可以填充结果的可选 `content`，但其条目格式因引擎与 SearXNG 版本而异。映射它需要先固定最低 SearXNG 版本，并为每种答案格式准备 fixture。

</details>
