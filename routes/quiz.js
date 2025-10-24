// routes/quiz.js

// ... (your GET /api/quiz/:language route is here) ...

// --- Submit Quiz Answers (UPDATED) ---
// @route   POST /api/quiz/submit
// @desc    Submit answers, get score, and save results
// @access  Private
router.post('/submit', auth, async (req, res) => {
  const { language, answers, timeTaken } = req.body;
  // 'answers' should be an array of objects: [{ questionId: '...', answer: 0 }, ...]
  
  try {
    const questionIds = answers.map(a => a.questionId);
    
    // 1. Get the correct answers from the database
    const correctQuestions = await Quiz.find({
      _id: { $in: questionIds }
    }).select('_id correctAnswer');

    // Create a map for easy lookup
    const answerMap = {};
    correctQuestions.forEach(q => {
      answerMap[q._id.toString()] = q.correctAnswer;
    });

    // 2. Calculate the score AND build a results array
    let score = 0;
    let correctAnswersCount = 0;
    const totalQuestions = answers.length;
    
    // --- NEW: This array will store the detailed results ---
    const detailedResults = [];

    answers.forEach(answer => {
      const isCorrect = answerMap[answer.questionId] === answer.answer;
      if (isCorrect) {
        correctAnswersCount++;
        score += 10; // 10 points per correct answer
      }
      // Add details for this question to our results array
      detailedResults.push({
        questionId: answer.questionId,
        yourAnswer: answer.answer,
        correctAnswer: answerMap[answer.questionId],
        isCorrect: isCorrect
      });
    });
    
    const accuracy = (correctAnswersCount / totalQuestions) * 100;

    // 3. Save the result to the database
    const newResult = new QuizResult({
      user: req.user.id,
      language,
      score,
      correctAnswers: correctAnswersCount,
      totalQuestions,
      timeTaken,
      accuracy: parseFloat(accuracy.toFixed(2)),
    });

    await newResult.save();

    // 4. Send the ENTIRE result object back to the user
    res.status(201).json({
      score,
      correctAnswers: correctAnswersCount,
      totalQuestions,
      timeTaken,
      accuracy: newResult.accuracy,
      // --- NEW: Send the detailed results back ---
      detailedResults: detailedResults,
      msg: 'Quiz submitted successfully!'
    });

  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server Error');
  }
});

module.exports = router;
