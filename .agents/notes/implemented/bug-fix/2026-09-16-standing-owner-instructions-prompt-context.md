# Agent Note: Standing owner instructions reach the model prompt

Status: implemented

## Problem

The settings General profile block persists an owner-written instructions
textarea into the durable `ui-onboarding` section, and its copy promises the
agent honors the text "in this and every session". The browser half of
`dsh-client-ui-settings-general` wrote the field correctly, but the Host half
declared the namespace with only `welcomeNoticeVersion` and no plugin read the
stored text, so the saved instructions never reached any model request — a
silent promise the UI made and the harness did not keep.

## Decision

The node face of `dsh-client-ui-settings-general` owns the whole durable
section schema (`welcomeNoticeVersion`, `userName`, `userFullName`,
`userEmail`, `instructions`, all optional strings) and contributes a
`profile:instructions` prompt context (order 2, alongside the locale
response-language context) that reads the stored section at assembly time. The
context renders the trimmed instructions under a standing-instructions
sentence; unset or whitespace-only storage contributes nothing. A change to
the settings document therefore reaches the next model step without a restart,
the same assembly-time read the locale context uses.

The context is a prompt context, not a persona edit: it leaves the deployment
persona intact, and a direct user message outranks it by the sentence the
context itself carries.

## Alternatives considered

**Mirror the text into localStorage and inject per message.** Rejected: it
would fork a second durable copy of a field the settings scope already owns
and would violate model-visible-means-logged unless a session event carried it.

**Register a persona section that appends the text.** Rejected: the persona
section name is already owned by the deployment/preset persona row, and
appending through the section registry would fight the single-registration
invariant instead of the context list, which is built for per-assembly facts.

## Verification

`tests/host.client.spec.ts` drives the real Settings provider and SystemPrompt
services: the namespace registers and disposes with its fiber, the stored
instructions reach `systemPrompt.assemble()` under
`PROFILE_INSTRUCTIONS_CONTEXT`, blank storage contributes nothing, and
disposal removes the context. `profileInstructionsText` unit cases cover unset,
whitespace, and non-empty text.

## Consequences

Text a user writes in Settings now reaches every session's model request on
this deployment. Instructions are plain context: they carry no tool grant and
no permission change, and trimming means a whitespace-only field can never
look loaded. The host schema now accepts the profile fields the browser scope
has written since the profile block shipped, so previously stored sections
validate instead of being tolerated by accident.
