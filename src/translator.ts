import { parserOutput, textParams } from "./main";
import { PrintToken, InputToken, ArtihmeticExpressionToken, VariableAssignmentToken, DataObject } from "./objects/tokens";

interface parsedMipsArithmetic {
    operator: "+" | "-" | "*" | "/",
    finalRegister: string,
    overwriteRegister: boolean;
    left: { type: string, value: string | number },
    right: { type: string, value: string | number }
}

/** Provides functions for translating tokens to mips */
export default class Translate {

    public translate = (pyCode: PrintToken | InputToken | ArtihmeticExpressionToken | VariableAssignmentToken) => {
        let mipsCode = ""
        switch (pyCode.token) {
            case "print":
                mipsCode += this.translatePrint(pyCode as PrintToken);
                break;
            case "input":
                mipsCode += this.translateInput(pyCode as InputToken);
                break;
            default:
                mipsCode += "//some other code\n";
                break;
        }
        return mipsCode;
    }

    /** Translates print tokens to mips code */
    public translatePrint(token: PrintToken): string {
        let printMips = ""
        token.properties.prompt.forEach(prompt => {
            printMips += this._translatePrintPrompts(prompt);
        })
        //print newline after a print statement
        printMips += `#printing newline\naddi $a0, $0, 0xA\t#ascii code for LF(newline), if you have any trouble try 0xD for CR.\naddi $v0, $0, 11\t#syscall 11 prints the lower 8 bits of $a0 as an ascii character.\nsyscall\n`
        return printMips;
    }

    /** Translates all prompts(in a single print statement) into mips */
    private _translatePrintPrompts(printToken: DataObject | ArtihmeticExpressionToken) {
        let mipsCode = "";
        if ((printToken as DataObject).spaced) {
            mipsCode += `la $a0, 32\naddi $v0, $0, 11\nsyscall\n` //printing space
        }
        switch (printToken.type) {
            case "string":
                mipsCode += `la $a0, ${(printToken as DataObject).value}\naddi $v0, $0, 4\nsyscall\n`
                break;
            case "int":
                mipsCode += `addi $a0 $0 ${(printToken as DataObject).value}\naddi $v0, $0, 1\nsyscall\n` //printing single integer
                break;
            case "variable":
                mipsCode += `la $a0, ${(printToken as DataObject).value}\naddi $v0, $0, 4\nsyscall\n` //printing single variable
                break;
            case "artihmeticExpression":
                //compute arthimetic expression
                mipsCode += this.translateArithmetic(printToken as ArtihmeticExpressionToken)
                mipsCode += `add $a0 $0 $t0\naddi $v0, $0, 1\nsyscall\n` //printing integer
                break;

            default:
                break;
        }
        //syscallFunc += `la $a0, ${properties.prompt.}\naddi $v0, $0, 4\nsyscall\n`;
        return mipsCode

    }

    /** Translates input tokens to mips code */
    public translateInput(token: InputToken): string {
        let inputMips = "";
        token.properties.prompt.forEach(prompt => {
            inputMips += this._translatePrintPrompts(prompt);
            console.log("type", token.type)
            switch (token.type) {
                case "int":
                    inputMips += `addi $v0, $0,5\t#reading an int but not assigning it anywhere\nsyscall\n`
                    break;
                case "string":
                    inputMips += `la $a0, ENTER_STR_ADDRESS\t#reading a string but not assigning it anywhere\nli $a1, MAX_CHAR_FOR_STR\naddi $v0, $0,8\nsyscall\n`
                    break;
                case null:
                    inputMips += `la $a0, ENTER_STR_ADDRESS\t#reading a string but not assigning it anywhere\nli $a1, MAX_CHAR_FOR_STR\naddi $v0, $0,8\nsyscall\n`
                    break;
            }
        })
        return inputMips;
    }

    /** Translates arithemetic tokens to mips code */
    public translateArithmetic(root: ArtihmeticExpressionToken) {
        const operations = this._postOrderArithmetic(root);
        let mipsCode: Array<parsedMipsArithmetic> = []
        let prev = null, current = 0, next = null, usedRegisters = {}, currentRegister = -1;
        let availRegisters = ["$t0", "$t1", "$t2", "$t3", "$t4", "$t5", "$t6"]
        while (current < operations.length) {
            const currentOperationIndex = (next || next === 0) ? next : (prev || prev === 0) ? prev : current
            const currentOperation = operations[currentOperationIndex]
            if (currentOperationIndex === operations.length - 1 && (currentOperation.left === "prevVal" && currentOperation.right === "nextVal")) {
                mipsCode.push({ operator: operations[operations.length - 1].operator, finalRegister: "$t0", overwriteRegister: true, left: { type: "register", value: usedRegisters['0'] }, right: { type: "register", value: availRegisters[currentRegister] } })
                break;
            }

            if (currentOperation.left.value && currentOperation.right.value) {
                currentRegister = (currentRegister + 1) % 7;
                mipsCode.push({ operator: currentOperation.operator, finalRegister: availRegisters[currentRegister], overwriteRegister: false, left: currentOperation.left, right: currentOperation.right })
                usedRegisters = { ...usedRegisters, [currentOperationIndex]: availRegisters[currentRegister] }
                current += 1; next = null;
            }

            else if (currentOperation.left === "prevVal" && currentOperation.right === "nextVal") {
                currentRegister = (currentRegister + 1) % 2;
                usedRegisters = { ...usedRegisters, [currentOperationIndex]: availRegisters[currentRegister] }
                mipsCode.push({ operator: currentOperation.operator, finalRegister: availRegisters[currentRegister], overwriteRegister: true, left: { type: "register", value: usedRegisters[current - 2] }, right: { type: "register", value: usedRegisters[current - 1] } })
                current += 1
            }

            else if (currentOperation.left === "prevVal") {
                mipsCode.push({ operator: currentOperation.operator, finalRegister: availRegisters[currentRegister], overwriteRegister: true, left: { type: "register", value: availRegisters[currentRegister] }, right: currentOperation.right })
                current += 1, next = null
                usedRegisters = { ...usedRegisters, [currentOperationIndex]: availRegisters[currentRegister] }

            }

            else if (currentOperation.right === "nextVal") {
                usedRegisters = { ...usedRegisters, [currentOperationIndex]: availRegisters[currentRegister] };
                mipsCode.push({ operator: currentOperation.operator, finalRegister: availRegisters[currentRegister], overwriteRegister: true, left: currentOperation.left, right: { type: "register", value: usedRegisters[currentOperationIndex] } })
                current += 1, next = null;
            }
        }
        return mipsCode.map(elem => this._translateArithmeticOperation(elem, availRegisters[currentRegister + 2])).join("");
    }

    /** Translates a single arithmetic operation to mips code */
    private _translateArithmeticOperation(mipsOperation: parsedMipsArithmetic, recentRegister?: string) {
        let mipsCode = ""
        const freeRegister = !mipsOperation.overwriteRegister ? recentRegister : mipsOperation.finalRegister === "$t0" ? "$t1" : "$t0";
        switch (mipsOperation.operator) {
            case "+":
                mipsCode += this._operationToString("add", mipsOperation, freeRegister)
                break;
            case "-":
                mipsCode += this._operationToString("sub", mipsOperation, freeRegister)
                break;
            case "*":
                mipsCode += this._operationToString("mult", mipsOperation, freeRegister)
                break;
            case "/":
                mipsCode += this._operationToString("div", mipsOperation, freeRegister)
                break;
            default:
                break;
        }
        return mipsCode;
    }

    private _operationToString(operatorString: string, mipsOperation: parsedMipsArithmetic, freeRegister?: string): string {
        let mipsCode = "";
        if (mipsOperation.operator === "+" || mipsOperation.operator === "-") {
            if (mipsOperation.left.type === "variable") {
                mipsCode += `lw ${mipsOperation.finalRegister}, ${mipsOperation.left.value}\n`
            }
            else if (mipsOperation.left.type === "int") {
                mipsCode += `li ${mipsOperation.finalRegister}, ${mipsOperation.left.value}\n`
            }
            //right
            if (mipsOperation.right.type === "variable") {
                mipsCode += `lw ${freeRegister}, ${mipsOperation.right.value}\n`
            }
            else if (mipsOperation.right.type === "int") {
                mipsCode += `li ${freeRegister}, ${mipsOperation.right.value}\n`
            }
            if (mipsOperation.left.type === "register" && mipsOperation.right.type === "register") {
                mipsCode += `${operatorString} ${mipsOperation.finalRegister}, ${mipsOperation.left.value}, ${mipsOperation.right.value}\n`
            }
            else {
                mipsCode += `${operatorString} ${mipsOperation.finalRegister}, ${mipsOperation.finalRegister}, ${freeRegister}\n`
            }
        }
        else if (mipsOperation.operator === "*" || mipsOperation.operator === "/") {
            //left
            if (mipsOperation.left.type === "variable") {
                mipsCode += `lw ${mipsOperation.finalRegister}, ${mipsOperation.left.value}\n`
            }
            else if (mipsOperation.left.type === "int") {
                mipsCode += `li ${mipsOperation.finalRegister}, ${mipsOperation.left.value}\n`
            }
            //right
            if (mipsOperation.right.type === "variable") {
                mipsCode += `lw ${freeRegister}, ${mipsOperation.right.value}\n`
            }
            else if (mipsOperation.right.type === "int") {
                mipsCode += `li ${freeRegister}, ${mipsOperation.right.value}\n`
            }
            if (mipsOperation.left.type === "register" && mipsOperation.right.type === "register") {
                mipsCode += `${operatorString} ${mipsOperation.left.value}, ${mipsOperation.right.value}\nmflo ${mipsOperation.finalRegister}\n`
            }
            else {
                mipsCode += `${operatorString} ${mipsOperation.finalRegister}, ${freeRegister}\nmflo ${mipsOperation.finalRegister}\n`
            }
        }
        return mipsCode;

    }

    /** Traverses through a parsed arithmetic sequence and returns a more readable result in the correct order */
    private _postOrderArithmetic(root: ArtihmeticExpressionToken): Array<{ operator: "+" | "-" | "*" | "/", left: any, right: any }> {
        const result = [];
        const node = root
        //not typed to avoid the headache of having to cast each node value
        const traverse = function (node) {
            if (node.properties) {
                traverse(node.properties.left);
                traverse(node.properties.right);
                if (node.properties.left.token === "artihmeticExpression") {
                    let nodeValue = { operator: node.properties.operator, left: "prevVal", right: node.properties.right }
                    if (node.properties.right.token === "artihmeticExpression") {
                        nodeValue = { ...nodeValue, right: "nextVal" }
                    }
                    result.push(nodeValue)
                }
                else if (node.properties.right.token === "artihmeticExpression") {
                    let nodeValue = { operator: node.properties.operator, left: node.properties.left, right: "nextVal" }
                    result.push(nodeValue)
                }
                else {
                    result.push(node.properties);
                }
            }
        };
        traverse(node);
        return result;
    };

}