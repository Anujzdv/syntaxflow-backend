// seeder.js
const mongoose = require('mongoose');
const dotenv = require('dotenv');
const Quiz = require('./models/Quiz');

dotenv.config();

const sampleQuizzes = [
  // --- JavaScript (20 Questions) ---
  {
    language: 'JavaScript',
    question: 'How do you declare a variable that can be changed?',
    options: ['let myVar = 10;', 'const myVar = 10;', 'var myVar = 10;', 'Both A and C'],
    correctAnswer: 3,
    difficulty: 'Easy'
  },
  {
    language: 'JavaScript',
    question: 'What symbol is used for "strict equality" (value and type)?',
    options: ['==', '===', '=', '!='],
    correctAnswer: 1,
    difficulty: 'Easy'
  },
  {
    language: 'JavaScript',
    question: 'How do you write a single-line comment?',
    options: ['// This is a comment', '', '/* This is a comment */', '# This is a comment'],
    correctAnswer: 0,
    difficulty: 'Easy'
  },
  {
    language: 'JavaScript',
    question: 'Which is NOT a primitive data type in JavaScript?',
    options: ['String', 'Number', 'Boolean', 'Object'],
    correctAnswer: 3,
    difficulty: 'Medium'
  },
  {
    language: 'JavaScript',
    question: 'How do you call a function named "myFunction"?',
    options: ['call myFunction();', 'myFunction;', 'myFunction()', 'run myFunction;'],
    correctAnswer: 2,
    difficulty: 'Easy'
  },
  {
    language: 'JavaScript',
    question: 'What keyword is used to define a function?',
    options: ['function', 'def', 'fun', 'method'],
    correctAnswer: 0,
    difficulty: 'Easy'
  },
  {
    language: 'JavaScript',
    question: 'How do you write an IF statement?',
    options: ['if i = 5 then', 'if (i == 5)', 'if i == 5', 'if (i = 5)'],
    correctAnswer: 1,
    difficulty: 'Easy'
  },
  {
    language: 'JavaScript',
    question: 'How does a FOR loop start?',
    options: ['for (i = 0; i <= 5; i++)', 'for (i = 0; i <= 5)', 'for i = 1 to 5', 'for (i <= 5; i++)'],
    correctAnswer: 0,
    difficulty: 'Medium'
  },
  {
    language: 'JavaScript',
    question: 'How do you create an array?',
    options: ['var arr = (1, 2, 3)', 'var arr = {1, 2, 3}', 'var arr = [1, 2, 3]', 'var arr = "1, 2, 3"'],
    correctAnswer: 2,
    difficulty: 'Easy'
  },
  {
    language: 'JavaScript',
    question: 'What method returns the length of a string `str`?',
    options: ['str.length()', 'str.len', 'str.length', 'len(str)'],
    correctAnswer: 2,
    difficulty: 'Medium'
  },
  {
    language: 'JavaScript',
    question: 'How do you create an object?',
    options: ['var car = {type:"Fiat"};', 'var car = (type:"Fiat");', 'var car = [type:"Fiat"];', 'var car = "type:Fiat";'],
    correctAnswer: 0,
    difficulty: 'Easy'
  },
  {
    language: 'JavaScript',
    question: 'What does "typeof null" return?',
    options: ['"null"', '"undefined"', '"object"', '"number"'],
    correctAnswer: 2,
    difficulty: 'Hard'
  },
  {
    language: 'JavaScript',
    question: 'Which operator is used to assign a value?',
    options: ['=', '==', '===', ':'],
    correctAnswer: 0,
    difficulty: 'Easy'
  },
  {
    language: 'JavaScript',
    question: 'What is the correct way to get the element with id "demo"?',
    options: ['document.getElement("demo")', 'document.getElementById("demo")', 'document.getElementByName("demo")', '#demo'],
    correctAnswer: 1,
    difficulty: 'Medium'
  },
  {
    language: 'JavaScript',
    question: 'How do you declare a constant variable?',
    options: ['const PI = 3.14;', 'let PI = 3.14;', 'var PI = 3.14;', 'constant PI = 3.14;'],
    correctAnswer: 0,
    difficulty: 'Easy'
  },
  {
    language: 'JavaScript',
    question: 'Which event occurs when the user clicks on an HTML element?',
    options: ['onchange', 'onmouseclick', 'onmouseover', 'onclick'],
    correctAnswer: 3,
    difficulty: 'Easy'
  },
  {
    language: 'JavaScript',
    question: 'How do you round 7.25 to the nearest integer?',
    options: ['Math.round(7.25)', 'round(7.25)', 'Math.rnd(7.25)', 'rnd(7.25)'],
    correctAnswer: 0,
    difficulty: 'Easy'
  },
  {
    language: 'JavaScript',
    question: 'What operator is the "logical AND"?',
    options: ['&', 'AND', '&&', '||'],
    correctAnswer: 2,
    difficulty: 'Easy'
  },
  {
    language: 'JavaScript',
    question: 'What operator is the "logical OR"?',
    options: ['||', 'OR', '|', 'or'],
    correctAnswer: 0,
    difficulty: 'Easy'
  },
  {
    language: 'JavaScript',
    question: 'How do you write a multi-line comment?',
    options: ['// ... //', '/* ... */', '', '## ... ##'],
    correctAnswer: 1,
    difficulty: 'Easy'
  },

  // --- Python (20 Questions) ---
  {
    language: 'Python',
    question: 'How do you write a single-line comment?',
    options: ['// This is a comment', '# This is a comment', '/* This is a comment */', ''],
    correctAnswer: 1,
    difficulty: 'Easy'
  },
  {
    language: 'Python',
    question: 'How do you create a variable `x` with the numeric value 5?',
    options: ['x = 5', 'int x = 5', 'x = 5;', 'x := 5'],
    correctAnswer: 0,
    difficulty: 'Easy'
  },
  {
    language: 'Python',
    question: 'What is the correct way to print "Hello, World!"?',
    options: ['print("Hello, World!")', 'echo "Hello, World!"', 'System.out.println("Hello, World!")', 'console.log("Hello, World!")'],
    correctAnswer: 0,
    difficulty: 'Easy'
  },
  {
    language: 'Python',
    question: 'What is used to define a block of code (like in a loop or function)?',
    options: ['Curly braces {}', 'Parentheses ()', 'Indentation', 'END keyword'],
    correctAnswer: 2,
    difficulty: 'Easy'
  },
  {
    language: 'Python',
    question: 'How do you start a function definition?',
    options: ['function myFunc():', 'def myFunc():', 'define myFunc():', 'function.myFunc():'],
    correctAnswer: 1,
    difficulty: 'Easy'
  },
  {
    language: 'Python',
    question: 'What is the correct way to write an IF statement?',
    options: ['if (x > y):', 'if x > y:', 'if x > y then:', 'if {x > y}'],
    correctAnswer: 1,
    difficulty: 'Easy'
  },
  {
    language: 'Python',
    question: 'How do you start a FOR loop to count from 0 to 4?',
    options: ['for x in 5:', 'for x in range(5):', 'for x = 0 to 5:', 'for (x=0; x<5; x++)'],
    correctAnswer: 1,
    difficulty: 'Medium'
  },
  {
    language: 'Python',
    question: 'Which of these is a Python List?',
    options: ['{1, 2, 3}', '[1, 2, 3]', '(1, 2, 3)', '<1, 2, 3>'],
    correctAnswer: 1,
    difficulty: 'Easy'
  },
  {
    language: 'Python',
    question: 'Which of these is a Python Tuple?',
    options: ['{1, 2, 3}', '[1, 2, 3]', '(1, 2, 3)', '"1, 2, 3"'],
    correctAnswer: 2,
    difficulty: 'Medium'
  },
  {
    language: 'Python',
    question: 'Which of these is a Python Dictionary (dict)?',
    options: ['{"name": "John", "age": 30}', '["name": "John", "age": 30]', '("name": "John", "age": 30)', '<"name": "John", "age": 30>'],
    correctAnswer: 0,
    difficulty: 'Medium'
  },
  {
    language: 'Python',
    question: 'How do you get the length of a list `my_list`?',
    options: ['my_list.length()', 'my_list.len', 'length(my_list)', 'len(my_list)'],
    correctAnswer: 3,
    difficulty: 'Easy'
  },
  {
    language: 'Python',
    question: 'What is the operator for "not equal"?',
    options: ['!=', '<>', '==!', 'NOT ='],
    correctAnswer: 0,
    difficulty: 'Easy'
  },
  {
    language: 'Python',
    question: 'What is the operator for "logical AND"?',
    options: ['&&', '&', 'AND', 'and'],
    correctAnswer: 3,
    difficulty: 'Easy'
  },
  {
    language: 'Python',
    question: 'What is the operator for "logical OR"?',
    options: ['||', '|', 'OR', 'or'],
    correctAnswer: 3,
    difficulty: 'Easy'
  },
  {
    language: 'Python',
    question: 'How do you get user input from the console?',
    options: ['input("Enter value: ")', 'cin("Enter value: ")', 'getInput("Enter value: ")', 'console.read("Enter value: ")'],
    correctAnswer: 0,
    difficulty: 'Easy'
  },
  {
    language: 'Python',
    question: 'What keyword is used for "else if"?',
    options: ['elseif', 'else if', 'elif', 'next if'],
    correctAnswer: 2,
    difficulty: 'Easy'
  },
  {
    language: 'Python',
    question: 'How do you write a multi-line string?',
    options: ['/* ... */', '""" ... """', 'STRING ... END', '" ... "'],
    correctAnswer: 1,
    difficulty: 'Medium'
  },
  {
    language: 'Python',
    question: 'What does `my_list.append("item")` do?',
    options: ['Adds "item" to the end of the list', 'Deletes "item" from the list', 'Returns the index of "item"', 'Sorts the list'],
    correctAnswer: 0,
    difficulty: 'Easy'
  },
  {
    language: 'Python',
    question: 'Which data type is immutable (cannot be changed)?',
    options: ['List', 'Dictionary', 'Set', 'Tuple'],
    correctAnswer: 3,
    difficulty: 'Medium'
  },
  {
    language: 'Python',
    question: 'What is the file extension for Python files?',
    options: ['.py', '.pyt', '.pyth', '.pn'],
    correctAnswer: 0,
    difficulty: 'Easy'
  },

  // --- Java (20 Questions) ---
  {
    language: 'Java',
    question: 'What is the correct file extension for Java files?',
    options: ['.java', '.class', '.jav', '.j'],
    correctAnswer: 0,
    difficulty: 'Easy'
  },
  {
    language: 'Java',
    question: 'How do you print "Hello World" to the console?',
    options: ['print("Hello World");', 'System.out.println("Hello World");', 'echo("Hello World");', 'Console.WriteLine("Hello World");'],
    correctAnswer: 1,
    difficulty: 'Easy'
  },
  {
    language: 'Java',
    question: 'How do you declare an integer variable `x` with the value 5?',
    options: ['x = 5;', 'int x = 5;', 'num x = 5;', 'x := 5;'],
    correctAnswer: 1,
    difficulty: 'Easy'
  },
  {
    language: 'Java',
    question: 'Every Java statement must end with a...?',
    options: ['Period (.)', 'Semicolon (;)', 'Colon (:)', 'Nothing'],
    correctAnswer: 1,
    difficulty: 'Easy'
  },
  {
    language: 'Java',
    question: 'How do you write a single-line comment?',
    options: ['// This is a comment', '# This is a comment', '/* This is a comment */', ''],
    correctAnswer: 0,
    difficulty: 'Easy'
  },
  {
    language: 'Java',
    question: 'How do you write a multi-line comment?',
    options: ['// ... //', '""" ... """', '/* ... */', '## ... ##'],
    correctAnswer: 2,
    difficulty: 'Easy'
  },
  {
    language: 'Java',
    question: 'Which data type is used to store text?',
    options: ['string', 'str', 'String', 'Text'],
    correctAnswer: 2,
    difficulty: 'Easy'
  },
  {
    language: 'Java',
    question: 'How do you create a method named "myMethod"?',
    options: ['def myMethod() {}', 'myMethod() {}', 'function myMethod() {}', 'void myMethod() {}'],
    correctAnswer: 3,
    difficulty: 'Easy'
  },
  {
    language: 'Java',
    question: 'Every Java application must have a main method with what signature?',
    options: ['public static void main(String[] args)', 'void main()', 'static main()', 'public void main(String args)'],
    correctAnswer: 0,
    difficulty: 'Medium'
  },
  {
    language: 'Java',
    question: 'How do you write an IF statement?',
    options: ['if (x > y)', 'if x > y:', 'if x > y then', 'if [x > y]'],
    correctAnswer: 0,
    difficulty: 'Easy'
  },
  {
    language: 'Java',
    question: 'What is the keyword for "else if"?',
    options: ['elseif', 'elif', 'else if', 'next if'],
    correctAnswer: 2,
    difficulty: 'Easy'
  },
  {
    language: 'Java',
    question: 'How does a FOR loop start?',
    options: ['for (i = 0; i <= 5; i++)', 'for (i = 0 to 5)', 'for i in range(5)', 'for (i <= 5; i++)'],
    correctAnswer: 0,
    difficulty: 'Medium'
  },
  {
    language: 'Java',
    question: 'Which keyword is used to create a new object from a class?',
    options: ['new', 'create', 'alloc', 'build'],
    correctAnswer: 0,
    difficulty: 'Easy'
  },
  {
    language: 'Java',
    question: 'How do you create an array of integers?',
    options: ['int[] arr = new int[5];', 'int arr[5];', 'int arr = new int[5];', 'List<int> arr = new List<int>();'],
    correctAnswer: 0,
    difficulty: 'Medium'
  },
  {
    language: 'Java',
    question: 'What is the operator for "logical AND"?',
    options: ['&', '&&', 'and', 'AND'],
    correctAnswer: 1,
    difficulty: 'Easy'
  },
  {
    language: 'Java',
    question: 'What is the operator for "logical OR"?',
    options: ['|', '||', 'or', 'OR'],
    correctAnswer: 1,
    difficulty: 'Easy'
  },
  {
    language: 'Java',
    question: 'How do you get the length of a string `str`?',
    options: ['str.length', 'len(str)', 'str.length()', 'str.size()'],
    correctAnswer: 2,
    difficulty: 'Easy'
  },
  {
    language: 'Java',
    question: 'How do you get the length of an array `arr`?',
    options: ['arr.length()', 'arr.length', 'arr.size()', 'len(arr)'],
    correctAnswer: 1,
    difficulty: 'Medium'
  },
  {
    language: 'Java',
    question: 'What keyword is used to import a package?',
    options: ['import', 'include', 'using', 'require'],
    correctAnswer: 0,
    difficulty: 'Easy'
  },
  {
    language: 'Java',
    question: 'What keyword is used to define a constant (unchangeable) variable?',
    options: ['const', 'static', 'final', 'let'],
    correctAnswer: 2,
    difficulty: 'Medium'
  },

  // --- C++ (20 Questions) ---
  {
    language: 'C++',
    question: 'Which header file is needed to use `cout` and `cin`?',
    options: ['<stdio.h>', '<iostream>', '<string>', '<math.h>'],
    correctAnswer: 1,
    difficulty: 'Easy'
  },
  {
    language: 'C++',
    question: 'How do you print "Hello World" to the console?',
    options: ['printf("Hello World");', 'cout << "Hello World";', 'System.out.println("Hello World");', 'print("Hello World");'],
    correctAnswer: 1,
    difficulty: 'Easy'
  },
  {
    language: 'C++',
    question: 'What line is needed to avoid writing `std::` before `cout`?',
    options: ['using namespace std;', 'import std;', 'namespace std;', 'include namespace std;'],
    correctAnswer: 0,
    difficulty: 'Easy'
  },
  {
    language: 'C++',
    question: 'How do you declare an integer variable `x` with the value 5?',
    options: ['x = 5;', 'x := 5;', 'int x = 5;', 'number x = 5;'],
    correctAnswer: 2,
    difficulty: 'Easy'
  },
  {
    language: 'C++',
    question: 'Every C++ statement must end with a...?',
    options: ['Semicolon (;)', 'Period (.)', 'Colon (:)', 'Nothing'],
    correctAnswer: 0,
    difficulty: 'Easy'
  },
  {
    language: 'C++',
    question: 'How do you write a single-line comment?',
    options: ['# This is a comment', '// This is a comment', '/* This is a comment */', ''],
    correctAnswer: 1,
    difficulty: 'Easy'
  },
  {
    language: 'C++',
    question: 'How do you write a multi-line comment?',
    options: ['/* ... */', '// ... //', '## ... ##', '""" ... """'],
    correctAnswer: 0,
    difficulty: 'Easy'
  },
  {
    language: 'C++',
    question: 'How do you write an IF statement?',
    options: ['if x > y:', 'if (x > y)', 'if x > y then', 'if [x > y]'],
    correctAnswer: 1,
    difficulty: 'Easy'
  },
  {
    language: 'C++',
    question: 'How does a FOR loop start?',
    options: ['for (i = 0; i <= 5; i++)', 'for (i = 0 to 5)', 'for i in range(5)', 'for (i <= 5; i++)'],
    correctAnswer: 0,
    difficulty: 'Easy'
  },
  {
    language: 'C++',
    question: 'What is the "address-of" operator?',
    options: ['*', '&', '#', '->'],
    correctAnswer: 1,
    difficulty: 'Medium'
  },
  {
    language: 'C++',
    question: 'What is the "dereference" (value at address) operator?',
    options: ['*', '&', '$', '->'],
    correctAnswer: 0,
    difficulty: 'Medium'
  },
  {
    language: 'C++',
    question: 'How do you declare a pointer `p` to an integer?',
    options: ['int &p;', 'int *p;', 'int p*;', 'pointer<int> p;'],
    correctAnswer: 1,
    difficulty: 'Medium'
  },
  {
    language: 'C++',
    question: 'What keyword is used to define a constant?',
    options: ['const', 'final', 'static', 'let'],
    correctAnswer: 0,
    difficulty: 'Easy'
  },
  {
    language: 'C++',
    question: 'How do you read a value into an integer `x`?',
    options: ['cin >> x;', 'cin << x;', 'read(x);', 'scanf("%d", &x);'],
    correctAnswer: 0,
    difficulty: 'Easy'
  },
  {
    language: 'C++',
    question: 'How do you define a function `myFunction` that returns nothing?',
    options: ['function myFunction()', 'def myFunction()', 'void myFunction()', 'null myFunction()'],
    correctAnswer: 2,
    difficulty: 'Easy'
  },
  {
    language: 'C++',
    question: 'What is the operator for "logical AND"?',
    options: ['&', '&&', 'and', 'AND'],
    correctAnswer: 1,
    difficulty: 'Easy'
  },
  {
    language: 'C++',
    question: 'What is the operator for "logical OR"?',
    options: ['|', '||', 'or', 'OR'],
    correctAnswer: 1,
    difficulty: 'Easy'
  },
  {
    language: 'C++',
    question: 'What is the file extension for C++ header files?',
    options: ['.h', '.cpp', '.hpp', 'Both .h and .hpp'],
    correctAnswer: 3,
    difficulty: 'Medium'
  },
  {
    language: 'C++',
    question: 'What keyword is used to define a class?',
    options: ['class', 'struct', 'object', 'define'],
    correctAnswer: 0,
    difficulty: 'Easy'
  },
  {
    language: 'C++',
    question: 'What is the main function signature in C++?',
    options: ['int main()', 'void main()', 'static void main()', 'public main()'],
    correctAnswer: 0,
    difficulty: 'Easy'
  },

  // --- C (20 Questions) ---
  {
    language: 'C',
    question: 'Which header file is needed to use `printf` and `scanf`?',
    options: ['<iostream>', '<stdlib.h>', '<stdio.h>', '<string.h>'],
    correctAnswer: 2,
    difficulty: 'Easy'
  },
  {
    language: 'C',
    question: 'How do you print "Hello World" to the console?',
    options: ['printf("Hello World\\n");', 'cout << "Hello World";', 'print("Hello World");', 'echo("Hello World");'],
    correctAnswer: 0,
    difficulty: 'Easy'
  },
  {
    language: 'C',
    question: 'How do you declare an integer variable `x` with the value 5?',
    options: ['x = 5;', 'int x = 5;', 'x := 5;', 'var x = 5;'],
    correctAnswer: 1,
    difficulty: 'Easy'
  },
  {
    language: 'C',
    question: 'Every C statement must end with a...?',
    options: ['Semicolon (;)', 'Period (.)', 'Nothing', 'End;'],
    correctAnswer: 0,
    difficulty: 'Easy'
  },
  {
    language: 'C',
    question: 'How do you write a single-line comment?',
    options: ['# This is a comment', '// This is a comment', '/* This is a comment */', 'Both B and C'],
    correctAnswer: 3,
    difficulty: 'Medium'
  },
  {
    language: 'C',
    question: 'How do you write a multi-line comment?',
    options: ['/* ... */', '// ... //', '## ... ##', '""" ... """'],
    correctAnswer: 0,
    difficulty: 'Easy'
  },
  {
    language: 'C',
    question: 'How do you write an IF statement?',
    options: ['if x > y:', 'if (x > y)', 'if x > y then', 'if [x > y]'],
    correctAnswer: 1,
    difficulty: 'Easy'
  },
  {
    language: 'C',
    question: 'How does a FOR loop start?',
    options: ['for (i = 0; i < 5; i++)', 'for (i = 0 to 5)', 'for i in range(5)', 'for (i < 5; i++)'],
    correctAnswer: 0,
    difficulty: 'Easy'
  },
  {
    language: 'C',
    question: 'What is the "address-of" operator?',
    options: ['*', '&', '#', '->'],
    correctAnswer: 1,
    difficulty: 'Easy'
  },
  {
    language: 'C',
    question: 'What is the "dereference" (value at address) operator?',
    options: ['*', '&', '$', '->'],
    correctAnswer: 0,
    difficulty: 'Easy'
  },
  {
    language: 'C',
    question: 'How do you declare a pointer `p` to an integer?',
    options: ['int &p;', 'int *p;', 'int p*;', 'pointer<int> p;'],
    correctAnswer: 1,
    difficulty: 'Medium'
  },
  {
    language: 'C',
    question: 'What keyword is used to define a constant?',
    options: ['const', 'final', 'static', 'let'],
    correctAnswer: 0,
    difficulty: 'Easy'
  },
  {
    language: 'C',
    question: 'How do you read an integer value into `x`?',
    options: ['cin >> x;', 'read("%d", &x);', 'scanf("%d", &x);', 'input(&x);'],
    correctAnswer: 2,
    difficulty: 'Medium'
  },
  {
    language: 'C',
    question: 'How do you define a function `myFunction` that returns nothing?',
    options: ['function myFunction()', 'def myFunction()', 'void myFunction()', 'null myFunction()'],
    correctAnswer: 2,
    difficulty: 'Easy'
  },
  {
    language: 'C',
    question: 'What is the operator for "logical AND"?',
    options: ['&', '&&', 'and', 'AND'],
    correctAnswer: 1,
    difficulty: 'Easy'
  },
  {
    language: 'C',
    question: 'What is the operator for "logical OR"?',
    options: ['|', '||', 'or', 'OR'],
    correctAnswer: 1,
    difficulty: 'Easy'
  },
  {
    language: 'C',
    question: 'What is the file extension for C header files?',
    options: ['.h', '.c', '.ch', '.header'],
    correctAnswer: 0,
    difficulty: 'Easy'
  },
  {
    language: 'C',
    question: 'What keyword is used to define a structure?',
    options: ['struct', 'class', 'object', 'define'],
    correctAnswer: 0,
    difficulty: 'Easy'
  },
  {
    language: 'C',
    question: 'What is the main function signature in C?',
    options: ['int main()', 'void main()', 'Both A and B are common', 'public main()'],
    correctAnswer: 0,
    difficulty: 'Easy'
  },
  {
    language: 'C',
    question: 'How do you define an array `arr` of 5 integers?',
    options: ['int arr[5];', 'int arr = new int[5];', 'int[5] arr;', 'arr[5] as int;'],
    correctAnswer: 0,
    difficulty: 'Easy'
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
    // await Quiz.deleteMany(); // <-- Comment this out if you want to ADD questions
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
// To add data: node seeder.js
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
