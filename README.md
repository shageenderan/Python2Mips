# Python2Mips
Parser written in Javascript that converts *simple* Python source code to MIPS Assembly language

## Functionality
  1. Literals and Variables
      ✔️ Integers<br />
      ✔️ Strings<br />
      ✔️ Dynamic Variables<br />
      ✔️ Variable assignments of multiple types (integers, strings, function results, array elements, arithmetic operations)
      ❌ Floats, Doubles, Long, Binary
  2. String
      ✔️ Simple string manipulation i.e. x = "hello" + "world"; x = 2*"hello"
      ✔️ String concatenation i.e. x = "hello"; x += " world"
      ❌ Concatenating a string with itself i.e. x = world; x = "hello " + x
      ❌ Brackets in string concatenation i.e. x = ("hello" + "world")\*2 is invalid but x = "hello"\*2 + "world"\*2 is valid
  3. I/O:
      ✔️ Basic print() and input()
      ✔️ Simple print formatting i.e. print("hello" + "world"), print(str(2) + "0")
      ✔️ Printing arrays and array elements
      ✔️ Printing function output
      ❌ Complex casting of variables i.e. bin(input())
  4. Arithmetic:
      ⚠️ Operator precedence works well except for when a literal not in a bracket is used with mutiple other literals in brackets
          i.e. print((2+3) * (4*(5-6)) + (9-1)) is valid but print((2+3) * (4*(5-6)) + 8) will produce unexpected results. Currently 
          working on this. 
      ✔️ Arithmetic operations with simple operator precedence (Muliplication, Division, Addition, Subtraction, Modulo)
      ✔️ Arithmetic operations between number and variable i.e. x+x, 2\*x are both valid
  5. Logical Operators:
      ✔️ Basic logical operators: and, or, not
      ✔️ Complex cobmination of multiple operators i.e. if x and y or (z and x)
      ✔️ Comparing variables using equality operators i.e. ==, !=, >, <, >=, <=
  6. Logical flow
      ✔️ if statements
      ✔️ Nested if statements
      ✔️ else statements
      ❌ elif statements
  7. Loops
      ✔️ while loops
      ✔️ for loops in a range i.e. for i in range(3)
      ✔️ nested loops
      ❌ for loops of an iterable i.e. for i in arr
  8. Arrays
      ⚠️ Only integer arrays are supported. All array declared are treated as heap arrays, even those declared at commpile time, in               order to simplify some translation functions. I hope to refactor this in a future update
      ✔️ Array declaration and assignment
      ✔️ Manipulating/Assigning array elements
      ✔️ len(arr)
  9. Functions
      ⚠️ Only functions which take integer parameters are supported, passing any other param type will result in undefined behaviors
      ✔️ Simple function definitions with a dynamic number of parameters
      ✔️ Calling user defined functions
      
❗❗ Vigorous testing was *not* conducted due to lact of time. If you encounter any errors in translating to mips from valid python code (adhering to the above functionality) kindly open an issue 

❗❗ I make no claim that the mips code produced is of high quality. This was just a small project I embarked on to pass the time

❗❗ This repository may or may not be updated/refactored in the future depending on my interests so any bug fixes/new functionality may never be added
      
## Sample ▶️
https://dashboard.heroku.com/apps/python2mips/activity
<img src="https://user-images.githubusercontent.com/46664356/67779728-03faf300-faa0-11e9-9e43-aaa49c57fb88.PNG" width="90%"></img> 

