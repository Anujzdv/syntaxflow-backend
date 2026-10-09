/**
 * Adaptive Question Service
 * Orchestrates question retrieval: curated first, AI generation on demand, graceful fallback.
 * Strictly guarantees that serialized questions sent to clients never leak correctOptionId or explanation.
 */

const curatedQuestions = require('../data/curatedQuestions');
const { generateAiQuestion } = require('./aiGenerator');
const { normalizeDifficulty } = require('../utils/adaptiveEngine');

/**
 * Returns a question matching the language and difficulty, avoiding usedQuestionIds.
 * Tries curated pool -> AI generator -> closest difficulty curated pool.
 *
 * @param {Object} params
 * @param {string} params.language
 * @param {string} params.topic
 * @param {'easy'|'medium'|'hard'} params.difficulty
 * @param {string[]} [params.usedQuestionIds=[]]
 * @returns {Promise<Object|null>} Full internal question object (with correctOptionId & explanation)
 */
async function selectNextQuestion({ language, topic = 'general', difficulty = 'medium', usedQuestionIds = [] }) {
  const normDifficulty = normalizeDifficulty(difficulty);
  const usedSet = new Set(usedQuestionIds);

  // 1. Try curated questions matching language and exact difficulty
  const matchingCurated = curatedQuestions.filter(q => 
    q.language.toLowerCase() === language.toLowerCase() &&
    q.difficulty === normDifficulty &&
    !usedSet.has(q.id)
  );

  if (matchingCurated.length > 0) {
    const randomIndex = Math.floor(Math.random() * matchingCurated.length);
    return matchingCurated[randomIndex];
  }

  // 2. Curated at exact difficulty depleted -> Attempt AI generation
  try {
    const aiQuestion = await generateAiQuestion({
      language,
      topic,
      difficulty: normDifficulty
    });

    if (aiQuestion && !usedSet.has(aiQuestion.id)) {
      return aiQuestion;
    }
  } catch (err) {
    console.warn('[Adaptive Service] AI question generation fallback triggered:', err.message);
  }

  // 3. Fallback: Any remaining unused question in this language across any difficulty
  const remainingInLanguage = curatedQuestions.filter(q =>
    q.language.toLowerCase() === language.toLowerCase() &&
    !usedSet.has(q.id)
  );

  if (remainingInLanguage.length > 0) {
    // Sort by proximity to target difficulty
    const diffWeights = { easy: 1, medium: 2, hard: 3 };
    const targetWeight = diffWeights[normDifficulty];

    remainingInLanguage.sort((a, b) => 
      Math.abs(diffWeights[a.difficulty] - targetWeight) - Math.abs(diffWeights[b.difficulty] - targetWeight)
    );

    return remainingInLanguage[0];
  }

  // 4. Exhausted all questions for this language
  return null;
}

/**
 * Strips answers and explanations from a question object before sending to the client.
 * @param {Object} question
 * @returns {Object} Safe question DTO
 */
function serializeQuestionForClient(question) {
  if (!question) return null;

  return {
    id: question.id,
    questionText: question.questionText,
    codeSnippet: question.codeSnippet || null,
    options: question.options.map(opt => ({
      id: opt.id,
      text: opt.text
    })),
    topic: question.topic,
    difficulty: question.difficulty,
    language: question.language,
    source: question.source || 'curated'
  };
}

module.exports = {
  selectNextQuestion,
  serializeQuestionForClient
};
