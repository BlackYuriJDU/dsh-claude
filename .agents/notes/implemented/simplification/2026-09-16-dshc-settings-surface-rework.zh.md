# Agent Note: dshc 重做设置外壳并移除多余的设置行

Status: implemented

[English](2026-09-16-dshc-settings-surface-rework.md) | 中文

## 问题

上游的设置界面包含本部署不使用的控件：Enter 行为行、General 分节中的权限行、Plugins 设置分节、框架级的侧边栏折叠开关，以及仍然绑定到已删除中文词典配对的英文界面文案。本部署的参考设计则需要一个由外壳拥有的 Perfil 区块、分组导航（Configurações / Personalizar）、“即将推出”占位项，以及一个 durable 的聊天字体偏好。

## 决策

该 fork 按参考设计重做客户端设置界面：

- `ui-settings-general` 拥有 Perfil 区块（头像、全名、显示名称、常驻指令）和只读的 Account 分节，二者都基于 durable 的 `ui-onboarding` 作用域；未知的分节 id 归入 Configurações 分组，`connectors`/`plugins` 渲染“即将推出”占位项。
- `ui-theme` 新增 durable 的 `chatFont` 偏好（inter/system/serif/mono）及其独立的 General 行；所选值设置文档级的 `--dsh-chat-font-family` 变量，由 `ui-conversation` 使用。
- `ui-conversation` 移除 Enter 行为行的注册（提交策略仍保持挂载并生效），并且只在问候界面渲染 hero 胶囊外观——Chat/Cowork 分段、计划位、模型位以及其他附加位。
- `ui-permission-presets` 移除 General 分节中的行（本部署的权限姿态是固定的）；`/permission` 弹窗装饰及其控制器保留。
- `ui-settings-plugins` 移除 Plugins 分节的注册；其卡片和标签页注册保持空闲，直到有外部界面声明 `settings.plugins.tab` 父级，该插件仍保持挂载以处理凭据失效。
- `ui-layout` 移除框架级的折叠开关（由侧边栏底部按钮组拥有该控件），`ui-sidebar` 新增 Design 行。

`ui-settings-plugins` 中保留但处于休眠状态的注册以及权限 store 是有意为之：外部界面仍可激活该标签页，控制器在没有可见行的情况下保持接线。

## 备选方案

**直接删除休眠的注册。** 已否决：标签页和卡片界面是有文档的扩展点；部署方（或未来的改动）可以重新声明父级来启用它们，而无需重新构建该包。

**把外壳拥有的个人资料拆分为独立的包。** 已推迟：目前只有设置外壳和侧边栏使用它；出现第二个消费者后再拆分。

## 验证

对改动涉及的十一个客户端包进行合并的 vitest 运行：1815 个测试通过（112 个文件）；逐包的 `tsc -b` 通过；九个打包包的 tsdown 构建以及 Web 前端构建通过；3090 端口上的现有 GUI 提供了重建后的外壳和改动后的模块。

## 影响

新的设置分节按外壳的词汇映射分组，未知 id 归入 Configurações。聊天字体偏好存放在共享的主题设置 schema 中，因此读取同一主目录的上游构建会容忍并忽略这个额外字段。权限默认值和 Enter 行为不再是用户可调整的界面；两条写入路径仍保持挂载，供未来的设置行使用。
