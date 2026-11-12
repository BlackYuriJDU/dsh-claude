# Agent Note: 非 Chat 视图显示视图标签页，以便用户返回 Chat

Status: implemented

[English](2026-11-12-trajectory-view-return-to-chat.md) | 中文

## 问题

dshc 隐藏了会话头部的界面元素，使对话直接从 transcript（文本记录）开始。头部原本也承载 Chat/Trajectory 视图标签页，但工具行上的检查控件仍会通过 chat store 选中 Trajectory 视图。点击一次检查后，会话显示 Trajectory，却没有任何可见方式返回 Chat；只有切换会话才能恢复 transcript。

## 决策

`ConversationSessionHeader` 在 Chat 视图激活时保持隐藏；只要激活的是其他已注册视图，它就使用共享的标签页样式渲染视图标签页。选择 Chat 标签页会把 store 的 `view` 写回 `chat`，头部随之再次隐藏。面包屑、会话日志、PTC 标签以及后台任务操作仍保持移除。

## 备选方案

**从工具行移除检查控件。** 已否决：Trajectory 账本是唯一的逐请求检查器，而在头部隐藏时，该控件是它唯一的入口。

**在 Trajectory 工具栏内放一个专用返回按钮。** 已否决：这会在单个视图内重复导航，并且注册在视图环上的其他非 Chat 视图都需要各自的副本。

## 验证

`packages/client/ui-trajectory/tests/views.client.spec.tsx` 在视图环上挂载真实的头部和主体：在 Chat 下无法访问任何标签页；通过 store 选中 Trajectory 后，会显示 Chat 和 Trajectory 标签页且 Trajectory 处于选中状态；点击 Chat 标签页会回到聊天主体并隐藏标签页。

## 影响

头部只在 Chat 之外重新出现，因此日常使用中以 transcript 为先的布局保持不变。今后注册到 `conversation.view` 的任何视图都可以通过同一组标签页进入和离开，无需修改头部。
