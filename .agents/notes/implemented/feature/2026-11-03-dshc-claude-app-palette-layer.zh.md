# Agent Note：以主题覆盖层实现 DSHC 标识

Status: implemented

[English](2026-11-03-dshc-claude-app-palette-layer.md) | 中文

## 问题

DSH Claude 曾通过编辑内置主题样式表与组件 CSS、用 `[class*='_x']` 选择器匹配 CSS module 类名，并强制仅深色偏好，来重新设计 Web 客户端的样式。其配色取自 Anthropic 的营销网站（`#cc785c`、`#181715`），而非 Claude 应用。变基到上游时产生了 259 个合并冲突，其中大部分位于这些被编辑的包中。

## 决策

- [`ui-brand-dshc`](../../../../packages/client/ui-brand-dshc/README.zh.md) 注册一个 `ctx.theme.overrideTokens` 层，并占用 `sidebar.brand.mark`、`sidebar.brand.name` 与 `conversation.hero.brand.mark` 槽位。它不编辑任何上游包。
- 每个覆盖都同时给出浅色与深色取值，因此内置的浅色、深色与跟随系统偏好继续有效；保留上游的默认偏好 `system`。
- 取值遵循 Anthropic MCP Apps 设计指南中的宿主样式变量，外加该应用的侧栏色调与陶土色品牌填充及悬停色。没有公开取值的 token 由公开取值推导，源文件对此做了标注。
- 界面文字使用系统 UI 无衬线字体栈，字标使用系统衬线字体栈，这正是该应用在缺少自有字体时的渲染结果。由于该应用的字体不可再分发，因此不附带字体文件。
- 标志为 DSHC 字母标志，文字 token 遵守由测试保证的 WCAG AA 下限（[对比度下限与字母标志](2026-11-13-dshc-aa-contrast-and-monogram.zh.md)）；不包含任何 Anthropic 标志或字体。

## 备选方案

**移植此前的样式表覆盖。** 它们依赖哈希类名并需要编辑上游 CSS，因此上游对这些组件的每次修改都会再次冲突。

**注册第三个内置主题。** 已注册的主题会替换当前偏好，用户将失去浅色、深色与跟随系统的选择。覆盖层则为当前激活的任一基础配色重新着色。

**嵌入开源替代字体。** 此前的构建在 CSS bundle 中嵌入了 371 KB 的 base64 字体，且替代字体（Cormorant Garamond、Inter）与该应用的字体有明显差异。系统字体栈没有成本，并与该应用自身的回退一致。

## 后果

- 上游对 `ui-theme` 与组件样式的更新可以合并而不产生 DSHC 冲突；只有 token 改名需要在此处修改。
- 硬编码颜色或直接读取 `--dsw-static-*` 阶的组件保留基础值。
- 在 `ui-theme` 提供相应 token 之前，不应用指南中的圆角与边框宽度几何。
