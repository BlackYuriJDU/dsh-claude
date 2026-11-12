# Agent Note: dshc 只提供 en 与 pt，不再提供 zh 词典

Status: implemented

[English](2026-09-16-drop-zh-locale-dictionaries.md) | 中文

## 问题

上游客户端把每个 UI 词典都作为 zh/en 配对提供，并以 zh 作为键集的唯一来源。本部署是为葡萄牙语使用者维护的 dshc fork：zh 词典在每个界面上都是无用文案，它们强加的配对机制（每个键在两个词典中重复，外加配对门禁）是本部署得不到任何回报的维护成本。共享主目录中的 durable `locale.preference` 仍可能保存旧构建留下的 `zh`。

## 决策

该 fork 只提供 `en` 和 `pt` 词典。参考 UI 文案为英文的包注册 `{ en }`；本部署实际本地化为葡萄牙语的包（`dsh-client-locale`、`dsh-client-ui-workspace`、`session-log-export`、`dsh-client-ui-conversation`）注册 `{ en, pt }`。zh 词典文件已删除，键联合类型改由保留下来的来源推导（`keyof typeof en` 或其 pt 同级），语言注册表提供 English 与 Português。对于本构建不再提供的语言，存储的偏好会被忽略——采纳时回退到由浏览器推导的语言，而不是激活一个没有词典的语言。

`en` 回退常量保留其两个职责：浏览器未指定任何已提供语言时的初始语言，以及当前语言缺少某个键时查询的词典。

## 备选方案

**保留 zh 并把 pt 作为第三种语言。** 已否决：该 fork 没有 zh 受众；维护三份词典会使配对工作量翻三倍，并让键集唯一来源的约束继续指向一个无人使用的语言。

**把每个包都翻译成 pt。** 已推迟：该 fork 的产品文案以英文为主，只在所有者要求的地方提供 pt；各包的 pt 词典按需求添加，而不是一次性全面覆盖。

## 验证

包测试（`dsh-client-locale`、`dsh-client-ui-agent-preset`、`dsh-client-ui-commands`）在双语言注册表、过期 `zh` 偏好的采纳测试以及 pt 文档语言（`pt-BR`）下全部通过；对于导入不再引用 `zh` 的八个包，逐包 `tsc -b` 均通过。

## 影响

zh/en 配对要求不再适用于客户端词典：新键只需添加一次（en），并在存在 pt 词典的地方翻译；[语言词典一致性门禁](../../../../scripts/locale-dictionary-parity.spec.ts) 检查每个 pt 词典都与唯一的 en 对应词典配对，并且不声明该对应词典没有的键。与上游构建共享的主目录在上游构建中仍显示 zh UI，在这里则以英文打开；没有任何机制迁移已存储的值。从 `LOCALES` 中移除某个语言 id 现在是下线该语言的既定方式，采纳时的守卫保证这种移除对已存储的偏好是安全的。
