import { SyntaxError, parse } from './pythonParser';
import Translate from './translator';
import { PrintToken, ArtihmeticExpressionToken, InputToken, VariableAssignmentToken } from './objects/tokens';

const testString = `x = 2;\nprint(2+2)\ninput("type something:")`
const testPrint = `print(2)\nprint("Hello")\nprint("hello", "world")\nprint(2+2)\nprint(9*30/5 + 32)`
const testAr = `print(9*30/5 + 32)`

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
    const sampleOutput:parserOutput = parse(testPrint) as parserOutput;
    //console.log(sampleOutput)
    const test = sampleOutput.tokens.map(elem => {
        // console.log("token: ", elem)
        // console.log(typeof elem)
        if (elem.token === "print" ){
            // console.log("token: ", elem)
            return pyTranslator.translate(elem)
        }
    })
    console.log(sampleOutput.data)
    console.log(test)
    console.log(".data")
    sampleOutput.data.map(elem => console.log(elem));
    console.log("\n.text\n")
    test.forEach(elem => console.log(elem));
    console.log("addi $v0, $0, 10\nsyscall\n") //exit)
}
catch (e)
{
    console.log(e)
}