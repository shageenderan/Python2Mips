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
                mipsCode += this._translatePrint(pyCode as PrintToken)
                break;
            default:
                mipsCode += "//some other code\n";
                break;
        }
        return mipsCode;
    }

    private _translatePrint = (token: PrintToken) => {
        let printMips = ""
        token.properties.prompt.forEach(elem => {
            if ((elem as DataObject).spaced) {
                printMips += `la $a0, 32\naddi $v0, $0, 11\nsyscall\n` //printing space
            }
            switch (elem.type) {
                case "string":
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
                    printMips += this._translateArithmetic(elem as ArtihmeticExpressionToken)
                    printMips += `add $a0 $0 $t0\naddi $v0, $0, 1\nsyscall\n` //printing integer
                    break;

                default:
                    break;
            }
        })
        //syscallFunc += `la $a0, ${properties.prompt.}\naddi $v0, $0, 4\nsyscall\n`;
        printMips += `#printing newline\naddi $a0, $0, 0xA #ascii code for LF(newline), if you have any trouble try 0xD for CR.\naddi $v0, $0, 11 #syscall 11 prints the lower 8 bits of $a0 as an ascii character.\nsyscall\n`
        return printMips
    }

    private _translateArithmetic(root: ArtihmeticExpressionToken) {
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
        else if (mipsOperation.operator === "*" || mipsOperation.operator === "/"){
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