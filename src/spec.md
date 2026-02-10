# Specification

## Summary
**Goal:** Add a new selectable “Generic Game” scorecard template that uses Nerts-style numeric round entry (one number per player per round), auto-computed totals, and unlimited rounds with no automatic game end.

**Planned changes:**
- Add a new “Generic Game” card to the home game picker that routes through the existing setup flow (/setup/$gameType) into the existing score sheet flow.
- Backend: extend the Motoko GameType model and session creation/scoring flows to support “Generic Game” sessions, including addRound/updateRound, without applying win-target game-ending logic.
- Frontend: add “Generic Game” to gameTemplates and template/type plumbing (route params, LocalSession.gameType, RoundEntryState) so it behaves like existing round-based games.
- Frontend: implement a Generic Game round-entry component with exactly one numeric input per player per round, validation (block submit with a clear English error if any value is invalid/missing), and submission as Map(playerId -> number).
- Frontend: integrate Generic Game into ScoreSheet and EditRound flows so rounds can be added and edited, round history displays correctly, and checkGameEnd does not end sessions automatically.

**User-visible outcome:** Users can choose “Generic Game,” set up a session, enter one numeric score per player per round for unlimited rounds, see totals update automatically, and edit past rounds without the game ending due to a target score.
