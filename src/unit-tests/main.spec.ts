import { expect } from 'chai';
import { SyntaxError, parse } from '../pythonParser';
import 'mocha';
import { parserOutput } from '../main';
import Translate from '../translator';

const pyTranslator = new Translate();

describe('Testing Parser and Translator for Python Print Statements', () => {

    const printString = `print("hello world")`

    it('Parse and Translate: Print(String) ', () => {
        const parserPrintOutput: parserOutput = parse(printString) as parserOutput;
        const result = parserPrintOutput.tokens.map(elem => {
            return pyTranslator.translate(elem)
        })
        expect(parserPrintOutput.data[0]).to.equal('str0: \t.asciiz\t"hello world"');
        expect(result[0].mipsCode).to.equal("la $a0, str0\naddi $v0, $0, 4\nsyscall\n" + 
        `#printing newline\naddi $a0, $0, 0xA #ascii code for LF(newline), if you have any trouble try 0xD for CR.\naddi $v0, $0, 11 #syscall 11 prints the lower 8 bits of $a0 as an ascii character.\nsyscall\n`);
    });

});