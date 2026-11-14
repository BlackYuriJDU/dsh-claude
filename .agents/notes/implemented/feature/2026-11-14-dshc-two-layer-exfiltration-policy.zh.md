# Agent Note：DSHC 双层防外泄策略

Status: implemented

[English](2026-11-14-dshc-two-layer-exfiltration-policy.md) | 中文

## 问题

受限的 shell 命令能读取用户可读的每个文件并访问任何主机：bwrap profile 以只读方式绑定 `/` 且保留网络，Seatbelt 允许所有读取。文件工具 `read`、`read_image`、`grep` 与 `glob` 也没有针对凭据的规则，`web_fetch` 可以在地址中带出本地数据。除 `gen-third-party-notices` 审查的直接声明外，依赖闭包没有许可证检查。

## 决策

- **第一层，沙箱。** [`dsh-sandbox-local`](../../../../packages/sandbox/sandbox-local/README.zh.md) 新增 `denyReadPaths` 与 `network: on | off`，二者默认都不加限制。bwrap 用空的只读 tmpfs 隐藏目录、用 `/dev/null` 隐藏文件，并在可写绑定之后挂载，`--unshare-net` 移除网络；Seatbelt 在末尾追加 `deny file-read*` 与 `deny network*`。Landlock 与 Windows ACL runner 无法表达二者，因此报告 `partial` 强制执行，而不是声称具备该边界。
- **第二层，工具。** [`dsh-sensitive-access-policy`](../../../../packages/guard/sensitive-access-policy/README.zh.md) 加入 `tools/pre-execute`，先委托，再在文件工具触及受保护路径、或 `web_fetch` 地址向允许域名外的站点携带数据（查询、片段、凭据或长路径）时把 `allow` 变为 `ask`。请求批准让用户掌控合理的读取；没有批准通道时，流水线会拒绝。
- **DSHC 默认值。** 组合包在第二层保护 `~/.ssh`、`~/.aws`、`~/.config/gh`、`~/.gnupg` 与 `**/.env*`，在第一层隐藏这四个目录，并在允许列表为空时对携带数据的抓取请求批准（所有者决策 D13）。
- **许可证。** `verify-dependency-licenses` 用同一 `isPermissive` 策略检查完整的已安装闭包，允许仅开发用的包使用 MPL-2.0，拒绝没有宽松替代的 GPL 与 AGPL 以及 tldraw，并为当前每个例外写明理由（所有者决策 D14）。

## 备选方案

**第二层直接拒绝而非请求批准。** 受保护文件有时就是任务本身，例如修复 `.env` 模板；拒绝会迫使用户在任务中途修改配置。

**第一层使用 glob 模式。** bwrap 挂载与 Landlock 授权只接受具体路径，因此 `**/.env*` 需要在每次受限执行时扫描工作区，且仍会漏掉命令执行期间新建的文件；第一层保留字面路径，第二层匹配 glob。

**对列表外的每次抓取都请求批准。** 所有者选择只在地址携带数据时请求，因此读取页面无需提示。

**按许可证允许 MPL 与 LGPL。** 所有者选择具名例外，因此采用这些许可证的新包在发布前会经过审查。

## 影响

- 在 bwrap 或 Seatbelt 下，shell 命令无法读取 DSHC 的凭据目录；在 Landlock 下仍可读取，封装会报告 `partial`。
- 工作区 `.env` 文件对文件工具受保护，但对 shell 命令不受保护，因为第一层无法按模式匹配。
- 许可证策略外的新依赖会让静态门禁失败，直到它获得有理由的例外。
- [`apps/web/tests/dshc-privacy.e2e.ts`](../../../../apps/web/tests/dshc-privacy.e2e.ts) 在真实组合中守住两项承诺：启动期间不访问外部主机，以及在读取工作区 `.env` 或进行携带数据的抓取前请求批准。
