/**
 * Curated Question Bank for Syntax|Flow Adaptive Practice Mode
 * High quality questions for deterministic fallback and offline operation.
 */

const curatedQuestions = [
  // ==================== JAVASCRIPT ====================
  {
    id: 'curated-js-easy-01',
    language: 'JavaScript',
    topic: 'basics',
    difficulty: 'easy',
    questionText: 'What is the output of typeof null in JavaScript?',
    codeSnippet: 'console.log(typeof null);',
    options: [
      { id: 'A', text: '"null"' },
      { id: 'B', text: '"undefined"' },
      { id: 'C', text: '"object"' },
      { id: 'D', text: '"number"' }
    ],
    correctOptionId: 'C',
    explanation: 'In JavaScript, typeof null returns "object" due to a historical bug in the first implementation of JavaScript that has been preserved for backward compatibility.',
    source: 'curated'
  },
  {
    id: 'curated-js-easy-02',
    language: 'JavaScript',
    topic: 'arrays',
    difficulty: 'easy',
    questionText: 'Which array method adds one or more elements to the end of an array and returns its new length?',
    codeSnippet: 'const arr = [1, 2];\narr.push(3);',
    options: [
      { id: 'A', text: 'unshift()' },
      { id: 'B', text: 'push()' },
      { id: 'C', text: 'concat()' },
      { id: 'D', text: 'append()' }
    ],
    correctOptionId: 'B',
    explanation: 'The push() method adds one or more elements to the end of an array and returns the new length of the array.',
    source: 'curated'
  },
  {
    id: 'curated-js-medium-01',
    language: 'JavaScript',
    topic: 'closures',
    difficulty: 'medium',
    questionText: 'What will be printed to the console after executing this code?',
    codeSnippet: 'for (var i = 0; i < 3; i++) {\n  setTimeout(() => console.log(i), 0);\n}',
    options: [
      { id: 'A', text: '0, 1, 2' },
      { id: 'B', text: '3, 3, 3' },
      { id: 'C', text: 'undefined, undefined, undefined' },
      { id: 'D', text: '0, 0, 0' }
    ],
    correctOptionId: 'B',
    explanation: 'Because var is function-scoped rather than block-scoped, all three callbacks close over the same shared i variable, which equals 3 by the time the event loop executes the timer callbacks.',
    source: 'curated'
  },
  {
    id: 'curated-js-medium-02',
    language: 'JavaScript',
    topic: 'arrays',
    difficulty: 'medium',
    questionText: 'What does the reduce method evaluate to in this expression?',
    codeSnippet: 'const nums = [1, 2, 3, 4];\nconst res = nums.reduce((acc, curr) => acc + curr, 10);',
    options: [
      { id: 'A', text: '10' },
      { id: 'B', text: '20' },
      { id: 'C', text: '14' },
      { id: 'D', text: 'NaN' }
    ],
    correctOptionId: 'B',
    explanation: 'The initial accumulator value is 10. Adding 1 + 2 + 3 + 4 produces 10 + 10 = 20.',
    source: 'curated'
  },
  {
    id: 'curated-js-hard-01',
    language: 'JavaScript',
    topic: 'event-loop',
    difficulty: 'hard',
    questionText: 'In what order will the log statements print?',
    codeSnippet: 'console.log("A");\nsetTimeout(() => console.log("B"), 0);\nPromise.resolve().then(() => console.log("C"));\nconsole.log("D");',
    options: [
      { id: 'A', text: 'A, D, B, C' },
      { id: 'B', text: 'A, D, C, B' },
      { id: 'C', text: 'A, B, C, D' },
      { id: 'D', text: 'A, C, D, B' }
    ],
    correctOptionId: 'B',
    explanation: 'Synchronous execution logs A and D first. Then microtasks (Promise resolution C) are drained before macrotasks (setTimeout callback B). Therefore: A, D, C, B.',
    source: 'curated'
  },
  {
    id: 'curated-js-hard-02',
    language: 'JavaScript',
    topic: 'prototypes',
    difficulty: 'hard',
    questionText: 'What is returned by Object.prototype.toString.call(NaN)?',
    codeSnippet: 'Object.prototype.toString.call(NaN);',
    options: [
      { id: 'A', text: '"[object NaN]"' },
      { id: 'B', text: '"[object Number]"' },
      { id: 'C', text: '"[object Undefined]"' },
      { id: 'D', text: '"[object Error]"' }
    ],
    correctOptionId: 'B',
    explanation: 'In JavaScript, NaN is of primitive type number, so Object.prototype.toString.call(NaN) returns "[object Number]".',
    source: 'curated'
  },

  // ==================== PYTHON ====================
  {
    id: 'curated-py-easy-01',
    language: 'Python',
    topic: 'basics',
    difficulty: 'easy',
    questionText: 'What is the data type of the result of 7 / 2 in Python 3?',
    codeSnippet: 'result = 7 / 2',
    options: [
      { id: 'A', text: 'int' },
      { id: 'B', text: 'float' },
      { id: 'C', text: 'decimal' },
      { id: 'D', text: 'number' }
    ],
    correctOptionId: 'B',
    explanation: 'In Python 3, the single slash division operator (/) always returns a float (3.5), whereas integer floor division is performed by //.',
    source: 'curated'
  },
  {
    id: 'curated-py-easy-02',
    language: 'Python',
    topic: 'lists',
    difficulty: 'easy',
    questionText: 'How do you obtain the number of elements in a Python list named items?',
    codeSnippet: 'items = [10, 20, 30]',
    options: [
      { id: 'A', text: 'items.length()' },
      { id: 'B', text: 'items.size()' },
      { id: 'C', text: 'len(items)' },
      { id: 'D', text: 'count(items)' }
    ],
    correctOptionId: 'C',
    explanation: 'The built-in len() function returns the number of items in a container such as a list, string, or dictionary.',
    source: 'curated'
  },
  {
    id: 'curated-py-medium-01',
    language: 'Python',
    topic: 'functions',
    difficulty: 'medium',
    questionText: 'What will calling f() twice output?',
    codeSnippet: 'def f(x=[]):\n    x.append(1)\n    return x\n\nprint(f(), f())',
    options: [
      { id: 'A', text: '[1] [1]' },
      { id: 'B', text: '[1] [1, 1]' },
      { id: 'C', text: '[1, 1] [1, 1]' },
      { id: 'D', text: 'Error: mutable default argument' }
    ],
    correctOptionId: 'C',
    explanation: 'Default argument expressions in Python are evaluated once at function definition time. The list x is shared across calls, so both calls mutate and refer to the same list [1, 1].',
    source: 'curated'
  },
  {
    id: 'curated-py-medium-02',
    language: 'Python',
    topic: 'dictionaries',
    difficulty: 'medium',
    questionText: 'What is the output of this dictionary comprehension?',
    codeSnippet: 'd = {x: x**2 for x in (1, 2, 3)}\nprint(d.get(4, 0))',
    options: [
      { id: 'A', text: '16' },
      { id: 'B', text: 'None' },
      { id: 'C', text: '0' },
      { id: 'D', text: 'KeyError' }
    ],
    correctOptionId: 'C',
    explanation: 'The dictionary contains keys 1, 2, 3. dict.get(key, default) returns the specified default (0) when the key is not found.',
    source: 'curated'
  },
  {
    id: 'curated-py-hard-01',
    language: 'Python',
    topic: 'generators',
    difficulty: 'hard',
    questionText: 'What is printed by this generator pipeline?',
    codeSnippet: 'def gen():\n    yield 1\n    yield 2\ng = gen()\nprint(next(g), [x for x in g])',
    options: [
      { id: 'A', text: '1 [1, 2]' },
      { id: 'B', text: '1 [2]' },
      { id: 'C', text: '1 []' },
      { id: 'D', text: 'StopIteration' }
    ],
    correctOptionId: 'B',
    explanation: 'The first next(g) consumes the first yielded value (1). The subsequent list comprehension consumes the remainder of the generator stream, which yields only [2].',
    source: 'curated'
  },
  {
    id: 'curated-py-hard-02',
    language: 'Python',
    topic: 'metaclasses',
    difficulty: 'hard',
    questionText: 'Which method is called first when creating an instance of a Python class?',
    codeSnippet: 'class A:\n    pass\na = A()',
    options: [
      { id: 'A', text: '__init__' },
      { id: 'B', text: '__new__' },
      { id: 'C', text: '__call__' },
      { id: 'D', text: '__prepare__' }
    ],
    correctOptionId: 'B',
    explanation: '__new__ is the constructor method responsible for creating and returning a new instance, after which __init__ is called to initialize that instance.',
    source: 'curated'
  },

  // ==================== C++ ====================
  {
    id: 'curated-cpp-easy-01',
    language: 'C++',
    topic: 'arrays',
    difficulty: 'easy',
    questionText: 'What is the index of the first element in a standard C++ array?',
    codeSnippet: 'int arr[5] = {10, 20, 30, 40, 50};',
    options: [
      { id: 'A', text: '1' },
      { id: 'B', text: '0' },
      { id: 'C', text: '-1' },
      { id: 'D', text: 'Depends on the compiler' }
    ],
    correctOptionId: 'B',
    explanation: 'C and C++ use zero-based indexing, meaning the first element is located at index 0.',
    source: 'curated'
  },
  {
    id: 'curated-cpp-easy-02',
    language: 'C++',
    topic: 'basics',
    difficulty: 'easy',
    questionText: 'Which operator is used to allocate dynamic memory on the heap in C++?',
    codeSnippet: 'int* p = ... int(10);',
    options: [
      { id: 'A', text: 'malloc' },
      { id: 'B', text: 'new' },
      { id: 'C', text: 'alloc' },
      { id: 'D', text: 'create' }
    ],
    correctOptionId: 'B',
    explanation: 'The new operator allocates dynamic memory on the free store (heap) and initializes the object in C++.',
    source: 'curated'
  },
  {
    id: 'curated-cpp-medium-01',
    language: 'C++',
    topic: 'pointers',
    difficulty: 'medium',
    questionText: 'What is the value of *p after the following operations?',
    codeSnippet: 'int arr[] = {10, 20, 30};\nint* p = arr;\np++;',
    options: [
      { id: 'A', text: '10' },
      { id: 'B', text: '11' },
      { id: 'C', text: '20' },
      { id: 'D', text: '30' }
    ],
    correctOptionId: 'C',
    explanation: 'arr decays to a pointer to arr[0]. Incrementing the pointer advances it by sizeof(int) bytes to point to arr[1], so dereferencing yields 20.',
    source: 'curated'
  },
  {
    id: 'curated-cpp-medium-02',
    language: 'C++',
    topic: 'arrays',
    difficulty: 'medium',
    questionText: 'What is the output of sizeof(arr) / sizeof(arr[0]) for the array below on standard 64-bit systems?',
    codeSnippet: 'int arr[6];',
    options: [
      { id: 'A', text: '6' },
      { id: 'B', text: '24' },
      { id: 'C', text: '4' },
      { id: 'D', text: '8' }
    ],
    correctOptionId: 'A',
    explanation: 'sizeof(arr) gives the total bytes (6 * 4 = 24), and sizeof(arr[0]) gives 4 bytes. 24 / 4 = 6 elements.',
    source: 'curated'
  },
  {
    id: 'curated-cpp-hard-01',
    language: 'C++',
    topic: 'memory',
    difficulty: 'hard',
    questionText: 'What does std::move actually do to an object?',
    codeSnippet: '#include <utility>\nauto y = std::move(x);',
    options: [
      { id: 'A', text: 'Physically relocates memory to a new location' },
      { id: 'B', text: 'Unconditionally casts its argument to an rvalue reference' },
      { id: 'C', text: 'Deletes the original object immediately' },
      { id: 'D', text: 'Performs a deep clone of the heap contents' }
    ],
    correctOptionId: 'B',
    explanation: 'std::move does not move anything at runtime; it is a static cast that converts an lvalue expression into an rvalue reference (xvalue), enabling move semantics.',
    source: 'curated'
  },
  {
    id: 'curated-cpp-hard-02',
    language: 'C++',
    topic: 'templates',
    difficulty: 'hard',
    questionText: 'Which C++ feature enables substitution failure not to be treated as a compile error (SFINAE)?',
    codeSnippet: 'template <typename T, typename = std::enable_if_t<std::is_integral<T>::value>>\nvoid foo(T t);',
    options: [
      { id: 'A', text: 'RTTI' },
      { id: 'B', text: 'Template argument deduction substitution failure' },
      { id: 'C', text: 'Dynamic dispatch' },
      { id: 'D', text: 'Virtual inheritance' }
    ],
    correctOptionId: 'B',
    explanation: 'SFINAE (Substitution Failure Is Not An Error) ensures that when substituting deduced template arguments leads to an invalid type, the compiler discards that overload instead of failing compilation.',
    source: 'curated'
  },

  // ==================== JAVA ====================
  {
    id: 'curated-java-easy-01',
    language: 'Java',
    topic: 'basics',
    difficulty: 'easy',
    questionText: 'What is the default value of an uninitialized boolean instance field in Java?',
    codeSnippet: 'class Sample {\n  boolean flag;\n}',
    options: [
      { id: 'A', text: 'true' },
      { id: 'B', text: 'false' },
      { id: 'C', text: 'null' },
      { id: 'D', text: '0' }
    ],
    correctOptionId: 'B',
    explanation: 'In Java, uninitialized instance fields of primitive boolean type default to false.',
    source: 'curated'
  },
  {
    id: 'curated-java-medium-01',
    language: 'Java',
    topic: 'strings',
    difficulty: 'medium',
    questionText: 'What does the expression (s1 == s2) evaluate to?',
    codeSnippet: 'String s1 = "hello";\nString s2 = new String("hello");',
    options: [
      { id: 'A', text: 'true' },
      { id: 'B', text: 'false' },
      { id: 'C', text: 'NullPointerException' },
      { id: 'D', text: 'Compile error' }
    ],
    correctOptionId: 'B',
    explanation: '== compares reference addresses, not content. s1 refers to the string pool literal, while s2 refers to a newly created heap object. Use .equals() for content comparison.',
    source: 'curated'
  },
  {
    id: 'curated-java-hard-01',
    language: 'Java',
    topic: 'concurrency',
    difficulty: 'hard',
    questionText: 'What guarantee does the volatile keyword provide for a variable in Java?',
    codeSnippet: 'private volatile boolean running = true;',
    options: [
      { id: 'A', text: 'Mutual exclusion / atomic compound actions' },
      { id: 'B', text: 'Visibility of writes across threads and prevents instruction reordering' },
      { id: 'C', text: 'Thread-local storage' },
      { id: 'D', text: 'Automatic garbage collection protection' }
    ],
    correctOptionId: 'B',
    explanation: 'volatile ensures memory visibility (changes are written immediately to main memory) and establishes a happens-before relationship preventing certain instruction reorderings. It does not provide atomicity for compound operations.',
    source: 'curated'
  },

  // ==================== C ====================
  {
    id: 'curated-c-easy-01',
    language: 'C',
    topic: 'basics',
    difficulty: 'easy',
    questionText: 'What header file must be included to use printf and scanf in C?',
    codeSnippet: '#include <...>',
    options: [
      { id: 'A', text: '<stdlib.h>' },
      { id: 'B', text: '<stdio.h>' },
      { id: 'C', text: '<string.h>' },
      { id: 'D', text: '<math.h>' }
    ],
    correctOptionId: 'B',
    explanation: '<stdio.h> (Standard Input / Output) declares input/output utility functions including printf and scanf.',
    source: 'curated'
  },
  {
    id: 'curated-c-medium-01',
    language: 'C',
    topic: 'strings',
    difficulty: 'medium',
    questionText: 'How are strings represented in C?',
    codeSnippet: 'char str[] = "Syntax";',
    options: [
      { id: 'A', text: 'Instances of the String class' },
      { id: 'B', text: 'Null-terminated (\\0) character arrays' },
      { id: 'C', text: 'Dynamically sized vectors' },
      { id: 'D', text: 'Linked lists of characters' }
    ],
    correctOptionId: 'B',
    explanation: 'In C, strings are continuous arrays of characters terminated by the null character byte \\0.',
    source: 'curated'
  },
  {
    id: 'curated-c-hard-01',
    language: 'C',
    topic: 'memory',
    difficulty: 'hard',
    questionText: 'What happens if you dereference a freed pointer in C?',
    codeSnippet: 'int* p = malloc(sizeof(int));\nfree(p);\n*p = 42;',
    options: [
      { id: 'A', text: 'Guaranteed compile-time error' },
      { id: 'B', text: 'Undefined behavior (use-after-free)' },
      { id: 'C', text: 'Automatic reallocation' },
      { id: 'D', text: 'NullPointerException' }
    ],
    correctOptionId: 'B',
    explanation: 'Dereferencing a pointer after free() is undefined behavior (use-after-free), which can cause segmentation faults, memory corruption, or security vulnerabilities.',
    source: 'curated'
  }
];

module.exports = curatedQuestions;
