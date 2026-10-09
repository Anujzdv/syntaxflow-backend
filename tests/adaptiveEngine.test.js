const { adjustDifficulty, normalizeDifficulty, VALID_DIFFICULTIES } = require('../utils/adaptiveEngine');

describe('Adaptive Difficulty Engine', () => {
  describe('normalizeDifficulty', () => {
    test('normalizes standard values and handles case sensitivity', () => {
      expect(normalizeDifficulty('EASY')).toBe('easy');
      expect(normalizeDifficulty('Medium')).toBe('medium');
      expect(normalizeDifficulty('HARD')).toBe('hard');
    });

    test('defaults invalid or empty inputs to medium', () => {
      expect(normalizeDifficulty(null)).toBe('medium');
      expect(normalizeDifficulty(undefined)).toBe('medium');
      expect(normalizeDifficulty('extreme')).toBe('medium');
      expect(normalizeDifficulty('')).toBe('medium');
    });

    test('validates standard difficulty list', () => {
      expect(VALID_DIFFICULTIES).toEqual(['easy', 'medium', 'hard']);
    });
  });

  describe('adjustDifficulty Transitions', () => {
    test('maintains difficulty on empty or single outcome', () => {
      expect(adjustDifficulty({ currentDifficulty: 'medium', recentOutcomes: [] })).toEqual({
        nextDifficulty: 'medium',
        change: 'maintain',
        reason: 'No recent outcomes to evaluate.',
        streakReset: false
      });

      expect(adjustDifficulty({ currentDifficulty: 'medium', recentOutcomes: [{ isCorrect: true }] })).toEqual({
        nextDifficulty: 'medium',
        change: 'maintain',
        reason: 'Performance within expected threshold; maintaining difficulty.',
        streakReset: false
      });
    });

    test('increases difficulty on 2 consecutive correct answers from easy to medium', () => {
      const result = adjustDifficulty({
        currentDifficulty: 'easy',
        recentOutcomes: [{ isCorrect: true }, { isCorrect: true }]
      });
      expect(result.nextDifficulty).toBe('medium');
      expect(result.change).toBe('increase');
      expect(result.streakReset).toBe(true);
    });

    test('increases difficulty on 2 consecutive correct answers from medium to hard', () => {
      const result = adjustDifficulty({
        currentDifficulty: 'medium',
        recentOutcomes: [{ isCorrect: true }, { isCorrect: true }]
      });
      expect(result.nextDifficulty).toBe('hard');
      expect(result.change).toBe('increase');
      expect(result.streakReset).toBe(true);
    });

    test('clamps difficulty at hard when already hard and user answers 2 consecutive correct', () => {
      const result = adjustDifficulty({
        currentDifficulty: 'hard',
        recentOutcomes: [{ isCorrect: true }, { isCorrect: true }]
      });
      expect(result.nextDifficulty).toBe('hard');
      expect(result.change).toBe('maintain');
      expect(result.streakReset).toBe(true);
      expect(result.reason).toContain('Maximum difficulty reached');
    });

    test('decreases difficulty on 2 consecutive incorrect answers from hard to medium', () => {
      const result = adjustDifficulty({
        currentDifficulty: 'hard',
        recentOutcomes: [{ isCorrect: false }, { isCorrect: false }]
      });
      expect(result.nextDifficulty).toBe('medium');
      expect(result.change).toBe('decrease');
      expect(result.streakReset).toBe(true);
    });

    test('decreases difficulty on 2 consecutive incorrect answers from medium to easy', () => {
      const result = adjustDifficulty({
        currentDifficulty: 'medium',
        recentOutcomes: [{ isCorrect: false }, { isCorrect: false }]
      });
      expect(result.nextDifficulty).toBe('easy');
      expect(result.change).toBe('decrease');
      expect(result.streakReset).toBe(true);
    });

    test('clamps difficulty at easy when already easy and user answers 2 consecutive incorrect', () => {
      const result = adjustDifficulty({
        currentDifficulty: 'easy',
        recentOutcomes: [{ isCorrect: false }, { isCorrect: false }]
      });
      expect(result.nextDifficulty).toBe('easy');
      expect(result.change).toBe('maintain');
      expect(result.streakReset).toBe(true);
      expect(result.reason).toContain('Minimum difficulty reached');
    });

    test('maintains difficulty on mixed consecutive answers', () => {
      const result1 = adjustDifficulty({
        currentDifficulty: 'medium',
        recentOutcomes: [{ isCorrect: true }, { isCorrect: false }]
      });
      expect(result1.nextDifficulty).toBe('medium');
      expect(result1.change).toBe('maintain');
      expect(result1.streakReset).toBe(false);

      const result2 = adjustDifficulty({
        currentDifficulty: 'medium',
        recentOutcomes: [{ isCorrect: false }, { isCorrect: true }]
      });
      expect(result2.nextDifficulty).toBe('medium');
      expect(result2.change).toBe('maintain');
      expect(result2.streakReset).toBe(false);
    });

    test('evaluates strictly the last two outcomes in a longer sequence', () => {
      const outcomes = [
        { isCorrect: false },
        { isCorrect: false },
        { isCorrect: true },
        { isCorrect: true }
      ];
      const result = adjustDifficulty({
        currentDifficulty: 'easy',
        recentOutcomes: outcomes
      });
      expect(result.nextDifficulty).toBe('medium');
      expect(result.change).toBe('increase');
    });
  });
});
