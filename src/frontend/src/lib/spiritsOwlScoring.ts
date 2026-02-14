/**
 * Calculate the Owl board score from checkbox state
 * 
 * Rules:
 * - Each completed pair (both stones checked) scores 3 points
 * - Maximum without Spirit Stone: 9 points (3 pairs × 3 points)
 * - If Spirit Stone is checked, the total is doubled
 * - Maximum with Spirit Stone: 18 points
 */
export function calculateOwlScore(
  pair1: [boolean, boolean],
  pair2: [boolean, boolean],
  pair3: [boolean, boolean],
  spiritStone: boolean
): number {
  let completedPairs = 0;

  // Count completed pairs (both stones in the pair must be checked)
  if (pair1[0] && pair1[1]) completedPairs++;
  if (pair2[0] && pair2[1]) completedPairs++;
  if (pair3[0] && pair3[1]) completedPairs++;

  // Base score: 3 points per completed pair
  let score = completedPairs * 3;

  // Double if Spirit Stone is checked
  if (spiritStone) {
    score *= 2;
  }

  return score;
}
