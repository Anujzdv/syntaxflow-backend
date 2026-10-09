/**
 * Deterministic Adaptive Difficulty Engine
 * Pure function with zero external dependencies (no DB, no network, no LLM).
 */

const VALID_DIFFICULTIES = ['easy', 'medium', 'hard'];

const DIFFICULTY_RANKS = {
  easy: 1,
  medium: 2,
  hard: 3
};

const RANK_TO_DIFFICULTY = {
  1: 'easy',
  2: 'medium',
  3: 'hard'
};

/**
 * Normalizes difficulty string to lowercase valid value.
 * @param {string} diff 
 * @returns {'easy' | 'medium' | 'hard'}
 */
function normalizeDifficulty(diff) {
  if (!diff) return 'medium';
  const lower = String(diff).trim().toLowerCase();
  if (VALID_DIFFICULTIES.includes(lower)) return lower;
  return 'medium';
}

/**
 * Adjusts difficulty based on current difficulty and recent outcomes.
 *
 * Deterministic Rules:
 * - 2 consecutive correct answers: increase difficulty (easy -> medium -> hard).
 *   If already 'hard', maintain at 'hard'.
 * - 2 consecutive incorrect answers: decrease difficulty (hard -> medium -> easy).
 *   If already 'easy', maintain at 'easy'.
 * - Otherwise: maintain current difficulty.
 * - Streak is reset upon difficulty transition.
 *
 * @param {Object} params
 * @param {'easy'|'medium'|'hard'} params.currentDifficulty
 * @param {Array<{ isCorrect: boolean }>} [params.recentOutcomes=[]]
 * @returns {{
 *   nextDifficulty: 'easy'|'medium'|'hard',
 *   change: 'increase'|'decrease'|'maintain',
 *   reason: string,
 *   streakReset: boolean
 * }}
 */
function adjustDifficulty({ currentDifficulty, recentOutcomes = [] }) {
  const current = normalizeDifficulty(currentDifficulty);
  const currentRank = DIFFICULTY_RANKS[current];

  if (!Array.isArray(recentOutcomes) || recentOutcomes.length === 0) {
    return {
      nextDifficulty: current,
      change: 'maintain',
      reason: 'No recent outcomes to evaluate.',
      streakReset: false
    };
  }

  // Look at the last two outcomes
  const n = recentOutcomes.length;
  const last1 = recentOutcomes[n - 1];
  const last2 = n >= 2 ? recentOutcomes[n - 2] : null;

  // Check 2 consecutive correct
  if (last1 && last2 && last1.isCorrect === true && last2.isCorrect === true) {
    if (currentRank < 3) {
      const next = RANK_TO_DIFFICULTY[currentRank + 1];
      return {
        nextDifficulty: next,
        change: 'increase',
        reason: 'Mastery demonstrated with 2 consecutive correct answers.',
        streakReset: true
      };
    }
    return {
      nextDifficulty: 'hard',
      change: 'maintain',
      reason: 'Maximum difficulty reached. Maintained at hard.',
      streakReset: true
    };
  }

  // Check 2 consecutive incorrect
  if (last1 && last2 && last1.isCorrect === false && last2.isCorrect === false) {
    if (currentRank > 1) {
      const next = RANK_TO_DIFFICULTY[currentRank - 1];
      return {
        nextDifficulty: next,
        change: 'decrease',
        reason: 'Struggling with content; reduced difficulty for reinforcement.',
        streakReset: true
      };
    }
    return {
      nextDifficulty: 'easy',
      change: 'maintain',
      reason: 'Minimum difficulty reached. Maintained at easy.',
      streakReset: true
    };
  }

  // Mixed or single outcome
  return {
    nextDifficulty: current,
    change: 'maintain',
    reason: 'Performance within expected threshold; maintaining difficulty.',
    streakReset: false
  };
}

module.exports = {
  VALID_DIFFICULTIES,
  normalizeDifficulty,
  adjustDifficulty
};
