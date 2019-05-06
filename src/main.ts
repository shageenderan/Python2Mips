import { SyntaxError, parse } from './pythonParser';
import Translate from './translator';
import { PrintToken, ArtihmeticExpressionToken, InputToken, VariableAssignmentToken } from './objects/tokens';

const testStringPrint = `x = 2;\nprint(2+2)\ninput("type something:")`
const testPrint = `print(2)\nprint("Hello")\nprint("hello", "world")\nprint(2+2)\nprint(9*30/5 + 32)`
const testArPrint = `print(9*30/5 + 32)`
const testInput = `(2-3) * (6-3*8) + 90/45`
const testSimpleInput = `input()`
const testVarAssign = `name = input('Enter name (max 60 chars): ')\nprint('Hello ' + name)\nage = int(input("enter your age"))\nprint(age)`
const testVarAssignComplex = `temp_C = int(input('Enter temperature in Celsius '))\ntemp_F = int(9*temp_C/5 + 32)\nprint('Temperature in Fahrenheit is ' + str(temp_F))`

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
    const sampleOutput: parserOutput = parse(testInput) as parserOutput;
    //console.log(sampleOutput)
    const test = sampleOutput.tokens.map(elem => {
        // console.log("token: ", elem)
        return pyTranslator.translate(elem)
    })
    console.log(sampleOutput.data)
    console.log(test)
    console.log(".data")
    sampleOutput.data.map(elem => console.log(elem));
    console.log("\n.text\n")
    test.forEach(elem => console.log(elem));
    console.log("addi $v0, $0, 10\nsyscall\n") //exit)
}
catch (e) {
    console.log(e)
}