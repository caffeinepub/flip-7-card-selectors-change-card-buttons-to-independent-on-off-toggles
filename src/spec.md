# Specification

## Summary
**Goal:** Change the Flip 7 per-player card selectors from repeatable “add” buttons into independent on/off toggles that drive the per-player tally and validation.

**Planned changes:**
- Update the Flip 7 score entry card grid (1–12, +4, +10) so each card control toggles ON/OFF per player (no repeated accumulation).
- Ensure all card toggles are independent (turning one ON/OFF does not change any other card’s state for the same player).
- Add clear, accessible visual styling to distinguish ON vs OFF states (including non-color-only indication and appropriate focus/hover states).
- Update per-player Button Tally, Clear, and Add Round/reset behavior to reflect toggle state: tally equals the sum of all ON toggles; Clear resets all toggles OFF and sets tally to 0; after Add Round, toggles reset OFF (along with existing manual score and x2 reset behavior).

**User-visible outcome:** Each player can tap card values to toggle them ON/OFF, instantly seeing the tally update based on selected cards; Clear and Add Round behave as before but now reset the toggle selections appropriately.
