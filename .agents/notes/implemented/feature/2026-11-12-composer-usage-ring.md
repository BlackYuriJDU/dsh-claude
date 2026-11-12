# Agent Note: Composer usage ring carries the session figures; the Access seat returns under the card

Status: implemented

English | [中文](2026-11-12-composer-usage-ring.zh.md)

## Problem

dshc reworked the composer into a capsule with the plus menu, dictation, and send, and in doing so dropped three surfaces: the chat stats line (turn and step counts, cache hit, tokens, latency, throughput), the composer `ContextMeter` ring, and the Access seat (the permission-preset chip). The session's usage and its permission mode became invisible, and the Web suites that pinned them failed.

## Decision

A live session's composer renders a row under its card, following Claude Code, whose mode selector and usage ring sit in the row under the prompt box. The Access seat (`PermissionSelect`) sits on the left. On the right, after the model seat, sits the [context meter](2026-08-05-composer-context-meter-breakdown.md) ring. Its panel keeps the context section and adds a session section: turn and step counts, the cache-hit share as a bar, billed input against output tokens as a two-color bar, and one latency/throughput line. The figures come from the same `sessionStats` and `tokenUsage` projections the stats line read. The ring renders once the route capacity is known or the session has recorded activity, so a session without a reported capacity still reaches its figures. No background-jobs chip returns to the composer: Claude Code keeps background work in a separate tasks pane, not in the composer.

## Alternatives considered

**Restore the inline stats line.** Rejected: the owner asked for the Claude Code pattern of one circle whose panel shows the figures visually and in simplified form.

**A separate stats popover beside the ring.** Rejected: two controls for one session's usage would split one home per fact.

## Verification

`packages/client/ui-conversation/tests/context-meter.client.spec.tsx` covers the session section with its cache and token bars, the session-only ring without a route capacity, and the settled-history fold when the `sessionStats` projection is absent.

## Consequences

The stats line component no longer renders; its pure helpers (`deriveStats`, `cacheHitPercent`, `billedInputTokens`, `contextOccupancy`, `formatTokens`, `formatDuration`) back the ring panel. Web goldens that captured the stats line or the upstream composer chrome are refreshed against the under-card row.
