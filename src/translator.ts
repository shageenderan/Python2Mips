import { parserOutput, textParams } from "./main";
import { PrintToken, InputToken, ArtihmeticExpressionToken, VariableAssignmentToken, DataObject, VariableAssignmentDataObject, StringConcatenationToken, StringConcatProperties, ArtihmeticExpressionProperties } from "./objects/tokens";

interface parsedMipsArithmetic {
    operator: "+" | "-" | "*" | "/" | "%" | "//",
    finalRegister: string,
    overwriteRegister: boolean;
    left: { type: string, value: string | number },
    right: { type: string, value: string | number }
}

/** Provides functions for translating tokens to mips */
export default class Translate {

    functions: Array<string> = [];

    public translate = (pyCode: PrintToken | InputToken | ArtihmeticExpressionToken | VariableAssignmentToken) => {
        let mipsCode = ""
        switch (pyCode.token) {
            case "print":
                mipsCode += this.translatePrint(pyCode as PrintToken);
                break;
            case "input":
                mipsCode += this.translateInput(pyCode as InputToken);
                break;
            case "variableAssignment":
                mipsCode += this.translateVariableAssignment(pyCode as VariableAssignmentToken);
                break;
            case "artihmeticExpression":
                mipsCode += this.translateArithmetic(pyCode as ArtihmeticExpressionToken);
                break;
            default:
                mipsCode += "#some other code\n";
                break;
        }
        return { mipsCode, functions: this.functions };
    }

    /** Translates print tokens to mips code */
    public translatePrint(token: PrintToken): string {
        let printMips = ""
        token.properties.prompt.forEach(prompt => {
            printMips += this._translatePrintPrompt(prompt);
        })
        //print newline after a print statement
        printMips += `#printing newline\naddi $a0, $0, 0xA #ascii code for LF(newline), if you have any trouble try 0xD for CR.\naddi $v0, $0, 11 #syscall 11 prints the lower 8 bits of $a0 as an ascii character.\nsyscall\n`
        return printMips;
    }

    /** Translates all prompts(in a single print statement) into mips */
    private _translatePrintPrompt(printToken: DataObject | ArtihmeticExpressionToken) {
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
            case "variable-int":
                mipsCode += `lw $a0, ${(printToken as DataObject).value}\naddi $v0, $0, 1\nsyscall\n` //printing single integer variable
                break;
            case "variable-artihmeticExpression":
                mipsCode += `lw $a0, ${(printToken as DataObject).value}\naddi $v0, $0, 1\nsyscall\n` //printing single integer variable
                break;
            case "variable-string":
                mipsCode += `la $a0, ${(printToken as DataObject).value}\naddi $v0, $0, 4\nsyscall\n` //printing single string variable
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
    public translateInput(token: InputToken, addr?: string): string {
        let inputMips = "";
        token.properties.prompt.forEach(prompt => {
            console.log("INPUT PROMPT", prompt)
            inputMips += this._translatePrintPrompt(prompt);
        })
        inputMips += this._translateInputPrompt(token.type, addr);
        return inputMips;
    }

    private _translateInputPrompt(type: string, addr?: string) {
        let mipsCode = "";
        switch (type) {
            case "int":
                mipsCode += addr ? `addi $v0, $0, 5\nsyscall\nsw $v0, ${addr}\n`
                    : `addi $v0, $0,5 #[WARNING]:reading an int but not assigning it anywhere\nsyscall\n`
                break;
            case "string":
                mipsCode += addr ? `la $a0, ${addr}\naddi $a1, $0, 60\naddi $v0, $0, 8\nsyscall\n`
                    : `la $a0, STR_ADDRESS #[WARNING]:reading a string but not assigning it anywhere\nli $a1, MAX_SPACE_FOR_STR\naddi $v0, $0,8\nsyscall\n`
                break;
            case null:
                mipsCode += addr ? `la $a0, ${addr}\naddi $a1, $0, 60\naddi $v0, $0, 8\nsyscall\n`
                    : `la $a0, STR_ADDRESS #[WARNING]:reading a string but not assigning it anywhere\nli $a1, MAX_SPACE_FOR_STR\naddi $v0, $0,8\nsyscall\n`
                break;
        }
        return mipsCode
    }

    /** Translates variable assignment tokens to mips code */
    public translateVariableAssignment(token: VariableAssignmentToken): string {
        let variableAssignmentMips = ""
        if ((token.properties.value as VariableAssignmentDataObject).value) {
            const dataObjToken = token.properties.value as VariableAssignmentDataObject;
            console.log(dataObjToken, !dataObjToken.initialDeclaration)
            if (!dataObjToken.initialDeclaration) {
                switch (dataObjToken.type) {
                    case "string":
                        //this variable is being reused later, hence need to load each character one by one into the buffer
                        // variableAssignmentMips += `#WARNING DUE TO REASSINGING THIS STRING TYPE VARIABLE SOMEWHERE IN YOUR CODE, MIPS HAS TO LOAD EACH CHARACTER OF THE STRING INTO THE LABEL ADDRESS.
                        // THIS RESULTS IN EXTREMELY LONG MIPS CODE.`
                        variableAssignmentMips += `la $s0, ${token.properties.variable}\n` + this._storeStringInMips(dataObjToken.value as string, token.properties.variable)
                        break;
                    case "int":
                        variableAssignmentMips += `li $t0, ${dataObjToken.value}\nsw $t0, ${token.properties.variable}\n`
                        break;
                    default:
                        break;
                }
                return variableAssignmentMips;
            }
            else {
                return "";
            }
        }

        if ((token.properties.value as StringConcatenationToken).token === "stringConcatenation") {
            // Token is a string concatenation i.e. s = "hello" + "world"
            const stringConcatenationToken = token.properties.value as StringConcatenationToken;
            const variable = token.properties.variable
            const addedStrings = (stringConcatenationToken.properties as StringConcatProperties).addedStrings 
            //check if adding variable to itself i.e. x = x + "some stuff"
            variableAssignmentMips += addedStrings[0].type === "variable" && (addedStrings[0].value === variable)
                ? `la $s0, ${variable}\naddi $s0, $s0, ${token.properties.space - 1}\n`
                : `la $s0, ${variable}\n`;
                    
            variableAssignmentMips += this.translateStringConcatenation(stringConcatenationToken, variable, token.properties.space);    
        }

        else if ((token.properties.value as InputToken).token === "input") {
            // Token is an input()
            console.log("INPUT", token)
            console.log("VARIABLE", token.properties.variable)
            const inputToken = token.properties.value as InputToken;
            variableAssignmentMips += this.translateInput(inputToken, token.properties.variable);
        }

        else if ((token.properties.value as ArtihmeticExpressionToken).token === "artihmeticExpression") {
            // Token is an arithmetic expression
            console.log("TRAVERSING ARITHMETIC", this._postOrderArithmetic(token.properties.value as ArtihmeticExpressionToken));
            const arithemeticExpression = token.properties.value as ArtihmeticExpressionToken
            variableAssignmentMips += this.translateArithmetic(arithemeticExpression);
            variableAssignmentMips += `sw $t0, ${token.properties.variable}\n`
        }
        return variableAssignmentMips;
    }

    public translateStringConcatenation(token: StringConcatenationToken, addr: string, space?: number) {
        let mipsCode = ``;
        (token.properties as StringConcatProperties).addedStrings.forEach(addedString => {
            switch (addedString.type) {
                case "string":
                    mipsCode += `${this._concatVariableMips(addedString.value as string, addr)}`
                    break;
                //update to variable-string and variable-int
                case "variable":
                    mipsCode += (token.properties as StringConcatProperties).addedStrings.indexOf(addedString) === 0 && addedString.value === addr
                        ? `` // skip adding the same value
                        : this._concatVariableMips(addedString.value as string, addr)
                    break;
                default:
                    break;
            }
        })
        mipsCode += `li $s0, 0` //resetting saved register.
        return mipsCode;
        //console.log("**********************************************************\n", mipsCode, "\n**********************************************************");
    }

    // move this along with other in-built python functions to its own module at a later time
    private _concatVariableMips(variable: string, addr: string): string {
        let mipsCode = `add $a0, $s0, $0\nla $a1, ${variable}\njal strConcat\n`
        this.functions.push('strConcat');
        return mipsCode;
    }

    private _storeStringInMips(string: string, addr: string): string {
        let storeStringMips = ``;
        for (let i = 0; i < string.length; i++) {
            storeStringMips += `li $t0, '${string[i]}'\nsb $t0, 0($s0)\naddi $s0,$s0,1 # advance destination pointer\n`
        }
        storeStringMips += `sb $zero,0($s0) # finished storing ${string} in label ${addr}\n`
        return storeStringMips;
    }



    /** Translates arithemetic tokens to mips code */
    public translateArithmetic(token: ArtihmeticExpressionToken) {
        const operations = this._postOrderArithmetic(token);
        let mipsCode: Array<parsedMipsArithmetic> = []
        let prev = null, current = 0, next = null, usedRegisters = {}, currentRegister = -1;
        let availRegisters = ["$t0", "$t1", "$t2", "$t3", "$t4", "$t5", "$t6"]
        while (current < operations.length) {
            const currentOperationIndex = (next || next === 0) ? next : (prev || prev === 0) ? prev : current
            const currentOperation = operations[currentOperationIndex]
            if (currentOperationIndex === operations.length - 1 && (currentOperation.left === "prevVal" && currentOperation.right === "nextVal")) {
                // console.log("FINAL REGISTRES", usedRegisters)
                // console.log("current", current)
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
                // console.log("PREV REGISTERS", usedRegisters)
                // console.log("CURRENT", current)
                currentRegister = (currentRegister + 1) % 2;
                mipsCode.push({ operator: currentOperation.operator, finalRegister: availRegisters[currentRegister], overwriteRegister: false, left: { type: "register", value: usedRegisters[current - 3] }, right: { type: "register", value: usedRegisters[current - 2] } })
                usedRegisters = { ...usedRegisters, [currentOperationIndex]: availRegisters[currentRegister] }
                current += 1
            }

            else if (currentOperation.left === "prevVal") {
                mipsCode.push({ operator: currentOperation.operator, finalRegister: availRegisters[currentRegister], overwriteRegister: true, left: { type: "register", value: availRegisters[currentRegister] }, right: currentOperation.right })
                current += 1, next = null
                usedRegisters = { ...usedRegisters, [currentOperationIndex]: availRegisters[currentRegister] }

            }

            else if (currentOperation.right === "nextVal") {
                usedRegisters = { ...usedRegisters, [currentOperationIndex]: availRegisters[currentRegister] };
                mipsCode.push({ operator: currentOperation.operator, finalRegister: availRegisters[currentRegister], overwriteRegister: false, left: currentOperation.left, right: { type: "register", value: usedRegisters[currentOperationIndex] } })
                current += 1, next = null;
            }
        }
        console.log("ORDERING", mipsCode.map(elem => this._translateArithmeticOperation(elem, availRegisters[currentRegister + 1])).join(""))
        return mipsCode.map(elem => this._translateArithmeticOperation(elem, availRegisters[currentRegister + 1])).join("");
    }

    /** Translates a single arithmetic operation to mips code */
    private _translateArithmeticOperation(mipsOperation: parsedMipsArithmetic, recentRegister?: string) {
        let mipsCode = ""
        // console.log("LOOK", mipsOperation)
        // console.log("FREE", recentRegister)
        const freeRegister = !mipsOperation.overwriteRegister ? recentRegister : mipsOperation.finalRegister === "$t0" ? "$t1" : "$t0";
        // console.log("FREE REG", freeRegister)
        switch (mipsOperation.operator) {
            case "+":
                mipsCode += this._arithmeticOperationToString("add", mipsOperation, freeRegister)
                break;
            case "-":
                mipsCode += this._arithmeticOperationToString("sub", mipsOperation, freeRegister)
                break;
            case "*":
                mipsCode += this._arithmeticOperationToString("mult", mipsOperation, freeRegister)
                break;
            case "/":
                mipsCode += this._arithmeticOperationToString("div", mipsOperation, freeRegister)
                break;
            case "//":
                mipsCode += this._arithmeticOperationToString("div", {...mipsOperation, operator: "/"}, freeRegister)
                break;
            case "%":
                mipsCode += this._arithmeticOperationToString("div", mipsOperation, freeRegister)
                break;     
            default:
                break;
        }
        return mipsCode;
    }

    private _arithmeticOperationToString(operatorString: string, mipsOperation: parsedMipsArithmetic, freeRegister?: string): string {
        // console.log(operatorString, mipsOperation.finalRegister, freeRegister)
        let mipsCode = "", leftRegister = freeRegister, rightRegister = mipsOperation.finalRegister;
        if (mipsOperation.operator === "+" || mipsOperation.operator === "-") {
            if (mipsOperation.left.type === "register" && mipsOperation.right.type === "register") {
                mipsCode += `${operatorString} ${mipsOperation.finalRegister}, ${mipsOperation.left.value}, ${mipsOperation.right.value}\n`
            }
            else {
                //left
                if (mipsOperation.left.type === "variable") {
                    mipsCode += `lw ${leftRegister}, ${mipsOperation.left.value}\n`
                }
                else if (mipsOperation.left.type === "int") {
                    mipsCode += `li ${leftRegister}, ${mipsOperation.left.value}\n`
                }
                else if (mipsOperation.left.type === "register") {
                    leftRegister = mipsOperation.left.value as string
                }

                //right
                if (mipsOperation.left.type === "register") {
                    if (mipsOperation.right.type === "variable") {
                        mipsCode += `lw ${freeRegister}, ${mipsOperation.right.value}\n`
                    }
                    else if (mipsOperation.right.type === "int") {
                        mipsCode += `li ${freeRegister}, ${mipsOperation.right.value}\n`
                    }
                    rightRegister = freeRegister;
                }
                else {
                    if (mipsOperation.right.type === "variable") {
                        mipsCode += `lw ${rightRegister}, ${mipsOperation.right.value}\n`
                    }
                    else if (mipsOperation.right.type === "int") {
                        mipsCode += `li ${rightRegister}, ${mipsOperation.right.value}\n`
                    }
                    else if (mipsOperation.right.type === "register") {
                        rightRegister = mipsOperation.right.value as string
                    }
                }
                mipsCode += `${operatorString} ${mipsOperation.finalRegister}, ${leftRegister}, ${rightRegister}\n`
            }
        }
        else if (mipsOperation.operator === "*" || mipsOperation.operator === "/") {
            if (mipsOperation.left.type === "register" && mipsOperation.right.type === "register") {
                mipsCode += `${operatorString} ${mipsOperation.left.value}, ${mipsOperation.right.value}\nmflo ${mipsOperation.finalRegister}\n`
            }
            else {
                //left
                if (mipsOperation.left.type === "variable") {
                    mipsCode += `lw ${leftRegister}, ${mipsOperation.left.value}\n`
                }
                else if (mipsOperation.left.type === "int") {
                    mipsCode += `li ${leftRegister}, ${mipsOperation.left.value}\n`
                }
                else if (mipsOperation.left.type === "register") {
                    leftRegister = mipsOperation.left.value as string
                }
                //right
                if (mipsOperation.left.type === "register") {
                    if (mipsOperation.right.type === "variable") {
                        mipsCode += `lw ${freeRegister}, ${mipsOperation.right.value}\n`
                    }
                    else if (mipsOperation.right.type === "int") {
                        mipsCode += `li ${freeRegister}, ${mipsOperation.right.value}\n`
                    }
                    rightRegister = freeRegister;
                }
                else {
                    if (mipsOperation.right.type === "variable") {
                        mipsCode += `lw ${rightRegister}, ${mipsOperation.right.value}\n`
                    }
                    else if (mipsOperation.right.type === "int") {
                        mipsCode += `li ${rightRegister}, ${mipsOperation.right.value}\n`
                    }
                    else if (mipsOperation.right.type === "register") {
                        rightRegister = mipsOperation.right.value as string
                    }
                }

                mipsCode += `${operatorString} ${leftRegister}, ${rightRegister}\nmflo ${mipsOperation.finalRegister}\n`

            }
        }
        else if (mipsOperation.operator === "%") {
            if (mipsOperation.left.type === "register" && mipsOperation.right.type === "register") {
                mipsCode += `${operatorString} ${mipsOperation.left.value}, ${mipsOperation.right.value}\nmflo ${mipsOperation.finalRegister}\n`
            }
            else {
                //left
                if (mipsOperation.left.type === "variable") {
                    mipsCode += `lw ${leftRegister}, ${mipsOperation.left.value}\n`
                }
                else if (mipsOperation.left.type === "int") {
                    mipsCode += `li ${leftRegister}, ${mipsOperation.left.value}\n`
                }
                else if (mipsOperation.left.type === "register") {
                    leftRegister = mipsOperation.left.value as string
                }
                //right
                if (mipsOperation.left.type === "register") {
                    if (mipsOperation.right.type === "variable") {
                        mipsCode += `lw ${freeRegister}, ${mipsOperation.right.value}\n`
                    }
                    else if (mipsOperation.right.type === "int") {
                        mipsCode += `li ${freeRegister}, ${mipsOperation.right.value}\n`
                    }
                    rightRegister = freeRegister;
                }
                else {
                    if (mipsOperation.right.type === "variable") {
                        mipsCode += `lw ${rightRegister}, ${mipsOperation.right.value}\n`
                    }
                    else if (mipsOperation.right.type === "int") {
                        mipsCode += `li ${rightRegister}, ${mipsOperation.right.value}\n`
                    }
                    else if (mipsOperation.right.type === "register") {
                        rightRegister = mipsOperation.right.value as string
                    }
                }

                mipsCode += `${operatorString} ${leftRegister}, ${rightRegister}\nmfhi ${mipsOperation.finalRegister}\n`

            }

        }
        return mipsCode;

    }

    /** Traverses through a parsed arithmetic sequence and returns a more readable result in the correct order */
    private _postOrderArithmetic(root: ArtihmeticExpressionToken | StringConcatenationToken): Array<{ operator: "+" | "-" | "*" | "/", left: any, right: any }> {
        const result = [];
        const node = root
        //not typed to avoid the headache of having to cast each node value
        const traverse = function (node) {
            if (node.properties) {
                traverse(node.properties.left);
                traverse(node.properties.right);
                if (node.properties.left.token) {
                    let nodeValue = { operator: node.properties.operator, left: "prevVal", right: node.properties.right }
                    if (node.properties.right.token) {
                        nodeValue = { ...nodeValue, right: "nextVal" }
                    }
                    result.push(nodeValue)
                }
                else if (node.properties.right.token) {
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