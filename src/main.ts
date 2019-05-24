import { SyntaxError, parse } from './pythonParser';
import Translate from './translator';
import { PrintToken, ArtihmeticExpressionToken, InputToken, VariableAssignmentToken } from './objects/tokens';
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

export interface textParams {
    token: PrintToken | InputToken | ArtihmeticExpressionToken | VariableAssignmentToken
}

export interface parserOutput {
    data: Array<string>;
    tokens: Array<PrintToken | InputToken | ArtihmeticExpressionToken | VariableAssignmentToken>;
}

//const x:Token<PrintToken> = {token:{}};

try {
    const pyTranslator = new Translate();
    const sampleOutput: parserOutput = parse(testBug) as parserOutput;
    //console.log(sampleOutput)
    const text = []
    const functions = []
    sampleOutput.tokens.forEach(elem => {
        // console.log("token: ", elem)
        let translated = pyTranslator.translate(elem)
        text.push(translated.mipsCode)
        functions.push(...translated.functions)
    })
    console.log(sampleOutput.data)
    console.log(text)
    console.log(".data")
    sampleOutput.data.map(elem => console.log(elem));
    console.log("\n.text\n")
    text.filter(elem => elem === '' ? false : true).forEach(elem => console.log(elem));
    console.log("addi $v0, $0, 10\nsyscall\n") //exit)
    functions.filter((item, index) => functions.indexOf(item) >= index).forEach(elem => console.log(mipsFunctions[elem] ? mipsFunctions[elem] : ""));
}
catch (e) {
    console.log(e)
}