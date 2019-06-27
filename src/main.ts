import { SyntaxError, parse } from './pythonParser';
import Translate from './translator';
import { Token } from './objects/tokens';
import { mipsFunctions } from './mipsFunction';

const testStringPrint = `x = 2;\nprint(x+2)\nx=input("type something:"); print(x)`
const testPrint = `print(2)\nprint("hello")\nprint("hello", "world")\nprint(2+2)\nprint(9*30/5 + 32)`
const testArPrint = `print(2 + (9*30/5 + 32))`
const testInput = `x = int(input("enter a number: "))\nprint("adding 10 to your number:", x)\nx=10 + x\nprint(x)`
const testSimpleInput = `input()`
const testVarAssign = `name = input('Enter name (max 60 chars): ')\nprint('Hello ' + name)\nage = int(input("enter your age"))\nprint(age)`
const testVarAssignComplex = `temp_C = int(input('Enter temperature in Celsius '))\ntemp_F = int(9*temp_C/5 + 32)\nprint('Temperature in Fahrenheit is ' + str(temp_F))`
const testStrConcat = `x = "hello"; y="am i doing something wrong?"; print(x); x = "hello young luke skywalker" + " " + y; print(x); print(y); x = "reset"; print(x)`
const testSaveSpaceStrConcat = `x="hello";print("initial x:", x);x += " world"; print("Final x:", x)`
const testChangingVarTypes = `x=3; print(x); x=x+2*5; print(x); Y="hello"; print(Y)`
const testNewStringCOncat = `x="hello"; y="world"; x = x + y*2 +"WOW"*4; print(x); x=2;y=2; x = x+y*2; print(x)`
const testBug = `x = "hello"; y="am i doing something wrong?"; print(x); x = "hello young luke skywalker" + " " + y; print(x); print(y); x = "reset"; print(x + "am i doing something wrong?" + " ")`
const testSimpleIf = `n = int(input("Enter int: "));
if n < 0:
    print("negative")`
const testSimpleIf2 = `n = int(input("Enter int: "))
if (n % 2 == 0):
 print(n, 'is even')
else:
 print(n, 'is odd')

print("ending the program now")`
const testMyIf = `x = "hello"
print("x is: ", x)
z = input("Add world?")
if z == "y":
    x += "world"
    print("you added world, now x is: ", x)
else:
    print("you did not add world, x is still: ", x)`
const wtf = `x = 10; y = 0
if x == 0:
    if y == 10:
        print("equal")
    else:
        print("not equal")
else:
    if x == 10:
        if y == 0:
            print("equal")
        else:
            print("not equal")
    else:
        print("not equal")`
const unaryIf = `x = 10
if x:
    print(x)
else:
    print("x is 0")
`
const bug_test = `x = ""
if x:
    print("x is not empty")
else:
    print("x is empty")`
const bug_test1 = `x = input("enter x: ")
y = input("enter y: ")
if x:
    if y:
        print("x and y are not empty")
    else:
        print("y is empty but x is not")
else:
    if y:
        print("x is empty but y is not")
    else:
        print("x and y are empty")`
const leap_year = `year=int(input("Enter year to be checked:"))
if(year%4==0 and year%100!=0 or year%400==0):
    print("The year is a leap year!")
else:
    print("The year isn't a leap year!")`
const testSimpleChained = `x = 10; y= 5
if x % 5 == 0 or y % 5 == 0:
    print(x//y)
else:
    print("either x and y is not divisible by 5")`
const testBoolean = `x = False
if x:
    print(x)
else:
    x = True
    if x:
        print("Now x is ", x)`
const testNotIf = `x = 2010
if x > 10 and x % 5 == 0 and not x == 5:
    print("x is not 5 but is divisible by 5 and bigger than 10")
else:
    print("x is either 5, not divisible by 5, or smaller than 10")
`
const whileLoop = `x = 1
while x+1 < 5:
    y = 1
    print(x)
    while y < 3:
        print(y)
        y+=1
    x+=1
print("done loop")`
const forLoop = `y = int(input("how many times to repeat?"))
for x in range(y):
    print("hello world")
for x in range(0,10,2):
    print(x)`
const nestedFor = `for i in range(3):
    for j in range(i, 3):
        print(i, j)`
const loopBreaks = `i = 1
j = 0
while i < 6:        
    print(i)
    while j < 6:  
        j += 1 
        print(j)
        if j == 3:
            continue
        break
    i += 1

while i <= 12:
    i+=1
    if i == 9:
        continue
    print("second i", i)`


export interface parserOutput {
    data: Array<string>;
    tokens: Array<Token>;
}

//const x:Token<PrintToken> = {token:{}};
const compareDataSegment = (a: string, b: string) => {
    if(a.slice(a.indexOf(".") + 1, a.indexOf(".") + 6) === "space") {
        return -1
    }
    if(b.slice(b.indexOf(".") + 1, b.indexOf(".") + 6) === "space") {
        return 1
    }
    return a.slice(a.indexOf(".") + 1) > b.slice(b.indexOf(".")) + 1 ? 1 : -1
}

try {
    const pyTranslator = new Translate();
    const sampleOutput: parserOutput = parse(loopBreaks) as parserOutput;
    //console.log(sampleOutput)
    const text = []
    const functions = []
    sampleOutput.tokens.forEach(elem => {
        // console.log("token: ", elem)
        let translated = pyTranslator.translate(elem)
        text.push(translated.mipsCode)
        functions.push(...translated.functions)
    })
    console.log(sampleOutput.data.sort(compareDataSegment))
    console.log(text)
    console.log(".data")
    sampleOutput.data.map(elem => console.log(elem));
    console.log("\n.text")
    text.filter(elem => elem === '' ? false : true).forEach(elem => console.log(elem));
    console.log("addi $v0, $0, 10\nsyscall\n") //exit)
    functions.filter((item, index) => functions.indexOf(item) >= index).forEach(elem => console.log(mipsFunctions[elem] ? mipsFunctions[elem] : ""));
}
catch (e) {
    console.log(e)
}