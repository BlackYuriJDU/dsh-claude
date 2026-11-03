# DSH Claude

[English](README.md) | 中文

DSH Claude（`dshc`）是 [DeepSeek Harness](https://github.com/deepseek-ai/deepseek-harness) 的一个分支。DeepSeek Harness 是一个开源、基于插件的智能体框架；本分支的 Web 客户端仿照 Claude 应用设计样式。你自带模型与 API 密钥；框架、工具与界面保持开放。

> **与 Anthropic 无关联。** DSH Claude 是一个独立的开源项目。“Claude” 是 Anthropic, PBC 的商标，此处仅用于说明设计灵感来源。不包含任何 Anthropic 标志、字体或其他资产。

## 本分支新增的内容

本分支是上游框架之上的一层，因此上游更新可以合并而不触及它：

- [`ui-brand-dshc`](packages/client/ui-brand-dshc/README.zh.md) 将浅色与深色配色改为 Claude 应用的暖色中性色与陶土色强调色，并显示 DSHC 标志。
- [`web-search-searxng`](packages/web/web-search-searxng/README.zh.md) 通过 SearXNG 实例搜索网页，无需 API 密钥。
- [`dsh-dshc`](packages/bundle/dshc/README.zh.md) 是 `dshc` 配置档的补丁层，将以上两者叠加在 Web 配置档之上。
- [`bin/dshc`](bin/dshc) 使用独立的主目录与端口启动该配置档，因此可以与标准 `dsh` 安装并行运行。

<a id="run"></a>

## 运行

<a id="run-from-source"></a>

### 从源码运行

构建仓库，然后启动 DSH Claude：

```sh
git clone https://github.com/BlackYuriJDU/dsh-claude.git
cd dsh-claude
pnpm install
pnpm run build
bin/dshc
```

`bin/dshc` 从 `apps/cli/lib/bin.js` 处的已构建 CLI 提供 `http://127.0.0.1:3090`，并将状态保存在 `~/.dshc`。设置 `DSHC_PORT`、`DSHC_DSH_HOME`、`DSHC_WORKSPACE` 或 `DSHC_HOME` 可分别更改端口、主目录、工作目录或仓库位置。将 `SEARXNG_URL` 设为启用了 JSON 输出的 SearXNG 实例即可开启免密钥网页搜索。

上游配置档仍可在同一仓库中使用，例如在端口 3080 上运行 `pnpm dsh web`。

## 上游

DeepSeek Harness 文档：[https://deepseek-harness.github.io/deepseek-harness/](https://deepseek-harness.github.io/deepseek-harness/)。请从[开发指南](docs/development.zh.md)与[架构文档](docs/architecture.zh.md)开始；智能体遵循 [AGENTS.md](AGENTS.md)。运行项目前请阅读[安全须知](SAFETY.zh.md)。

## 许可证

[MIT](LICENSE)，继承自 DeepSeek Harness。第三方依赖及其许可证披露于 [THIRD_PARTY_NOTICES.md](THIRD_PARTY_NOTICES.md)。
