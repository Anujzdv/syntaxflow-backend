// seeder.js - Fixed with proper Quiz schema
const mongoose = require('mongoose');
const dotenv = require('dotenv');
const Quiz = require('./models/Quiz');

dotenv.config();

const sampleQuizzes = [
  // --- JavaScript Quiz ---
  {
    title: 'JavaScript Fundamentals',
    language: 'JavaScript',
    difficulty: 'easy',
    xp_reward: 100,
    timeLimit: 600,
    passingScore: 60,
    isPublished: true,
    questions: [
      {
        question_text: 'How do you declare a variable that can be changed?',
        code_snippet: 'let x = 10;',
        type: 'single',
        explanation: 'The `let` keyword declares a block-scoped variable that can be reassigned.',
        tags: ['variables', 'declaration'],
        options: [
          { text: 'let myVar = 10;', is_correct: true },
          { text: 'const myVar = 10;', is_correct: false },
          { text: 'var myVar = 10;', is_correct: false },
          { text: 'Both B and C', is_correct: false },
        ]
      },
      {
        question_text: 'What symbol is used for "strict equality"?',
        code_snippet: 'if (5 === "5") { }',
        type: 'single',
        explanation: 'The `===` operator checks both value and type.',
        tags: ['operators', 'equality'],
        options: [
          { text: '==', is_correct: false },
          { text: '===', is_correct: true },
          { text: '=', is_correct: false },
          { text: '!=', is_correct: false },
        ]
      },
      {
        question_text: 'How do you write a single-line comment?',
        code_snippet: '// This is a comment',
        type: 'single',
        explanation: 'Single-line comments in JavaScript use the `//` syntax.',
        tags: ['comments', 'syntax'],
        options: [
          { text: '// This is a comment', is_correct: true },
          { text: '<!-- This is a comment -->', is_correct: false },
          { text: '/* This is a comment */', is_correct: false },
          { text: '# This is a comment', is_correct: false },
        ]
      },
      {
        question_text: 'Which is NOT a primitive data type?',
        code_snippet: 'let obj = { name: "John" };',
        type: 'single',
        explanation: 'Primitive types: String, Number, Boolean, Symbol, BigInt, null, undefined. Object is not primitive.',
        tags: ['data-types', 'primitives'],
        options: [
          { text: 'String', is_correct: false },
          { text: 'Number', is_correct: false },
          { text: 'Boolean', is_correct: false },
          { text: 'Object', is_correct: true },
        ]
      },
      {
        question_text: 'How do you call a function?',
        code_snippet: 'function myFunction() { return 5; }',
        type: 'single',
        explanation: 'Functions are called by writing the function name followed by parentheses.',
        tags: ['functions', 'calling'],
        options: [
          { text: 'call myFunction();', is_correct: false },
          { text: 'myFunction;', is_correct: false },
          { text: 'myFunction()', is_correct: true },
          { text: 'run myFunction;', is_correct: false },
        ]
      },
    ]
  },

  // --- Python Quiz ---
  {
    title: 'Python Fundamentals',
    language: 'Python',
    difficulty: 'easy',
    xp_reward: 100,
    timeLimit: 600,
    passingScore: 60,
    isPublished: true,
    questions: [
      {
        question_text: 'How do you write a single-line comment?',
        code_snippet: '# This is a comment',
        type: 'single',
        explanation: 'In Python, single-line comments use the `#` symbol.',
        tags: ['comments', 'syntax'],
        options: [
          { text: '// This is a comment', is_correct: false },
          { text: '# This is a comment', is_correct: true },
          { text: '/* This is a comment */', is_correct: false },
          { text: '-- This is a comment', is_correct: false },
        ]
      },
      {
        question_text: 'How do you create a variable?',
        code_snippet: 'x = 5',
        type: 'single',
        explanation: 'In Python, you simply assign a value to create a variable. No type declaration needed.',
        tags: ['variables', 'declaration'],
        options: [
          { text: 'x = 5', is_correct: true },
          { text: 'int x = 5;', is_correct: false },
          { text: 'let x = 5;', is_correct: false },
          { text: 'var x = 5;', is_correct: false },
        ]
      },
      {
        question_text: 'What is the correct way to print text?',
        code_snippet: 'print("Hello, World!")',
        type: 'single',
        explanation: 'The `print()` function outputs text to the console in Python.',
        tags: ['output', 'functions'],
        options: [
          { text: 'echo "Hello, World!"', is_correct: false },
          { text: 'print("Hello, World!")', is_correct: true },
          { text: 'System.out.println("Hello, World!")', is_correct: false },
          { text: 'console.log("Hello, World!")', is_correct: false },
        ]
      },
      {
        question_text: 'How is code blocks defined in Python?',
        code_snippet: 'if x > 5:\n    print("Yes")',
        type: 'single',
        explanation: 'Python uses indentation to define code blocks, not curly braces.',
        tags: ['syntax', 'indentation'],
        options: [
          { text: 'Curly braces {}', is_correct: false },
          { text: 'Parentheses ()', is_correct: false },
          { text: 'Indentation', is_correct: true },
          { text: 'END keyword', is_correct: false },
        ]
      },
      {
        question_text: 'How do you define a function?',
        code_snippet: 'def greet(name):\n    print(f"Hello {name}")',
        type: 'single',
        explanation: 'In Python, functions are defined with the `def` keyword.',
        tags: ['functions', 'definition'],
        options: [
          { text: 'function greet():', is_correct: false },
          { text: 'def greet():', is_correct: true },
          { text: 'define greet():', is_correct: false },
          { text: 'fun greet():', is_correct: false },
        ]
      },
    ]
  },

  // --- Java Quiz ---
  {
    title: 'Java Fundamentals',
    language: 'Java',
    difficulty: 'easy',
    xp_reward: 100,
    timeLimit: 600,
    passingScore: 60,
    isPublished: true,
    questions: [
      {
        question_text: 'What is the correct file extension?',
        code_snippet: 'public class HelloWorld { }',
        type: 'single',
        explanation: 'Java source files must have the `.java` file extension.',
        tags: ['syntax', 'files'],
        options: [
          { text: '.java', is_correct: true },
          { text: '.class', is_correct: false },
          { text: '.jav', is_correct: false },
          { text: '.j', is_correct: false },
        ]
      },
      {
        question_text: 'How do you print text in Java?',
        code_snippet: 'System.out.println("Hello");',
        type: 'single',
        explanation: 'The `System.out.println()` method outputs text followed by a newline.',
        tags: ['output', 'methods'],
        options: [
          { text: 'printf("Hello");', is_correct: false },
          { text: 'System.out.println("Hello");', is_correct: true },
          { text: 'print("Hello");', is_correct: false },
          { text: 'echo("Hello");', is_correct: false },
        ]
      },
      {
        question_text: 'How do you declare a variable?',
        code_snippet: 'int age = 25;',
        type: 'single',
        explanation: 'In Java, you must specify the data type when declaring a variable.',
        tags: ['variables', 'types'],
        options: [
          { text: 'age = 25;', is_correct: false },
          { text: 'int age = 25;', is_correct: true },
          { text: 'let age = 25;', is_correct: false },
          { text: 'var age = 25;', is_correct: false },
        ]
      },
      {
        question_text: 'What keyword creates a constant?',
        code_snippet: 'final double PI = 3.14;',
        type: 'single',
        explanation: 'The `final` keyword in Java creates a constant that cannot be changed.',
        tags: ['constants', 'keywords'],
        options: [
          { text: 'const', is_correct: false },
          { text: 'static', is_correct: false },
          { text: 'final', is_correct: true },
          { text: 'fixed', is_correct: false },
        ]
      },
      {
        question_text: 'How do you get the length of an array?',
        code_snippet: 'int[] arr = {1, 2, 3}; int len = arr.length;',
        type: 'single',
        explanation: 'In Java, the `length` property returns the size of an array.',
        tags: ['arrays', 'properties'],
        options: [
          { text: 'arr.length()', is_correct: false },
          { text: 'arr.length', is_correct: true },
          { text: 'arr.size()', is_correct: false },
          { text: 'len(arr)', is_correct: false },
        ]
      },
    ]
  },

  // --- C++ Quiz ---
  {
    title: 'C++ Fundamentals',
    language: 'C++',
    difficulty: 'easy',
    xp_reward: 100,
    timeLimit: 600,
    passingScore: 60,
    isPublished: true,
    questions: [
      {
        question_text: 'Which header is needed for input/output?',
        code_snippet: '#include <iostream>',
        type: 'single',
        explanation: 'The `<iostream>` header provides `cout` and `cin` for console I/O.',
        tags: ['headers', 'io'],
        options: [
          { text: '<stdio.h>', is_correct: false },
          { text: '<iostream>', is_correct: true },
          { text: '<string>', is_correct: false },
          { text: '<math.h>', is_correct: false },
        ]
      },
      {
        question_text: 'How do you print to console?',
        code_snippet: 'cout << "Hello World";',
        type: 'single',
        explanation: 'In C++, `cout` with the `<<` operator outputs text to the console.',
        tags: ['output', 'operators'],
        options: [
          { text: 'printf("Hello World");', is_correct: false },
          { text: 'cout << "Hello World";', is_correct: true },
          { text: 'System.out.println("Hello World");', is_correct: false },
          { text: 'print("Hello World");', is_correct: false },
        ]
      },
      {
        question_text: 'What line avoids writing std::',
        code_snippet: 'using namespace std;',
        type: 'single',
        explanation: 'The `using namespace std;` directive allows you to use `cout` instead of `std::cout`.',
        tags: ['namespace', 'syntax'],
        options: [
          { text: 'using namespace std;', is_correct: true },
          { text: 'import std;', is_correct: false },
          { text: 'namespace std;', is_correct: false },
          { text: 'include namespace std;', is_correct: false },
        ]
      },
      {
        question_text: 'How do you declare an integer?',
        code_snippet: 'int x = 5;',
        type: 'single',
        explanation: 'The `int` keyword declares an integer variable in C++.',
        tags: ['variables', 'types'],
        options: [
          { text: 'x = 5;', is_correct: false },
          { text: 'int x = 5;', is_correct: true },
          { text: 'integer x = 5;', is_correct: false },
          { text: 'num x = 5;', is_correct: false },
        ]
      },
      {
        question_text: 'What symbol ends every statement?',
        code_snippet: 'cout << "Hello";',
        type: 'single',
        explanation: 'Every statement in C++ must end with a semicolon (;).',
        tags: ['syntax', 'punctuation'],
        options: [
          { text: 'Semicolon (;)', is_correct: true },
          { text: 'Period (.)', is_correct: false },
          { text: 'Colon (:)', is_correct: false },
          { text: 'Nothing', is_correct: false },
        ]
      },
    ]
  },

  // --- C Quiz ---
  {
    title: 'C Fundamentals',
    language: 'C',
    difficulty: 'easy',
    xp_reward: 100,
    timeLimit: 600,
    passingScore: 60,
    isPublished: true,
    questions: [
      {
        question_text: 'Which header is needed for printf?',
        code_snippet: '#include <stdio.h>',
        type: 'single',
        explanation: 'The `<stdio.h>` header provides `printf` and `scanf` functions.',
        tags: ['headers', 'io'],
        options: [
          { text: '<iostream>', is_correct: false },
          { text: '<stdlib.h>', is_correct: false },
          { text: '<stdio.h>', is_correct: true },
          { text: '<string.h>', is_correct: false },
        ]
      },
      {
        question_text: 'How do you print text?',
        code_snippet: 'printf("Hello World\\n");',
        type: 'single',
        explanation: 'The `printf()` function prints formatted text to the console.',
        tags: ['output', 'functions'],
        options: [
          { text: 'printf("Hello World\\n");', is_correct: true },
          { text: 'cout << "Hello World";', is_correct: false },
          { text: 'print("Hello World");', is_correct: false },
          { text: 'echo("Hello World");', is_correct: false },
        ]
      },
      {
        question_text: 'How do you declare an integer?',
        code_snippet: 'int x = 5;',
        type: 'single',
        explanation: 'The `int` keyword is used to declare an integer variable in C.',
        tags: ['variables', 'types'],
        options: [
          { text: 'x = 5;', is_correct: false },
          { text: 'int x = 5;', is_correct: true },
          { text: 'integer x = 5;', is_correct: false },
          { text: 'var x = 5;', is_correct: false },
        ]
      },
      {
        question_text: 'What symbol ends statements?',
        code_snippet: 'int x = 10;',
        type: 'single',
        explanation: 'All C statements must terminate with a semicolon (;).',
        tags: ['syntax', 'punctuation'],
        options: [
          { text: 'Semicolon (;)', is_correct: true },
          { text: 'Period (.)', is_correct: false },
          { text: 'Colon (:)', is_correct: false },
          { text: 'Nothing', is_correct: false },
        ]
      },
      {
        question_text: 'How do you write a comment?',
        code_snippet: '// This is a comment',
        type: 'single',
        explanation: 'Single-line comments in C use `//` or multi-line comments use `/* ... */`.',
        tags: ['comments', 'syntax'],
        options: [
          { text: '# This is a comment', is_correct: false },
          { text: '// This is a comment', is_correct: true },
          { text: '-- This is a comment', is_correct: false },
          { text: 'REM This is a comment', is_correct: false },
        ]
      },
    ]
  },
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
    await Quiz.deleteMany(); // Clear old data
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

connectDB();

// Handle command line arguments
if (process.argv[2] === '-d') {
  destroyData();
} else {
  importData();
}
