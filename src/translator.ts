import { parserOutput, textParams } from "./main";
import { PrintToken, InputToken, ArtihmeticExpressionToken, VariableAssignmentToken, DataObject } from "./objects/tokens";

/** Provides functions for translating tokens to mips */

export default class Translate {

    public translate = (pyCode: PrintToken | InputToken | ArtihmeticExpressionToken | VariableAssignmentToken) => {
        let mipsCode = ""
        switch (pyCode.token) {
            case "print":
                mipsCode += this.toPrint(pyCode as PrintToken)
                break;
            default:
                mipsCode += "//some other code\n";
                break;
        }
        return mipsCode
    }

    private toPrint = (token: PrintToken) => {
        let printMips = ""
        token.properties.prompt.forEach(elem => {
            console.log(elem);
            switch (elem.type) {
                case "string":
                    if ((elem as DataObject).spaced) {
                        printMips += `la $a0, 32\naddi $v0, $0, 11\nsyscall\n` //printing space
                    }
                    printMips += `la $a0, ${(elem as DataObject).value}\naddi $v0, $0, 4\nsyscall\n`
                    break;
                case "int":
                    printMips += `addi $a0 $0 ${(elem as DataObject).value}\naddi $v0, $0, 1\nsyscall\n` //printing single integer
                    break;
                case "variable":
                    printMips += `la $a0, ${(elem as DataObject).value}\naddi $v0, $0, 4\nsyscall\n` //printing single variable
                    break;
                case "artihmeticExpression":
                    //compute arthimetic expression
                    console.log("TOKEN", ((elem as ArtihmeticExpressionToken).token))
                    printMips += "some arthimetic expression"

                    break;

                default:
                    break;
            }
        })
        //syscallFunc += `la $a0, ${properties.prompt.}\naddi $v0, $0, 4\nsyscall\n`;
        return printMips
    }

    private translateArithemetic(token: ArtihmeticExpressionToken) {
        console.log("arithemetic token: ", token)
    }

}