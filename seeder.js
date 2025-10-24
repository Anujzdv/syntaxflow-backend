// seeder.js
const mongoose = require('mongoose');
const dotenv = require('dotenv');
const Quiz = require('./models/Quiz');

dotenv.config();

const sampleQuizzes = [
  // --- JavaScript ---
  {
    language: 'JavaScript',
    question: 'What does "typeof null" return?',
    options: ['"object"', '"null"', '"undefined"', '"string"'],
    correctAnswer: 0,
    difficulty: 'Easy'
  },
  {
    language: 'JavaScript',
    question: 'What is the correct way to write a JavaScript array?',
    options: ['var colors = (1:"red", 2:"green")', 'var colors = ["red", "green"]', 'var colors = "red", "green"', 'var colors = 1 = ("red")'],
    correctAnswer: 1,
    difficulty: 'Easy'
  },
  // --- Python ---
  {
    language: 'Python',
    question: 'What is the correct file extension for Python files?',
    options: ['.pyth', '.pt', '.py', '.pyt'],
    correctAnswer: 2,
    difficulty: 'Easy'
  },
  {
    language: 'Python',
    question: 'How do you create a variable with the numeric value 5?',
    options: ['x = 5', 'x = int(5)', 'Both are correct', 'Neither is correct'],
    correctAnswer: 2,
    difficulty: 'Easy'
  },
  // --- Java ---
  {
    language: 'Java',
    question: 'Which data type is used to create a variable that should store text?',
    options: ['string', 'Txt', 'String', 'myString'],
    correctAnswer: 2,
    difficulty: 'Easy'
  },
  {
    language: 'Java',
    question: 'How do you create a method in Java?',
    options: ['methodName()', '(methodName)', 'methodName[]', 'methodName.'],
    correctAnswer: 0,
    difficulty: 'Easy'
  },
  // --- C++ ---
  {
    language: 'C++',
    question: 'Which header file is needed to use "cout" and "cin"?',
    options: ['<iostream>', '<stdio.h>', '<streams>', '<inputoutput>'],
    correctAnswer: 0,
    difficulty: 'Easy'
  },
  {
    language: 'C++',
    question: 'What is the correct way to declare a pointer in C++?',
    options: ['int *ptr;', 'int ptr;', 'ptr int;', 'pointer int ptr;'],
    correctAnswer: 0,
    difficulty: 'Medium'
  },
  // --- C ---
  {
    language: 'C',
    question: 'What is the "brain" of the computer?',
    options: ['RAM', 'Motherboard', 'CPU', 'Hard Drive'],
    correctAnswer: 2,
    difficulty: 'Easy'
  },
  {
    language: 'C',
    question: 'Which function is used to print output to the console?',
    options: ['print()', 'printf()', 'cout <<', 'console.log()'],
    correctAnswer: 1,
    difficulty: 'Easy'
  }
];

const connectDB = async () => {
  try {
    await mongoose.connect(process.env.MONGO_URI, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });
    console.log('MongoDB Connected for seeder...');
  } catch (err) {
    console.error(err.message);
    process.exit(1);
  }
};

const importData = async () => {
  try {
    await Quiz.deleteMany(); // Clear existing questions
    await Quiz.insertMany(sampleQuizzes);
    console.log('Data Imported Successfully!');
    process.exit();
  } catch (err) {
    console.error(`Error: ${err.message}`);
    process.exit(1);
  }
};

const destroyData = async () => {
  try {
    await Quiz.deleteMany();
    console.log('Data Destroyed Successfully!');
    process.exit();
  } catch (err) {
    console.error(`Error: ${err.message}`);
    process.exit(1);
  }
};

// --- How to Run This Script ---
// In your terminal:
// To add data: node seeder.js -i
// To delete data: node seeder.js -d

const main = async () => {
  await connectDB();
  if (process.argv[2] === '-d') {
    await destroyData();
  } else {
    await importData();
  }
};

main();