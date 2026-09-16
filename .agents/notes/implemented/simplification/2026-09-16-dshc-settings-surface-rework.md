# Agent Note: dshc reworks the settings shell and retires surplus rows

Status: implemented

## Problem

The upstream settings surfaces carry controls this deployment does not use:
an Enter-behavior row, a General-section permission row, a Plugins settings
section, a frame-level sidebar fold toggle, and English chrome still keyed to
removed Chinese dictionary pairs. The deployment's reference design instead
has a shell-owned Perfil block, grouped nav (Configurações / Personalizar),
"soon" placeholders, and a durable chat-font preference.

## Decision

The fork reworks the client settings surfaces toward the reference:

- `ui-settings-general` owns the Perfil block (avatar, full name, display
  name, standing instructions) and a read-only Account section, both riding
  the durable `ui-onboarding` scope; unknown section ids group under
  Configurações, and `connectors`/`plugins` render "soon" placeholders.
- `ui-theme` adds a durable `chatFont` preference (inter/system/serif/mono)
  with its own General row; the selection sets the document-level
  `--dsh-chat-font-family` variable that `ui-conversation` consumes.
- `ui-conversation` retires the Enter-behavior row registration (the
  submission policy stays mounted and effective) and renders the hero
  capsule chrome — Chat/Cowork segment, plan seat, model seat, extra seats —
  only on the greeting screen.
- `ui-permission-presets` retires the General-section row (the deployment's
  permission posture is fixed); the `/permission` popup decoration and its
  controller stay.
- `ui-settings-plugins` retires the Plugins section registration; its cards
  and tab registration idle until an external surface declares the
  `settings.plugins.tab` parent, and the plugin stays mounted for credential
  invalidation.
- `ui-layout` drops the frame-level fold toggle (the sidebar foot cluster
  owns the control), and `ui-sidebar` adds the Design row.

The retained-but-dormant registrations in `ui-settings-plugins` and the
permission store are deliberate: an external surface can still activate the
tab, and the controllers keep their wiring without a visible row.

## Alternatives considered

**Delete the dormant registrations outright.** Rejected: the tab and card
surfaces are documented extension points; a deployment (or a future change)
can re-declare the parent and light them up without rebuilding the package.

**Split the shell-owned profile into its own package.** Deferred: only the
settings shell and the sidebar consume it today; extraction follows a second
consumer.

## Verification

Consolidated vitest run over the eleven touched client packages: 1815 tests
passing (112 files); focused `tsc -b` per package green; tsdown bundles for
the nine bundling packages plus the web frontend build green; the existing
GUI on port 3090 serves the rebuilt shell and the changed modules.

## Consequences

New settings sections group by the shell's vocabulary map and unknown ids
fall under Configurações. The chat-font preference lives in the shared theme
settings schema, so upstream builds reading the same home tolerate the extra
field and ignore it. The permission default and Enter behavior are no longer
user-adjustable surfaces; both write paths remain mounted for future rows.
