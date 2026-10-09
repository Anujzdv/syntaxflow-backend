// check-db.js - Check if quiz data exists in the database
const mongoose = require('mongoose');
const dotenv = require('dotenv');
const Quiz = require('./models/Quiz');

dotenv.config();

const checkData = async () => {
  try {
    await mongoose.connect(process.env.MONGO_URI, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });
    console.log('✓ MongoDB Connected');

    // Count quizzes
    const count = await Quiz.countDocuments();
    console.log(`\n📊 Total Quizzes in Database: ${count}`);

    if (count > 0) {
      // Get quiz titles and languages
      const quizzes = await Quiz.find({}, 'title language difficulty questions');
      console.log('\n📚 Quizzes Found:');
      quizzes.forEach((quiz, idx) => {
        console.log(`  ${idx + 1}. ${quiz.title} (${quiz.language}) - ${quiz.difficulty} - ${quiz.questions.length} questions`);
      });
    } else {
      console.log('\n⚠️  No quizzes found in the database.');
      console.log('Run: node seeder.js');
    }

    await mongoose.connection.close();
    console.log('\n✓ Connection closed');
    process.exit(0);
  } catch (err) {
    console.error('❌ Error:', err.message);
    process.exit(1);
  }
};

checkData();
