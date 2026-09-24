# Agent Note: dshc ships en and pt with no zh dictionaries

Status: implemented

## Problem

The upstream client shipped every UI dictionary as a zh/en pair, with zh as
the key-set source of truth. This deployment is the dshc fork for a
Portuguese-speaking owner: the zh dictionaries are dead copy on every
surface, and the pairing regime they impose (every key duplicated across two
dictionaries and the pairing gate) is maintenance cost the deployment gets
nothing back from. The durable `locale.preference` on shared homes may still
name `zh` from an older build.

## Decision

The fork ships `en` and `pt` dictionaries only. Packages whose reference UI
copy is English register `{ en }`; the packages this deployment actually
localizes to Portuguese (`dsh-client-locale`, `dsh-client-ui-workspace`,
`session-log-export`, `dsh-client-ui-conversation`) register `{ en, pt }`.
The zh dictionary files are deleted, key unions moved to the surviving
source (`keyof typeof en` or its pt sibling), and the locale registry offers
English and Português. A stored preference for a locale this build no longer
ships is ignored — adoption falls back to the browser-derived locale rather
than activating a dictionary-less locale.

The `en` fallback constant keeps both of its roles: the opening locale when
the browser names no shipped language, and the dictionary consulted when the
active locale misses a key.

## Alternatives considered

**Keep zh and add pt as a third locale.** Rejected: the fork has no zh
audience; carrying three dictionaries triples the pairing work and keeps the
key-set-source-of-truth discipline pointed at a locale nobody uses.

**Translate every package to pt.** Deferred: the fork's product copy is
English with pt where the owner asked for it; per-package pt dictionaries
follow demand instead of a blanket sweep.

## Verification

Package specs (`dsh-client-locale`, `dsh-client-ui-agent-preset`,
`dsh-client-ui-commands`) run green against the two-locale registry, the
stale-`zh`-preference adoption test, and the pt document language
(`pt-BR`); per-package `tsc -b` is green for the eight packages whose
imports stopped naming `zh`.

## Consequences

The pairing gate no longer applies to client dictionaries, and new keys are
added once (en) plus translated where a pt dictionary exists. A home shared
with an upstream build keeps its zh UI through the upstream build and opens
English here; nothing migrates the stored value. Removing a locale id from
`LOCALES` is now the documented way to retire one, with the adopt-time guard
making the drop safe for stored preferences.
