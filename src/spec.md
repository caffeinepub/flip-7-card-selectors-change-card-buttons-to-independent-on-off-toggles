# Specification

## Summary
**Goal:** Update the Phase 10 round submission UI so the “Phase complete” checkbox is always visible, defaults to unchecked for new rounds, and is right-aligned on the same row as the score input.

**Planned changes:**
- In Phase10ScoreEntry, render the “Phase complete” checkbox + label for each player row by default (no extra tap/click to reveal).
- Ensure the checkbox is unchecked by default when entering a new round (no initialState), while respecting saved values when editing an existing round (initialState present).
- Adjust the per-player row layout so the score input and “Phase complete” control sit on the same horizontal line, with the checkbox/label right-justified and responsive on narrow/mobile widths.
- Preserve existing checkbox disable/enable rules (e.g., ownership/submitting state) and keep Phase 10 progression behavior unchanged (UI-only).

**User-visible outcome:** On the Phase 10 round submission screen, each player’s score entry shows an always-visible “Phase complete” checkbox aligned to the right of the score input; it starts unchecked for new rounds and correctly reflects saved state when editing.
