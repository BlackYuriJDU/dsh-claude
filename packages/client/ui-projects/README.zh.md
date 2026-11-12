# @deepseek-ai/dsh-client-ui-projects

[English](README.md) | 中文

项目插件：按工作区划分的指令和知识文件。Node 侧注册以工作区 id 为键的 durable `ui-projects` 设置命名空间，并贡献 `project:content` 提示词上下文（order 3）。每次组装提示词时，该上下文把会话不可变的 cwd 解析为路径包含它的已注册工作区（最长的路径前缀匹配优先），并渲染该项目的指令和知识文件。浏览器侧在设置中新增 **Projects** 分节，每个工作区一张卡片：一个指令文本框，以及一个通过 Host 选取文件的知识文件列表。

由于提示词上下文提供方是同步的，知识文件在组装时同步读取。每个文件最多贡献 `knowledgeFileMaxChars` 个字符（`Config`，默认 20,000，必须为正整数）；更长的文件会被截断并附加标记，无法读取的文件贡献一行提示，而不会使请求失败。

## 模型体验

### 项目内容

#### 模型看到的内容

当会话 cwd 位于某个已注册工作区内，且该项目有非空指令或至少一个知识文件时，runtime-context 快照中包含一个 `project:content` 贡献。指令跟在下面第一段引导语之后；每个知识文件以 `--- <name> ---` 标题及其内容的形式跟在第二段引导语之后。不在任何已注册工作区内的会话，以及没有内容的项目，不贡献任何内容。

##### 指令引导语

```markdown
Instructions for this project, written by the user and applying to every session in it — honor them unless a direct user message supersedes them:
```

##### 知识引导语

```markdown
Knowledge files attached to this project:
```

#### Token 影响

与项目内容成正比：指令加上每个知识文件最多 `knowledgeFileMaxChars` 个字符。项目内容和文件未变化时，请求不会新增任何内容。

#### KV Cache 影响

稳定的系统提示词保持字节级一致。编辑项目或修改磁盘上的知识文件会改变完整的 runtime-context 快照，该快照追加在保留的历史之后，并保留之前已缓存的前缀；未变化的请求复用保留的快照。

## 已知限制与暂缓事项

- **不对知识文件做检索**：每次快照变化时，每个附加文件都会被整体注入（不超过单文件上限）；大型知识集会消耗 token，而不是被检索。
- **每次组装都重新读取文件**：磁盘上的编辑无需修改设置即可到达模型，被删除的文件会退化为提示行。
