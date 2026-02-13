# Specification

## Summary
**Goal:** Fix Phase 10 “phase complete” checkbox behavior so it can be toggled freely, displays correctly, and only affects phase progression when checked at submission time.

**Planned changes:**
- Ensure each player’s “phase complete” checkbox defaults to unchecked when starting a new Phase 10 round entry from ScoreSheetScreen.
- Fix checkbox interaction so users can check and uncheck freely before pressing “Submit Score” (no lock-in).
- Ensure checkbox visuals match standard behavior (check indicator only visible when checked).
- Update submission logic so phase completion/progression is recorded only for players whose checkbox is checked at the moment of submission (for both saved sessions via backend and quick/local sessions).

**User-visible outcome:** On the Phase 10 score submission screen, users can toggle “phase complete” on/off per player before submitting, the checkmark displays correctly, and only checked players advance/log phase completion when scores are submitted.
