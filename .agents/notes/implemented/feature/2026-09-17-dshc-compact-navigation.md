# Agent Note: DSHC compact navigation without duplicate slot instances

Status: implemented

English | [中文](2026-09-17-dshc-compact-navigation.zh.md)

## Problem

Navigation must leave more room for reading on desktop and remain usable on narrow windows without resizing the conversation every time it opens. Sidebar occupants own state and global event listeners, so duplicating the slot for an overlay also duplicates workspace controls and event consumers.

## Decision

The layout uses a 260px default sidebar with a 240–420px desktop resize range. Below 1024px, the solver receives its existing zero preference sentinel and reserves the 56px rail. Opening navigation positions the same sidebar element above that grid, passes its actual drawer width to the occupant, and leaves the conversation in its explicit second grid column. Desktop widths survive breakpoint transitions; the drawer expansion state is transient.

Navigation is a non-modal complementary region. Opening focuses that region; Escape from it closes the drawer unless a nested dialog owns the event. A pointer scrim also closes navigation. Keyboard users remain free to reach the conversation; the implementation does not claim modal focus isolation. Shell overlays sit above the drawer. No new slot, public value export, package, or server operation is needed.

The conversation uses a 760px reading axis. Its existing composer relation remains content width plus 32px, preserving alignment with dock and takeover cards and retaining the selected reading font. This geometry does not change the DSHC palette or typography.

This decision extends the [slot identity standard](../architecture/2026-07-22-slot-type-chain-implementation.md) and leaves [workspace browsing ownership](2026-07-25-session-list-browsing-and-manual-order.md) unchanged. Neither decision is superseded.

## Alternatives considered

**Render the sidebar again inside the overlay.** This duplicates mounted workspace regions and their window listeners; identical slot keys do not make two React positions one instance.

**Expand the narrow grid track.** This squeezes and reflows the conversation on each navigation gesture instead of preserving the reading area.

**Make the drawer a modal dialog.** Navigation need not prevent keyboard access to the conversation. Declaring `aria-modal` without actual focus isolation would misrepresent the interaction, while trapping focus would change that interaction unnecessarily.

## Consequences

The frame owns navigation positioning and must retain explicit grid coordinates when the sidebar becomes absolutely positioned. Sidebar-local drafts retain their owner instance through drawer transitions. CSS uses the existing overlay and shadow tokens. At very narrow widths the drawer is capped by the rail-containing grid area and frame; no extra wide layout preference is persisted.

Layout tests cover the unchanged track width, one surviving sidebar element, owner width, focus, Escape, scrim closure, and desktop preference restoration. A read-only Playwright probe against the existing GUI verifies opening and closing at 900px, with one input instead of the duplicated pair. These checks do not establish that Cowork, Design, artifacts, cloud execution, or scheduling are complete.
