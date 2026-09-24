# @deepseek-ai/dsh-client-ui-layout

[English](README.md) | 中文

外壳插件：双栏 AppFrame（拖动手柄与栏宽求解）加 `ctx.layout` 面板几何服务；它注册到运行时拥有的 `root` slot，并声明 `sidebar`、`conversation` 和 `shell.overlay`。侧边栏的缩放边界是不可见命中条带；关闭的侧边栏仍保留 56px 控制栏。该包还提供主题呈现器：它消费解析后的 `ctx.theme` 快照，并将其投影到 document（用 `html { color-scheme }` 驱动原生 UA 控件，依据当前配色方案设置 `body[data-ds-dark-theme]`，并将主题的别名 token 设为 body 上的内联变量，同时拥有一个 `<meta name="theme-color">`，其内容随计算后的 body 背景色更新）。在应用调色板和 token 后进行测量，可确保渲染后的背景成为唯一的颜色依据；呈现器在 dispose（资源释放）时会移除其自有的元数据节点，并一并清除其写入的其他全局状态。

AppFrame 始终挂载会话栏；已连接 Session 通过 `SessionProvider` 渲染。布局 store 是瞬时状态，侧边栏以 260px 宽度启动（可在 240px 至 420px 之间拖动调整），且该 store 从不读写 `localStorage`。会话 owner share 为空，侧边栏 owner share 只包含 `collapsed` 和 `width`；注册方通过标准钩子获取业务数据，并从各自的 inject 接口获取操作。

宽度低于 1024px 时，导航以紧凑控制栏启动，展开后成为覆盖会话的非模态抽屉。网格轨道保持 56px；抽屉使用侧边栏默认宽度，不修改桌面宽度偏好。侧边栏槽位在桌面、控制栏和抽屉之间始终保留同一个挂载实例。打开时焦点移入导航区域；在区域内按 Escape 或点击遮罩会关闭抽屉，嵌套对话框仍自行处理 Escape。键盘用户可以从导航移向会话。外壳浮层始终位于导航之上。

`/client` 导出表层包含插件主体（`apply`／`inject`）、`LayoutController` 和 owner-share 接口。AppFrame、面板 store 与栏宽求解器仍属于包内部。

## 模型体验

无。布局外壳管理浏览器查看状态；这里没有任何内容进入模型请求。

#### KV Cache 影响

无；该包既不组装也不发送提供方请求。

## 已知限制与暂缓事项

- **面板几何信息是瞬时状态**：重新加载会恢复侧边栏默认值；关闭侧边栏会忘记拖动后的宽度。
- **挤压重排期间不提供滚动锚定**：布局变化可能移动读者的 viewport。
