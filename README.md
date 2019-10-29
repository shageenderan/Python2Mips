# Python2Mips
Parser written in Javascript that converts *simple* Python source code to MIPS Assembly language

## Functionality
  1. Literals and Variables<br />
      ✔️ Integers<br />
      ✔️ Strings<br />
      ✔️ Dynamic Variables<br />
      ✔️ Variable assignments of multiple types (integers, strings, function results, array elements, arithmetic operations)<br />
      ❌ Floats, Doubles, Long, Binary<br />
  2. Strings<br />
      ✔️ Simple string manipulation i.e. x = "hello" + "world"; x = 2*"hello"<br />
      ✔️ String concatenation i.e. x = "hello"; x += " world"<br />
      ❌ Concatenating a string with itself i.e. x = world; x = "hello " + x<br />
      ❌ Brackets in string concatenation i.e. x = ("hello" + "world")\*2 is invalid but x = "hello"\*2 + "world"\*2 is valid<br />
  3. I/O<br />
      ✔️ Basic print() and input()<br />
      ✔️ Simple print formatting i.e. print("hello" + "world"), print(str(2) + "0")<br />
      ✔️ Printing arrays and array elements<br />
      ✔️ Printing function output<br />
      ❌ Complex casting of variables i.e. bin(input())<br />
  4. Arithmetic<br />
      ⚠️ Operator precedence works well except for when a literal not in a bracket is used with mutiple other literals in brackets
          i.e. print((2+3) * (4*(5-6)) + (9-1)) is valid but print((2+3) * (4*(5-6)) + 8) will produce unexpected results. Currently 
          working on this. <br />
      ✔️ Arithmetic operations with simple operator precedence (Muliplication, Division, Addition, Subtraction, Modulo)<br />
      ✔️ Arithmetic operations between number and variable i.e. x+x, 2\*x are both valid<br />
  5. Logical Operators<br />
      ✔️ Basic logical operators: and, or, not<br />
      ✔️ Complex cobmination of multiple operators i.e. if x and y or (z and x)<br />
      ✔️ Comparing variables using equality operators i.e. ==, !=, >, <, >=, <=<br />
  6. Logical flow<br />
      ✔️ if statements<br />
      ✔️ Nested if statements<br />
      ✔️ else statements<br />
      ❌ elif statements<br />
  7. Loops<br />
      ✔️ while loops<br />
      ✔️ for loops in a range i.e. for i in range(3)<br />
      ✔️ nested loops<br />
      ❌ for loops of an iterable i.e. for i in arr<br />
  8. Arrays<br />
      ⚠️ Only integer arrays are supported. All array declared are treated as heap arrays, even those declared at commpile time, in               order to simplify some translation functions. I hope to refactor this in a future update<br />
      ✔️ Array declaration and assignment<br />
      ✔️ Manipulating/Assigning array elements<br />
      ✔️ len(arr)<br />
  9. Functions<br />
      ⚠️ Only functions which take integer parameters are supported, passing any other param type will result in undefined behaviors<br />
      ✔️ Simple function definitions with a dynamic number of parameters<br />
      ✔️ Calling user defined functions<br />
      
❗❗ Vigorous testing was *not* conducted due to lact of time. If you encounter any errors in translating to mips from valid python code (adhering to the above functionality) kindly open an issue<br /><br /> 
❗❗ I make no claim that the mips code produced is of high quality. This was just a small project I embarked on to pass the time<br /><br />
❗❗ This repository may or may not be updated/refactored in the future depending on my interests so any bug fixes/new functionality may never be added<br /><br />
      
## Sample ▶️
https://dashboard.heroku.com/apps/python2mips/activity
<img src="https://user-images.githubusercontent.com/46664356/67779728-03faf300-faa0-11e9-9e43-aaa49c57fb88.PNG" width="90%"></img> 

