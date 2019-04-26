import { SyntaxError, parse } from './pythonParser';
import Translate from './translator';

const testString = `print("hello world")\ninput("type something:")`

export interface textParams {
    type:string;
    function: string;
    addr?: string
}

export interface parserOutput {
    data: Array<string>;
    text: Array<textParams>;
}

try {
    const pyTranslator = new Translate();
    const sampleOutput:parserOutput = parse(testString) as parserOutput;
    console.log(sampleOutput)
    const test = sampleOutput.text.map(elem => {
        return pyTranslator.translate(elem)
    })
    console.log(test)
}
catch (e)
{
    console.log(e)
}