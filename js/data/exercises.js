// Brick++ exercises: 10 worlds that take a beginner from `cout` to structs.
//
// Text fields (`concept`, `task`) use a tiny markdown: paragraphs separated by
// blank lines, `inline code`, **bold**, and ```cpp fenced blocks.
// Every solution is checked against real g++ by tools/check-content.mjs.

// --- helpers -------------------------------------------------------------
// md`...` / cpp`...` keep backslashes exactly as written (so "\n" inside C++
// snippets stays a backslash-n), remove the common indentation and let us
// write \` for a markdown backtick inside the template literal.
function dedent(str) {
  const lines = str.replace(/^[ \t]*\n/, '').replace(/\n[ \t]*$/, '').split('\n');
  const indents = lines.filter((l) => l.trim()).map((l) => l.match(/^ */)[0].length);
  const cut = indents.length ? Math.min(...indents) : 0;
  return lines.map((l) => l.slice(cut)).join('\n');
}
const md = (s, ...v) => dedent(String.raw(s, ...v).replace(/\\`/g, '`'));
const cpp = (s, ...v) => dedent(String.raw(s, ...v)) + '\n';

const BLANK = cpp`
  #include <iostream>
  using namespace std;

  int main() {
      // your code here

      return 0;
  }
`;

export const WORLDS = [
  // =======================================================================
  // WORLD 1
  // =======================================================================
  {
    id: 'w1',
    title: 'First Bricks',
    color: '#d01012',
    icon: '🧱',
    intro:
      'Every great build starts with one brick. In this world you will write your very first C++ programs: making the computer print messages, stacking lines of text, leaving notes for yourself with comments, and even drawing a LEGO brick out of characters. No experience needed - just curiosity!',
    exercises: [
      {
        id: 'w1e1',
        title: 'Hello, Builder!',
        story: 'Every new builder at Brick City HQ has to say hello to the computer first. Time for your first message!',
        concept: md`
          A C++ program is a list of instructions. The computer starts reading them inside **main**:

          \`\`\`cpp
          #include <iostream>
          using namespace std;

          int main() {
              cout << "Hi there!" << endl;
              return 0;
          }
          \`\`\`

          - \`#include <iostream>\` brings in the tools for **i**nput and **o**utput.
          - \`using namespace std;\` lets us write \`cout\` instead of the longer \`std::cout\`.
          - \`cout\` (say "see-out") is the screen. The arrows \`<<\` push things onto it.
          - Text goes inside **double quotes**: \`"Hi there!"\`.
          - \`endl\` means "end the line".
          - Every instruction ends with a **semicolon** \`;\` - like a full stop at the end of a sentence.
          - \`return 0;\` tells the computer "all done, everything went fine".
        `,
        task: md`
          Make the program print exactly:

          \`\`\`
          Hello, Builder!
          \`\`\`

          Watch the capital letters, the comma and the exclamation mark - the computer checks every character!
        `,
        starter: BLANK,
        solution: cpp`
          #include <iostream>
          using namespace std;

          int main() {
              cout << "Hello, Builder!" << endl;
              return 0;
          }
        `,
        hints: [
          'Replace the comment line with a cout statement.',
          'Text must be inside double quotes: "Hello, Builder!"',
          'cout << "Hello, Builder!" << endl;',
        ],
        tests: [{ stdin: '', expected: 'Hello, Builder!\n' }],
        require: [{ pattern: 'cout\\s*<<', message: 'Use cout << to print the message.' }],
        xp: 10,
      },
      {
        id: 'w1e2',
        title: 'Stacking Lines',
        story: 'Before a big build, the crew checks that all parts have arrived. Print the checklist!',
        concept: md`
          You can print many lines by writing several \`cout\` statements, one after another. The computer runs them **from top to bottom**.

          \`\`\`cpp
          cout << "Wheels: ready" << endl;
          cout << "Windows: ready" << endl;
          \`\`\`

          \`endl\` moves to a new line. Without it, everything sticks together on one line:

          \`\`\`cpp
          cout << "Red";
          cout << "Blue";   // prints RedBlue
          \`\`\`

          There is another way to make a new line: the special character \`\n\` written **inside** the quotes:

          \`\`\`cpp
          cout << "Line one\nLine two\n";
          \`\`\`

          Both ways work. Use whichever you find easier to read!
        `,
        task: md`
          Print this checklist, exactly 4 lines:

          \`\`\`
          Bricks: ready
          Plates: ready
          Minifigs: ready
          Let's build!
          \`\`\`

          Use \`endl\` at least once.
        `,
        starter: BLANK,
        solution: cpp`
          #include <iostream>
          using namespace std;

          int main() {
              cout << "Bricks: ready" << endl;
              cout << "Plates: ready" << endl;
              cout << "Minifigs: ready" << endl;
              cout << "Let's build!" << endl;
              return 0;
          }
        `,
        hints: [
          'Write one cout statement per line of the checklist.',
          'Finish each line with << endl so the next text starts on a new line.',
          'cout << "Bricks: ready" << endl;  - then the same for the other three lines.',
        ],
        tests: [{ stdin: '', expected: "Bricks: ready\nPlates: ready\nMinifigs: ready\nLet's build!\n" }],
        require: [{ pattern: '\\bendl\\b', message: 'Use endl at least once to end a line.' }],
        xp: 10,
      },
      {
        id: 'w1e3',
        title: 'Secret Notes',
        story: 'Someone sneaked a silly step into the official building instructions. Hide it without deleting it!',
        concept: md`
          A **comment** is a note for humans. The computer completely ignores it.

          \`\`\`cpp
          // This is a one-line comment
          cout << "Hi" << endl;  // a comment can also go at the end of a line

          /* This is a
             multi-line comment */
          \`\`\`

          Programmers use comments to explain *why* the code does something, so that their friends (and their future selves!) understand it.

          A handy trick: put \`//\` in front of a line of code to **switch it off** without deleting it. This is called "commenting out" a line. Remove the \`//\` and the line works again.
        `,
        task: md`
          The program prints 4 steps, but step 2 is terrible advice. **Comment out** that line so the output becomes:

          \`\`\`
          Step 1: Open the box
          Step 3: Snap bricks together
          Step 4: Show off your build
          \`\`\`

          Then add a comment of your own somewhere explaining what the program does.
        `,
        starter: cpp`
          #include <iostream>
          using namespace std;

          int main() {
              cout << "Step 1: Open the box" << endl;
              cout << "Step 2: Eat the bricks" << endl;
              cout << "Step 3: Snap bricks together" << endl;
              cout << "Step 4: Show off your build" << endl;
              return 0;
          }
        `,
        solution: cpp`
          #include <iostream>
          using namespace std;

          // Prints the (safe!) building instructions
          int main() {
              cout << "Step 1: Open the box" << endl;
              // cout << "Step 2: Eat the bricks" << endl;
              cout << "Step 3: Snap bricks together" << endl;
              cout << "Step 4: Show off your build" << endl;
              return 0;
          }
        `,
        hints: [
          'Which line prints the silly step? That is the one to switch off.',
          'Two slashes // at the start of a line turn it into a comment.',
          'Change the Step 2 line to start with //  like this:  // cout << "Step 2: ...',
        ],
        tests: [{ stdin: '', expected: 'Step 1: Open the box\nStep 3: Snap bricks together\nStep 4: Show off your build\n' }],
        xp: 10,
      },
      {
        id: 'w1e4',
        title: 'Text Brick',
        story: 'The Brick City billboard has no pictures - only letters and symbols. Draw a 1x4 brick on it!',
        concept: md`
          **ASCII art** means drawing pictures using only keyboard characters. Each line of the picture is just a line of text, so you print it with \`cout\`.

          \`\`\`cpp
          cout << " /\\_/\\ " << endl;   // careful: see below!
          cout << "( o.o )" << endl;
          \`\`\`

          Spaces count! \`"  o"\` (two spaces, then o) is different from \`"o"\`. The computer prints exactly what is between the quotes.

          One warning: the backslash character is special inside quotes (remember \`\n\`?). To print one backslash you must write two of them, like in the cat's ears above. Today's brick does not need any backslashes, so you are safe.
        `,
        task: md`
          Print this brick exactly, including the spaces at the start of the first line (two spaces before the first \`o\`, two spaces between studs):

          \`\`\`
            o  o  o  o
          +------------+
          |  BRICK++   |
          +------------+
          \`\`\`

          Count carefully: the \`+------------+\` lines have 12 dashes.
        `,
        starter: BLANK,
        solution: cpp`
          #include <iostream>
          using namespace std;

          int main() {
              cout << "  o  o  o  o" << endl;
              cout << "+------------+" << endl;
              cout << "|  BRICK++   |" << endl;
              cout << "+------------+" << endl;
              return 0;
          }
        `,
        hints: [
          'Each line of the picture is one cout line.',
          'Copy each line of the picture into quotes exactly, spaces included.',
          'First line: cout << "  o  o  o  o" << endl;  (two spaces at the start)',
        ],
        tests: [{ stdin: '', expected: '  o  o  o  o\n+------------+\n|  BRICK++   |\n+------------+\n' }],
        xp: 15,
      },
      {
        id: 'w1e5',
        title: 'Stud Math',
        story: 'The computer is a super-fast calculator. Let it count the studs for you!',
        concept: md`
          \`cout\` can print numbers too, and it can **calculate** before printing:

          \`\`\`cpp
          cout << 3 + 4 << endl;   // prints 7
          cout << "3 + 4" << endl; // prints 3 + 4  (it's just text!)
          \`\`\`

          Math symbols in C++: \`+\` plus, \`-\` minus, \`*\` times, \`/\` divide.

          You can chain text and numbers with \`<<\`:

          \`\`\`cpp
          cout << "I have " << 2 * 5 << " minifigs." << endl;
          // prints: I have 10 minifigs.
          \`\`\`

          Notice the spaces inside the quotes: \`"I have "\` ends with a space so the number doesn't glue onto the word.
        `,
        task: md`
          A 2x4 brick has 2 rows of 4 studs. Print exactly:

          \`\`\`
          A 2x4 brick has 8 studs.
          Three of them have 24 studs.
          \`\`\`

          Don't type 8 and 24 yourself - let C++ calculate them with \`*\` (for example \`2 * 4\`).
        `,
        starter: BLANK,
        solution: cpp`
          #include <iostream>
          using namespace std;

          int main() {
              cout << "A 2x4 brick has " << 2 * 4 << " studs." << endl;
              cout << "Three of them have " << 3 * 2 * 4 << " studs." << endl;
              return 0;
          }
        `,
        hints: [
          'Mix text in quotes and math outside quotes, joined with <<.',
          'cout << "A 2x4 brick has " << 2 * 4 << " studs." << endl;',
          'For the second line, three bricks have 3 * 2 * 4 studs.',
        ],
        tests: [{ stdin: '', expected: 'A 2x4 brick has 8 studs.\nThree of them have 24 studs.\n' }],
        require: [{ pattern: '\\d\\s*\\*\\s*\\d', message: 'Let C++ do the math: use * outside the quotes (like 2 * 4).' }],
        xp: 15,
      },
    ],
  },

  // =======================================================================
  // WORLD 2
  // =======================================================================
  {
    id: 'w2',
    title: 'Variables Workshop',
    color: '#0055bf',
    icon: '📦',
    intro:
      'Programs need to remember things: how many bricks you have, the name of your minifig, the price of a set. In the Variables Workshop you will learn to store values in labelled boxes called variables, use different types of data, and discover a few surprises about how computers divide numbers.',
    exercises: [
      {
        id: 'w2e1',
        title: 'Labelled Boxes',
        story: 'Your bricks are piling up. Time to sort them into labelled storage boxes!',
        concept: md`
          A **variable** is a labelled box that stores a value. You create one by giving its **type** and a **name**:

          \`\`\`cpp
          int bricks = 12;
          \`\`\`

          - \`int\` means the box holds a whole number (an **int**eger).
          - \`bricks\` is the label (the variable's name).
          - \`= 12\` puts 12 in the box.

          Now you can use the name instead of the number:

          \`\`\`cpp
          int bricks = 12;
          int wheels = 4;
          cout << "Parts: " << bricks + wheels << endl;  // Parts: 16
          \`\`\`

          Names may contain letters, digits and \`_\`, but cannot start with a digit or contain spaces. A popular style is **camelCase**: \`studsPerBrick\`.
        `,
        task: md`
          Create two \`int\` variables: \`bricks\` with the value \`12\` and \`studsPerBrick\` with the value \`8\`. Then print:

          \`\`\`
          Bricks: 12
          Studs per brick: 8
          Total studs: 96
          \`\`\`

          Print the numbers using the variables, and calculate the total with \`*\`.
        `,
        starter: BLANK,
        solution: cpp`
          #include <iostream>
          using namespace std;

          int main() {
              int bricks = 12;
              int studsPerBrick = 8;
              cout << "Bricks: " << bricks << endl;
              cout << "Studs per brick: " << studsPerBrick << endl;
              cout << "Total studs: " << bricks * studsPerBrick << endl;
              return 0;
          }
        `,
        hints: [
          'Start with: int bricks = 12;',
          'Print a variable without quotes: cout << "Bricks: " << bricks << endl;',
          'The total is bricks * studsPerBrick.',
        ],
        tests: [{ stdin: '', expected: 'Bricks: 12\nStuds per brick: 8\nTotal studs: 96\n' }],
        require: [
          { pattern: '\\bint\\s+bricks\\b', message: 'Create an int variable called bricks.' },
          { pattern: '\\bint\\s+studsPerBrick\\b', message: 'Create an int variable called studsPerBrick.' },
          { pattern: 'bricks\\s*\\*\\s*studsPerBrick|studsPerBrick\\s*\\*\\s*bricks', message: 'Calculate the total with bricks * studsPerBrick.' },
        ],
        xp: 15,
      },
      {
        id: 'w2e2',
        title: 'Minifig ID Card',
        story: 'Every minifig in Brick City gets an ID card. Let us build one with different kinds of data.',
        concept: md`
          Different data needs different types of box:

          \`\`\`cpp
          int pieces = 250;          // whole numbers
          double height = 4.5;       // numbers with a decimal point
          char grade = 'A';          // ONE character, in single quotes
          string name = "Emmet";     // text, in double quotes
          bool isHero = true;        // true or false
          \`\`\`

          To use \`string\` you should add \`#include <string>\` at the top.

          Watch the quotes: a \`char\` uses **single** quotes \`'A'\`, a \`string\` uses **double** quotes \`"Emmet"\`.

          A surprise: when you print a \`bool\`, \`cout\` shows \`1\` for true and \`0\` for false.
        `,
        task: md`
          Create these four variables: a \`string\` name \`"Emmet"\`, a \`char\` grade \`'A'\`, a \`double\` height \`4.5\` and a \`bool\` isHero \`true\`. Print them like this:

          \`\`\`
          Name: Emmet
          Grade: A
          Height: 4.5 cm
          Hero: 1
          \`\`\`
        `,
        starter: cpp`
          #include <iostream>
          #include <string>
          using namespace std;

          int main() {
              // create the four variables here

              // print the ID card here

              return 0;
          }
        `,
        solution: cpp`
          #include <iostream>
          #include <string>
          using namespace std;

          int main() {
              string name = "Emmet";
              char grade = 'A';
              double height = 4.5;
              bool isHero = true;
              cout << "Name: " << name << endl;
              cout << "Grade: " << grade << endl;
              cout << "Height: " << height << " cm" << endl;
              cout << "Hero: " << isHero << endl;
              return 0;
          }
        `,
        hints: [
          'You need one variable of each type: string, char, double, bool.',
          "char grade = 'A';   (single quotes for one character)",
          'cout << "Height: " << height << " cm" << endl;',
        ],
        tests: [{ stdin: '', expected: 'Name: Emmet\nGrade: A\nHeight: 4.5 cm\nHero: 1\n' }],
        require: [
          { pattern: '\\bstring\\s+\\w+', message: 'Create a string variable for the name.' },
          { pattern: '\\bchar\\s+\\w+', message: 'Create a char variable for the grade.' },
          { pattern: '\\bdouble\\s+\\w+', message: 'Create a double variable for the height.' },
          { pattern: '\\bbool\\s+\\w+', message: 'Create a bool variable for isHero.' },
        ],
        xp: 15,
      },
      {
        id: 'w2e3',
        title: 'Bagging Bricks',
        story: 'The factory packs bricks into bags of 8. How many full bags do we get, and how many bricks are left over?',
        concept: md`
          When you divide two \`int\`s, C++ does **integer division**: it throws away everything after the decimal point.

          \`\`\`cpp
          cout << 7 / 2;   // 3, not 3.5!
          cout << 20 / 6;  // 3
          \`\`\`

          The **modulo** operator \`%\` gives the **remainder** - what is left over:

          \`\`\`cpp
          cout << 7 % 2;   // 1   (7 = 2*3 + 1)
          cout << 20 % 6;  // 2   (20 = 6*3 + 2)
          cout << 12 % 4;  // 0   (divides evenly)
          \`\`\`

          Think of it like sharing sweets: \`/\` tells you how many each friend gets, \`%\` tells you how many are left in the bag.
        `,
        task: md`
          Create \`int bricks = 50;\` and \`int perBag = 8;\`. Using \`/\` and \`%\`, print:

          \`\`\`
          Full bags: 6
          Left over: 2
          \`\`\`
        `,
        starter: cpp`
          #include <iostream>
          using namespace std;

          int main() {
              int bricks = 50;
              int perBag = 8;
              // print the number of full bags and the leftovers

              return 0;
          }
        `,
        solution: cpp`
          #include <iostream>
          using namespace std;

          int main() {
              int bricks = 50;
              int perBag = 8;
              cout << "Full bags: " << bricks / perBag << endl;
              cout << "Left over: " << bricks % perBag << endl;
              return 0;
          }
        `,
        hints: [
          'Full bags = bricks divided by perBag (integer division).',
          'Leftovers = the remainder, which is what % gives you.',
          'cout << "Left over: " << bricks % perBag << endl;',
        ],
        tests: [{ stdin: '', expected: 'Full bags: 6\nLeft over: 2\n' }],
        require: [
          { pattern: 'bricks\\s*/\\s*perBag', message: 'Calculate the full bags with bricks / perBag.' },
          { pattern: 'bricks\\s*%\\s*perBag', message: 'Calculate the leftovers with bricks % perBag.' },
        ],
        xp: 15,
      },
      {
        id: 'w2e4',
        title: 'Fair Shares',
        story: 'Two builders scored 7 and 8 points in a speed-build. What is their average? The answer depends on how you ask!',
        concept: md`
          If both numbers are \`int\`, division is integer division. To get the decimals, at least **one** side must be a \`double\`:

          \`\`\`cpp
          int a = 7, b = 8;
          cout << (a + b) / 2;      // 7    (int / int)
          cout << (a + b) / 2.0;    // 7.5  (2.0 is a double)
          cout << (double)(a + b) / 2;  // 7.5 (we turned the sum into a double)
          \`\`\`

          \`(double)x\` is called a **cast**: it converts a value to another type. You can also write \`static_cast<double>(x)\`.

          Also notice the brackets: \`(a + b) / 2\` adds first. Without brackets, \`a + b / 2\` would divide \`b\` first, just like in maths class.
        `,
        task: md`
          Create \`int a = 7;\` and \`int b = 8;\`. Print the average twice - once with integer division, once with real division:

          \`\`\`
          Integer average: 7
          Real average: 7.5
          \`\`\`

          Store the real average in a \`double\` variable.
        `,
        starter: cpp`
          #include <iostream>
          using namespace std;

          int main() {
              int a = 7;
              int b = 8;
              // your code here

              return 0;
          }
        `,
        solution: cpp`
          #include <iostream>
          using namespace std;

          int main() {
              int a = 7;
              int b = 8;
              int intAverage = (a + b) / 2;
              double realAverage = (a + b) / 2.0;
              cout << "Integer average: " << intAverage << endl;
              cout << "Real average: " << realAverage << endl;
              return 0;
          }
        `,
        hints: [
          'Integer average: (a + b) / 2',
          'For the real average, make one side a double: divide by 2.0 instead of 2.',
          'double realAverage = (a + b) / 2.0;',
        ],
        tests: [{ stdin: '', expected: 'Integer average: 7\nReal average: 7.5\n' }],
        require: [{ pattern: '\\bdouble\\s+\\w+', message: 'Store the real average in a double variable.' }],
        xp: 20,
      },
      {
        id: 'w2e5',
        title: 'Coin Counter',
        story: 'You have 100 Brick Coins. Watch them change as you shop, find treasure, and win a bonus!',
        concept: md`
          A variable can **change** over time - that is why it is called a variable! You can give it a new value, even based on its old value:

          \`\`\`cpp
          int coins = 10;
          coins = coins + 5;   // now 15
          \`\`\`

          Shortcuts (**compound assignment**):

          \`\`\`cpp
          coins += 5;   // same as coins = coins + 5
          coins -= 3;   // coins = coins - 3
          coins *= 2;   // coins = coins * 2
          coins++;      // add 1
          \`\`\`

          Some values should **never** change, like the price of a set. Mark them \`const\`, and C++ will stop you if you try to change them by mistake:

          \`\`\`cpp
          const int PRICE = 35;
          PRICE = 40;   // ERROR: PRICE is constant
          \`\`\`

          Constants are often written in CAPITALS so they stand out.
        `,
        task: md`
          Start with \`int coins = 100;\` and create \`const int PRICE = 35;\`. Then, printing after each step:

          1. buy a set (\`coins -= PRICE;\`)
          2. find 10 coins (\`+=\`)
          3. a bonus doubles your coins (\`*=\`)

          Output:

          \`\`\`
          Start: 100
          After buying: 65
          After finding: 75
          After doubling: 150
          \`\`\`
        `,
        starter: cpp`
          #include <iostream>
          using namespace std;

          int main() {
              int coins = 100;
              cout << "Start: " << coins << endl;
              // your code here

              return 0;
          }
        `,
        solution: cpp`
          #include <iostream>
          using namespace std;

          int main() {
              int coins = 100;
              const int PRICE = 35;
              cout << "Start: " << coins << endl;
              coins -= PRICE;
              cout << "After buying: " << coins << endl;
              coins += 10;
              cout << "After finding: " << coins << endl;
              coins *= 2;
              cout << "After doubling: " << coins << endl;
              return 0;
          }
        `,
        hints: [
          'Create the constant with: const int PRICE = 35;',
          'Change coins, then print it, then change it again, then print again...',
          'coins -= PRICE;  then  coins += 10;  then  coins *= 2;',
        ],
        tests: [{ stdin: '', expected: 'Start: 100\nAfter buying: 65\nAfter finding: 75\nAfter doubling: 150\n' }],
        require: [
          { pattern: '\\bconst\\s+int\\s+PRICE\\b', message: 'Create the constant: const int PRICE = 35;' },
          { pattern: '-=', message: 'Use -= to pay for the set.' },
          { pattern: '\\+=', message: 'Use += to add the coins you found.' },
          { pattern: '\\*=', message: 'Use *= to double your coins.' },
        ],
        xp: 20,
      },
    ],
  },

  // =======================================================================
  // WORLD 3
  // =======================================================================
  {
    id: 'w3',
    title: 'Talking to the Computer',
    color: '#f2cd37',
    icon: '🎤',
    intro:
      'So far your programs always print the same thing. Now they will listen! With cin your program can read numbers and words that someone types, and react to them. By the end of this world you will have built your own little calculators.',
    exercises: [
      {
        id: 'w3e1',
        title: 'Brick Echo',
        story: 'The sorting robot asks how many bricks you brought, and repeats it back to you.',
        concept: md`
          \`cin\` (say "see-in") is the keyboard. The arrows \`>>\` point **from** \`cin\` **into** your variable:

          \`\`\`cpp
          int bricks;
          cin >> bricks;     // waits for a number and stores it
          cout << bricks * 2 << endl;
          \`\`\`

          The variable must exist **before** you read into it, so declare it first (no starting value needed - \`cin\` fills it).

          Memory trick: with \`cout <<\` the data flows **out** to the screen, with \`cin >>\` it flows **in** to the variable.

          **Important for Brick++:** the tests type the input for you. Do **not** print prompts like \`"Enter a number:"\` - print only what the task asks for, otherwise the output won't match.
        `,
        task: md`
          Read one whole number and print it in a sentence. For input \`5\` the output must be:

          \`\`\`
          You have 5 bricks!
          \`\`\`
        `,
        starter: cpp`
          #include <iostream>
          using namespace std;

          int main() {
              int bricks;
              // read the number, then print the sentence

              return 0;
          }
        `,
        solution: cpp`
          #include <iostream>
          using namespace std;

          int main() {
              int bricks;
              cin >> bricks;
              cout << "You have " << bricks << " bricks!" << endl;
              return 0;
          }
        `,
        hints: [
          'First read: cin >> bricks;',
          'Then print text, the variable, and more text, joined with <<.',
          'cout << "You have " << bricks << " bricks!" << endl;',
        ],
        tests: [
          { stdin: '5\n', expected: 'You have 5 bricks!\n' },
          { stdin: '0\n', expected: 'You have 0 bricks!\n' },
          { stdin: '120\n', expected: 'You have 120 bricks!\n', hidden: true },
          { stdin: '7\n', expected: 'You have 7 bricks!\n', hidden: true },
        ],
        require: [{ pattern: 'cin\\s*>>', message: 'Read the number with cin >>.' }],
        xp: 20,
      },
      {
        id: 'w3e2',
        title: 'Adding Machine',
        story: 'Two builders bring their bricks together. How many do they have in total?',
        concept: md`
          You can read several values in one line by chaining \`>>\`:

          \`\`\`cpp
          int a, b;        // two int variables at once
          cin >> a >> b;   // reads the first number into a, the second into b
          \`\`\`

          \`cin\` skips spaces and new lines between numbers, so the input \`3 4\` and the input

          \`\`\`
          3
          4
          \`\`\`

          both work the same way.

          Then you can calculate with the values like any other variables:

          \`\`\`cpp
          cout << a << " * " << b << " = " << a * b << endl;
          \`\`\`
        `,
        task: md`
          Read two whole numbers and print their sum as an equation. For input \`3 4\`:

          \`\`\`
          3 + 4 = 7
          \`\`\`

          Numbers can be negative too.
        `,
        starter: cpp`
          #include <iostream>
          using namespace std;

          int main() {
              int a, b;
              // your code here

              return 0;
          }
        `,
        solution: cpp`
          #include <iostream>
          using namespace std;

          int main() {
              int a, b;
              cin >> a >> b;
              cout << a << " + " << b << " = " << a + b << endl;
              return 0;
          }
        `,
        hints: [
          'Read both numbers: cin >> a >> b;',
          'The " + " and " = " parts are text, so they go in quotes (with spaces around them).',
          'cout << a << " + " << b << " = " << a + b << endl;',
        ],
        tests: [
          { stdin: '3 4\n', expected: '3 + 4 = 7\n' },
          { stdin: '10 25\n', expected: '10 + 25 = 35\n' },
          { stdin: '-5 5\n', expected: '-5 + 5 = 0\n', hidden: true },
          { stdin: '100\n1\n', expected: '100 + 1 = 101\n', hidden: true },
        ],
        require: [{ pattern: 'cin\\s*>>', message: 'Read the numbers with cin >>.' }],
        xp: 20,
      },
      {
        id: 'w3e3',
        title: 'Welcome Gate',
        story: 'The gate to Brick City greets every visitor by name.',
        concept: md`
          \`cin\` can read text into a \`string\` too:

          \`\`\`cpp
          string name;
          cin >> name;
          cout << "Hi, " << name << "!" << endl;
          \`\`\`

          But careful: \`cin >>\` reads only **one word**. It stops at the first space. If someone types \`Lucy Wyldstyle\`, then \`name\` becomes just \`Lucy\` (the rest waits for the next \`cin\`).

          That's perfect for reading single words like a first name, a colour, or a command. For whole sentences there is another tool - coming up next!
        `,
        task: md`
          Read a name (one word) and greet the visitor. For input \`Emmet\`:

          \`\`\`
          Welcome to Brick City, Emmet!
          \`\`\`
        `,
        starter: cpp`
          #include <iostream>
          #include <string>
          using namespace std;

          int main() {
              // your code here

              return 0;
          }
        `,
        solution: cpp`
          #include <iostream>
          #include <string>
          using namespace std;

          int main() {
              string name;
              cin >> name;
              cout << "Welcome to Brick City, " << name << "!" << endl;
              return 0;
          }
        `,
        hints: [
          'Create a string variable to hold the name.',
          'string name;  cin >> name;',
          'cout << "Welcome to Brick City, " << name << "!" << endl;',
        ],
        tests: [
          { stdin: 'Emmet\n', expected: 'Welcome to Brick City, Emmet!\n' },
          { stdin: 'Lucy\n', expected: 'Welcome to Brick City, Lucy!\n' },
          { stdin: 'Benny\n', expected: 'Welcome to Brick City, Benny!\n', hidden: true },
        ],
        require: [{ pattern: '\\bstring\\s+\\w+', message: 'Store the name in a string variable.' }],
        xp: 20,
      },
      {
        id: 'w3e4',
        title: 'Set Name Scanner',
        story: 'LEGO set names often have several words, like "Space Shuttle Explorer". Read them in one piece!',
        concept: md`
          To read a **whole line** including spaces, use \`getline\`:

          \`\`\`cpp
          string line;
          getline(cin, line);   // reads everything until Enter
          \`\`\`

          Now \`line\` holds the full text, spaces and all.

          A string knows how long it is. \`line.length()\` (or \`line.size()\`, same thing) gives the number of characters - **spaces count too**:

          \`\`\`cpp
          string s = "Hi there";
          cout << s.length();   // 8  (H,i,space,t,h,e,r,e)
          \`\`\`

          The dot \`.\` means "ask this string to do something". You will see the dot a lot in C++!
        `,
        task: md`
          Read a whole line with \`getline\`, then print the line and its number of characters. For input \`Space Shuttle Explorer\`:

          \`\`\`
          Set: Space Shuttle Explorer
          Characters: 22
          \`\`\`
        `,
        starter: cpp`
          #include <iostream>
          #include <string>
          using namespace std;

          int main() {
              string setName;
              // read the whole line, then print the two lines

              return 0;
          }
        `,
        solution: cpp`
          #include <iostream>
          #include <string>
          using namespace std;

          int main() {
              string setName;
              getline(cin, setName);
              cout << "Set: " << setName << endl;
              cout << "Characters: " << setName.length() << endl;
              return 0;
          }
        `,
        hints: [
          'cin >> only reads one word - use getline instead.',
          'getline(cin, setName);',
          'cout << "Characters: " << setName.length() << endl;',
        ],
        tests: [
          { stdin: 'Space Shuttle Explorer\n', expected: 'Set: Space Shuttle Explorer\nCharacters: 22\n' },
          { stdin: 'Hogwarts Castle\n', expected: 'Set: Hogwarts Castle\nCharacters: 15\n' },
          { stdin: 'Millennium Falcon\n', expected: 'Set: Millennium Falcon\nCharacters: 17\n', hidden: true },
          { stdin: 'X\n', expected: 'Set: X\nCharacters: 1\n', hidden: true },
        ],
        require: [{ pattern: '\\bgetline\\s*\\(', message: 'Use getline(cin, ...) to read the whole line.' }],
        xp: 25,
      },
      {
        id: 'w3e5',
        title: 'Shop Calculator',
        story: 'The Brick Shop sells loose bricks. Build the till that tells customers how much to pay.',
        concept: md`
          Money has decimals, so use \`double\`. \`cin\` reads decimals into a \`double\` just fine:

          \`\`\`cpp
          double price;
          cin >> price;   // the user can type 2.25
          \`\`\`

          Printing money nicely needs exactly 2 digits after the dot. Add \`#include <iomanip>\` and use \`fixed\` and \`setprecision\`:

          \`\`\`cpp
          cout << fixed << setprecision(2);
          cout << 4.5 << endl;    // 4.50
          cout << 3.14159 << endl; // 3.14
          \`\`\`

          \`fixed\` means "always use normal decimal notation", and \`setprecision(2)\` means "2 digits after the dot". It stays switched on for everything you print afterwards. It also rounds: \`2.678\` becomes \`2.68\`.
        `,
        task: md`
          Read a number of bricks (\`int\`) and the price of one brick (\`double\`). Print the total with 2 decimals. For input \`3 1.5\`:

          \`\`\`
          Total: $4.50
          \`\`\`
        `,
        starter: cpp`
          #include <iostream>
          #include <iomanip>
          using namespace std;

          int main() {
              int count;
              double price;
              // your code here

              return 0;
          }
        `,
        solution: cpp`
          #include <iostream>
          #include <iomanip>
          using namespace std;

          int main() {
              int count;
              double price;
              cin >> count >> price;
              double total = count * price;
              cout << fixed << setprecision(2);
              cout << "Total: $" << total << endl;
              return 0;
          }
        `,
        hints: [
          'Read both values: cin >> count >> price;',
          'The total is count * price - store it in a double.',
          'cout << fixed << setprecision(2) << "Total: $" << total << endl;',
        ],
        tests: [
          { stdin: '3 1.5\n', expected: 'Total: $4.50\n' },
          { stdin: '10 0.99\n', expected: 'Total: $9.90\n' },
          { stdin: '7 2.25\n', expected: 'Total: $15.75\n', hidden: true },
          { stdin: '1 100\n', expected: 'Total: $100.00\n', hidden: true },
        ],
        require: [{ pattern: 'setprecision\\s*\\(\\s*2\\s*\\)', message: 'Use fixed << setprecision(2) to show 2 decimals.' }],
        xp: 25,
      },
    ],
  },

  // =======================================================================
  // WORLD 4
  // =======================================================================
  {
    id: 'w4',
    title: 'Decision Bricks',
    color: '#237841',
    icon: '🔀',
    intro:
      'Real programs make choices: is this builder old enough? Is this number even? Which colour bin should this brick go into? Here you will learn if, else, logical operators and switch - the bricks that let your program take different paths.',
    exercises: [
      {
        id: 'w4e1',
        title: 'Age Check',
        story: 'Small parts are not for tiny kids! The box says 4+. Build the gatekeeper.',
        concept: md`
          \`if\` runs code only when a condition is **true**. \`else\` runs when it is **false**:

          \`\`\`cpp
          if (pieces > 1000) {
              cout << "Huge set!" << endl;
          } else {
              cout << "Normal set." << endl;
          }
          \`\`\`

          Comparison operators:

          - \`==\` equal (two equals signs! one \`=\` means "put a value in")
          - \`!=\` not equal
          - \`<\` less than, \`>\` greater than
          - \`<=\` less or equal, \`>=\` greater or equal

          The condition goes in round brackets \`( )\`, the code to run goes in curly braces \`{ }\`.
        `,
        task: md`
          Read an age. If it is **4 or more**, print \`Ready for bricks!\`. Otherwise print \`Duplo time!\`.

          Input \`10\` gives:

          \`\`\`
          Ready for bricks!
          \`\`\`
        `,
        starter: cpp`
          #include <iostream>
          using namespace std;

          int main() {
              int age;
              cin >> age;
              // your code here

              return 0;
          }
        `,
        solution: cpp`
          #include <iostream>
          using namespace std;

          int main() {
              int age;
              cin >> age;
              if (age >= 4) {
                  cout << "Ready for bricks!" << endl;
              } else {
                  cout << "Duplo time!" << endl;
              }
              return 0;
          }
        `,
        hints: [
          '"4 or more" means age >= 4.',
          'Use if (...) { ... } else { ... }',
          'if (age >= 4) { cout << "Ready for bricks!" << endl; } else { cout << "Duplo time!" << endl; }',
        ],
        tests: [
          { stdin: '10\n', expected: 'Ready for bricks!\n' },
          { stdin: '2\n', expected: 'Duplo time!\n' },
          { stdin: '4\n', expected: 'Ready for bricks!\n', hidden: true },
          { stdin: '3\n', expected: 'Duplo time!\n', hidden: true },
        ],
        require: [{ pattern: '\\bif\\s*\\(', message: 'Use an if statement.' }],
        xp: 20,
      },
      {
        id: 'w4e2',
        title: 'Even or Odd?',
        story: 'Bricks come in pairs on a double-sided conveyor belt. Is there a lonely one left?',
        concept: md`
          Remember \`%\`, the remainder? It is the classic way to test if a number divides evenly:

          \`\`\`cpp
          if (n % 2 == 0) {
              // n divides by 2 with nothing left: n is even
          }
          \`\`\`

          The same trick works for anything: \`n % 3 == 0\` means "n is a multiple of 3", \`n % 10\` gives the last digit of n.

          Zero counts as even, because \`0 % 2\` is \`0\`.
        `,
        task: md`
          Read a whole number (0 or more) and print whether it is even or odd. For input \`8\`:

          \`\`\`
          8 is even
          \`\`\`

          For input \`7\`:

          \`\`\`
          7 is odd
          \`\`\`
        `,
        starter: cpp`
          #include <iostream>
          using namespace std;

          int main() {
              int n;
              cin >> n;
              // your code here

              return 0;
          }
        `,
        solution: cpp`
          #include <iostream>
          using namespace std;

          int main() {
              int n;
              cin >> n;
              if (n % 2 == 0) {
                  cout << n << " is even" << endl;
              } else {
                  cout << n << " is odd" << endl;
              }
              return 0;
          }
        `,
        hints: [
          'A number is even when the remainder after dividing by 2 is 0.',
          'if (n % 2 == 0)',
          'cout << n << " is even" << endl;',
        ],
        tests: [
          { stdin: '8\n', expected: '8 is even\n' },
          { stdin: '7\n', expected: '7 is odd\n' },
          { stdin: '0\n', expected: '0 is even\n', hidden: true },
          { stdin: '1313\n', expected: '1313 is odd\n', hidden: true },
        ],
        require: [{ pattern: '%', message: 'Use % to check the remainder.' }],
        xp: 20,
      },
      {
        id: 'w4e3',
        title: 'Set Size Sorter',
        story: 'The shop sorts sets onto shelves by piece count. Write the label printer.',
        concept: md`
          When there are more than two choices, chain them with \`else if\`:

          \`\`\`cpp
          if (temp < 0) {
              cout << "Freezing" << endl;
          } else if (temp < 20) {
              cout << "Cool" << endl;
          } else {
              cout << "Warm" << endl;
          }
          \`\`\`

          C++ checks the conditions **from top to bottom** and runs only the **first** one that is true. Everything after it is skipped.

          That's why the order matters: in the example, \`temp < 20\` is only checked if \`temp < 0\` was false, so "Cool" means "between 0 and 19".

          Test the edges! If a rule says "less than 100", check what happens at exactly 99 and 100.
        `,
        task: md`
          Read the number of pieces and print one label:

          - fewer than 100 → \`Small set\`
          - fewer than 500 → \`Medium set\`
          - fewer than 1000 → \`Large set\`
          - otherwise → \`Mega set\`

          Input \`750\` gives \`Large set\`.
        `,
        starter: cpp`
          #include <iostream>
          using namespace std;

          int main() {
              int pieces;
              cin >> pieces;
              // your code here

              return 0;
          }
        `,
        solution: cpp`
          #include <iostream>
          using namespace std;

          int main() {
              int pieces;
              cin >> pieces;
              if (pieces < 100) {
                  cout << "Small set" << endl;
              } else if (pieces < 500) {
                  cout << "Medium set" << endl;
              } else if (pieces < 1000) {
                  cout << "Large set" << endl;
              } else {
                  cout << "Mega set" << endl;
              }
              return 0;
          }
        `,
        hints: [
          'You need one if, two else ifs and one else.',
          'Start with the smallest: if (pieces < 100) ... else if (pieces < 500) ...',
          'The final else catches everything 1000 and above: Mega set.',
        ],
        tests: [
          { stdin: '50\n', expected: 'Small set\n' },
          { stdin: '750\n', expected: 'Large set\n' },
          { stdin: '100\n', expected: 'Medium set\n', hidden: true },
          { stdin: '499\n', expected: 'Medium set\n', hidden: true },
          { stdin: '1000\n', expected: 'Mega set\n', hidden: true },
          { stdin: '9090\n', expected: 'Mega set\n', hidden: true },
        ],
        require: [{ pattern: 'else\\s+if', message: 'Use an else if chain.' }],
        xp: 25,
      },
      {
        id: 'w4e4',
        title: 'Leap Year Bricks',
        story: 'LEGO was founded in 1932. Was that a leap year? Build a checker that works for any year!',
        concept: md`
          Combine conditions with **logical operators**:

          - \`&&\` AND: true only if **both** sides are true
          - \`||\` OR: true if **at least one** side is true
          - \`!\` NOT: flips true and false

          \`\`\`cpp
          if (age >= 8 && age <= 14) { ... }   // between 8 and 14
          if (day == 6 || day == 7) { ... }    // weekend
          \`\`\`

          Use brackets to make the meaning clear, just like in maths:

          \`\`\`cpp
          if ((a > 0 && b > 0) || c == 0) { ... }
          \`\`\`

          The leap year rule: a year is a leap year if it is divisible by 4 **and not** by 100 - **or** if it is divisible by 400. So 2024 is a leap year, 1900 is not, 2000 is.
        `,
        task: md`
          Read a year and print \`YEAR is a leap year\` or \`YEAR is not a leap year\`. For input \`1932\`:

          \`\`\`
          1932 is a leap year
          \`\`\`
        `,
        starter: cpp`
          #include <iostream>
          using namespace std;

          int main() {
              int year;
              cin >> year;
              // your code here

              return 0;
          }
        `,
        solution: cpp`
          #include <iostream>
          using namespace std;

          int main() {
              int year;
              cin >> year;
              if ((year % 4 == 0 && year % 100 != 0) || year % 400 == 0) {
                  cout << year << " is a leap year" << endl;
              } else {
                  cout << year << " is not a leap year" << endl;
              }
              return 0;
          }
        `,
        hints: [
          '"Divisible by 4" means year % 4 == 0.',
          '"Not divisible by 100" means year % 100 != 0.',
          'if ((year % 4 == 0 && year % 100 != 0) || year % 400 == 0)',
        ],
        tests: [
          { stdin: '1932\n', expected: '1932 is a leap year\n' },
          { stdin: '2023\n', expected: '2023 is not a leap year\n' },
          { stdin: '1900\n', expected: '1900 is not a leap year\n', hidden: true },
          { stdin: '2000\n', expected: '2000 is a leap year\n', hidden: true },
          { stdin: '2024\n', expected: '2024 is a leap year\n', hidden: true },
        ],
        require: [{ pattern: '&&|\\|\\|', message: 'Combine your conditions with && and/or ||.' }],
        xp: 25,
      },
      {
        id: 'w4e5',
        title: 'Colour Codes',
        story: 'The sorting machine reads a one-letter colour code from each brick. Translate it!',
        concept: md`
          When you compare one variable against many exact values, \`switch\` is neat:

          \`\`\`cpp
          switch (day) {
              case 1:
                  cout << "Monday" << endl;
                  break;
              case 2:
                  cout << "Tuesday" << endl;
                  break;
              default:
                  cout << "Some other day" << endl;
          }
          \`\`\`

          - Each \`case\` is one possible value.
          - \`break\` jumps out of the switch. **Forget it** and C++ keeps running into the next case ("fall-through") - a classic bug!
          - \`default\` runs when no case matches.

          \`switch\` works with whole numbers and \`char\`s (like \`case 'r':\`), but not with strings.
        `,
        task: md`
          Read one character and print the colour name:

          - \`r\` → \`Red\`
          - \`b\` → \`Blue\`
          - \`y\` → \`Yellow\`
          - \`g\` → \`Green\`
          - anything else → \`Unknown colour\`

          Use a \`switch\`.
        `,
        starter: cpp`
          #include <iostream>
          using namespace std;

          int main() {
              char code;
              cin >> code;
              // your code here

              return 0;
          }
        `,
        solution: cpp`
          #include <iostream>
          using namespace std;

          int main() {
              char code;
              cin >> code;
              switch (code) {
                  case 'r':
                      cout << "Red" << endl;
                      break;
                  case 'b':
                      cout << "Blue" << endl;
                      break;
                  case 'y':
                      cout << "Yellow" << endl;
                      break;
                  case 'g':
                      cout << "Green" << endl;
                      break;
                  default:
                      cout << "Unknown colour" << endl;
              }
              return 0;
          }
        `,
        hints: [
          'Start with switch (code) { ... }',
          "Each colour is a case with a char in single quotes: case 'r':",
          "Don't forget break; after each cout, and a default: for unknown codes.",
        ],
        tests: [
          { stdin: 'r\n', expected: 'Red\n' },
          { stdin: 'y\n', expected: 'Yellow\n' },
          { stdin: 'x\n', expected: 'Unknown colour\n' },
          { stdin: 'b\n', expected: 'Blue\n', hidden: true },
          { stdin: 'g\n', expected: 'Green\n', hidden: true },
          { stdin: 'R\n', expected: 'Unknown colour\n', hidden: true },
        ],
        require: [{ pattern: '\\bswitch\\s*\\(', message: 'Use a switch statement.' }],
        xp: 25,
      },
    ],
  },

  // =======================================================================
  // WORLD 5
  // =======================================================================
  {
    id: 'w5',
    title: 'Loop Factory',
    color: '#fe8a18',
    icon: '🔁',
    intro:
      'Welcome to the factory, where machines repeat the same job thousands of times without getting bored. Loops let your program repeat code: counting, adding up, and stacking bricks into towers and pyramids. This is where programming gets really powerful.',
    exercises: [
      {
        id: 'w5e1',
        title: 'Rocket Countdown',
        story: 'The LEGO space rocket is on the launch pad. Start the countdown!',
        concept: md`
          A \`while\` loop repeats its body **as long as** the condition is true:

          \`\`\`cpp
          int n = 3;
          while (n > 0) {
              cout << n << endl;
              n--;            // n = n - 1
          }
          cout << "Done" << endl;
          \`\`\`

          prints \`3\`, \`2\`, \`1\`, then \`Done\`.

          How it runs: check condition → run body → check again → ... When the condition becomes false, the program continues after the loop.

          Make sure something in the body changes the condition! If \`n\` never got smaller, the loop would run forever (an **infinite loop**).
        `,
        task: md`
          Read a number \`n\`. Count down from \`n\` to \`1\`, one number per line, then print \`Liftoff!\`. For input \`3\`:

          \`\`\`
          3
          2
          1
          Liftoff!
          \`\`\`

          Use a \`while\` loop. (If \`n\` is 0, only \`Liftoff!\` is printed.)
        `,
        starter: cpp`
          #include <iostream>
          using namespace std;

          int main() {
              int n;
              cin >> n;
              // your code here

              return 0;
          }
        `,
        solution: cpp`
          #include <iostream>
          using namespace std;

          int main() {
              int n;
              cin >> n;
              while (n > 0) {
                  cout << n << endl;
                  n--;
              }
              cout << "Liftoff!" << endl;
              return 0;
          }
        `,
        hints: [
          'Loop while n is bigger than 0.',
          'Inside the loop: print n, then make it one smaller with n--;',
          'After the loop (outside the braces) print Liftoff!',
        ],
        tests: [
          { stdin: '3\n', expected: '3\n2\n1\nLiftoff!\n' },
          { stdin: '5\n', expected: '5\n4\n3\n2\n1\nLiftoff!\n' },
          { stdin: '1\n', expected: '1\nLiftoff!\n', hidden: true },
          { stdin: '0\n', expected: 'Liftoff!\n', hidden: true },
        ],
        require: [{ pattern: '\\bwhile\\s*\\(', message: 'Use a while loop.' }],
        xp: 25,
      },
      {
        id: 'w5e2',
        title: 'Stud Adder',
        story: 'Row 1 has 1 stud, row 2 has 2, row 3 has 3... How many studs on a triangle of n rows?',
        concept: md`
          A \`for\` loop packs the three parts of counting into one line:

          \`\`\`cpp
          for (int i = 1; i <= 5; i++) {
              cout << i << " ";
          }
          // prints: 1 2 3 4 5
          \`\`\`

          1. \`int i = 1\` - **start**: runs once at the beginning
          2. \`i <= 5\` - **condition**: checked before every round
          3. \`i++\` - **step**: runs after every round

          A super common pattern is the **running total**: start a variable at 0 and add to it in every round.

          \`\`\`cpp
          int total = 0;
          for (int i = 1; i <= 3; i++) {
              total += i;     // 0+1, then +2, then +3
          }
          cout << total;      // 6
          \`\`\`
        `,
        task: md`
          Read \`n\` and print the sum \`1 + 2 + ... + n\`. For input \`5\`:

          \`\`\`
          Sum: 15
          \`\`\`

          Use a \`for\` loop.
        `,
        starter: cpp`
          #include <iostream>
          using namespace std;

          int main() {
              int n;
              cin >> n;
              int total = 0;
              // your loop here

              return 0;
          }
        `,
        solution: cpp`
          #include <iostream>
          using namespace std;

          int main() {
              int n;
              cin >> n;
              int total = 0;
              for (int i = 1; i <= n; i++) {
                  total += i;
              }
              cout << "Sum: " << total << endl;
              return 0;
          }
        `,
        hints: [
          'Loop i from 1 up to and including n.',
          'Inside the loop add i to total: total += i;',
          'Print "Sum: " and total after the loop finishes.',
        ],
        tests: [
          { stdin: '5\n', expected: 'Sum: 15\n' },
          { stdin: '10\n', expected: 'Sum: 55\n' },
          { stdin: '1\n', expected: 'Sum: 1\n', hidden: true },
          { stdin: '100\n', expected: 'Sum: 5050\n', hidden: true },
        ],
        require: [{ pattern: '\\bfor\\s*\\(', message: 'Use a for loop.' }],
        xp: 25,
      },
      {
        id: 'w5e3',
        title: 'Brick Staircase',
        story: 'Build a staircase where every step is one brick taller than the last.',
        concept: md`
          You can put a loop **inside** another loop. These are **nested loops**:

          \`\`\`cpp
          for (int row = 1; row <= 3; row++) {
              for (int col = 1; col <= 4; col++) {
                  cout << "*";
              }
              cout << endl;
          }
          \`\`\`

          prints 3 rows of \`****\`. The inner loop runs completely for **every** round of the outer loop: 3 × 4 = 12 stars.

          The inner loop can also depend on the outer one. If the inner loop goes up to \`row\` instead of 4, each row gets longer:

          \`\`\`
          *
          **
          ***
          \`\`\`

          Tip: the \`endl\` belongs to the **outer** loop - one new line per row.
        `,
        task: md`
          Read \`n\` and print a staircase of \`n\` rows. Row 1 has one brick \`[#]\`, row 2 has two, and so on. For input \`3\`:

          \`\`\`
          [#]
          [#][#]
          [#][#][#]
          \`\`\`
        `,
        starter: cpp`
          #include <iostream>
          using namespace std;

          int main() {
              int n;
              cin >> n;
              // your nested loops here

              return 0;
          }
        `,
        solution: cpp`
          #include <iostream>
          using namespace std;

          int main() {
              int n;
              cin >> n;
              for (int row = 1; row <= n; row++) {
                  for (int b = 1; b <= row; b++) {
                      cout << "[#]";
                  }
                  cout << endl;
              }
              return 0;
          }
        `,
        hints: [
          'The outer loop counts rows from 1 to n.',
          'The inner loop prints "[#]" exactly row times.',
          'After the inner loop, print endl to start the next row.',
        ],
        tests: [
          { stdin: '3\n', expected: '[#]\n[#][#]\n[#][#][#]\n' },
          { stdin: '1\n', expected: '[#]\n' },
          { stdin: '5\n', expected: '[#]\n[#][#]\n[#][#][#]\n[#][#][#][#]\n[#][#][#][#][#]\n', hidden: true },
        ],
        require: [{ pattern: '\\b(for|while)\\b[\\s\\S]*\\b(for|while)\\b', message: 'Use nested loops (a loop inside a loop).' }],
        xp: 30,
      },
      {
        id: 'w5e4',
        title: 'Pyramid Builder',
        story: 'The pharaoh of Brick Egypt wants a perfectly centred pyramid.',
        concept: md`
          To centre a shape, each row needs some **spaces** first, then the bricks. Let's look at a pyramid of 4 rows (dots show the spaces):

          \`\`\`
          ...#       row 1: 3 spaces, 1 brick
          ..###      row 2: 2 spaces, 3 bricks
          .#####     row 3: 1 space,  5 bricks
          #######    row 4: 0 spaces, 7 bricks
          \`\`\`

          Find the pattern for row \`i\` (with \`n\` rows):

          - spaces: \`n - i\`
          - bricks: \`2 * i - 1\`

          So each row needs **two** inner loops, one after the other: one for the spaces, one for the bricks. Then \`endl\`.

          Finding the pattern with a little table like this is what real programmers do before writing the loops!
        `,
        task: md`
          Read \`n\` and print a pyramid of \`#\` with \`n\` rows. For input \`3\`:

          \`\`\`
            #
           ###
          #####
          \`\`\`

          (two spaces before the first \`#\`, one before the \`###\`)
        `,
        starter: cpp`
          #include <iostream>
          using namespace std;

          int main() {
              int n;
              cin >> n;
              // your code here

              return 0;
          }
        `,
        solution: cpp`
          #include <iostream>
          using namespace std;

          int main() {
              int n;
              cin >> n;
              for (int i = 1; i <= n; i++) {
                  for (int s = 0; s < n - i; s++) {
                      cout << " ";
                  }
                  for (int h = 0; h < 2 * i - 1; h++) {
                      cout << "#";
                  }
                  cout << endl;
              }
              return 0;
          }
        `,
        hints: [
          'Outer loop: i from 1 to n. Inside it you need two separate loops.',
          'First inner loop prints n - i spaces, second prints 2 * i - 1 hashes.',
          'for (int s = 0; s < n - i; s++) cout << " ";   then   for (int h = 0; h < 2 * i - 1; h++) cout << "#";',
        ],
        tests: [
          { stdin: '3\n', expected: '  #\n ###\n#####\n' },
          { stdin: '1\n', expected: '#\n' },
          { stdin: '4\n', expected: '   #\n  ###\n #####\n#######\n', hidden: true },
          { stdin: '6\n', expected: '     #\n    ###\n   #####\n  #######\n #########\n###########\n', hidden: true },
        ],
        xp: 30,
      },
      {
        id: 'w5e5',
        title: 'Quality Control',
        story: 'Bricks with a negative weight are broken and must be skipped. A 0 means the belt has stopped.',
        concept: md`
          Two keywords control loops from the inside:

          - \`break\` - stop the loop **completely**, right now.
          - \`continue\` - skip the rest of **this round** and jump to the next one.

          \`\`\`cpp
          for (int i = 1; i <= 10; i++) {
              if (i == 3) continue;   // skip 3
              if (i == 6) break;      // stop at 6
              cout << i << " ";
          }
          // prints: 1 2 4 5
          \`\`\`

          To read numbers until the input runs out, put \`cin\` in the condition:

          \`\`\`cpp
          int x;
          while (cin >> x) {
              // runs once per number read
          }
          \`\`\`
        `,
        task: md`
          Read numbers one by one. Add up the **positive** ones. Skip negative numbers with \`continue\`. When you read a \`0\`, stop with \`break\` (ignore anything after it). Then print the total. For input \`5 -2 7 0 9\`:

          \`\`\`
          Total: 12
          \`\`\`
        `,
        starter: cpp`
          #include <iostream>
          using namespace std;

          int main() {
              int total = 0;
              int x;
              while (cin >> x) {
                  // your code here
              }
              cout << "Total: " << total << endl;
              return 0;
          }
        `,
        solution: cpp`
          #include <iostream>
          using namespace std;

          int main() {
              int total = 0;
              int x;
              while (cin >> x) {
                  if (x == 0) {
                      break;
                  }
                  if (x < 0) {
                      continue;
                  }
                  total += x;
              }
              cout << "Total: " << total << endl;
              return 0;
          }
        `,
        hints: [
          'Inside the loop, first check for 0, then for negative numbers.',
          'if (x == 0) break;   and   if (x < 0) continue;',
          'Anything that survives both checks gets added: total += x;',
        ],
        tests: [
          { stdin: '5 -2 7 0 9\n', expected: 'Total: 12\n' },
          { stdin: '0\n', expected: 'Total: 0\n' },
          { stdin: '3 3 3 -10 0\n', expected: 'Total: 9\n', hidden: true },
          { stdin: '-1 -2 4 0 100\n', expected: 'Total: 4\n', hidden: true },
        ],
        require: [
          { pattern: '\\bbreak\\b', message: 'Use break to stop at 0.' },
          { pattern: '\\bcontinue\\b', message: 'Use continue to skip negative numbers.' },
        ],
        xp: 30,
      },
      {
        id: 'w5e6',
        title: 'Digit Counter',
        story: 'The serial number printer needs to know how many digits each part number has.',
        concept: md`
          A \`do-while\` loop checks its condition at the **end**, so the body always runs **at least once**:

          \`\`\`cpp
          int n = 0;
          do {
              cout << "Hello" << endl;
          } while (n > 0);
          // prints Hello once, even though n > 0 is false
          \`\`\`

          Note the semicolon after \`while (...)\`!

          Counting digits: dividing by 10 chops off the last digit (integer division!):

          \`\`\`
          1234 / 10 = 123
           123 / 10 = 12
            12 / 10 = 1
             1 / 10 = 0
          \`\`\`

          4 divisions until we hit 0 → 4 digits. But the number \`0\` has 1 digit, even though it is already 0. That's exactly where \`do-while\` shines!
        `,
        task: md`
          Read a whole number (0 or more) and print how many digits it has. Use a \`do-while\` loop. For input \`12345\`:

          \`\`\`
          Digits: 5
          \`\`\`

          For input \`0\` the answer is \`Digits: 1\`.
        `,
        starter: cpp`
          #include <iostream>
          using namespace std;

          int main() {
              int n;
              cin >> n;
              int digits = 0;
              // your do-while loop here

              cout << "Digits: " << digits << endl;
              return 0;
          }
        `,
        solution: cpp`
          #include <iostream>
          using namespace std;

          int main() {
              int n;
              cin >> n;
              int digits = 0;
              do {
                  digits++;
                  n /= 10;
              } while (n > 0);
              cout << "Digits: " << digits << endl;
              return 0;
          }
        `,
        hints: [
          'In each round: count one digit and chop the last digit off.',
          'digits++;  and  n /= 10;  (n = n / 10)',
          'do { digits++; n /= 10; } while (n > 0);',
        ],
        tests: [
          { stdin: '12345\n', expected: 'Digits: 5\n' },
          { stdin: '0\n', expected: 'Digits: 1\n' },
          { stdin: '7\n', expected: 'Digits: 1\n', hidden: true },
          { stdin: '1000\n', expected: 'Digits: 4\n', hidden: true },
          { stdin: '987654321\n', expected: 'Digits: 9\n', hidden: true },
        ],
        require: [{ pattern: '\\bdo\\b', message: 'Use a do-while loop for this one.' }],
        xp: 30,
      },
    ],
  },

  // =======================================================================
  // WORLD 6
  // =======================================================================
  {
    id: 'w6',
    title: 'Function Builders',
    color: '#81007b',
    icon: '🔧',
    intro:
      'Big LEGO models are built from smaller sub-assemblies: a wheel unit, a cockpit, a wing. Functions are the sub-assemblies of programs. You build a piece of code once, give it a name, and use it as many times as you like. You will even meet functions that use themselves!',
    exercises: [
      {
        id: 'w6e1',
        title: 'Stud Function',
        story: 'You keep calculating studs on bricks. Build a reusable stud calculator!',
        concept: md`
          A **function** is a named mini-program. You give it inputs (**parameters**) and it gives back a result (the **return value**):

          \`\`\`cpp
          int square(int x) {
              return x * x;
          }

          int main() {
              cout << square(4) << endl;   // 16
              cout << square(9) << endl;   // 81
              return 0;
          }
          \`\`\`

          - \`int\` before the name: the **type** of the result.
          - \`(int x)\`: the parameter list. Several parameters are separated by commas: \`(int a, int b)\`.
          - \`return\` sends the result back to whoever **called** the function.

          Write the function **above** \`main\`, so C++ knows about it before \`main\` uses it.
        `,
        task: md`
          Write a function \`int studs(int width, int length)\` that returns the number of studs on a brick. Then read the sizes of **two** bricks (4 numbers: \`w1 l1 w2 l2\`) and print, using your function. For input \`2 4 1 6\`:

          \`\`\`
          Brick 1: 8 studs
          Brick 2: 6 studs
          Total: 14 studs
          \`\`\`
        `,
        starter: cpp`
          #include <iostream>
          using namespace std;

          // write your studs function here

          int main() {
              int w1, l1, w2, l2;
              cin >> w1 >> l1 >> w2 >> l2;
              // your code here

              return 0;
          }
        `,
        solution: cpp`
          #include <iostream>
          using namespace std;

          int studs(int width, int length) {
              return width * length;
          }

          int main() {
              int w1, l1, w2, l2;
              cin >> w1 >> l1 >> w2 >> l2;
              int a = studs(w1, l1);
              int b = studs(w2, l2);
              cout << "Brick 1: " << a << " studs" << endl;
              cout << "Brick 2: " << b << " studs" << endl;
              cout << "Total: " << a + b << " studs" << endl;
              return 0;
          }
        `,
        hints: [
          'The function body only needs one line: return width * length;',
          'Call it like this: int a = studs(w1, l1);',
          'The total is studs(w1, l1) + studs(w2, l2).',
        ],
        tests: [
          { stdin: '2 4 1 6\n', expected: 'Brick 1: 8 studs\nBrick 2: 6 studs\nTotal: 14 studs\n' },
          { stdin: '1 1 2 2\n', expected: 'Brick 1: 1 studs\nBrick 2: 4 studs\nTotal: 5 studs\n' },
          { stdin: '6 8 16 16\n', expected: 'Brick 1: 48 studs\nBrick 2: 256 studs\nTotal: 304 studs\n', hidden: true },
        ],
        require: [
          { pattern: '\\bint\\s+studs\\s*\\(\\s*int\\s+\\w+\\s*,\\s*int\\s+\\w+\\s*\\)', message: 'Write a function int studs(int width, int length).' },
          { pattern: '\\breturn\\b[^;]*\\*', message: 'The studs function should return width * length.' },
        ],
        xp: 30,
      },
      {
        id: 'w6e2',
        title: 'Brick Printer',
        story: 'The display screen needs to draw bricks of different widths again and again.',
        concept: md`
          Some functions **do** something instead of calculating a result - like printing. They don't return anything, so their return type is \`void\` ("empty"):

          \`\`\`cpp
          void sayHi(string name) {
              cout << "Hi, " << name << "!" << endl;
          }

          int main() {
              sayHi("Emmet");
              sayHi("Lucy");
              return 0;
          }
          \`\`\`

          A \`void\` function doesn't need a \`return\` statement - it simply ends at its closing \`}\`.

          Functions can contain loops, ifs, variables - anything \`main\` can. And their variables are **local**: a variable created inside a function only exists inside that function.
        `,
        task: md`
          Write \`void printBrick(int width)\` that prints \`[\`, then \`width\` letters \`o\`, then \`]\` and a new line. Read \`n\` and call it for widths 1 to \`n\`. For input \`3\`:

          \`\`\`
          [o]
          [oo]
          [ooo]
          \`\`\`
        `,
        starter: cpp`
          #include <iostream>
          using namespace std;

          // write printBrick here

          int main() {
              int n;
              cin >> n;
              // call printBrick in a loop

              return 0;
          }
        `,
        solution: cpp`
          #include <iostream>
          using namespace std;

          void printBrick(int width) {
              cout << "[";
              for (int i = 0; i < width; i++) {
                  cout << "o";
              }
              cout << "]" << endl;
          }

          int main() {
              int n;
              cin >> n;
              for (int w = 1; w <= n; w++) {
                  printBrick(w);
              }
              return 0;
          }
        `,
        hints: [
          'Inside printBrick: print "[", loop width times printing "o", then print "]" and endl.',
          'In main: for (int w = 1; w <= n; w++) { ... }',
          'Call the function inside the loop with: printBrick(w);',
        ],
        tests: [
          { stdin: '3\n', expected: '[o]\n[oo]\n[ooo]\n' },
          { stdin: '1\n', expected: '[o]\n' },
          { stdin: '6\n', expected: '[o]\n[oo]\n[ooo]\n[oooo]\n[ooooo]\n[oooooo]\n', hidden: true },
        ],
        require: [
          { pattern: '\\bvoid\\s+printBrick\\s*\\(\\s*int\\s+\\w+\\s*\\)', message: 'Write a function void printBrick(int width).' },
          { pattern: 'printBrick\\s*\\(\\s*\\w+\\s*\\)\\s*;', message: 'Call printBrick from main.' },
        ],
        xp: 30,
      },
      {
        id: 'w6e3',
        title: 'Tallest Tower',
        story: 'Three builders made towers. The judge needs a function that finds the tallest one.',
        concept: md`
          A function can have several \`return\` statements. The **first** one that runs ends the function immediately:

          \`\`\`cpp
          int bigger(int a, int b) {
              if (a > b) {
                  return a;    // function stops here if a > b
              }
              return b;
          }
          \`\`\`

          You can call functions inside other expressions, and even pass one call into another:

          \`\`\`cpp
          cout << bigger(3, 8) + 1;          // 9
          cout << bigger(bigger(4, 9), 2);   // 9
          \`\`\`

          Tip: think about **ties** - what if two values are equal? A good function still gives the right answer.
        `,
        task: md`
          Write \`int biggest(int a, int b, int c)\` that returns the largest of three numbers. Read three numbers and print the result. For input \`12 30 7\`:

          \`\`\`
          Biggest: 30
          \`\`\`

          Numbers may be negative or equal.
        `,
        starter: cpp`
          #include <iostream>
          using namespace std;

          // write biggest here

          int main() {
              int a, b, c;
              cin >> a >> b >> c;
              // your code here

              return 0;
          }
        `,
        solution: cpp`
          #include <iostream>
          using namespace std;

          int biggest(int a, int b, int c) {
              int best = a;
              if (b > best) {
                  best = b;
              }
              if (c > best) {
                  best = c;
              }
              return best;
          }

          int main() {
              int a, b, c;
              cin >> a >> b >> c;
              cout << "Biggest: " << biggest(a, b, c) << endl;
              return 0;
          }
        `,
        hints: [
          'Start by assuming a is the biggest and store it in a variable.',
          'Then compare b with it, then c - replace it whenever you find something bigger.',
          'int best = a; if (b > best) best = b; if (c > best) best = c; return best;',
        ],
        tests: [
          { stdin: '12 30 7\n', expected: 'Biggest: 30\n' },
          { stdin: '5 2 1\n', expected: 'Biggest: 5\n' },
          { stdin: '1 2 99\n', expected: 'Biggest: 99\n', hidden: true },
          { stdin: '-4 -9 -2\n', expected: 'Biggest: -2\n', hidden: true },
          { stdin: '8 8 3\n', expected: 'Biggest: 8\n', hidden: true },
        ],
        require: [{ pattern: '\\bint\\s+biggest\\s*\\(', message: 'Write a function int biggest(int a, int b, int c).' }],
        xp: 35,
      },
      {
        id: 'w6e4',
        title: 'Swap Station',
        story: 'Two minifigs want to swap their places in the queue. A normal function can\'t do it... but a reference can!',
        concept: md`
          Normally a function gets a **copy** of each argument (**pass by value**). Changing the copy doesn't change the original:

          \`\`\`cpp
          void addTen(int x) { x += 10; }

          int n = 5;
          addTen(n);
          cout << n;   // still 5!
          \`\`\`

          Add \`&\` to the parameter type to **pass by reference**. Now the parameter is another name for the **original** variable:

          \`\`\`cpp
          void addTen(int& x) { x += 10; }

          int n = 5;
          addTen(n);
          cout << n;   // 15
          \`\`\`

          Think of it like this: by value = giving a friend a **photocopy** of your instructions; by reference = giving them the **original** booklet. If they scribble on it, you'll see it!

          To swap two variables you need a temporary helper box, or one value will be lost:

          \`\`\`cpp
          int temp = a;
          a = b;
          b = temp;
          \`\`\`
        `,
        task: md`
          Write \`void swapBricks(int& a, int& b)\` that swaps the two values (write it yourself - don't use the built-in \`swap\`). Read two numbers, print them, swap them with your function, print again. For input \`4 9\`:

          \`\`\`
          Before: 4 9
          After: 9 4
          \`\`\`
        `,
        starter: cpp`
          #include <iostream>
          using namespace std;

          void swapBricks(int a, int b) {
              int temp = a;
              a = b;
              b = temp;
          }

          int main() {
              int x, y;
              cin >> x >> y;
              cout << "Before: " << x << " " << y << endl;
              swapBricks(x, y);
              cout << "After: " << x << " " << y << endl;
              return 0;
          }
        `,
        solution: cpp`
          #include <iostream>
          using namespace std;

          void swapBricks(int& a, int& b) {
              int temp = a;
              a = b;
              b = temp;
          }

          int main() {
              int x, y;
              cin >> x >> y;
              cout << "Before: " << x << " " << y << endl;
              swapBricks(x, y);
              cout << "After: " << x << " " << y << endl;
              return 0;
          }
        `,
        hints: [
          'Run the starter code. Why does it not swap anything?',
          'The function receives copies. Make the parameters references.',
          'Change the first line of the function to: void swapBricks(int& a, int& b)',
        ],
        tests: [
          { stdin: '4 9\n', expected: 'Before: 4 9\nAfter: 9 4\n' },
          { stdin: '1 2\n', expected: 'Before: 1 2\nAfter: 2 1\n' },
          { stdin: '-3 100\n', expected: 'Before: -3 100\nAfter: 100 -3\n', hidden: true },
          { stdin: '7 7\n', expected: 'Before: 7 7\nAfter: 7 7\n', hidden: true },
        ],
        require: [{ pattern: '\\bvoid\\s+swapBricks\\s*\\(\\s*int\\s*&\\s*\\w+\\s*,\\s*int\\s*&\\s*\\w+\\s*\\)', message: 'Write void swapBricks(int& a, int& b) with reference parameters.' }],
        forbid: [{ pattern: '\\bswap\\s*\\(', message: 'Write the swap yourself instead of using the built-in swap().' }],
        xp: 35,
      },
      {
        id: 'w6e5',
        title: 'Factorial Tower',
        story: 'How many different ways can you stack n different coloured bricks? The answer is n! (n factorial) - and it grows FAST.',
        concept: md`
          **Recursion** is when a function calls **itself** to solve a smaller version of the same problem.

          Factorial: \`5! = 5 × 4 × 3 × 2 × 1 = 120\`. Notice that \`5! = 5 × 4!\`, and \`4! = 4 × 3!\`, and so on. By definition \`0! = 1\`.

          \`\`\`cpp
          int factorial(int n) {
              if (n <= 1) {
                  return 1;               // base case: stop here!
              }
              return n * factorial(n - 1); // recursive case
          }
          \`\`\`

          Every recursive function needs:

          1. a **base case** - a simple situation where it answers directly, without calling itself;
          2. a **recursive case** - which calls itself with a **smaller** problem, getting closer to the base case.

          Without a base case the function would call itself forever - like a tower of minifigs each asking the one below "what's the answer?" with nobody at the bottom.
        `,
        task: md`
          Write a **recursive** function \`int factorial(int n)\` (no loops allowed!). Read \`n\` (between 0 and 12) and print. For input \`5\`:

          \`\`\`
          5! = 120
          \`\`\`
        `,
        starter: cpp`
          #include <iostream>
          using namespace std;

          int factorial(int n) {
              // your code here
              return 0;
          }

          int main() {
              int n;
              cin >> n;
              cout << n << "! = " << factorial(n) << endl;
              return 0;
          }
        `,
        solution: cpp`
          #include <iostream>
          using namespace std;

          int factorial(int n) {
              if (n <= 1) {
                  return 1;
              }
              return n * factorial(n - 1);
          }

          int main() {
              int n;
              cin >> n;
              cout << n << "! = " << factorial(n) << endl;
              return 0;
          }
        `,
        hints: [
          'Base case: if n is 0 or 1, the answer is 1.',
          'Otherwise the answer is n times the factorial of n - 1.',
          'return n * factorial(n - 1);',
        ],
        tests: [
          { stdin: '5\n', expected: '5! = 120\n' },
          { stdin: '0\n', expected: '0! = 1\n' },
          { stdin: '1\n', expected: '1! = 1\n', hidden: true },
          { stdin: '10\n', expected: '10! = 3628800\n', hidden: true },
          { stdin: '12\n', expected: '12! = 479001600\n', hidden: true },
        ],
        require: [{ pattern: 'factorial\\s*\\([^)]*\\)\\s*\\{[\\s\\S]*factorial\\s*\\(', message: 'factorial must call itself (recursion).' }],
        forbid: [{ pattern: '\\b(for|while)\\b', message: 'No loops in this one - use recursion!' }],
        xp: 40,
      },
    ],
  },

  // =======================================================================
  // WORLD 7
  // =======================================================================
  {
    id: 'w7',
    title: 'Brick Collections',
    color: '#078bc9',
    icon: '🗃️',
    intro:
      'One variable holds one value. But a builder has hundreds of bricks! Arrays and vectors are like storage drawers with numbered compartments, holding many values under a single name. Combined with loops they let you find the biggest, sort, count, and even map out a whole baseplate.',
    exercises: [
      {
        id: 'w7e1',
        title: 'Brick Drawer',
        story: 'Your storage drawer has 5 compartments. Fill them, then empty them back to front.',
        concept: md`
          An **array** stores many values of the same type in a row:

          \`\`\`cpp
          int heights[5] = {3, 8, 1, 6, 4};
          \`\`\`

          Each compartment has a number called an **index**. Indexes start at **0**!

          \`\`\`
          index:   0  1  2  3  4
          value:   3  8  1  6  4
          \`\`\`

          So \`heights[0]\` is 3 and \`heights[4]\` is 4. There is **no** \`heights[5]\` - using it is a bug (the drawer only has 5 compartments: 0 to 4).

          Loops and arrays are best friends:

          \`\`\`cpp
          int a[5];
          for (int i = 0; i < 5; i++) {
              cin >> a[i];       // fill compartment i
          }
          \`\`\`

          Note \`i < 5\`, not \`i <= 5\` - that would be one step too far (an **off-by-one** error).
        `,
        task: md`
          Read exactly 5 numbers into an array \`int a[5]\`. Print them in **reverse** order on one line, separated by spaces. For input \`1 2 3 4 5\`:

          \`\`\`
          5 4 3 2 1
          \`\`\`
        `,
        starter: cpp`
          #include <iostream>
          using namespace std;

          int main() {
              int a[5];
              // read 5 numbers, then print them backwards

              return 0;
          }
        `,
        solution: cpp`
          #include <iostream>
          using namespace std;

          int main() {
              int a[5];
              for (int i = 0; i < 5; i++) {
                  cin >> a[i];
              }
              for (int i = 4; i >= 0; i--) {
                  cout << a[i] << " ";
              }
              cout << endl;
              return 0;
          }
        `,
        hints: [
          'First loop: i from 0 to 4, reading cin >> a[i];',
          'Second loop counts down: start at i = 4, keep going while i >= 0, and use i--.',
          'Print a[i] << " " inside the second loop, and endl after it.',
        ],
        tests: [
          { stdin: '1 2 3 4 5\n', expected: '5 4 3 2 1\n' },
          { stdin: '10 20 30 40 50\n', expected: '50 40 30 20 10\n' },
          { stdin: '7 -1 7 0 3\n', expected: '3 0 7 -1 7\n', hidden: true },
        ],
        require: [{ pattern: '\\[\\s*5\\s*\\]', message: 'Store the numbers in an array: int a[5];' }],
        xp: 35,
      },
      {
        id: 'w7e2',
        title: 'Highs and Lows',
        story: 'The Brick Olympics high-jump results are in. Find the best and the worst jump!',
        concept: md`
          A \`vector\` is like an array that can **grow**. Add \`#include <vector>\`:

          \`\`\`cpp
          vector<int> jumps;        // empty vector of ints
          jumps.push_back(12);      // add to the end
          jumps.push_back(30);
          cout << jumps.size();     // 2
          cout << jumps[1];         // 30
          \`\`\`

          You can also create it with a size: \`vector<int> v(n);\` makes \`n\` compartments, all 0.

          To find the **largest** value, keep a "best so far" variable. Start it at the **first element** (not at 0 - what if all values are negative?), then check every element:

          \`\`\`cpp
          int best = v[0];
          for (int i = 1; i < v.size(); i++) {
              if (v[i] > best) {
                  best = v[i];
              }
          }
          \`\`\`
        `,
        task: md`
          The first number is \`n\` (at least 1), followed by \`n\` numbers. Store them in a \`vector<int>\`, then print the largest and smallest. For input \`4 12 30 7 18\`:

          \`\`\`
          Max: 30
          Min: 7
          \`\`\`
        `,
        starter: cpp`
          #include <iostream>
          #include <vector>
          using namespace std;

          int main() {
              int n;
              cin >> n;
              vector<int> v(n);
              // read the numbers, then find max and min

              return 0;
          }
        `,
        solution: cpp`
          #include <iostream>
          #include <vector>
          using namespace std;

          int main() {
              int n;
              cin >> n;
              vector<int> v(n);
              for (int i = 0; i < n; i++) {
                  cin >> v[i];
              }
              int biggest = v[0];
              int smallest = v[0];
              for (int i = 1; i < n; i++) {
                  if (v[i] > biggest) {
                      biggest = v[i];
                  }
                  if (v[i] < smallest) {
                      smallest = v[i];
                  }
              }
              cout << "Max: " << biggest << endl;
              cout << "Min: " << smallest << endl;
              return 0;
          }
        `,
        hints: [
          'First fill the vector with a loop: cin >> v[i];',
          'Start both biggest and smallest at v[0].',
          'In a second loop, update biggest when v[i] > biggest and smallest when v[i] < smallest.',
        ],
        tests: [
          { stdin: '4 12 30 7 18\n', expected: 'Max: 30\nMin: 7\n' },
          { stdin: '1 5\n', expected: 'Max: 5\nMin: 5\n' },
          { stdin: '5 -3 -8 -1 -20 -4\n', expected: 'Max: -1\nMin: -20\n', hidden: true },
          { stdin: '6 9 9 2 9 2 4\n', expected: 'Max: 9\nMin: 2\n', hidden: true },
        ],
        require: [{ pattern: 'vector\\s*<\\s*int\\s*>', message: 'Store the numbers in a vector<int>.' }],
        xp: 35,
      },
      {
        id: 'w7e3',
        title: 'Average Builder',
        story: 'Builders keep sending in their brick counts. Nobody knows how many will come - collect them all!',
        concept: md`
          When you don't know how many values are coming, read until the input ends and \`push_back\` each one:

          \`\`\`cpp
          vector<int> v;
          int x;
          while (cin >> x) {
              v.push_back(x);
          }
          \`\`\`

          A **range-for** loop visits every element without needing an index:

          \`\`\`cpp
          int sum = 0;
          for (int x : v) {
              sum += x;
          }
          \`\`\`

          Read it as "for each \`x\` in \`v\`".

          For an average, remember integer division! Turn the sum into a \`double\` first:

          \`\`\`cpp
          double avg = (double)sum / v.size();
          \`\`\`

          And use \`fixed << setprecision(1)\` (from \`<iomanip>\`) to show exactly one decimal.
        `,
        task: md`
          Read whole numbers until the input ends (there is at least one). Print how many there were and their average with **1 decimal**. For input \`1 2\`:

          \`\`\`
          Count: 2
          Average: 1.5
          \`\`\`
        `,
        starter: cpp`
          #include <iostream>
          #include <vector>
          #include <iomanip>
          using namespace std;

          int main() {
              vector<int> v;
              // your code here

              return 0;
          }
        `,
        solution: cpp`
          #include <iostream>
          #include <vector>
          #include <iomanip>
          using namespace std;

          int main() {
              vector<int> v;
              int x;
              while (cin >> x) {
                  v.push_back(x);
              }
              int sum = 0;
              for (int value : v) {
                  sum += value;
              }
              double avg = (double)sum / v.size();
              cout << "Count: " << v.size() << endl;
              cout << fixed << setprecision(1) << "Average: " << avg << endl;
              return 0;
          }
        `,
        hints: [
          'Read with while (cin >> x) and v.push_back(x);',
          'Add everything up with a range-for: for (int value : v) sum += value;',
          'double avg = (double)sum / v.size();  then print with fixed << setprecision(1).',
        ],
        tests: [
          { stdin: '1 2\n', expected: 'Count: 2\nAverage: 1.5\n' },
          { stdin: '4 8 15 16 23 42\n', expected: 'Count: 6\nAverage: 18.0\n' },
          { stdin: '10 20 25\n', expected: 'Count: 3\nAverage: 18.3\n', hidden: true },
          { stdin: '7\n', expected: 'Count: 1\nAverage: 7.0\n', hidden: true },
        ],
        require: [{ pattern: 'push_back\\s*\\(', message: 'Collect the numbers with push_back.' }],
        xp: 40,
      },
      {
        id: 'w7e4',
        title: 'Sorting Machine',
        story: 'A heap of bricks of different lengths needs to be lined up neatly, shortest first.',
        concept: md`
          You don't have to write sorting yourself (yet!). \`<algorithm>\` has a ready-made tool:

          \`\`\`cpp
          #include <algorithm>

          vector<int> v = {5, 2, 9, 1};
          sort(v.begin(), v.end());      // v is now 1 2 5 9
          reverse(v.begin(), v.end());   // v is now 9 5 2 1
          \`\`\`

          \`v.begin()\` and \`v.end()\` tell \`sort\` which part of the vector to work on - here, all of it.

          Printing a vector is something you'll do often:

          \`\`\`cpp
          for (int x : v) {
              cout << x << " ";
          }
          cout << endl;
          \`\`\`

          (A space after the last number is fine here.)
        `,
        task: md`
          Read \`n\`, then \`n\` numbers into a vector. Print them sorted from smallest to biggest, then from biggest to smallest. For input \`4 3 1 4 2\`:

          \`\`\`
          Smallest first: 1 2 3 4
          Biggest first: 4 3 2 1
          \`\`\`
        `,
        starter: cpp`
          #include <iostream>
          #include <vector>
          #include <algorithm>
          using namespace std;

          int main() {
              int n;
              cin >> n;
              vector<int> v(n);
              for (int i = 0; i < n; i++) {
                  cin >> v[i];
              }
              // sort and print

              return 0;
          }
        `,
        solution: cpp`
          #include <iostream>
          #include <vector>
          #include <algorithm>
          using namespace std;

          int main() {
              int n;
              cin >> n;
              vector<int> v(n);
              for (int i = 0; i < n; i++) {
                  cin >> v[i];
              }
              sort(v.begin(), v.end());
              cout << "Smallest first:";
              for (int x : v) {
                  cout << " " << x;
              }
              cout << endl;
              reverse(v.begin(), v.end());
              cout << "Biggest first:";
              for (int x : v) {
                  cout << " " << x;
              }
              cout << endl;
              return 0;
          }
        `,
        hints: [
          'sort(v.begin(), v.end()); sorts from smallest to biggest.',
          'Print "Smallest first:" and then each number with a space in front.',
          'reverse(v.begin(), v.end()); flips the sorted vector, then print it again.',
        ],
        tests: [
          { stdin: '4 3 1 4 2\n', expected: 'Smallest first: 1 2 3 4\nBiggest first: 4 3 2 1\n' },
          { stdin: '1 42\n', expected: 'Smallest first: 42\nBiggest first: 42\n' },
          { stdin: '6 5 -2 5 0 11 3\n', expected: 'Smallest first: -2 0 3 5 5 11\nBiggest first: 11 5 5 3 0 -2\n', hidden: true },
        ],
        require: [{ pattern: '\\bsort\\s*\\(', message: 'Use sort(v.begin(), v.end()).' }],
        xp: 40,
      },
      {
        id: 'w7e5',
        title: 'Colour Census',
        story: 'A big box of mixed bricks arrives. How many of them are your favourite colour?',
        concept: md`
          Vectors can hold any type - including strings:

          \`\`\`cpp
          vector<string> names = {"Emmet", "Lucy", "Benny"};
          names.push_back("Unikitty");
          cout << names.size();   // 4
          \`\`\`

          Strings can be compared with \`==\`, so counting matches is easy:

          \`\`\`cpp
          int count = 0;
          for (string name : names) {
              if (name == "Lucy") {
                  count++;
              }
          }
          \`\`\`

          This "loop + if + counter" pattern is one of the most useful patterns in all of programming. You'll use it for counting votes, scores, letters, and much more.
        `,
        task: md`
          The first word is the colour to look for. After that come brick colours, one word each, until the input ends. Store the bricks in a \`vector<string>\`, then print how many bricks there are and how many match. For input \`red blue red green red\`:

          \`\`\`
          Total bricks: 4
          red: 2
          \`\`\`
        `,
        starter: cpp`
          #include <iostream>
          #include <string>
          #include <vector>
          using namespace std;

          int main() {
              string target;
              cin >> target;
              vector<string> bricks;
              // your code here

              return 0;
          }
        `,
        solution: cpp`
          #include <iostream>
          #include <string>
          #include <vector>
          using namespace std;

          int main() {
              string target;
              cin >> target;
              vector<string> bricks;
              string colour;
              while (cin >> colour) {
                  bricks.push_back(colour);
              }
              int count = 0;
              for (string b : bricks) {
                  if (b == target) {
                      count++;
                  }
              }
              cout << "Total bricks: " << bricks.size() << endl;
              cout << target << ": " << count << endl;
              return 0;
          }
        `,
        hints: [
          'Read the rest of the words with while (cin >> colour) and push_back them.',
          'Loop over the vector and count the ones that are == target.',
          'cout << target << ": " << count << endl;',
        ],
        tests: [
          { stdin: 'red blue red green red\n', expected: 'Total bricks: 4\nred: 2\n' },
          { stdin: 'yellow\nyellow yellow\nblue\nyellow\n', expected: 'Total bricks: 4\nyellow: 3\n' },
          { stdin: 'black white grey\n', expected: 'Total bricks: 2\nblack: 0\n', hidden: true },
          { stdin: 'green green\n', expected: 'Total bricks: 1\ngreen: 1\n', hidden: true },
        ],
        require: [{ pattern: 'vector\\s*<\\s*string\\s*>', message: 'Store the bricks in a vector<string>.' }],
        xp: 40,
      },
      {
        id: 'w7e6',
        title: 'Baseplate Map',
        story: 'Map out a 4x4 baseplate from above: where are the bricks, and how tall are the stacks?',
        concept: md`
          A **2D array** is a grid - an array of rows:

          \`\`\`cpp
          int plate[2][3] = {
              {1, 0, 2},
              {0, 4, 0}
          };
          cout << plate[1][1];   // row 1, column 1 → 4
          \`\`\`

          The first index is the **row**, the second is the **column**. Both start at 0.

          To visit every cell, use nested loops - the outer one for rows, the inner one for columns:

          \`\`\`cpp
          for (int r = 0; r < 2; r++) {
              for (int c = 0; c < 3; c++) {
                  cout << plate[r][c] << " ";
              }
              cout << endl;
          }
          \`\`\`
        `,
        task: md`
          Read a 4x4 grid of numbers into \`int plate[4][4]\`. Each number is the height of a brick stack (0 = empty). Print a map with \`#\` where there is a stack and \`.\` where it's empty, then the total number of bricks (sum of all heights). For input:

          \`\`\`
          0 1 0 0
          2 3 0 1
          0 0 0 0
          1 1 1 1
          \`\`\`

          the output is:

          \`\`\`
          .#..
          ##.#
          ....
          ####
          Total bricks: 10
          \`\`\`
        `,
        starter: cpp`
          #include <iostream>
          using namespace std;

          int main() {
              int plate[4][4];
              // read the grid, print the map and the total

              return 0;
          }
        `,
        solution: cpp`
          #include <iostream>
          using namespace std;

          int main() {
              int plate[4][4];
              for (int r = 0; r < 4; r++) {
                  for (int c = 0; c < 4; c++) {
                      cin >> plate[r][c];
                  }
              }
              int total = 0;
              for (int r = 0; r < 4; r++) {
                  for (int c = 0; c < 4; c++) {
                      if (plate[r][c] > 0) {
                          cout << "#";
                      } else {
                          cout << ".";
                      }
                      total += plate[r][c];
                  }
                  cout << endl;
              }
              cout << "Total bricks: " << total << endl;
              return 0;
          }
        `,
        hints: [
          'Read the grid with two nested loops: cin >> plate[r][c];',
          'Print with two nested loops too: "#" if the height is above 0, otherwise "."',
          'Add every height to a total while you print, and put endl after each row.',
        ],
        tests: [
          { stdin: '0 1 0 0\n2 3 0 1\n0 0 0 0\n1 1 1 1\n', expected: '.#..\n##.#\n....\n####\nTotal bricks: 10\n' },
          { stdin: '0 0 0 0\n0 0 0 0\n0 0 0 0\n0 0 0 0\n', expected: '....\n....\n....\n....\nTotal bricks: 0\n' },
          { stdin: '5 0 0 5\n0 2 2 0\n0 2 2 0\n5 0 0 5\n', expected: '#..#\n.##.\n.##.\n#..#\nTotal bricks: 28\n', hidden: true },
        ],
        require: [{ pattern: '\\[\\s*4\\s*\\]\\s*\\[\\s*4\\s*\\]', message: 'Use a 2D array: int plate[4][4];' }],
        xp: 45,
      },
    ],
  },

  // =======================================================================
  // WORLD 8
  // =======================================================================
  {
    id: 'w8',
    title: 'String Studio',
    color: '#c870a0',
    icon: '🔤',
    intro:
      'Text is everywhere: names, messages, secret codes. A string is really just a row of characters, like a line of 1x1 tiles with letters printed on them. In the String Studio you will take strings apart, flip them around, inspect every letter and even build a secret code machine.',
    exercises: [
      {
        id: 'w8e1',
        title: 'Mirror Writer',
        story: 'The Brick City mirror maze shows every word backwards. Recreate it!',
        concept: md`
          A string is a sequence of \`char\`s, and you can reach each one by **index**, just like an array:

          \`\`\`cpp
          string s = "LEGO";
          cout << s[0];          // L
          cout << s[3];          // O
          cout << s.length();    // 4
          \`\`\`

          The last character is at index \`s.length() - 1\`.

          You can build a new string piece by piece with \`+=\`:

          \`\`\`cpp
          string result = "";
          result += 'H';
          result += 'i';
          cout << result;   // Hi
          \`\`\`

          Looping over all characters:

          \`\`\`cpp
          for (int i = 0; i < s.length(); i++) {
              cout << s[i] << "-";   // L-E-G-O-
          }
          \`\`\`
        `,
        task: md`
          Read one word and print it backwards. Use a loop (not the built-in \`reverse\`). For input \`brick\`:

          \`\`\`
          kcirb
          \`\`\`
        `,
        starter: cpp`
          #include <iostream>
          #include <string>
          using namespace std;

          int main() {
              string word;
              cin >> word;
              // your code here

              return 0;
          }
        `,
        solution: cpp`
          #include <iostream>
          #include <string>
          using namespace std;

          int main() {
              string word;
              cin >> word;
              string backwards = "";
              for (int i = word.length() - 1; i >= 0; i--) {
                  backwards += word[i];
              }
              cout << backwards << endl;
              return 0;
          }
        `,
        hints: [
          'Start a loop at the last index: word.length() - 1.',
          'Count down to 0 with i--.',
          'Either print word[i] directly, or add it to a new string and print that at the end.',
        ],
        tests: [
          { stdin: 'brick\n', expected: 'kcirb\n' },
          { stdin: 'LEGO\n', expected: 'OGEL\n' },
          { stdin: 'a\n', expected: 'a\n', hidden: true },
          { stdin: 'Minifigure\n', expected: 'erugifiniM\n', hidden: true },
        ],
        forbid: [{ pattern: '\\breverse\\s*\\(', message: 'Use a loop instead of reverse() for this exercise.' }],
        xp: 40,
      },
      {
        id: 'w8e2',
        title: 'Vowel Detector',
        story: 'The robot announcer can only pronounce vowels. How many will it get to say?',
        concept: md`
          Each character is a \`char\`, and you compare it with **single** quotes:

          \`\`\`cpp
          char c = s[i];
          if (c == 'a' || c == 'e') { ... }
          \`\`\`

          Upper and lower case are **different** characters: \`'A' != 'a'\`. To treat them the same, convert first with \`tolower\`:

          \`\`\`cpp
          char low = tolower(c);   // 'A' becomes 'a', 'a' stays 'a', '!' stays '!'
          \`\`\`

          There are more handy checks: \`isdigit(c)\`, \`isalpha(c)\` (is it a letter?), \`isupper(c)\`, \`islower(c)\`, \`isspace(c)\`, and \`toupper(c)\`.

          Range-for works on strings too:

          \`\`\`cpp
          for (char c : s) { ... }
          \`\`\`
        `,
        task: md`
          Read a whole line (with \`getline\`) and count its vowels: \`a e i o u\`, in upper **or** lower case. For input \`I love LEGO bricks\`:

          \`\`\`
          Vowels: 6
          \`\`\`
        `,
        starter: cpp`
          #include <iostream>
          #include <string>
          using namespace std;

          int main() {
              string line;
              getline(cin, line);
              int vowels = 0;
              // your code here

              cout << "Vowels: " << vowels << endl;
              return 0;
          }
        `,
        solution: cpp`
          #include <iostream>
          #include <string>
          using namespace std;

          int main() {
              string line;
              getline(cin, line);
              int vowels = 0;
              for (char c : line) {
                  char low = tolower(c);
                  if (low == 'a' || low == 'e' || low == 'i' || low == 'o' || low == 'u') {
                      vowels++;
                  }
              }
              cout << "Vowels: " << vowels << endl;
              return 0;
          }
        `,
        hints: [
          'Loop over every character in the line.',
          'Turn each character into lowercase with tolower(c) so you only need to check 5 letters.',
          "if (low == 'a' || low == 'e' || low == 'i' || low == 'o' || low == 'u') vowels++;",
        ],
        tests: [
          { stdin: 'I love LEGO bricks\n', expected: 'Vowels: 6\n' },
          { stdin: 'Rhythm\n', expected: 'Vowels: 0\n' },
          { stdin: 'AEIOU aeiou\n', expected: 'Vowels: 10\n', hidden: true },
          { stdin: 'Build it, then play!\n', expected: 'Vowels: 5\n', hidden: true },
        ],
        xp: 40,
      },
      {
        id: 'w8e3',
        title: 'Palindrome Detector',
        story: 'Some words read the same both ways, like "level" or "racecar". The Brick Museum collects them!',
        concept: md`
          A **palindrome** reads the same forwards and backwards.

          One clever way to check: compare the first and last characters, then the second and second-to-last, and so on, moving inwards. If any pair differs, it's not a palindrome.

          \`\`\`
          r a c e c a r
          ^           ^    r == r  ✓
            ^       ^      a == a  ✓
              ^   ^        c == c  ✓
          \`\`\`

          In code, character \`i\` pairs with character \`n - 1 - i\`, and you only need to go halfway:

          \`\`\`cpp
          bool same = true;
          for (int i = 0; i < n / 2; i++) {
              if (s[i] != s[n - 1 - i]) {
                  same = false;
              }
          }
          \`\`\`

          A \`bool\` variable used like this is called a **flag**: it starts as true and gets "lowered" when we find a problem.
        `,
        task: md`
          Read one lowercase word and print whether it is a palindrome. For input \`racecar\`:

          \`\`\`
          racecar is a palindrome
          \`\`\`

          For input \`lego\`:

          \`\`\`
          lego is not a palindrome
          \`\`\`
        `,
        starter: cpp`
          #include <iostream>
          #include <string>
          using namespace std;

          int main() {
              string word;
              cin >> word;
              // your code here

              return 0;
          }
        `,
        solution: cpp`
          #include <iostream>
          #include <string>
          using namespace std;

          bool isPalindrome(string s) {
              int n = s.length();
              for (int i = 0; i < n / 2; i++) {
                  if (s[i] != s[n - 1 - i]) {
                      return false;
                  }
              }
              return true;
          }

          int main() {
              string word;
              cin >> word;
              if (isPalindrome(word)) {
                  cout << word << " is a palindrome" << endl;
              } else {
                  cout << word << " is not a palindrome" << endl;
              }
              return 0;
          }
        `,
        hints: [
          'Compare s[i] with s[n - 1 - i], where n is the length.',
          'Use a bool flag (or a bool function) that becomes false as soon as a pair does not match.',
          'Only loop while i < n / 2 - after the middle you would just check the same pairs again.',
        ],
        tests: [
          { stdin: 'racecar\n', expected: 'racecar is a palindrome\n' },
          { stdin: 'lego\n', expected: 'lego is not a palindrome\n' },
          { stdin: 'level\n', expected: 'level is a palindrome\n', hidden: true },
          { stdin: 'ab\n', expected: 'ab is not a palindrome\n', hidden: true },
          { stdin: 'a\n', expected: 'a is a palindrome\n', hidden: true },
          { stdin: 'abba\n', expected: 'abba is a palindrome\n', hidden: true },
        ],
        xp: 45,
      },
      {
        id: 'w8e4',
        title: 'Secret Code Machine',
        story: 'Send secret messages between Brick City HQ and the space station using a Caesar cipher!',
        concept: md`
          Every \`char\` is secretly a number, and letters are numbered in order. So you can do maths with them:

          \`\`\`cpp
          char c = 'a' + 2;      // 'c'
          int pos = 'd' - 'a';   // 3  (d is letter number 3, counting from 0)
          \`\`\`

          The **Caesar cipher** shifts every letter forward in the alphabet. With shift 3: a→d, b→e, ... and at the end it wraps around: x→a, y→b, z→c.

          The wrap-around is a job for \`%\`:

          \`\`\`cpp
          int pos = c - 'a';              // 0..25
          int newPos = (pos + shift) % 26;  // still 0..25
          c = 'a' + newPos;
          \`\`\`

          Do the same with \`'A'\` for capital letters (check with \`islower(c)\` / \`isupper(c)\`), and leave everything else (like \`!\` or digits) unchanged.
        `,
        task: md`
          The first number is the shift (0 to 25). Then come words until the input ends. Encode every word and print them on one line separated by single spaces. Keep upper case upper and lower case lower; other characters stay the same. For input:

          \`\`\`
          3
          hello world
          \`\`\`

          the output is:

          \`\`\`
          khoor zruog
          \`\`\`
        `,
        starter: cpp`
          #include <iostream>
          #include <string>
          using namespace std;

          int main() {
              int shift;
              cin >> shift;
              string word;
              // read and encode every word

              return 0;
          }
        `,
        solution: cpp`
          #include <iostream>
          #include <string>
          using namespace std;

          char encode(char c, int shift) {
              if (islower(c)) {
                  return 'a' + (c - 'a' + shift) % 26;
              }
              if (isupper(c)) {
                  return 'A' + (c - 'A' + shift) % 26;
              }
              return c;
          }

          int main() {
              int shift;
              cin >> shift;
              string word;
              bool first = true;
              while (cin >> word) {
                  for (int i = 0; i < word.length(); i++) {
                      word[i] = encode(word[i], shift);
                  }
                  if (!first) {
                      cout << " ";
                  }
                  cout << word;
                  first = false;
              }
              cout << endl;
              return 0;
          }
        `,
        hints: [
          'Write a helper function char encode(char c, int shift) that handles one character.',
          "For a lowercase c: return 'a' + (c - 'a' + shift) % 26;  and the same idea with 'A' for uppercase.",
          'In main: while (cin >> word) { change every word[i] with encode, then print the word with a space between words }',
        ],
        tests: [
          { stdin: '3\nhello world\n', expected: 'khoor zruog\n' },
          { stdin: '1\nHAL\n', expected: 'IBM\n' },
          { stdin: '13\nLego Rocks!\n', expected: 'Yrtb Ebpxf!\n', hidden: true },
          { stdin: '25\nabc xyz\n', expected: 'zab wxy\n', hidden: true },
          { stdin: '0\nSame Same 123\n', expected: 'Same Same 123\n', hidden: true },
        ],
        require: [{ pattern: '%\\s*26', message: 'Use % 26 to wrap around the alphabet.' }],
        xp: 50,
      },
    ],
  },

  // =======================================================================
  // WORLD 9
  // =======================================================================
  {
    id: 'w9',
    title: 'Struct Sets',
    color: '#a5ca18',
    icon: '🎁',
    intro:
      'A LEGO set has a name, a piece count and a price. Keeping those in three separate variables gets messy fast, especially with a whole shelf of sets. Structs let you design your own data type that bundles related values together, just like a set box bundles all its parts.',
    exercises: [
      {
        id: 'w9e1',
        title: 'Design a Set Box',
        story: 'The shop catalogue needs a tidy way to store each set. Design your own data type!',
        concept: md`
          A \`struct\` lets you create your **own type** that groups several values (called **fields** or **members**):

          \`\`\`cpp
          struct Minifig {
              string name;
              int age;
          };   // ← don't forget this semicolon!
          \`\`\`

          Now \`Minifig\` is a type just like \`int\`. Create a variable and use the **dot** to reach each field:

          \`\`\`cpp
          Minifig hero;
          hero.name = "Emmet";
          hero.age = 22;
          cout << hero.name << " is " << hero.age << endl;
          \`\`\`

          You can also fill all fields at once, in order: \`Minifig hero = {"Emmet", 22};\`

          And \`cin\` can read straight into a field: \`cin >> hero.name;\`
        `,
        task: md`
          Create a \`struct LegoSet\` with fields \`name\` (string), \`pieces\` (int) and \`price\` (double). Read one set (name is one word) and print it, with the price showing 2 decimals. For input \`Titanic 9090 679.99\`:

          \`\`\`
          Name: Titanic
          Pieces: 9090
          Price: $679.99
          \`\`\`
        `,
        starter: cpp`
          #include <iostream>
          #include <string>
          #include <iomanip>
          using namespace std;

          // define struct LegoSet here

          int main() {
              // your code here

              return 0;
          }
        `,
        solution: cpp`
          #include <iostream>
          #include <string>
          #include <iomanip>
          using namespace std;

          struct LegoSet {
              string name;
              int pieces;
              double price;
          };

          int main() {
              LegoSet s;
              cin >> s.name >> s.pieces >> s.price;
              cout << "Name: " << s.name << endl;
              cout << "Pieces: " << s.pieces << endl;
              cout << fixed << setprecision(2) << "Price: $" << s.price << endl;
              return 0;
          }
        `,
        hints: [
          'struct LegoSet { string name; int pieces; double price; };',
          'Create a variable LegoSet s; and read with cin >> s.name >> s.pieces >> s.price;',
          'Print the price with fixed << setprecision(2).',
        ],
        tests: [
          { stdin: 'Titanic 9090 679.99\n', expected: 'Name: Titanic\nPieces: 9090\nPrice: $679.99\n' },
          { stdin: 'Bonsai 878 49.99\n', expected: 'Name: Bonsai\nPieces: 878\nPrice: $49.99\n' },
          { stdin: 'Hogwarts 6020 469.5\n', expected: 'Name: Hogwarts\nPieces: 6020\nPrice: $469.50\n', hidden: true },
          { stdin: 'Tiny 10 5\n', expected: 'Name: Tiny\nPieces: 10\nPrice: $5.00\n', hidden: true },
        ],
        require: [
          { pattern: '\\bstruct\\s+LegoSet\\b', message: 'Define a struct called LegoSet.' },
          { pattern: '\\.\\s*pieces\\b', message: 'Use the dot to reach the fields, like s.pieces.' },
        ],
        xp: 45,
      },
      {
        id: 'w9e2',
        title: 'Set Showdown',
        story: 'Two giant sets go head to head. Which one has more pieces?',
        concept: md`
          Structs can be passed to functions like any other value:

          \`\`\`cpp
          void printFig(Minifig m) {
              cout << m.name << " (" << m.age << ")" << endl;
          }
          \`\`\`

          The function receives a **copy** (pass by value), so changes inside won't affect the original - unless you use \`&\`, as you learned in Function Builders.

          Functions can also **return** a struct, or take two of them and compare:

          \`\`\`cpp
          bool olderThan(Minifig a, Minifig b) {
              return a.age > b.age;
          }
          \`\`\`

          Packing data into a struct makes function signatures short and clear: one parameter instead of three!
        `,
        task: md`
          Use \`struct LegoSet { string name; int pieces; };\` and write \`void printSet(LegoSet s)\` which prints \`NAME (PIECES pieces)\`. Read two sets, print both with \`printSet\`, then the winner (more pieces) or \`It's a tie!\`. For input \`Titanic 9090 Colosseum 9036\`:

          \`\`\`
          Titanic (9090 pieces)
          Colosseum (9036 pieces)
          Winner: Titanic
          \`\`\`
        `,
        starter: cpp`
          #include <iostream>
          #include <string>
          using namespace std;

          struct LegoSet {
              string name;
              int pieces;
          };

          // write printSet here

          int main() {
              LegoSet a, b;
              cin >> a.name >> a.pieces >> b.name >> b.pieces;
              // your code here

              return 0;
          }
        `,
        solution: cpp`
          #include <iostream>
          #include <string>
          using namespace std;

          struct LegoSet {
              string name;
              int pieces;
          };

          void printSet(LegoSet s) {
              cout << s.name << " (" << s.pieces << " pieces)" << endl;
          }

          int main() {
              LegoSet a, b;
              cin >> a.name >> a.pieces >> b.name >> b.pieces;
              printSet(a);
              printSet(b);
              if (a.pieces > b.pieces) {
                  cout << "Winner: " << a.name << endl;
              } else if (b.pieces > a.pieces) {
                  cout << "Winner: " << b.name << endl;
              } else {
                  cout << "It's a tie!" << endl;
              }
              return 0;
          }
        `,
        hints: [
          'void printSet(LegoSet s) { cout << s.name << " (" << s.pieces << " pieces)" << endl; }',
          'Call printSet(a); and printSet(b); in main.',
          'Compare a.pieces and b.pieces with if / else if / else - three possible results.',
        ],
        tests: [
          { stdin: 'Titanic 9090 Colosseum 9036\n', expected: 'Titanic (9090 pieces)\nColosseum (9036 pieces)\nWinner: Titanic\n' },
          { stdin: 'Bonsai 878 Orchid 608\n', expected: 'Bonsai (878 pieces)\nOrchid (608 pieces)\nWinner: Bonsai\n' },
          { stdin: 'Rover 500 Shuttle 2354\n', expected: 'Rover (500 pieces)\nShuttle (2354 pieces)\nWinner: Shuttle\n', hidden: true },
          { stdin: 'Left 100 Right 100\n', expected: "Left (100 pieces)\nRight (100 pieces)\nIt's a tie!\n", hidden: true },
        ],
        require: [{ pattern: '\\bvoid\\s+printSet\\s*\\(\\s*(const\\s+)?LegoSet\\s*&?\\s*\\w+\\s*\\)', message: 'Write a function void printSet(LegoSet s).' }],
        xp: 50,
      },
      {
        id: 'w9e3',
        title: 'Shop Shelf',
        story: 'The whole shelf of the Brick Shop goes into the computer. Time for some statistics!',
        concept: md`
          A \`vector\` of structs is like a table: each element is one row, each field one column.

          \`\`\`cpp
          vector<Minifig> team;
          Minifig m;
          cin >> m.name >> m.age;
          team.push_back(m);

          cout << team[0].name;   // first minifig's name
          \`\`\`

          Looping over it:

          \`\`\`cpp
          for (Minifig m : team) {
              cout << m.name << endl;
          }
          \`\`\`

          To find "the element with the biggest something", remember the **index** (or a copy) of the best one so far, not just the value - then you can print its other fields too:

          \`\`\`cpp
          int oldest = 0;
          for (int i = 1; i < team.size(); i++) {
              if (team[i].age > team[oldest].age) {
                  oldest = i;
              }
          }
          cout << team[oldest].name;
          \`\`\`
        `,
        task: md`
          Read \`n\` (at least 1), then \`n\` sets as \`name pieces price\`. Store them in a \`vector<LegoSet>\`. Print the total number of pieces, the name of the most expensive set and the name of the cheapest one. For input:

          \`\`\`
          3
          Titanic 9090 679.99
          Bonsai 878 49.99
          Colosseum 9036 549.99
          \`\`\`

          the output is:

          \`\`\`
          Total pieces: 19004
          Most expensive: Titanic
          Cheapest: Bonsai
          \`\`\`
        `,
        starter: cpp`
          #include <iostream>
          #include <string>
          #include <vector>
          using namespace std;

          struct LegoSet {
              string name;
              int pieces;
              double price;
          };

          int main() {
              int n;
              cin >> n;
              vector<LegoSet> shelf;
              // your code here

              return 0;
          }
        `,
        solution: cpp`
          #include <iostream>
          #include <string>
          #include <vector>
          using namespace std;

          struct LegoSet {
              string name;
              int pieces;
              double price;
          };

          int main() {
              int n;
              cin >> n;
              vector<LegoSet> shelf;
              for (int i = 0; i < n; i++) {
                  LegoSet s;
                  cin >> s.name >> s.pieces >> s.price;
                  shelf.push_back(s);
              }
              int total = 0;
              int priciest = 0;
              int cheapest = 0;
              for (int i = 0; i < shelf.size(); i++) {
                  total += shelf[i].pieces;
                  if (shelf[i].price > shelf[priciest].price) {
                      priciest = i;
                  }
                  if (shelf[i].price < shelf[cheapest].price) {
                      cheapest = i;
                  }
              }
              cout << "Total pieces: " << total << endl;
              cout << "Most expensive: " << shelf[priciest].name << endl;
              cout << "Cheapest: " << shelf[cheapest].name << endl;
              return 0;
          }
        `,
        hints: [
          'In a loop, read each set into a LegoSet variable and push_back it into shelf.',
          'Keep the index of the most expensive and the cheapest set, both starting at 0.',
          'if (shelf[i].price > shelf[priciest].price) priciest = i;   (and the same idea with < for the cheapest)',
        ],
        tests: [
          { stdin: '3\nTitanic 9090 679.99\nBonsai 878 49.99\nColosseum 9036 549.99\n', expected: 'Total pieces: 19004\nMost expensive: Titanic\nCheapest: Bonsai\n' },
          { stdin: '1\nRover 500 39.99\n', expected: 'Total pieces: 500\nMost expensive: Rover\nCheapest: Rover\n' },
          { stdin: '4\nOrchid 608 49.99\nShuttle 2354 199.99\nCar 300 19.99\nCastle 4514 399.99\n', expected: 'Total pieces: 7776\nMost expensive: Castle\nCheapest: Car\n', hidden: true },
        ],
        require: [{ pattern: 'vector\\s*<\\s*LegoSet\\s*>', message: 'Store the sets in a vector<LegoSet>.' }],
        xp: 55,
      },
    ],
  },

  // =======================================================================
  // WORLD 10
  // =======================================================================
  {
    id: 'w10',
    title: 'Master Builder Challenges',
    color: '#1b2a34',
    icon: '🏆',
    intro:
      'You have all the bricks now: output, variables, input, decisions, loops, functions, collections, strings and structs. Master Builders combine them in creative ways. These challenges are bigger puzzles - plan before you build, test with your own inputs, and don\'t give up!',
    exercises: [
      {
        id: 'w10e1',
        title: 'LegoBrick Count-off',
        story: 'A famous programmer game, LEGO edition: count up, but multiples of 3 say "Lego" and multiples of 5 say "Brick".',
        concept: md`
          This puzzle is a classic job interview question (normally called **FizzBuzz**), and it's all about the **order of your checks**.

          A number like 15 is a multiple of 3 **and** of 5. If you check "multiple of 3?" first, you print \`Lego\` and never reach the "both" case!

          So check the most specific case first:

          \`\`\`cpp
          if (i % 3 == 0 && i % 5 == 0) {
              // both
          } else if (i % 3 == 0) {
              // only 3
          } else if (i % 5 == 0) {
              // only 5
          } else {
              // neither: print the number
          }
          \`\`\`

          (Being a multiple of both 3 and 5 is the same as being a multiple of 15.)
        `,
        task: md`
          Read \`n\` and print the numbers from 1 to \`n\`, one per line, but:

          - multiples of 3 and 5 → \`LegoBrick\`
          - multiples of 3 → \`Lego\`
          - multiples of 5 → \`Brick\`

          For input \`5\`:

          \`\`\`
          1
          2
          Lego
          4
          Brick
          \`\`\`
        `,
        starter: cpp`
          #include <iostream>
          using namespace std;

          int main() {
              int n;
              cin >> n;
              // your code here

              return 0;
          }
        `,
        solution: cpp`
          #include <iostream>
          using namespace std;

          int main() {
              int n;
              cin >> n;
              for (int i = 1; i <= n; i++) {
                  if (i % 15 == 0) {
                      cout << "LegoBrick" << endl;
                  } else if (i % 3 == 0) {
                      cout << "Lego" << endl;
                  } else if (i % 5 == 0) {
                      cout << "Brick" << endl;
                  } else {
                      cout << i << endl;
                  }
              }
              return 0;
          }
        `,
        hints: [
          'Loop from 1 to n and decide what to print for each i.',
          'Check the "both" case first: i % 3 == 0 && i % 5 == 0.',
          'Use an if / else if / else if / else chain, printing i itself in the last else.',
        ],
        tests: [
          { stdin: '5\n', expected: '1\n2\nLego\n4\nBrick\n' },
          { stdin: '15\n', expected: '1\n2\nLego\n4\nBrick\nLego\n7\n8\nLego\nBrick\n11\nLego\n13\n14\nLegoBrick\n' },
          { stdin: '1\n', expected: '1\n', hidden: true },
          { stdin: '20\n', expected: '1\n2\nLego\n4\nBrick\nLego\n7\n8\nLego\nBrick\n11\nLego\n13\n14\nLegoBrick\n16\n17\nLego\n19\nBrick\n', hidden: true },
        ],
        xp: 50,
      },
      {
        id: 'w10e2',
        title: 'Prime Bricks',
        story: 'Prime numbers can\'t be built as a rectangle of studs (except a single row). Find them all!',
        concept: md`
          A **prime number** is a whole number bigger than 1 that can only be divided evenly by 1 and itself. 2, 3, 5, 7, 11, 13 are prime; 9 is not (3 × 3); 1 is **not** prime.

          LEGO way to see it: 6 studs can be arranged as a 2x3 rectangle, so 6 is not prime. 7 studs can only make a 1x7 row - 7 is prime!

          To test \`n\`, try every divisor \`d\` from 2 upward. If \`n % d == 0\` for any of them, it's not prime. You only need to try divisors while \`d * d <= n\` - if \`n\` had a bigger divisor, it would also have a smaller partner that you already checked.

          \`\`\`cpp
          bool isPrime(int n) {
              if (n < 2) return false;
              for (int d = 2; d * d <= n; d++) {
                  if (n % d == 0) return false;
              }
              return true;
          }
          \`\`\`
        `,
        task: md`
          Write \`bool isPrime(int n)\`. Read \`n\` and print all primes from 2 to \`n\` on one line after \`Primes:\`. If there are none, print \`Primes: none\`. For input \`10\`:

          \`\`\`
          Primes: 2 3 5 7
          \`\`\`
        `,
        starter: cpp`
          #include <iostream>
          using namespace std;

          bool isPrime(int n) {
              // your code here
              return false;
          }

          int main() {
              int n;
              cin >> n;
              // your code here

              return 0;
          }
        `,
        solution: cpp`
          #include <iostream>
          using namespace std;

          bool isPrime(int n) {
              if (n < 2) {
                  return false;
              }
              for (int d = 2; d * d <= n; d++) {
                  if (n % d == 0) {
                      return false;
                  }
              }
              return true;
          }

          int main() {
              int n;
              cin >> n;
              cout << "Primes:";
              int found = 0;
              for (int i = 2; i <= n; i++) {
                  if (isPrime(i)) {
                      cout << " " << i;
                      found++;
                  }
              }
              if (found == 0) {
                  cout << " none";
              }
              cout << endl;
              return 0;
          }
        `,
        hints: [
          'isPrime: numbers below 2 are not prime; then try every divisor d with d * d <= n.',
          'In main print "Primes:" first, then " " << i for every prime i up to n.',
          'Count how many primes you printed. If the count is 0, print " none".',
        ],
        tests: [
          { stdin: '10\n', expected: 'Primes: 2 3 5 7\n' },
          { stdin: '1\n', expected: 'Primes: none\n' },
          { stdin: '2\n', expected: 'Primes: 2\n', hidden: true },
          { stdin: '30\n', expected: 'Primes: 2 3 5 7 11 13 17 19 23 29\n', hidden: true },
          { stdin: '49\n', expected: 'Primes: 2 3 5 7 11 13 17 19 23 29 31 37 41 43 47\n', hidden: true },
        ],
        require: [{ pattern: '\\bbool\\s+isPrime\\s*\\(', message: 'Write a function bool isPrime(int n).' }],
        xp: 55,
      },
      {
        id: 'w10e3',
        title: 'Guess the Box',
        story: 'A mystery box holds a secret number of bricks. Check each guess and give hints!',
        concept: md`
          In a real guessing game the guesses come from a player. Here they come from the input, so we can test the game.

          This challenge mixes several ideas:

          - reading values until the input ends: \`while (cin >> guess)\`
          - an \`if / else if / else\` for the three possible answers
          - a **counter** for the number of guesses
          - \`break\` to stop as soon as the guess is correct
          - a **flag** (\`bool found = false;\`) so that after the loop you know **why** it ended: because of \`break\` (found it) or because the input ran out

          \`\`\`cpp
          bool found = false;
          while (cin >> x) {
              if (x == secret) {
                  found = true;
                  break;
              }
          }
          if (!found) { ... }
          \`\`\`
        `,
        task: md`
          The first number is the secret. Then come guesses until the input ends. For each guess print \`Too low\` or \`Too high\`, or when it's right print \`Correct! Guesses used: K\` and stop. If the guesses run out, print \`Out of guesses! The number was SECRET.\` For input \`42\` and then \`50 25 42 10\`:

          \`\`\`
          Too high
          Too low
          Correct! Guesses used: 3
          \`\`\`
        `,
        starter: cpp`
          #include <iostream>
          using namespace std;

          int main() {
              int secret;
              cin >> secret;
              int guess;
              // your code here

              return 0;
          }
        `,
        solution: cpp`
          #include <iostream>
          using namespace std;

          int main() {
              int secret;
              cin >> secret;
              int guess;
              int count = 0;
              bool found = false;
              while (cin >> guess) {
                  count++;
                  if (guess < secret) {
                      cout << "Too low" << endl;
                  } else if (guess > secret) {
                      cout << "Too high" << endl;
                  } else {
                      cout << "Correct! Guesses used: " << count << endl;
                      found = true;
                      break;
                  }
              }
              if (!found) {
                  cout << "Out of guesses! The number was " << secret << "." << endl;
              }
              return 0;
          }
        `,
        hints: [
          'Use while (cin >> guess) and count every guess with count++.',
          'When the guess is right, print the message, set found = true and break.',
          'After the loop: if (!found) print the "Out of guesses!" message.',
        ],
        tests: [
          { stdin: '42\n50 25 42 10\n', expected: 'Too high\nToo low\nCorrect! Guesses used: 3\n' },
          { stdin: '7\n7\n', expected: 'Correct! Guesses used: 1\n' },
          { stdin: '13\n1 2 3\n', expected: 'Too low\nToo low\nToo low\nOut of guesses! The number was 13.\n', hidden: true },
          { stdin: '100\n150 120 99 100\n', expected: 'Too high\nToo high\nToo low\nCorrect! Guesses used: 4\n', hidden: true },
        ],
        xp: 55,
      },
      {
        id: 'w10e4',
        title: 'Bubble Sort Machine',
        story: 'The old sorting machine compares two neighbouring bricks and swaps them if they are in the wrong order. Again and again...',
        concept: md`
          Time to write sorting **yourself**! **Bubble sort** walks through the list comparing **neighbours**. If the left one is bigger, swap them:

          \`\`\`
          5 1 4 2   compare 5,1 → swap → 1 5 4 2
          1 5 4 2   compare 5,4 → swap → 1 4 5 2
          1 4 5 2   compare 5,2 → swap → 1 4 2 5
          \`\`\`

          After one pass the biggest value has "bubbled" to the end. Repeat the pass \`n - 1\` times and everything is sorted:

          \`\`\`cpp
          for (int pass = 0; pass < n - 1; pass++) {
              for (int i = 0; i < n - 1; i++) {
                  if (v[i] > v[i + 1]) {
                      // swap v[i] and v[i + 1]
                  }
              }
          }
          \`\`\`

          Careful with the inner loop: it uses \`v[i + 1]\`, so \`i\` must stop at \`n - 2\` (that's why it's \`i < n - 1\`), or you'd read past the end!
        `,
        task: md`
          Read \`n\`, then \`n\` numbers. Sort them with your own bubble sort (no \`sort\`!) and count how many swaps you made. Only swap when the left number is **strictly bigger**. For input \`5 5 1 4 2 8\`:

          \`\`\`
          Sorted: 1 2 4 5 8
          Swaps: 4
          \`\`\`
        `,
        starter: cpp`
          #include <iostream>
          #include <vector>
          using namespace std;

          int main() {
              int n;
              cin >> n;
              vector<int> v(n);
              for (int i = 0; i < n; i++) {
                  cin >> v[i];
              }
              int swaps = 0;
              // your bubble sort here

              return 0;
          }
        `,
        solution: cpp`
          #include <iostream>
          #include <vector>
          using namespace std;

          int main() {
              int n;
              cin >> n;
              vector<int> v(n);
              for (int i = 0; i < n; i++) {
                  cin >> v[i];
              }
              int swaps = 0;
              for (int pass = 0; pass < n - 1; pass++) {
                  for (int i = 0; i < n - 1; i++) {
                      if (v[i] > v[i + 1]) {
                          int temp = v[i];
                          v[i] = v[i + 1];
                          v[i + 1] = temp;
                          swaps++;
                      }
                  }
              }
              cout << "Sorted:";
              for (int x : v) {
                  cout << " " << x;
              }
              cout << endl;
              cout << "Swaps: " << swaps << endl;
              return 0;
          }
        `,
        hints: [
          'Two nested loops: the outer one repeats the pass n - 1 times, the inner one compares v[i] with v[i + 1].',
          'Swap with a temp variable (or swap(v[i], v[i + 1])) and do swaps++ each time.',
          'The inner loop condition must be i < n - 1 so that v[i + 1] stays inside the vector.',
        ],
        tests: [
          { stdin: '5\n5 1 4 2 8\n', expected: 'Sorted: 1 2 4 5 8\nSwaps: 4\n' },
          { stdin: '3\n1 2 3\n', expected: 'Sorted: 1 2 3\nSwaps: 0\n' },
          { stdin: '4\n4 3 2 1\n', expected: 'Sorted: 1 2 3 4\nSwaps: 6\n', hidden: true },
          { stdin: '6\n3 -1 3 0 2 -5\n', expected: 'Sorted: -5 -1 0 2 3 3\nSwaps: 10\n', hidden: true },
          { stdin: '1\n9\n', expected: 'Sorted: 9\nSwaps: 0\n', hidden: true },
        ],
        forbid: [{ pattern: '\\bsort\\s*\\(', message: 'Write the bubble sort yourself - no sort() here!' }],
        xp: 60,
      },
      {
        id: 'w10e5',
        title: 'Brick Inventory',
        story: 'The final challenge: run the warehouse computer! It takes commands to add bricks, remove bricks and show the stock.',
        concept: md`
          Real programs often read **commands**. Read the command word first, then decide what else to read:

          \`\`\`cpp
          string cmd;
          while (cin >> cmd) {
              if (cmd == "show") {
                  // no extra data
              } else if (cmd == "add") {
                  string colour;
                  int amount;
                  cin >> colour >> amount;
                  // ...
              }
          }
          \`\`\`

          For the stock, use a \`vector\` of a struct like \`struct Item { string colour; int count; };\`.

          To change an element **inside** the vector, either use its index (\`items[i].count += 5;\`) or a **reference** in the range-for: \`for (Item& it : items)\`. Without the \`&\`, you'd be changing a copy!

          A helper function that returns the **index** of a colour (or \`-1\` if it's not there) keeps the code tidy:

          \`\`\`cpp
          int findItem(vector<Item>& items, string colour) { ... }
          \`\`\`
        `,
        task: md`
          Process commands until the input ends:

          - \`add COLOUR N\` - add N bricks of that colour (new colours go to the end of the list)
          - \`remove COLOUR N\` - remove N bricks; if the colour is missing or has fewer than N, print \`Not enough COLOUR\` and change nothing
          - \`show\` - print every colour in the order it was first added, as \`COLOUR: COUNT\` (also colours with 0 left), or \`Inventory is empty\` if nothing was ever added

          For input:

          \`\`\`
          add red 10
          add blue 5
          remove red 3
          add red 2
          show
          \`\`\`

          the output is:

          \`\`\`
          red: 9
          blue: 5
          \`\`\`
        `,
        starter: cpp`
          #include <iostream>
          #include <string>
          #include <vector>
          using namespace std;

          struct Item {
              string colour;
              int count;
          };

          int main() {
              vector<Item> items;
              string cmd;
              while (cin >> cmd) {
                  // your code here
              }
              return 0;
          }
        `,
        solution: cpp`
          #include <iostream>
          #include <string>
          #include <vector>
          using namespace std;

          struct Item {
              string colour;
              int count;
          };

          int findItem(vector<Item>& items, string colour) {
              for (int i = 0; i < items.size(); i++) {
                  if (items[i].colour == colour) {
                      return i;
                  }
              }
              return -1;
          }

          int main() {
              vector<Item> items;
              string cmd;
              while (cin >> cmd) {
                  if (cmd == "show") {
                      if (items.empty()) {
                          cout << "Inventory is empty" << endl;
                      }
                      for (Item it : items) {
                          cout << it.colour << ": " << it.count << endl;
                      }
                  } else {
                      string colour;
                      int amount;
                      cin >> colour >> amount;
                      int idx = findItem(items, colour);
                      if (cmd == "add") {
                          if (idx == -1) {
                              Item fresh = {colour, amount};
                              items.push_back(fresh);
                          } else {
                              items[idx].count += amount;
                          }
                      } else if (cmd == "remove") {
                          if (idx == -1 || items[idx].count < amount) {
                              cout << "Not enough " << colour << endl;
                          } else {
                              items[idx].count -= amount;
                          }
                      }
                  }
              }
              return 0;
          }
        `,
        hints: [
          'Write int findItem(vector<Item>& items, string colour) that returns the index of the colour, or -1.',
          'For "add": if findItem gives -1, push_back a new Item; otherwise increase its count.',
          'For "remove": print "Not enough ..." if the index is -1 or the count is too small; otherwise subtract.',
        ],
        tests: [
          { stdin: 'add red 10\nadd blue 5\nremove red 3\nadd red 2\nshow\n', expected: 'red: 9\nblue: 5\n' },
          { stdin: 'show\nadd black 1\nshow\n', expected: 'Inventory is empty\nblack: 1\n' },
          { stdin: 'add yellow 4\nremove green 1\nremove yellow 5\nremove yellow 4\nshow\nadd green 2\nshow\n', expected: 'Not enough green\nNot enough yellow\nyellow: 0\nyellow: 0\ngreen: 2\n', hidden: true },
          { stdin: 'add red 1\nadd red 1\nadd blue 3\nremove blue 3\nshow\n', expected: 'red: 2\nblue: 0\n', hidden: true },
        ],
        require: [{ pattern: 'vector\\s*<\\s*Item\\s*>', message: 'Store the stock in a vector<Item>.' }],
        xp: 60,
      },
    ],
  },
];
