# @deepseek-ai/dsh-client-ui-settings-general

[English](README.md) | 中文

设置外壳、无特定功能归属文案与持久化产品引导 namespace。它以触发控件和模态设置面板占用 `sidebar.settings`，把 `settings.section` 账本投影成导航、把 `settings.onboarding` 账本投影成每次只挂载一个步骤的引导流程，并在设置页面上注册所有不属于单一功能的内容：触发器、标题栏与关闭控件内容、本地配置文件操作，「通用」分区及其 `settings.general.item` slot，以及 `settings` 字典。它渲染进的那些 slot 类型归 ui-settings——设置领域底座——所有；只有外壳自身的契约类型放在这里，因为它们引用 ui-sidebar 的 slot 类型，而底座不得依赖任何 `ui-*` 包。归具体功能所有的行（「权限」、「语言」、「外观」）、分区（「模型」）和条件式首次使用引导步骤仍由各自的功能包提供。

外壳不自带引导文案：所有文本都来自注册方。导航 label 可以是跟随语言的 thunk，因此导航投影经 `resolveSlotLabel` 解析，并在分区账本更新或 locale revision 变化时重新渲染（`ctx.get('locale')` 可选读取，无硬 locale 依赖）。首次使用引导记录按升序投影，每次只挂载一个步骤；可见步骤自行持有弹窗框架和应用根节点 `inert` 生命周期。已挂载但仍在判定私有事实的步骤渲染 null，因此判定期间不绘制也不阻塞任何内容。当前注册方会收到该条目的 id、`complete()` 和 `openSection(id)` 回调；完成或跳过当前步骤后，所有权转交给下一项。持久化完成状态、能力就绪状态、文案、变更操作以及可见包装均由注册方持有，因此独立注册的流程无法堆叠，外壳也不会成为第二个配置事实来源。

回环浏览器通过 `settings.describe` 加载提供方的 `hasDocument` 能力，且只有在 Host 确认可准备好一份由提供方持有的本地文档时才渲染**打开配置文件**。该操作发送无路径参数且仅限回环访问的 `settings.openDocument` 请求；Host 会再次解析提供方路径、在文档缺失时将其创建出来，并交给原生文本编辑器（macOS 上使用 `open -t`，绕过浏览器文件关联；Linux 和 Windows 上使用桌面文件关联；WSL 上经 `wslpath -w` 转换后使用 Windows 文件关联）。打开失败时该操作仍可使用，并渲染本地化错误。临时读取失败或 Host 拓扑变化后，重新打开对话框或重新连接会刷新可用性。远程浏览器从不注册该操作，也从不发起这项特权设置读取。

宿主端在用户设置 seam 中注册 `ui-onboarding`。`ui-settings-models` 提供的欢迎步骤通过既有公开 settings 边界读写其中的 `welcomeNoticeVersion`；外壳本身仍不持有产品策略。

## 模型体验

### 所有者的常驻指令

#### 模型看到的内容

对于存储的 `ui-onboarding` 分区中 `instructions` 非空的每个 agent（智能体）会话，runtime-context 快照中包含一个 `profile:instructions` 贡献（order 2）。去除首尾空白后的文本跟在下面这段固定引导语之后；未设置或只含空白的文本不贡献任何内容。

##### 引导语

```markdown
The user's standing instructions, written by them in Settings and applying to this and every session — honor them unless a direct user message supersedes them:
```

#### Token 影响

一个上下文块：固定引导语加上存储的指令。指令未变化时，请求不会新增任何内容。

#### KV Cache 影响

稳定的系统提示词保持字节级一致。编辑指令会改变完整的 runtime-context 快照，该快照追加在保留的历史之后，并保留之前已缓存的前缀；未变化的请求复用保留的快照。

## 已知限制与暂缓事项

- 「通用」分区没有内置行；每一行仅在其所属功能插件挂载时出现。
