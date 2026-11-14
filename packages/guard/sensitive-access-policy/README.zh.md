---
description: "在文件工具读取受保护路径、或 web_fetch 向允许列表外的站点发送数据前请求批准，面向组合防外泄策略的用户与维护者。"
kind: "package-reference"
---

# @deepseek-ai/dsh-sensitive-access-policy

[English](README.md) | 中文

## 概述

使用本包，可在文件工具读取受保护路径（例如 SSH 密钥或 `.env` 文件）之前、以及 `web_fetch` 在地址中向允许列表外的站点发送数据之前，要求用户批准。所有默认值都为空，因此在配置之前本插件不改变任何行为。它加入 `tools/pre-execute` 瀑布流，在之后的所有监听器都允许该调用后才生效，并覆盖代码运行中嵌套的调用。请与 `dsh-sandbox-local` 的 `denyReadPaths` 搭配使用，它会对 shell 命令隐藏相同路径。

## 目录

- [使用本包](#use-this-package)
- [理解实现](#understand-the-implementation)
- [进一步探索](#further-exploration)
- [模型体验](#model-experience)
- [已知限制与延期工作](#known-limitations-and-deferred-work)
- [开发备注](#dev-note)

-----

<a id="use-this-package"></a>
## 使用本包

### 何时选择

当智能体在凭据或私有文件旁工作、且你希望每次读取都由人确认时，或当你希望由人确认可能在地址中带出本地数据的抓取时，选择本包。不要把它作为 shell 命令的唯一边界：`bash` 等进程工具不经过这些文件工具检查，因此还应通过 [`dsh-sandbox-local`](../../sandbox/sandbox-local/README.zh.md) 的 `denyReadPaths` 隐藏这些路径。

### 配置

```yaml
- name: '@deepseek-ai/dsh-sensitive-access-policy'
  config:
    sensitivePaths: ['~/.ssh/**', '~/.aws/**', '**/.env*']
    fetchApproval: with-data
    fetchAllowedDomains: [docs.example.com]
```

| 字段 | 默认值 | 含义 |
|---|---|---|
| `sensitivePaths` | `[]` | `node:path` glob 模式；每项必须是绝对路径、以 `~/` 开头或以 `**` 开头，否则在加载时失败 |
| `fetchApproval` | `never` | 设为 `with-data` 时，若 `web_fetch` 的地址携带数据且站点不在 `fetchAllowedDomains` 中，则请求批准 |
| `fetchAllowedDomains` | `[]` | 无需批准即可访问的纯主机名；每项也覆盖其子域名 |
| `fetchPathLengthLimit` | `80` | 地址路径超过该字符数即视为携带数据 |

### 效果

- 当 `file_path` 匹配某个模式时，`read` 与 `read_image` 请求批准；当 `path` 是受保护目录或位于其中时，`grep` 与 `glob` 请求批准。相对路径基于会话目录解析，`~` 基于宿主账户的主目录解析，符号链接会同时按自身路径与目标判断。
- 当地址带有查询、片段、凭据或长度超过 `fetchPathLengthLimit` 的路径，且主机既不是允许的域名也不是其子域名时，`web_fetch` 请求批准。普通页面地址直接通过。
- 提示会以每种客户端语言写明路径或主机。批准只放行这一次调用；拒绝、或部署中没有批准通道时，该调用会以下方原因被拒绝。

-----

<a id="understand-the-implementation"></a>
## 理解实现

<details>
<summary>实现细节——点击展开</summary>

一个 `tools/pre-execute` 监听器先调用 `next()`，只把 `allow` 变为 `ask`，因此之后监听器给出的拒绝或取消不会被削弱。工具流水线的 `serviceAsk` 把 `ask` 交给批准服务，并把结果映射为允许或拒绝。模式与域名在 `apply` 中校验，因此格式错误的条目会让插件在加载时失败。路径检查使用 `node:path` 的 `matchesGlob`；当搜索根目录的直接子项会匹配时，该根目录也算匹配。

### 源码地图

| 文件 | 作用 |
|---|---|
| [`src/index.ts`](src/index.ts) | 插件入口：`Config`、路径与地址规则、`tools/pre-execute` 监听器 |
| [`src/locales.ts`](src/locales.ts) | 每种客户端语言的批准提示文本 |

</details>

-----

<a id="further-exploration"></a>
## 进一步探索

- [工具子系统参考](../../../docs/subsystems/tools.zh.md)——`tools/pre-execute` 瀑布流与 `ask` 决策。
- [`dsh-sandbox-local`](../../sandbox/sandbox-local/README.zh.md)——`denyReadPaths` 与 `network: off`，同一策略在进程层面的另一半。
- [guard 分组地图](../README.zh.md)——同组的 guard 包。

-----

<a id="model-experience"></a>
## 模型体验

### 条件性工具结果

#### 模型看到的内容

本插件不添加提示或 schema。当用户拒绝受保护的调用、或不存在批准通道时，模型会收到一个错误结果，其原因写明路径（`reading <path> requires approval because the path is protected`）或主机（`fetching <host> with data in the address requires approval because the site is not on the allowed list`）。获批的调用返回工具自身的结果。

#### Token 影响

没有受保护调用被拒绝时为零 token。一次拒绝会以一条简短的错误结果替代工具输出。

#### KV Cache 影响

只追加；新可见内容位于可复用请求前缀之后，不会使现有 KV Cache 条目失效。

## 已知限制与延期工作

<a id="known-limitations-and-deferred-work"></a>


- **仅限文件工具**——`bash`、终端以及启动进程的代码运行读取文件时不经过这些检查；在 bwrap 与 Seatbelt 下，`dsh-sandbox-local` 的 `denyReadPaths` 覆盖它们。
- **搜索内容**——以工作区为根的 `grep` 可能匹配其下受保护文件（例如 `.env` 文件）中的文本而不请求批准；只有以受保护目录为根或位于其中的搜索才会请求。
- **仅限地址中的数据**——发往允许域名的抓取或普通页面地址无需批准即可通过，即使站点会记录该请求。
- **远程工作区**——符号链接解析在宿主上执行，因此远程工作区中的路径只按名称判断。

<a id="dev-note"></a>
### 开发备注

<details>
<summary>维护者的工作上下文——点击展开</summary>

本开发备注是维护者的工作上下文：开放问题与尚未决定的探索方向。它明确不具权威性——已交付的行为、限制与既定理由以上文、包代码和相关 Agent Note 为准。

以工作区为范围的 `grep` 是否应跳过匹配 `sensitivePaths` 的文件仍未决定；这样可以弥补搜索内容的缺口而无需每次搜索都请求批准，但会改变模型看到的结果。

</details>
