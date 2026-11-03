---
description: "Web 客户端的 DSHC 标识：主题服务之上的 Claude 应用配色层，以及侧栏与 hero 中的 DSHC 标志，面向组合 DSHC 部署的用户与维护者。"
kind: "package-reference"
---

# @deepseek-ai/dsh-client-ui-brand-dshc

[English](README.md) | 中文

## 概述

本包为 Web 客户端提供 DSHC 标识。它在主题服务之上叠加一个配色层，将内置的浅色与深色配色改为 Claude 应用的暖色中性色与陶土色强调色，并以 DSHC 陶土色放射标志与衬线字标填充侧栏和空会话 hero 的品牌槽位。浅色、深色与跟随系统的偏好继续有效，因为每个覆盖都同时给出两种配色。DSHC 部署选择它来替代 `ui-brand-official`。它没有运行时状态，也不影响模型请求。

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

在浏览器插件清单中挂载本插件，并禁用 `ui-brand-official`，因为两者占用相同的单一槽位。本插件需要 `slots` 与 `theme` 服务；Web bundle 同时提供两者。

```yaml
- insert:
    - id: ui-brand-dshc
      name: '@deepseek-ai/dsh-client-ui-brand-dshc'
- id: ui-brand-official
  disabled: true
```

### 屏幕上的变化

画布在浅色下变为 `#FAF9F5`、深色下变为 `#262624`，凸起卡片与输入框为 `#FFFFFF` 与 `#30302E`，侧栏为 `#F5F4ED` 与 `#1F1E1D`，文字遵循 `#141413`/`#3D3D3A`/`#73726C` 与 `#FAF9F5`/`#C2C0B6`/`#9C9A92` 三级阶梯。通用主要按钮为墨色（浅色下 `#141413`、深色下 `#FAF9F5`），与该应用自身的对话框一致；输入框的发送按钮及其他强调元素在两种配色下都使用陶土色填充 `#C6613F`，悬停为更浅的 `#D97757`。界面文字使用系统 UI 无衬线字体栈，字标使用系统衬线字体栈，因此不附带字体文件。 Assistant 回复使用系统衬线字体栈，与 Claude 应用一致；推理内容保持无衬线，设置中选择的文字字体同样作用于回复。

### 替换配色或品牌

用户在设置中选择的字体仍优先于默认无衬线字体栈，之后的 `ctx.theme.overrideTokens` 层仍按 token 优先。若要保留配色而使用其他品牌，请在单独的包中为品牌槽位注册其他占位组件；若要保留品牌而使用内置配色，本包没有开关，请改为组合其他品牌包。

-----

<a id="understand-the-implementation"></a>
## 理解实现

<details>
<summary>实现内部细节——点击展开</summary>

配色是一个以包名为来源的 `ctx.theme.overrideTokens` 层，作为 fiber effect 注册，因此卸载插件时恰好移除该层，主题服务随即重新发布基础配色。取值来自 Anthropic MCP Apps 设计指南中的宿主样式变量，以及 Claude 应用的侧栏与品牌 token；这些来源未命名的 token 由它们推导，[`src/client/tokens.ts`](src/client/tokens.ts) 记录了哪些属于哪一类。三个品牌占位组件通过嵌套的 `ctx.slots.inject()` 调用注册为感知声明的集合，因此无论本行在声明包之前还是之后激活都能工作，并随声明一起撤回。node 部分是一个空的 Loader 席位。

| 文件 | 角色 |
|---|---|
| [`src/client/index.ts`](src/client/index.ts) | 浏览器入口：配色层与槽位注册 |
| [`src/client/tokens.ts`](src/client/tokens.ts) | 覆盖映射、陶土色常量与字体栈 |
| [`src/client/Brand.tsx`](src/client/Brand.tsx) | 陶土色放射标志与衬线字标 |
| [`src/index.ts`](src/index.ts) | 空的 node 部分 |

</details>

-----

<a id="further-exploration"></a>
## 进一步探索

当标识层面的说明不够用时阅读这些页面。它们从本包使用的服务出发，依次覆盖渲染它们的外壳。

- [ui-theme](../ui-theme/README.zh.md) — 主题服务、其内置配色与覆盖层。
- [ui-sidebar](../ui-sidebar/README.zh.md) — 声明 `sidebar.brand.mark` 与 `sidebar.brand.name` 并渲染其回退内容。
- [ui-conversation](../ui-conversation/README.zh.md) — 在 hero 中声明 `conversation.hero.brand.mark`。
- [ui-brand-official](../ui-brand-official/README.zh.md) — 本包所替代的官方占位组件。

-----

<a id="model-experience"></a>
## 模型体验

无，因为本包只提供浏览器展示；这里没有任何内容进入模型请求。

#### KV Cache 影响

无；本包既不组装也不发送提供方请求。

## 已知限制与延期工作

<a id="known-limitations-and-deferred-work"></a>


这些限制界定了配色层能触及的范围。它们是当前的包约束。

- **只有由 token 驱动的界面会改变** — 硬编码颜色或直接读取静态 `--dsw-static-*` 阶的组件保留基础值。
- **推导的 token 是近似值** — 悬停底色、代码块、气泡与滚动条没有公开的 Claude 应用取值，由公开取值推导。
- **浏览器标题与 favicon 相互独立** — 它们是槽位系统之外的构建环境事项。

<a id="dev-note"></a>
### 开发备注

<details>
<summary>面向维护者的工作上下文——点击展开</summary>

#### 未来：几何 token

同一指南中的圆角阶（4/6/8/10/12 px）与 0.5 px 边框宽度尚未应用；基础样式按组件硬编码圆角，因此需要先在 `ui-theme` 中提供圆角 token。

</details>
