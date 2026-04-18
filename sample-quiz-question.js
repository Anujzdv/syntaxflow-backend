// sample-quiz-question.js - Example of properly formatted quiz question

const sampleQuestion = {
  // ==========================================
  // SINGLE ANSWER QUESTION (Multiple Choice)
  // ==========================================
  title: 'JavaScript Basics Quiz',
  language: 'JavaScript',
  difficulty: 'easy',
  xp_reward: 100,
  timeLimit: 300,
  passingScore: 60,
  isPublished: true,
  questions: [
    {
      question_text: 'What is the correct way to declare a variable in JavaScript?',
      code_snippet: `// Example:
let myVar = 10;
const myConst = 20;
var oldVar = 30;`,
      type: 'single', // Single answer question
      explanation: 'The `let` keyword creates a block-scoped variable that can be reassigned. `var` is function-scoped (legacy), and `const` creates an immutable reference.',
      tags: ['variables', 'declaration', 'es6'],
      options: [
        {
          text: 'let myVar = 10;',
          is_correct: true
        },
        {
          text: 'const myVar = 10;',
          is_correct: false
        },
        {
          text: 'var myVar = 10;',
          is_correct: false
        },
        {
          text: 'declare myVar = 10;',
          is_correct: false
        }
      ]
    }
  ]
};

// ==========================================
// TRUE/FALSE QUESTION
// ==========================================
const trueFalseQuestion = {
  question_text: 'Are arrow functions and regular functions equivalent in all scenarios?',
  code_snippet: `// Regular function
function greet() { return 'hello'; }

// Arrow function
const greet = () => 'hello';`,
  type: 'true_false', // True/False question
  explanation: 'No - arrow functions do NOT have their own `this` context. They inherit `this` from their surrounding scope, which is a key difference from regular functions.',
  tags: ['arrow-functions', 'this-context'],
  options: [
    {
      text: 'True',
      is_correct: false
    },
    {
      text: 'False',
      is_correct: true
    }
  ]
};

// ==========================================
// MULTIPLE ANSWER QUESTION
// ==========================================
const multiAnswerQuestion = {
  question_text: 'Which of the following are valid array methods in JavaScript?',
  code_snippet: `const arr = [1, 2, 3, 4, 5];

// Valid array methods:
arr.map(x => x * 2)
arr.filter(x => x > 2)
arr.forEach(x => console.log(x))
arr.push(6)`,
  type: 'multi', // Multiple answer question
  explanation: 'The correct methods are map(), filter(), forEach(), and push(). These are all built-in array methods. Some others include: reduce(), find(), some(), every(), slice(), splice().',
  tags: ['array-methods', 'higher-order-functions'],
  options: [
    {
      text: 'map()',
      is_correct: true
    },
    {
      text: 'filter()',
      is_correct: true
    },
    {
      text: 'forEach()',
      is_correct: true
    },
    {
      text: 'multiply()',
      is_correct: false
    },
    {
      text: 'push()',
      is_correct: true
    },
    {
      text: 'extract()',
      is_correct: false
    }
  ]
};

// ==========================================
// EXPORT EXAMPLES
// ==========================================
module.exports = {
  sampleQuestion,
  trueFalseQuestion,
  multiAnswerQuestion
};

// ==========================================
// PYTHON EXAMPLE
// ==========================================
const pythonSampleQuestion = {
  question_text: 'What is the correct way to define a function in Python?',
  code_snippet: `# Correct way
def greet(name):
    return f"Hello, {name}!"

# Calling the function
result = greet("Alice")
print(result)  # Output: Hello, Alice!`,
  type: 'single',
  explanation: 'In Python, functions are defined using the `def` keyword followed by the function name, parameters in parentheses, a colon, and an indented body.',
  tags: ['functions', 'definition', 'basics'],
  options: [
    {
      text: 'def greet(name):',
      is_correct: true
    },
    {
      text: 'function greet(name):',
      is_correct: false
    },
    {
      text: 'fun greet(name):',
      is_correct: false
    },
    {
      text: 'define greet(name):',
      is_correct: false
    }
  ]
};

console.log('✅ Sample Quiz Questions Ready!');
console.log('\nThree question types:');
console.log('1. SINGLE - Multiple choice (one correct answer)');
console.log('2. TRUE_FALSE - Binary choice');
console.log('3. MULTI - Multiple choice (multiple correct answers)');
console.log('\nUse these as templates to create more quiz questions!');
