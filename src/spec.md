# Specification

## Summary
**Goal:** Store Spirits of the Wild character boards (name + icon) on the backend and let players select which character board(s) are active, showing only those during scoring.

**Planned changes:**
- Add a backend-stored animal/character catalog with stable IDs, name, and icon, seeded with at least Owl.
- Expose a backend query API to fetch the full animal/character list (id, name, icon) via generated types.
- Persist selected active character board ID(s) in saved game sessions and return them when loading sessions (with sensible handling for older sessions missing this data).
- Update the Spirits of the Wild setup screen to add a “Character Board Selection” section (below player selection) that lists backend-fetched animals with icon, name, and a checkbox.
- Update scoring so only selected character board score entry UI is shown (e.g., Owl uses existing SpiritsOwlScoreEntry), and prompt/apply a default when none are selected.

**User-visible outcome:** On the setup screen, players can choose which character board(s) to use from a backend-provided list, and during scoring only the selected board(s) appear; saved sessions remember the selection.
