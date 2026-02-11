# Specification

## Summary
**Goal:** Support shared first place when multiple players tie on the winning score at game end.

**Planned changes:**
- Update the game-end result type and scoring utilities (`frontend/src/lib/scoring.ts`) to return multiple winners when the top score is tied.
- Update the game-over messaging in `frontend/src/screens/ScoreSheetScreen.tsx` to display a “tied for first place” message listing all tied winners and the winning score, while keeping the single-winner message unchanged.

**User-visible outcome:** When a game ends with a tie for the highest score, the score sheet shows all tied players as shared first place (with the winning score); otherwise it continues to show the single winner as before.
