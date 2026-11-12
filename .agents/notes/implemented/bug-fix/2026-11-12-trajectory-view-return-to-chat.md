# Agent Note: Non-Chat views show the view tabs so the user can return to Chat

Status: implemented

English | [中文](2026-11-12-trajectory-view-return-to-chat.zh.md)

## Problem

dshc hides the session header chrome so the conversation starts at the transcript. The header also carried the Chat/Trajectory view tabs, but the tool-row inspect control still selects the Trajectory view through the chat store. After one inspect click the session showed Trajectory with no visible way back to Chat; only switching sessions restored the transcript.

## Decision

`ConversationSessionHeader` stays hidden while the Chat view is active and renders the view tabs, with the shared tab styles, whenever another registered view is active. Selecting the Chat tab writes the store's `view` back to `chat`, which hides the header again. Breadcrumbs, the session log, and the PTC chip stay removed; on Chat the header collapses to the background-jobs action alone, floating at the transcript's top-right and rendering only while the session has background work ([usage ring](../feature/2026-11-12-composer-usage-ring.md)).

## Alternatives considered

**Remove the inspect control from tool rows.** Rejected: the Trajectory ledger is the only per-request inspector, and the control is its sole entry point while the header is hidden.

**A dedicated back button inside the Trajectory toolbar.** Rejected: it would duplicate navigation inside one view, and other non-Chat views registered on the view ring would need their own copy.

## Verification

`packages/client/ui-trajectory/tests/views.client.spec.tsx` mounts the real header and body over the view ring: no tab is reachable on Chat, selecting Trajectory through the store shows the Chat and Trajectory tabs with Trajectory selected, and clicking the Chat tab returns to the chat body and hides the tabs.

## Consequences

The header reappears only outside Chat, so the transcript-first layout is unchanged for ordinary use. Any future view registered on `conversation.view` is reachable and leavable through the same tabs without header changes.
