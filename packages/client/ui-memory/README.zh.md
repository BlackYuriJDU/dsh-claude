# @deepseek-ai/dsh-client-ui-memory

[English](README.md) | 中文

记忆插件：跨会话的 durable 记忆。Node 侧注册 `ui-memory` 设置命名空间，并把已存储的记忆列表作为 `memory:standing` 提示词上下文（order 3）贡献给每个 agent（智能体）会话，与 `ui-settings-general` 处理常驻指令的机制相同。浏览器侧在设置中新增 **Memory** 分节，所有者可在其中查看、添加、编辑和删除记忆；每次编辑都通过 durable 的 `ui-memory` 作用域持久化。

该上下文在提示词组装时读取设置文档，因此编辑会进入每个会话（包括之后创建的会话）的下一次模型请求，无需重启。

## 模型体验

### 常驻记忆

#### 模型看到的内容

对于存储的记忆列表中至少有一条非空条目的每个 agent 会话，runtime-context 快照中包含一个 `memory:standing` 贡献。每个条目去除首尾空白后，以 `- ` 列表行的形式渲染在下面这段固定引导语之后；空列表或全为空白的列表不贡献任何内容。

##### 引导语

```markdown
The user's memories, saved by them in Settings and applying to this and every session — honor them unless a direct user message supersedes them:
```

#### Token 影响

一个上下文块，其大小随存储列表增长：固定引导语加上每条非空记忆一行。列表未变化时，请求不会新增任何内容。

#### KV Cache 影响

稳定的系统提示词保持字节级一致。编辑列表会改变完整的 runtime-context 快照，该快照追加在保留的历史之后，并保留之前已缓存的前缀；未变化的请求复用保留的快照。

## 已知限制与暂缓事项

- **不会自动提取记忆**：记忆由用户在设置中手动编写。从对话中识别更正并提议记忆的功能已暂缓。
- **每次编辑重写整个列表**：添加、编辑和删除都会通过设置作用域重写整个 `memories` 字段；来自两个界面的并发编辑通过作用域的修订号栅栏串行化。
