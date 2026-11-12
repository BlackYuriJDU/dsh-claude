# Agent Note: 所有者的常驻指令进入模型提示词

Status: implemented

[English](2026-09-16-standing-owner-instructions-prompt-context.md) | 中文

## 问题

设置中 General 页的个人资料区块会把所有者填写的指令文本框持久化到 durable 的 `ui-onboarding` 分区，其文案承诺 agent（智能体）会“在本次及之后的每个会话中”遵循这段文字。`dsh-client-ui-settings-general` 的浏览器侧正确写入了该字段，但 Host 侧声明该命名空间时只包含 `welcomeNoticeVersion`，也没有任何插件读取已保存的文本，因此保存的指令从未进入任何模型请求——UI 做出了承诺，harness 却没有兑现，而且没有任何提示。

## 决策

`dsh-client-ui-settings-general` 的 node 侧拥有整个 durable 分区的 schema（`welcomeNoticeVersion`、`userName`、`userFullName`、`userEmail`、`instructions`，均为可选字符串），并贡献一个 `profile:instructions` 提示词上下文（order 2，与按语言设定回复语言的上下文并列），在组装时读取已保存的分区。该上下文在一句说明常驻指令的句子之后渲染去除首尾空白的指令；未设置或只含空白时不贡献任何内容。因此设置文档的变更无需重启即可进入下一个模型步骤，与语言上下文采用相同的组装时读取方式。

该上下文是提示词上下文，而不是 persona 编辑：它不改动部署的 persona，并且上下文自带的句子说明用户的直接消息优先于它。

## 备选方案

**把文本镜像到 localStorage 并逐条消息注入。** 已否决：这会为设置作用域已经拥有的字段再分叉出第二份 durable 副本，而且除非有会话事件承载它，否则会违反“模型可见即已记录”的规则。

**注册一个追加该文本的 persona 分节。** 已否决：persona 分节名已由部署或 preset 的 persona 行占用，通过分节注册表追加会与单一注册不变量冲突；上下文列表才是为每次组装的事实而设计的。

## 验证

`tests/host.client.spec.ts` 驱动真实的 Settings provider 与 SystemPrompt 服务：命名空间随其 fiber 注册和 dispose（资源释放），已保存的指令以 `PROFILE_INSTRUCTIONS_CONTEXT` 进入 `systemPrompt.assemble()`，空白存储不贡献内容，dispose 后上下文被移除。`profileInstructionsText` 的单元用例覆盖未设置、仅空白和非空文本。

## 影响

用户在设置中写下的文字现在会进入本部署每个会话的模型请求。这些指令只是普通上下文：不授予任何工具，也不改变权限；去除首尾空白保证只含空白的字段永远不会看起来已生效。Host schema 现在接受浏览器作用域自个人资料区块上线以来一直写入的个人资料字段，因此之前存储的分区会通过校验，而不是碰巧被容忍。
