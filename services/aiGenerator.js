/**
 * AI Question Generator Service
 * Generates single practice-only MCQs using Google Gemini with strict schema validation.
 * Falls back safely to null if AI is unavailable, disabled, or invalid.
 */

const ALLOWED_LANGUAGES = ['JavaScript', 'Python', 'Java', 'C++', 'C'];
const ALLOWED_DIFFICULTIES = ['easy', 'medium', 'hard'];

/**
 * Validates generated question against Blueprint requirements:
 * - Exactly 4 non-empty, distinct options
 * - correctOptionId matches exactly one option
 * - question and explanation have sensible lengths
 * - language and difficulty match the request
 */
function validateQuestionSchema(data, expectedLanguage, expectedDifficulty) {
  if (!data || typeof data !== 'object') return false;

  const { questionText, options, correctOptionId, explanation } = data;

  if (typeof questionText !== 'string' || questionText.trim().length < 10 || questionText.trim().length > 600) {
    return false;
  }

  if (typeof explanation !== 'string' || explanation.trim().length < 10 || explanation.trim().length > 600) {
    return false;
  }

  if (!Array.isArray(options) || options.length !== 4) {
    return false;
  }

  const validIds = new Set(['A', 'B', 'C', 'D']);
  const optionTexts = new Set();

  for (const opt of options) {
    if (!opt || typeof opt !== 'object') return false;
    if (!validIds.has(opt.id)) return false;
    if (typeof opt.text !== 'string' || opt.text.trim().length === 0) return false;
    optionTexts.add(opt.text.trim().toLowerCase());
  }

  // Ensure all 4 options are distinct
  if (optionTexts.size !== 4) return false;

  // Ensure correctOptionId is one of A, B, C, D
  if (!validIds.has(correctOptionId)) return false;

  return true;
}

/**
 * Requests a single practice question from Google Gemini.
 * @param {Object} params
 * @param {string} params.language
 * @param {string} params.topic
 * @param {'easy'|'medium'|'hard'} params.difficulty
 * @returns {Promise<Object|null>} Safe validated question or null
 */
async function generateAiQuestion({ language, topic = 'general', difficulty = 'medium' }) {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey || apiKey.trim() === '' || apiKey === 'your_gemini_api_key_here') {
    return null;
  }

  // Normalize language
  const matchedLang = ALLOWED_LANGUAGES.find(
    l => l.toLowerCase() === String(language).toLowerCase()
  ) || 'JavaScript';

  const normalizedDiff = ALLOWED_DIFFICULTIES.includes(String(difficulty).toLowerCase())
    ? String(difficulty).toLowerCase()
    : 'medium';

  const prompt = `You are a computer science tutor. Generate exactly one single multiple-choice question for:
Language: ${matchedLang}
Topic: ${topic}
Difficulty: ${normalizedDiff}

Rules:
1. Provide exactly four distinct options with IDs "A", "B", "C", "D".
2. Exactly one option must be unambiguously correct.
3. The other three must be plausible but unambiguously incorrect distractors.
4. Include an explanation explaining why the correct option is right.
5. If code is needed, keep it concise (under 15 lines).
6. Return ONLY valid JSON adhering strictly to this format, with no markdown code fences:
{
  "questionText": "Question text here",
  "codeSnippet": "code snippet or null",
  "options": [
    { "id": "A", "text": "Option A" },
    { "id": "B", "text": "Option B" },
    { "id": "C", "text": "Option C" },
    { "id": "D", "text": "Option D" }
  ],
  "correctOptionId": "A",
  "explanation": "Clear explanation of the correct answer"
}`;

  const endpoint = `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${encodeURIComponent(apiKey)}`;

  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 8000); // 8 second timeout

  try {
    const response = await fetch(endpoint, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        contents: [
          {
            parts: [{ text: prompt }]
          }
        ],
        generationConfig: {
          temperature: 0.4,
          maxOutputTokens: 600,
          responseMimeType: 'application/json'
        }
      }),
      signal: controller.signal
    });

    clearTimeout(timeoutId);

    if (!response.ok) {
      console.warn(`[AI Generator] Gemini API returned status ${response.status}`);
      return null;
    }

    const result = await response.json();
    const rawText = result?.candidates?.[0]?.content?.parts?.[0]?.text;

    if (!rawText) {
      return null;
    }

    // Clean potential markdown fences if present
    const cleaned = rawText.replace(/^```json\s*/i, '').replace(/^```\s*/i, '').replace(/```$/i, '').trim();
    const parsed = JSON.parse(cleaned);

    if (!validateQuestionSchema(parsed, matchedLang, normalizedDiff)) {
      console.warn('[AI Generator] Generated question failed schema validation.');
      return null;
    }

    return {
      id: `ai-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
      language: matchedLang,
      topic,
      difficulty: normalizedDiff,
      questionText: parsed.questionText.trim(),
      codeSnippet: parsed.codeSnippet && parsed.codeSnippet !== 'null' ? parsed.codeSnippet : null,
      options: parsed.options.map(o => ({ id: o.id.trim(), text: o.text.trim() })),
      correctOptionId: parsed.correctOptionId.trim(),
      explanation: parsed.explanation.trim(),
      source: 'ai_generated'
    };
  } catch (err) {
    clearTimeout(timeoutId);
    if (err.name === 'AbortError') {
      console.warn('[AI Generator] Request timed out after 8s.');
    } else {
      console.warn('[AI Generator] Error generating question:', err.message);
    }
    return null;
  }
}

module.exports = {
  validateQuestionSchema,
  generateAiQuestion,
  ALLOWED_LANGUAGES,
  ALLOWED_DIFFICULTIES
};
