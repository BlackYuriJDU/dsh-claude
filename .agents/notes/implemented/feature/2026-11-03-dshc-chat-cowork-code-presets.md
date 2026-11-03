# Agent Note: DSHC Chat, Cowork, and Code presets

Status: implemented

English | [中文](2026-11-03-dshc-chat-cowork-code-presets.zh.md)

## Problem

DSH Claude labeled the composer "Chat" or "Cowork", but the switch only changed the placeholder text; every session ran the same coding persona. The upstream presets (Standard, PTC, Minimal, Creator) are organized around harness capabilities rather than the three ways people use the Claude products, and none introduces the agent as DSHC.

## Decision

- [`dsh-dshc`](../../../../packages/bundle/dshc/README.md) adds three presets, Chat, Cowork, and Code, sets Chat as the start default, disables Standard, PTC, and Minimal, and keeps Creator after the three.
- The personas are original text written from a study of Anthropic's published sources: the claude.ai system prompt (October 2026) for tone and formatting, the Cowork help-center articles for the task flow (outcome, plan, visible progress, deliverables, approval before deletion), and the Claude Code documentation for the gather-context, act, verify loop. No Anthropic prompt text is copied.
- Every persona opens with the same identity, DSHC powered by `{{model}}` and not Claude, and closes with the same communication rules; a test keeps both identical across presets.
- Chat has file reads, web search and fetch, skills, and compaction, with no shell and no write tools. Cowork and Code reuse the upstream standard rows unchanged apart from the persona; a test keeps them equal to the upstream preset.
- The personas name only tools the presets mount (`todo_write`, `ask_user_question`, `exit_plan_mode`, and `present`), and only the `{{model}}` prompt variable, which the upstream presets already use.

## Alternatives considered

**Keep Standard beside Code.** Their tool sets are identical, so two entries would differ only in persona and confuse the choice; PTC and Minimal describe themselves relative to Standard, so they leave with it.

**Make Cowork the default.** Cowork matches the harness's agent strengths, but the Claude product starts in Chat and the composer's preset chip makes the switch one click.

**Paste the claude.ai system prompt.** It is published, but copying it would import product-specific instructions about tools DSH does not have, add thousands of tokens to every request, and blur the line between DSHC and Claude.

## Consequences

- Persona text is fixed per preset, so it stays in the cached prompt prefix; switching presets starts a new prefix.
- Models other than Claude follow the rules only as far as they follow instructions; the personas steer behavior and do not reproduce Claude's training.
- Upstream changes to the standard preset make the equality test fail, which is the signal to re-derive Cowork and Code.
