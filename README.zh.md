# DSH Claude

[English](README.md) | 中文

**DSH Claude**（`dshc`）是 [DeepSeek Harness](https://github.com/deepseek-ai/deepseek-harness) 的一个 fork——一个开源、基于插件的 agent harness（智能体框架）——其 UI 体验受 [Claude](https://claude.ai) 沉静、编辑式的风格启发。你自带模型和 API 密钥；harness、工具和界面保持开放。

> **与 Anthropic 无关联。** DSH Claude 是一个独立的开源项目。“Claude”是 Anthropic, PBC 的商标，此处仅用于说明设计灵感。该 UI 是重新换肤，而非复制：不包含任何 Anthropic 的素材、标志或字体。

## 为什么

- **一切皆插件。** 上游架构（内置的 Cordis）保持不变——DSH Claude 在其之上叠加主题和 UX 包，而不是分叉行为。
- **自带模型。** 在你自己的设置中配置任意提供方和密钥；不捆绑任何内容，也不向外回传任何数据。
- **可以并行运行。** `dshc` 命令及其默认端口（3090）永远不会与运行在 3080 上的原版 `dsh` 安装冲突。

<a id="run"></a>

## 运行

### 通过 npm 运行（原版 harness）

```sh
npx @deepseek-ai/dsh web          # original, port 3080
```

### DSH Claude

```sh
dshc web                          # serves http://127.0.0.1:3090
dshc web --port 0                 # or let the OS pick a free port
```

`dshc` 是本检出中已构建 CLI（`apps/cli/dist/bin.js`）之上的一个轻量启动器；`DSHC_HOME` 可覆盖检出路径。

<a id="run-from-source"></a>

### 从源码运行

```sh
git clone https://github.com/BlackYuriJDU/dsh-claude.git
cd dsh-claude
pnpm install
pnpm run build
pnpm dsh web --port 3090
```

## 路线图

- [ ] 面向 Web UI 的 Claude 风格主题包（字体排印、配色、动效）
- [ ] 无需密钥的网页搜索提供方（基础搜索不需要 API 密钥）
- [ ] 预构建的 `dshc` npm 发行版

## 许可证

[MIT](LICENSE)——继承自 DeepSeek Harness（© 2026 DeepSeek）。第三方依赖及其许可证见 [THIRD_PARTY_NOTICES.md](THIRD_PARTY_NOTICES.md)。
