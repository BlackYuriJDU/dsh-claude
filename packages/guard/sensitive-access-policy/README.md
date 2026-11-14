---
description: "Approval before file tools read protected paths or web_fetch sends data to sites outside an allowed list, for users and maintainers composing an exfiltration policy."
kind: "package-reference"
---

# @deepseek-ai/dsh-sensitive-access-policy

English | [中文](README.zh.md)

## Summary

Use this package to require the user's approval before a file tool reads a protected path, such as SSH keys or `.env` files, and before `web_fetch` sends data in its address to a site outside an allowed list. Every default is empty, so the plugin changes nothing until configured. It joins the `tools/pre-execute` waterfall after every later listener has allowed the call, and covers calls nested in a code run. Pair it with `denyReadPaths` in `dsh-sandbox-local`, which hides the same paths from shell commands.

## Table of Contents

- [Use this package](#use-this-package)
- [Understand the implementation](#understand-the-implementation)
- [Further Exploration](#further-exploration)
- [Model Experience](#model-experience)
- [Known Limitations and Deferred Work](#known-limitations-and-deferred-work)

-----

<a id="use-this-package"></a>
## Use this package

### When to choose it

Choose it when the agent works next to credentials or private files and you want a person to confirm each read of them, or when you want a person to confirm a fetch that could carry local data out in its address. Avoid it as the only boundary for shell commands: `bash` and other process tools do not pass through these file-tool checks, so hide those paths with `denyReadPaths` in [`dsh-sandbox-local`](../../sandbox/sandbox-local/README.md) as well.

### Setting it up

```yaml
- name: '@deepseek-ai/dsh-sensitive-access-policy'
  config:
    sensitivePaths: ['~/.ssh/**', '~/.aws/**', '**/.env*']
    fetchApproval: with-data
    fetchAllowedDomains: [docs.example.com]
```

| Field | Default | Meaning |
|---|---|---|
| `sensitivePaths` | `[]` | `node:path` glob patterns; each is absolute, starts with `~/`, or starts with `**`, and anything else fails at load |
| `fetchApproval` | `never` | `with-data` asks before a `web_fetch` whose address carries data to a site outside `fetchAllowedDomains` |
| `fetchAllowedDomains` | `[]` | Bare host names reached without approval; each also covers its subdomains |
| `fetchPathLengthLimit` | `80` | Address paths longer than this many characters count as carrying data |

### What you get

- `read` and `read_image` ask when `file_path` matches a pattern; `grep` and `glob` ask when `path` is a protected directory or lies inside one. A relative path resolves against the Session directory, `~` against the Host account's home, and a symlink is judged by both its own path and its target.
- `web_fetch` asks when the address has a query, a fragment, credentials, or a path longer than `fetchPathLengthLimit`, and its host is not an allowed domain or a subdomain of one. A plain page address passes.
- The prompt names the path or host in every Client locale. Approval allows that one call; a rejection, or a deployment without an approval channel, denies it with the reason below.

-----

<a id="understand-the-implementation"></a>
## Understand the implementation

<details>
<summary>Implementation internals — click to expand</summary>

One `tools/pre-execute` listener calls `next()` first and only turns an `allow` into `ask`, so a denial or cancellation from a later listener is never weakened. The tool pipeline's `serviceAsk` routes the `ask` to the approval service and maps its outcome to allow or deny. Patterns and domains are validated in `apply`, so a malformed entry fails the plugin at load. Path checks use `matchesGlob` from `node:path`; a search root also matches when a direct child of it would.

### Source map

| File | Role |
|---|---|
| [`src/index.ts`](src/index.ts) | Plugin entry: `Config`, path and address rules, the `tools/pre-execute` listener |
| [`src/locales.ts`](src/locales.ts) | Approval prompt text in every Client locale |

</details>

-----

<a id="further-exploration"></a>
## Further Exploration

- [Tools subsystem reference](../../../docs/subsystems/tools.md) — the `tools/pre-execute` waterfall and the `ask` decision.
- [`dsh-sandbox-local`](../../sandbox/sandbox-local/README.md) — `denyReadPaths` and `network: off`, the process-level half of the same policy.
- [guard group map](../README.md) — the sibling guard packages.

-----

<a id="model-experience"></a>
## Model Experience

### Conditional tool result

#### What the model sees

This plugin adds no prompt or schema. When the user rejects a guarded call, or no approval channel exists, the model receives an error result whose reason names the path (`reading <path> requires approval because the path is protected`) or the host (`fetching <host> with data in the address requires approval because the site is not on the allowed list`). An approved call returns the tool's own result.

#### Token effect

Zero tokens when no guarded call is denied. A denial adds one short error result in place of the tool's output.

#### KV Cache effect

Append-only; newly visible content follows the reusable request prefix and does not invalidate existing KV Cache entries.

## Known Limitations and Deferred Work

<a id="known-limitations-and-deferred-work"></a>


- **File tools only** — `bash`, terminals, and code runs that spawn processes read files without passing through these checks; `denyReadPaths` in `dsh-sandbox-local` covers them under bwrap and Seatbelt.
- **Search contents** — a `grep` rooted at the workspace can match text inside a protected file below it, such as an `.env` file, without asking; only a search rooted at or inside a protected directory asks.
- **Address data only** — a fetch to an allowed domain, or a plain page address, passes without approval even if the site logs the request.
- **Remote workspaces** — symlink resolution runs on the Host, so a path in a remote workspace is judged by its name alone.
