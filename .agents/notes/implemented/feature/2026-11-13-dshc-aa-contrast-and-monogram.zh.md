# Agent Note：DSHC 对比度下限与字母标志

Status: implemented

[English](2026-11-13-dshc-aa-contrast-and-monogram.md) | 中文

## 问题

[主题覆盖层](2026-11-03-dshc-claude-app-palette-layer.zh.md)照搬了 Claude 应用的公开取值，其中七个文字 token 在同一层的某些表面上低于 WCAG AA（4.5:1）：三级与说明文字、链接、deep-diving 标签、同时用作焦点环颜色的业务强调色，以及深色下的成功、警告与错误文字。源码注释承诺“在所有表面上达到 AA”，却没有任何检查。该层的八辐陶土色放射标志也是最接近标志（logo）的元素，而 Anthropic 商标指南明确提到了标志；对外显示的产品名“DSH Claude”还包含 Claude 商标。

## 决策

- 配色仍沿用该应用。每个不达标的 token 只调整明度，保持色相与彩度，直到在该层定义的最差表面上达到 4.5:1；链接与 deep-diving 标签使用自己的 `DSHC_LINK` 一对取值，发送按钮的陶土色填充仍为 `DSHC_CLAY`。
- [`ui-brand-dshc/tests/contrast.client.spec.ts`](../../../../packages/client/ui-brand-dshc/tests/contrast.client.spec.ts) 读取 `DSHC_TOKENS`：任何文字 token 在该层任一不透明表面上低于 4.5:1，或图标、焦点环低于 3:1，或代码高亮 token 在代码块上低于 4.5:1，测试即失败。它已用一组不达标的取值验证过。
- 标志改为字母标志：一个圆角陶土色方块，内有字标首字母的白色衬线字形，使用同一配色与系统衬线字体栈。
- 预设人设与 README 中对外显示的产品名为 DSHC，遵循上游为派生项目建议的 `DSH` 前缀。

## 备选方案

**改用原创配色。** 维护者选择保留该应用的配色；只调整明度即可修正对比度，每个 token 的可见变化为 ΔE 0.4 到 12。

**保留放射标志并记录风险。** 维护者选择了字母标志。

**四个字母的字母标志。** 在侧栏 16 到 24 px 的尺寸下，`DSHC` 四个字母无法辨认；首字母在各槽位要求的所有尺寸下都可读。

## 影响

- 破坏对比度的 token 修改会让 `pnpm run test` 与覆盖率门禁失败，而不是留到之后的视觉检查。
- favicon 与 Web 应用清单仍来自所有 profile 共用的上游 Web 应用；要为 `dshc` profile 替换它们，需要构建期的资源覆盖。
- 发送按钮陶土色填充上的白色图标对比度为 4.05:1，足以满足图标（3:1），但不满足文字要求。
