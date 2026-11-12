# Agent Note：composer 用量圆环承载会话数字；Access 座位回到卡片下方

Status: implemented

[English](2026-11-12-composer-usage-ring.md) | 中文

## 问题

dshc 把 composer 改造成带加号菜单、语音输入与发送按钮的胶囊，同时去掉了三个界面：聊天统计行（轮次与步骤计数、缓存命中、token、延迟、吞吐）、composer 的 `ContextMeter` 圆环，以及 Access 座位（权限预设 chip）。会话用量与权限模式因此不可见，固定这些界面的 Web 测试套件也随之失败。

## 决定

实时会话的 composer 在卡片下方渲染一行，参照 Claude Code 把模式选择器与用量圆环放在提示框下方一行的做法。左侧是 Access 座位（`PermissionSelect`）。右侧在模型座位之后是[上下文用量计](2026-08-05-composer-context-meter-breakdown.zh.md)圆环。其面板保留上下文分区，并新增会话分区：轮次与步骤计数、以进度条呈现的缓存命中率、以双色进度条呈现的计费输入与输出 token，以及一行延迟／吞吐。这些数字来自统计行原先读取的 `sessionStats` 与 `tokenUsage` 投影。路由容量已知或会话已有活动记录时圆环即渲染，因此尚未报告容量的会话也能看到这些数字。后台任务 chip 不回到 composer：Claude Code 把后台工作放在独立的任务面板中，而不是 composer 里。

## 考虑过的替代方案

**恢复行内统计行。** 否决：所有者要求采用 Claude Code 的模式，即一个圆形控件，其面板以更直观、更简化的方式展示这些数字。

**在圆环旁另设统计弹出层。** 否决：同一会话的用量拆成两个控件，违背「一个事实一个家」。

## 验证

`packages/client/ui-conversation/tests/context-meter.client.spec.tsx` 覆盖带缓存与 token 进度条的会话分区、无路由容量时仅含会话分区的圆环，以及缺少 `sessionStats` 投影时对已结算历史的折算。

## 后果

统计行组件不再渲染；其纯函数（`deriveStats`、`cacheHitPercent`、`billedInputTokens`、`contextOccupancy`、`formatTokens`、`formatDuration`）为圆环面板供数。捕获了统计行或上游 composer 外观的 Web golden 文件按卡片下方一行重新录制。
