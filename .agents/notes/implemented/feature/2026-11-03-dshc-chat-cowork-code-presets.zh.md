# Agent Note：DSHC 的 Chat、Cowork 与 Code 预设

Status: implemented

[English](2026-11-03-dshc-chat-cowork-code-presets.md) | 中文

## 问题

DSH Claude 曾将输入框标为 “Chat” 或 “Cowork”，但该切换只改变占位文本；每个会话都运行同一个编程人设。上游预设（Standard、PTC、Minimal、Creator）围绕框架能力组织，而不是围绕人们使用 Claude 产品的三种方式，并且都不会以 DSHC 的身份介绍智能体。

## 决策

- [`dsh-dshc`](../../../../packages/bundle/dshc/README.zh.md) 新增 Chat、Cowork 与 Code 三个预设，将 Chat 设为起始默认值，禁用 Standard、PTC 与 Minimal，并把 Creator 保留在三者之后。
- 人设是基于对 Anthropic 已发布资料研究后撰写的原创文本：claude.ai 系统提示（2026 年 10 月）用于语气与格式，Cowork 帮助中心文章用于任务流程（结果、计划、可见进度、交付物、删除前审批），Claude Code 文档用于“收集上下文、行动、验证”循环。没有复制任何 Anthropic 提示文本。
- 每个人设都以相同的身份开头——由 `{{model}}` 驱动的 DSHC，而不是 Claude——并以相同的沟通规则结尾；测试保证二者在各预设之间完全一致。
- Chat 具备读取文件、网页搜索与抓取、技能与压缩，没有 shell，也没有写入工具。除人设外，Cowork 与 Code 原样复用上游 standard 行；测试保证它们与上游预设一致。
- 人设只提及预设实际挂载的工具（`todo_write`、`ask_user_question`、`exit_plan_mode` 与 `present`），并且只使用上游预设已经在用的 `{{model}}` 提示变量。

## 备选方案

**保留 Standard 与 Code 并列。** 二者工具集完全相同，两个条目只在人设上不同，会让选择变得混乱；PTC 与 Minimal 以 Standard 为参照描述自身，因此随之移除。

**将 Cowork 设为默认。** Cowork 契合框架的智能体能力，但 Claude 产品从 Chat 开始，而输入框的预设标签只需一次点击即可切换。

**直接粘贴 claude.ai 系统提示。** 它是公开的，但复制它会引入关于 DSH 不具备的工具的产品专属指令，为每个请求增加数千个 token，并模糊 DSHC 与 Claude 之间的界限。

## 后果

- 人设文本按预设固定，因此保留在缓存的提示前缀中；切换预设会开始新的前缀。
- Claude 以外的模型只会在其遵循指令的程度内遵循这些规则；人设引导行为，并不复现 Claude 的训练。
- 上游对 standard 预设的修改会使一致性测试失败，这正是重新派生 Cowork 与 Code 的信号。
