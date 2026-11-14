---
description: "dsh Web 客户端 Plugins 页面上 SearXNG 搜索提供方的设置页：web-search-searxng 命名空间的实例 URL、语言、分类与安全搜索。"
kind: "package-reference"
---

# @deepseek-ai/dsh-client-ui-settings-searxng

[English](README.md) | 中文

## 概述

在侧栏打开 **Plugins**，在 Official 组中选择 **SearXNG search**，即可设置网页搜索使用的 SearXNG 实例及其结果过滤方式。页面暂存输入内容，仅在保存时写入，标记用户覆盖过的值，并可将每项恢复为部署默认值。只有当 Host 提供 `web-search-searxng` 命名空间时页面才存在，因此未包含该提供方的部署不会显示它。

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

Official 组中的 **SearXNG search** 卡片打开该页面。**Instance URL** 是启用了 JSON 输出的 SearXNG 实例基址；留空时提供方使用 `$SEARXNG_URL`。**Language**、**Categories** 与 **SafeSearch**（`0` 关闭、`1` 中等、`2` 严格）用于缩小结果；留空时使用实例自身的默认值。用户覆盖过的字段带有 **Overridden** 徽标，旁边有 **Reset to default**。在点击 **Save** 之前不会写入任何内容，提供方会在下一次搜索时读取已保存的值。在 **Web search and fetch** 中选择 SearXNG 作为提供方，即可通过它搜索。

-----

<a id="understand-the-implementation"></a>
## 理解实现

<details>
<summary>实现内部细节——点击展开</summary>

Host 部分是一个空的 `apply`，存在只是为了让本包拥有一个 Loader 行，客户端模块系统据此提供浏览器部分。浏览器部分通过 `ctx.configForms.get` 绑定 `web-search-searxng` 条目，在 `ui-primitives` 共享的 `SettingsFormModel` 之上用 `SearxngCardController` 保存暂存表单，并通过 `ctx.configForms.whileServed` 以顺序 `25`（位于 Web search and fetch 页面之后）将 `SearxngCard` 注册到 Plugins 页面的 `plugins.item` 槽位。页面文案位于本包的 `settings.searxng` 词典；`SettingsForm` 框架通过 props 接收文案。

</details>

-----

<a id="further-exploration"></a>
## 进一步探索

- [web-search-searxng](../../web/web-search-searxng/README.zh.md) — 本页面编辑其实时字段的提供方。
- [ui-plugin-manager](../ui-plugin-manager/README.zh.md) — Plugins 页面及本页面注册进的 `plugins.item` 槽位。
- [ui-primitives](../ui-primitives/README.zh.md) — 本页面渲染的设置表单模型与字段。
- [dsh-dshc](../../bundle/dshc/README.zh.md) — 挂载该提供方与本页面的配置档层。

-----

<a id="model-experience"></a>
## 模型体验

无，因为本包是浏览器端设置界面，不注册任何模型界面。

#### KV Cache 影响

无；本包既不组装也不发送提供方请求。

## 已知限制与延期工作

<a id="known-limitations-and-deferred-work"></a>

- **每次保存由 Host schema 校验** — SafeSearch 取 `0`、`1`、`2` 以外的值，或提供方 schema 拒绝的值，都会使保存失败并保留草稿以便修正；页面本身不校验 URL 或语言代码。

<a id="dev-note"></a>
### 开发备注

<details>
<summary>面向维护者的工作上下文——点击展开</summary>

无。

</details>
