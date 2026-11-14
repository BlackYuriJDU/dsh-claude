# Agent Note: DSHC two-layer exfiltration policy

Status: implemented

English | [中文](2026-11-14-dshc-two-layer-exfiltration-policy.zh.md)

## Problem

A confined shell command could read every file the user can read and reach any host: the bwrap profile bound `/` read-only and kept the network, and Seatbelt allowed every read. The file tools `read`, `read_image`, `grep`, and `glob` had no rule for credentials either, and `web_fetch` could carry local data out in its address. The dependency closure had no license check beyond the direct declarations that `gen-third-party-notices` reviews.

## Decision

- **Layer 1, the sandbox.** [`dsh-sandbox-local`](../../../../packages/sandbox/sandbox-local/README.md) gains `denyReadPaths` and `network: on | off`, both defaulting to no restriction. bwrap hides a directory under an empty read-only tmpfs and a file under `/dev/null`, mounted after the writable binds, and `--unshare-net` removes the network; Seatbelt appends `deny file-read*` and `deny network*`. Landlock and the Windows ACL runner cannot express either, so they report `partial` enforcement instead of claiming the boundary.
- **Layer 2, the tools.** [`dsh-sensitive-access-policy`](../../../../packages/guard/sensitive-access-policy/README.md) joins `tools/pre-execute`, delegates first, and turns an `allow` into `ask` when a file tool reaches a protected path or a `web_fetch` address carries data (query, fragment, credentials, or a long path) to a site outside the allowed domains. Asking keeps the user in control of a legitimate read; the pipeline denies when no approval channel exists.
- **DSHC defaults.** The bundle protects `~/.ssh`, `~/.aws`, `~/.config/gh`, `~/.gnupg`, and `**/.env*` in layer 2, hides the four directories in layer 1, and asks before data-carrying fetches with an empty allowed list (owner decision D13).
- **Licenses.** `verify-dependency-licenses` checks the whole installed closure with the same `isPermissive` policy, allows MPL-2.0 for development-only packages, refuses GPL and AGPL without a permissive alternative and tldraw, and names each current exception with its reason (owner decision D14).

## Alternatives considered

**Deny instead of ask in layer 2.** A protected file is sometimes the task itself, such as fixing an `.env` template; a denial would force the user to change configuration mid-task.

**Glob patterns in layer 1.** bwrap mounts and Landlock grants take concrete paths, so `**/.env*` would need a scan of the workspace at every confinement and would still miss files created during the command; layer 1 keeps literal paths and layer 2 matches globs.

**Ask before every fetch outside the list.** The owner chose to ask only when the address carries data, so reading a page needs no prompt.

**Allow MPL and LGPL by license.** The owner chose named exceptions, so a new package under those licenses is reviewed before it ships.

## Consequences

- Shell commands under bwrap or Seatbelt cannot read the DSHC credential directories; under Landlock they still can, and the wrap reports `partial`.
- A workspace `.env` file is protected from the file tools but not from shell commands, which layer 1 cannot match by pattern.
- A new dependency outside the license policy fails the static gates until it gets a reasoned exception.
- [`apps/web/tests/dshc-privacy.e2e.ts`](../../../../apps/web/tests/dshc-privacy.e2e.ts) keeps both promises in the real composition: no external host during boot, and approval before a workspace `.env` read or a data-carrying fetch.
