# Agent Note：通过 SearXNG 提供方实现免密钥 web 搜索

Status: implemented

[English](2026-11-03-keyless-searxng-search-provider.md) | 中文

## 问题

所有已发布的搜索提供方（Exa、Perplexity、DeepSeek）都需要厂商凭据，因此没有凭据的部署无法使用 `web_search`。DSH Claude 曾用一个独立的 Python MCP 服务器绕过此问题，它抓取 DuckDuckGo 的 HTML 结果：该服务器位于插件系统之外，需在设置文件中手动注册，依赖页面标记，且没有测试。

## 决策

- [`dsh-web-search-searxng`](../../../../packages/web/web-search-searxng/README.zh.md) 在 `ctx.web` 上注册 `searxng` 提供方。它向 SearXNG 实例发送 `GET {baseURL}/search?q=…&format=json`；SearXNG 是可自托管的元搜索引擎，具有文档化的 JSON 输出且无需 API 密钥。
- `baseURL` 回退到 `$SEARXNG_URL`；`language`、`categories` 与 `safeSearch` 可选，否则采用实例设置。基址为空、无法解析或非 http(s) 时提供方不可用，因此选择过程报告 `WEB_PROVIDER_UNAVAILABLE` 或 `WEB_PROVIDER_CONFIGURED_UNAVAILABLE`，而不是发送请求。
- 结果只保留带非空白摘录的 http(s) URL，且由于 SearXNG 合并多个引擎，URL 的首次出现胜出。提供方不返回 `content`；由服务执行 `maxResults`。
- 请求使用 `redirect: 'error'`，与家族中针对带凭据提供方的规则一致，尽管该请求不携带凭据，从而只联系已配置的实例这一个源。
- HTTP `403` 会指出 `search.formats` 设置，因为 SearXNG 在禁用 JSON 输出时返回 `403`。
- 本包归类为 `optional`：已发布的默认 bundle 不挂载它。

## 备选方案

**继续抓取 DuckDuckGo。** 它不需要实例，但解析的是非 API 的标记，会无预警地失效，且自动化抓取与该服务的条款冲突。它也无法针对稳定的契约进行测试。

**默认使用公共 SearXNG 实例。** 公共实例通常禁用 JSON 输出并对自动化客户端限流，而默认值会把每位用户的查询发送给部署方未选择的第三方。要求 `baseURL` 或 `$SEARXNG_URL` 使实例成为明确的部署选择。

**将 SearXNG 即时答案映射为 `content`。** `answers[]` 的条目格式因引擎与 SearXNG 版本而异；映射它需要先固定最低版本并准备 fixture，已记录在包的开发备注中。

## 后果

- 可访问 SearXNG 实例的部署无需厂商密钥即可获得 `web_search`。
- 结果质量与覆盖面取决于实例的引擎设置，提供方无法控制。
- 实时冒烟测试在缺少 `$SEARXNG_URL` 时自动跳过，因此 CI 只通过模拟 `fetch` 与出口代理 spec 覆盖本提供方。
