import { PrintToken, InputToken, ArtihmeticExpressionToken, VariableAssignmentToken, DataObject, VariableAssignmentDataObject, StringConcatenationToken, StringConcatProperties, ArtihmeticExpressionProperties, Token, IfToken, IfCondition, UnaryCondition, BinaryCondition, ChainedBooleanCondition, LoopToken, LoopBreakToken, ArrayToken, ArrayOperation, ElementAssignmentProperties, Assignment, ArrayElement } from "./objects/tokens";

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
    /** Current if statement */
    ifCounter: number = -1;
    /** Stack to keep track of if statements being used, especially when nested */
    ifStack: Array<number> = [];

    /** Current loop statement */
    loopCounter: number = -1;
    /** Stack to keep track of loop statements being used, especially when nested */
    loopStack: Array<number> = [];

    public translate = (pyCode: Token) => {
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
            case "ifStatement":
                mipsCode += this.translateIfStatement(pyCode as IfToken);
                break;
            case "loop":
                mipsCode += this.translateLoop(pyCode as LoopToken);
                break;
            case "loopBreak":
                mipsCode += this.translateLoopBreak(pyCode as LoopBreakToken);
                break;
            case "array":
                mipsCode += "#translate ARRAY"
                break;
            case "arrayOperation":
                mipsCode += this.translateArrayOperation(pyCode as ArrayOperation);
                break;
            default:
                //mipsCode += `#some error occured got token: ${pyCode.token}`;;
                break;
        }
        return { mipsCode, functions: this.functions };
    }

    public translateArrayOperation(token: ArrayOperation) {
        let arrayOperationMips = "";
        switch (token.type) {
            case "elementAssignment":
                arrayOperationMips += this._translateElementAssignment(token.properties as ElementAssignmentProperties)
                break;
            default:
                break;
        }
        return arrayOperationMips;
    }

    private _translateElementAssignment(assignment: ElementAssignmentProperties) {
        let elementAssignmentMips = "";
        //get element index of the assignment
        elementAssignmentMips += this._getElementIndex(assignment.index);
        //get address of array at index
        elementAssignmentMips += `lw $t2, ${assignment.arrayRef.value}\naddi $t3, $0, 4\nmult $t3, $t0\nmflo $t4\nadd $t4, $t4, $t3 # t4 = i * 4 + 4\nadd $t4, $t4, $t2 # $t4 points to next location in the list\n`
        //update value at address
        elementAssignmentMips += this._translateAssignment(assignment.value, "($t4)");
        return elementAssignmentMips;
    }

    /** Translates assignments. Stores in register */
    private _translateAssignment(assignmentType: Assignment, register="$t0") {
        let assignmentMips = "";
        if ((assignmentType as DataObject).value !== undefined) {
            const dataObj = assignmentType as DataObject;
            switch (dataObj.type) {
                case "string":
                        //this variable is being reused later, hence need to load each character one by one into the buffer
                        // variableAssignmentMips += `#WARNING DUE TO REASSINGING THIS STRING TYPE VARIABLE SOMEWHERE IN YOUR CODE, MIPS HAS TO LOAD EACH CHARACTER OF THE STRING INTO THE LABEL ADDRESS.
                        // THIS RESULTS IN EXTREMELY LONG MIPS CODE.`
                        assignmentMips += `la $s0, ${register}\n` + this._storeStringInMips(dataObj.value as string, register)
                        break;
                    case "int":
                        assignmentMips += `li $t0, ${dataObj.value}\n${register === "$t0" ? "" : register + '\n'}`
                        break;
                    case "boolean":
                        assignmentMips += `li $t0, ${dataObj.value ? "1" : "0"}\n${register === "$t0" ? "" : register + '\n'}`
                        break;
                    case "variable-int":
                        assignmentMips += `lw $t0, ${dataObj.value}\n${register === "$t0" ? "" : register + '\n'}`
                        break;
                    case "variable-boolean":
                        assignmentMips += `lw $t0, ${dataObj.value}\n${register === "$t0" ? "" : register + '\n'}`
                        break;
                    case "variable-artihmeticExpression":
                        assignmentMips += `lw $t0, ${dataObj.value}\n${register === "$t0" ? "" : register + '\n'}`
                        break;
                    case "variable-string":
                        assignmentMips += `la $s0, ${register}\nadd $a0, $s0, $0\nla $a1, ${dataObj.value}\njal strConcat\n`
                        break;
                    default:
                        break;
            }
        }

        // else if ((assignmentType as StringConcatenationToken).token === "stringConcatenation") {
        //     // Token is a string concatenation i.e. s = "hello" + "world"
        //     const stringConcatenationToken = assignmentType as StringConcatenationToken;
        //     const variable = register
        //     const addedStrings = (stringConcatenationToken.properties as StringConcatProperties).addedStrings
        //     //check if adding variable to itself i.e. x = x + "some stuff"
        //     assignmentMips += addedStrings[0].type === "variable" && (addedStrings[0].value === variable)
        //         ? `la $s0, ${variable}\naddi $s0, $s0, ${token.properties.space - 1}\n`
        //         : `la $s0, ${variable}\n`;

        //     assignmentMips += this.translateStringConcatenation(stringConcatenationToken, variable);
        // }

        else if((assignmentType as ArrayToken).token === "array") {
            const arrayToken = assignmentType as ArrayToken
            assignmentMips += this.allocateArray(arrayToken, register)
        }

        else if ((assignmentType as InputToken).token === "input") {
            // Token is an input()
            console.log("INPUT", assignmentType)
            console.log("VARIABLE", register)
            const inputToken = assignmentType as InputToken;
            assignmentMips += this.translateInput(inputToken, register);
        }

        else if ((assignmentType as ArtihmeticExpressionToken).token === "artihmeticExpression") {
            // Token is an arithmetic expression
            //console.log("TRAVERSING ARITHMETIC", this._postOrderArithmetic(assignmentType as ArtihmeticExpressionToken));
            const arithemeticExpression = assignmentType as ArtihmeticExpressionToken
            assignmentMips += this.translateArithmetic(arithemeticExpression);
            if(register !== "$t0") assignmentMips += `sw $t0, ${register}\n`;
        }

        return assignmentMips;
    }

    /** Translates the value of a given index and stores it in the given register */
    private _getElementIndex(index: DataObject | ArtihmeticExpressionToken, register=`$t0`) {
        let elementIndex = ''
        if (index.type === "int") {
            elementIndex += `li ${register}, ${(index as DataObject).value}\n`
        }
        else {
            //Arithmetic index
            elementIndex += this.translateArithmetic(index as ArtihmeticExpressionToken);
            elementIndex += register === "$t0" ? "" : `add ${register}, $t0, $0\n`
        }
        return elementIndex;
    }

    /** mips array allocation
     * @param register the register to store the array reference
    */
    public allocateArray(token: ArrayToken, register: string) {
        let mipsArray = "";
        if (token.properties.allocation === "dynamic") {
            mipsArray += `lw $t0, ${(token.properties.length as DataObject).value}\naddi $t1, $0, 4\nmult $t1, $t0\nmflo $t2\nadd $a0, $t2, $t1 # $a0 = 4*size + 4\naddi $v0, $0, 9 # $v0 = 9\nsyscall # allocate memory\nsw $v0, ${register} # the_list now points to the returned address\nsw $t0, ($v0) # store length of list\n`
        }
        return mipsArray;
    }

    /** Translates print tokens to mips code */
    public translatePrint(token: PrintToken): string {
        let printMips = ""
        token.properties.prompt.forEach(prompt => {
            printMips += this._translatePrintPrompt(prompt);
        })
        //print newline after a print statement
        printMips += `#printing newline\naddi $a0, $0, 10 #ascii code for LF(newline), if you have any trouble try 0xD for CR.\naddi $v0, $0, 11 #syscall 11 prints the lower 8 bits of $a0 as an ascii character.\nsyscall\n`
        return printMips;
    }

    /** Translates all prompts(in a single print statement) into mips */
    private _translatePrintPrompt(printToken: DataObject | ArtihmeticExpressionToken | ArrayElement) {
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
                mipsCode += `lw $a0, ${(printToken as DataObject).value}\naddi $v0, $0, 1\nsyscall\n` //printing single integer
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
            case "variable-array":
                mipsCode += `lw $a0, ${(printToken as DataObject).value}\njal printArray\n`
                this.functions.push("printArray")
                break;
            case "artihmeticExpression":
                //compute arthimetic expression
                mipsCode += this.translateArithmetic(printToken as ArtihmeticExpressionToken)
                mipsCode += `add $a0 $0 $t0\naddi $v0, $0, 1\nsyscall\n` //printing integer
                break;
            case "arrayElement":
                const arrayElem = printToken as ArrayElement
                mipsCode += `li $t0, 4\nlw $t1, ${arrayElem.value.arrayRef.value}\nadd $t1, $t1, $t0\n`             //get starting address of list
                mipsCode += this._getElementIndex(arrayElem.value.index, "$t2");                                    //translate index to print
                mipsCode += `mult $t2, $t0\nmflo $t2\nadd $t2, $t2, $t1\n`                                          //address of element to print
                mipsCode += `lw $a0, ($t2)\nli $v0, 1\nsyscall\n`                                                   //print elem
                break;
            default:
                mipsCode += `#some error occured got type: ${printToken.type}`;
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
            if (prompt.type) {
                inputMips += this._translatePrintPrompt(prompt); 
            }
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
            default:
                return `#some error occured got type: ${type}`;
        }
        return mipsCode
    }

    /** Translates variable assignment tokens to mips code */
    public translateVariableAssignment(token: VariableAssignmentToken): string {
        let variableAssignmentMips = ""
        if ((token.properties.value as VariableAssignmentDataObject).value || (token.properties.value as VariableAssignmentDataObject).value === 0 ||(token.properties.value as VariableAssignmentDataObject).type === "boolean") {
            const dataObjToken = token.properties.value as VariableAssignmentDataObject;
            console.log(dataObjToken, !dataObjToken.initialDeclaration)
            if (!dataObjToken.initialDeclaration || dataObjToken.type.includes("variable")) {
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
                    case "boolean":
                        variableAssignmentMips += `li $t0, ${dataObjToken.value ? "1" : "0"}\nsw $t0, ${token.properties.variable}\n`
                        break;
                    case "variable-int":
                        variableAssignmentMips += `lw $t0, ${dataObjToken.value}\nsw $t0, ${token.properties.variable}\n`
                        break;
                    case "variable-boolean":
                        variableAssignmentMips += `lw $t0, ${dataObjToken.value}\nsw $t0, ${token.properties.variable}\n`
                        break;
                    case "variable-artihmeticExpression":
                        variableAssignmentMips += `lw $t0, ${dataObjToken.value}\nsw $t0, ${token.properties.variable}\n`
                        break;
                    case "variable-string":
                        variableAssignmentMips += `la $s0, ${token.properties.variable}\nadd $a0, $s0, $0\nla $a1, ${dataObjToken.value}\njal strConcat\n`
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

            variableAssignmentMips += this.translateStringConcatenation(stringConcatenationToken, variable);
        }

        else if((token.properties.value as ArrayToken).token === "array") {
            const arrayToken = token.properties.value as ArrayToken
            variableAssignmentMips += this.allocateArray(arrayToken, token.properties.variable)
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

    public translateStringConcatenation(token: StringConcatenationToken, addr: string) {
        let mipsCode = ``;
        (token.properties as StringConcatProperties).addedStrings.forEach(addedString => {
            switch (addedString.type) {
                case "string":
                    mipsCode += `${this._concatVariableMips(addedString.value as string)}`
                    break;
                //update to variable-string and variable-int
                case "variable":
                    mipsCode += (token.properties as StringConcatProperties).addedStrings.indexOf(addedString) === 0 && addedString.value === addr
                        ? `` // skip adding the same value
                        : this._concatVariableMips(addedString.value as string)
                    break;
                case "variable-string":
                    mipsCode += (token.properties as StringConcatProperties).addedStrings.indexOf(addedString) === 0 && addedString.value === addr
                        ? `` // skip adding the same value
                        : this._concatVariableMips(addedString.value as string)
                    break;
                default:
                    return `#some error occured got type: ${addedString.type}`;
            }
        })
        mipsCode += `li $s0, 0\n` //resetting saved register.
        return mipsCode;
        //console.log("**********************************************************\n", mipsCode, "\n**********************************************************");
    }

    private _concatVariableMips(variable: string): string {
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

    /** Translates loop statements to mips code */
    public translateLoop(token: LoopToken) {
        this.loopStack.push(++this.loopCounter)
        let loopMips = "";
        //translate condition
        loopMips += `loop${this.loopCounter}:\n`
        const exitLoop = `exitLoop${this.loopCounter}\n`
        loopMips += this.translateBooleanCondition(token.properties.condition, exitLoop)
        if (token.properties.condition.type !== "chainedBoolean") {
            loopMips += `${exitLoop}\n`
        }
        //translate body
        console.log("loop body:", token.properties.body)
        token.properties.body.forEach(elem => {
            if ((elem as Token).token){
                //elem is a token
                console.log("loop translating", elem)
                loopMips += this.translate(elem as Token).mipsCode
            }
        })
        const loopCounter = this.loopStack.pop();
        loopMips += `j loop${loopCounter}\n\n`;
        loopMips += `exitLoop${loopCounter}:`;
        return loopMips;
    }

    /** Translates Loop Breaks (continue, break, pass) */
    public translateLoopBreak(token: LoopBreakToken) {
        let loopBreakMips = ""
        switch (token.properties.value) {
            case "break":
                loopBreakMips += `j exitLoop${this.loopCounter}\n`
                break;
            case "continue":
                loopBreakMips += `j loop${this.loopStack[0]}\n`
                break;
            case "pass":
                //pass does nothing
                break;
            default:
                break;
        }
        return loopBreakMips;
    }

    /** Translates if statements(including corresponding else) to mips code */
    public translateIfStatement(token: IfToken) {
        this.ifStack.push(++this.ifCounter)
        let mipsCode = `#if${this.ifCounter}\n`;
        console.log("if", token);
        mipsCode += this.translateIfCondition(token.properties.condition, token.properties.alternate ? true : false);
        mipsCode += this.translateIfBody(token.properties.body);
        const ifCounter = this.ifStack.pop()
        if(token.properties.alternate){
            mipsCode += `j exit${ifCounter}\n\n`
            mipsCode += `else${ifCounter}:\n`;
            mipsCode += this.translateIfBody(token.properties.alternate);
        }
        mipsCode += `\nexit${ifCounter}: \n`;
        return mipsCode;
    }

    /** Check if two items are of the same type.
     * Note that all arithmeticExpressions == ints and variables of known types are equal to the type of the corresponding literals. i.e.
     * x = 10 and 15 should both be identified as ints
     */
    private _isSameType(val1: DataObject | ArtihmeticExpressionToken, val2: DataObject | ArtihmeticExpressionToken) {
        if (val1.type.includes("string") && val2.type.includes("string")) {
            return true
        }
        else if ( (val1.type.includes("int") || val1.type.includes("artihmeticExpression") || val1.type.includes("boolean"))  
               && (val2.type.includes("int") || val2.type.includes("artihmeticExpression")  || val2.type.includes("boolean")) ) {
            return true
        } 
        else{
            return false    
        }
    }

    /** Translates a boolean condition to equivalent mips code 
     * @param jumpTo exclusively used by chainedBoolean and is the label to jump to if this condition is True
    */
    public translateBooleanCondition(condition: UnaryCondition | BinaryCondition | ChainedBooleanCondition, jumpTo: string) {
        let booleanMips = "";
        switch (condition.type) {
            case "unaryBoolean":
                booleanMips += this._translateUnaryBoolean(condition as UnaryCondition, (condition as UnaryCondition).negated);
                break;
            case "binaryBoolean":
                const binaryCondition = condition as BinaryCondition
                if (!this._isSameType(binaryCondition.left as DataObject, binaryCondition.right as DataObject)) {
                    booleanMips += `#This condition is comparing objects of types ${binaryCondition.left.type} and ${binaryCondition.right.type} and will never evaluate to true as comparands are of different types hence, the program just skips it\n
                    j `
                }
                else{
                    booleanMips += this._translateBinaryBoolean(binaryCondition)
                }
                break;
            case "chainedBoolean":
                booleanMips += this._translateChainedBoolean(condition as ChainedBooleanCondition, jumpTo);
                break;

            default:
                return `#some error occured, got type: ${condition.type}\n`;
        }
        return booleanMips;
    }

    /** Translates an if condition to equivalent mips code */
    public translateIfCondition(condition: UnaryCondition | BinaryCondition | ChainedBooleanCondition, alternatePresent: boolean): string {
        let ifConditionMips = ""
        const jumpTo = alternatePresent ? `else${this.ifCounter}` : `exit${this.ifCounter}`
        ifConditionMips += this.translateBooleanCondition(condition, jumpTo)
        if (condition.type !== "chainedBoolean") {
            ifConditionMips += `${jumpTo}\n`
        }
        return ifConditionMips;
    }

    private _negateComparsion(comparison: String) {
        switch (comparison) {
            case "==":
                return "!=";
            case "!=":
                return "==";
            case ">":
                return "<=";
            case ">=":
                return "<";
            case "<":
                return ">=";
            case "<=":
                return ">";
            default:
                break;
        }
    }

    private _translateChainedBoolean(condition: ChainedBooleanCondition, jumpTo: string) {
        if (condition.left.type === "chainedBoolean" || condition.right.type === "chainedBoolean") {
            return this._translateComplexChaninedBoolean(condition, "$t0") + `beqz $t0, ${jumpTo}\n`
        }
        else {
            return this._translateSimpleChaninedBoolean(condition, jumpTo)
        }
    }

    private _translateComplexChaninedBoolean(condition: ChainedBooleanCondition, register: string): string {
        let chainedBooleanMips = "";
        // Evaluates the left and right hand side before comparing the bits. 0 == False and !0 is True. Left hand side should be evaluated into $s0
        // with a value of 0 indicating the expression is false or not 0 indicating a true(i.e. -2 and 2 are considered true but 0 is false)
        // Similar with right hand side but with $ts1 instead
        //Translate left condition
        switch (condition.left.type) {
            case "unaryBoolean":
                chainedBooleanMips += this._evaluateUnaryBoolean(condition.left as UnaryCondition, "$s0");
                break;
            case "binaryBoolean":
                chainedBooleanMips += this._evaluateBinaryBoolean(condition.left as BinaryCondition, "$s0");
                break;
            case "chainedBoolean":
                chainedBooleanMips += this._translateComplexChaninedBoolean(condition.left as ChainedBooleanCondition, "$s0");
                break;
            default:
                break;
        }

        //Translate right condition
        switch (condition.right.type) {
            case "unaryBoolean":
                chainedBooleanMips += this._evaluateUnaryBoolean(condition.right as UnaryCondition, "$s1");
                break;
            case "binaryBoolean":
                chainedBooleanMips += this._evaluateBinaryBoolean(condition.right as BinaryCondition, "$s1");
                break;
            case "chainedBoolean":
                chainedBooleanMips += this._translateComplexChaninedBoolean(condition.right as ChainedBooleanCondition, "$s1");
                break;
            default:
                break;
        }

        if (condition.operator === "and") {
            chainedBooleanMips += `#and\nmult $s0, $s1\nmflo ${register}\n`
        }
        else {
            //or
            chainedBooleanMips += `or ${register}, $s0, $s1\n`
        }

        return chainedBooleanMips;
    }

    private _evaluateUnaryBoolean(condition: UnaryCondition, register: "$s0" | "$s1"): string {
        let evaluatedUnaryMips = ""
        switch (condition.comparison.type) {
            case "int":
                evaluatedUnaryMips += `li ${register}, ${condition.comparison.value}\n`;
                break;
            case "string":
                evaluatedUnaryMips += `la $a0, ${condition.comparison.value}\njal strEmpty\n#Flip the lsb so that 0 becomes 1, and 1 becomes 0\n
                xori $t0, $v0, 1\n`;
                this.functions.push('strEmpty');
                break;
            case "artihmeticExpression":
                evaluatedUnaryMips += this.translateArithmetic(condition.comparison as ArtihmeticExpressionToken);
                evaluatedUnaryMips += `add ${register}, $t0, $0\n`
                break;
            case "boolean":
                evaluatedUnaryMips += `li ${register}, ${condition.comparison.value}\n`
                break;
            case "variable-int":
                evaluatedUnaryMips += `lw ${register}, ${condition.comparison.value}\n`
                break;
            case "variable-string":
                evaluatedUnaryMips += `la $a0, ${condition.comparison.value}\njal strEmpty\nli $t0, $v0\n`;
                this.functions.push('strEmpty');
                break;
            case "variable-boolean":
                evaluatedUnaryMips += `lw ${register}, ${condition.comparison.value}\n`
                break;
            default:
                evaluatedUnaryMips += `#Some error occured, got type: ${condition.comparison.type}`
                break;
        }
        return evaluatedUnaryMips;
    }

    private _evaluateBinaryBoolean(condition: BinaryCondition, register: "$s0" | "$s1"): string {
        let evaluatedBinaryMips = "", leftComparand = "" , rightComparand = "";
        let comparingStrings = false
        if (condition.left.type.includes("string") || condition.right.type.includes("string") ) {
            //comparing strings
            comparingStrings = true;
            leftComparand = this._translateIfConditionComparand(condition.left, '$a0')
            rightComparand = this._translateIfConditionComparand(condition.right, '$a1')
        }
        else {
            leftComparand = this._translateIfConditionComparand(condition.left, '$t2')
            rightComparand = this._translateIfConditionComparand(condition.right, '$t3')
        }

        evaluatedBinaryMips += leftComparand + rightComparand

        switch (condition.comparison) {
            case "<":
                // a < b is the same as slt register a b
                if (comparingStrings) {
                    //if v0 == -1 then should return 1 (true) else return 0 (false)
                    evaluatedBinaryMips += `jal strCmp\nslti ${register}, $v0, 0\n`
                    this.functions.push('strCmp')
                }
                else {
                    evaluatedBinaryMips += `slt ${register}, $t2, $t3\n`
                }
                break;
            case "<=":
                // a <= b is the same as !(a > b)
                if (comparingStrings) {
                    //if v0 == 1 return 0 (false) else return 1 (true)
                    evaluatedBinaryMips += `jal strCmp\nslti ${register}, $v0, 1\n`
                    this.functions.push('strCmp')
                }
                else {
                    evaluatedBinaryMips += `slt ${register}, $t3, $t2\nxori ${register}, ${register}, 1\n`
                }
                break;
            case ">":
                // a > b is the same as slt b a
                if (comparingStrings) {
                    //if v0 == 1 return 1 (true) else return 0 (false)
                    evaluatedBinaryMips += `jal strCmp\nslt ${register}, $0, $v0\n`
                    this.functions.push('strCmp')
                }
                else {
                    evaluatedBinaryMips += `slt ${register} $t3, $t2\n`
                }
                break;
            case ">=":
                // a >= b is the same as !(a < b)
                if (comparingStrings) {
                    //if v0 == -1 then should return 0 (false) else return 1 (true)
                    evaluatedBinaryMips += `jal strCmp\nli ${register}, -1\nslt ${register}, ${register}, $v0\n`
                    this.functions.push('strCmp')
                }
                else {
                    evaluatedBinaryMips += `slt ${register} $t2, $t3\nxori ${register}, ${register}, 1\n`
                }
                break;
            case "==":
                // a == b is the same as a-b == 0
                if (comparingStrings) {
                    //if v0 == 0 then should return 1 (true) else return 0 (false)
                    evaluatedBinaryMips += `jal strCmp\nsltiu ${register}, $v0, 1\n`
                    this.functions.push('strCmp')
                }
                else {
                    evaluatedBinaryMips += `subu ${register} $t2, $t3\nsltu ${register}, $0, ${register}\nxori ${register}, ${register}, 1\n`
                }
                break;
            case "!=":
                // a != b is the same as a-b != 0
                if (comparingStrings) {
                    //if v0 == 0 then should return 0 (false) else return 1 (true)
                    evaluatedBinaryMips += `jal strCmp\nsltu ${register}, $0, $v0\n`
                    this.functions.push('strCmp')
                }
                else {
                    evaluatedBinaryMips += `subu ${register} $t2, $t3\nsltu ${register}, $0, ${register}\n`
                }
                break;     
            default:
                evaluatedBinaryMips += `#some error occured got comparison ${condition.comparison}\n`
                break;
        }

        return evaluatedBinaryMips;
    }

    /** Translates simple chained if conditions i.e. if x and y: ... to mips code */
    private _translateSimpleChaninedBoolean(condition: ChainedBooleanCondition, jumpTo: string): string {
        let chainedBooleanMips = ""
        if (condition.operator === "and") {
            //Translate left
            switch (condition.left.type) {
                case "unaryBoolean":
                    chainedBooleanMips += this._translateUnaryBoolean(condition.left as UnaryCondition, (condition.left as UnaryCondition).negated);
                    chainedBooleanMips += `${jumpTo}\n`
                    break;
                case "binaryBoolean":
                    chainedBooleanMips += this._translateBinaryBoolean(condition.left as BinaryCondition);
                    chainedBooleanMips += `${jumpTo}\n`
                    break;
                default:
                    break;
            }
            //Translate right
            switch (condition.right.type) {
                case "unaryBoolean":
                    chainedBooleanMips += this._translateUnaryBoolean(condition.right as UnaryCondition, (condition.left as UnaryCondition).negated);
                    chainedBooleanMips += `${jumpTo}\n`
                    break;
                case "binaryBoolean":
                    chainedBooleanMips += this._translateBinaryBoolean(condition.right as BinaryCondition);
                    chainedBooleanMips += `${jumpTo}\n`
                    break;
                default:
                    break;
            }
        }
        else {  
            //or
            const negatedLeft = {...condition.left, comparison: this._negateComparsion((condition.left as BinaryCondition).comparison as String)}
            console.log("NEGATED IF OR", negatedLeft)
            //Translate left
            switch (negatedLeft.type) {
                case "unaryBoolean":
                    chainedBooleanMips += this._translateUnaryBoolean(condition.left as UnaryCondition, !(condition.left as UnaryCondition).negated);
                    chainedBooleanMips += `ifBody${this.ifCounter}\n`
                    break;
                case "binaryBoolean":
                    chainedBooleanMips += this._translateBinaryBoolean(negatedLeft as BinaryCondition);
                    chainedBooleanMips += `ifBody${this.ifCounter}\n`
                    break;
                default:
                    break;
            }
            //Translate right
            switch (condition.right.type) {
                case "unaryBoolean":
                    chainedBooleanMips += this._translateUnaryBoolean(condition.right as UnaryCondition, (condition.left as UnaryCondition).negated);
                    chainedBooleanMips += `${jumpTo}\n`
                    break;
                case "binaryBoolean":
                    chainedBooleanMips += this._translateBinaryBoolean(condition.right as BinaryCondition);
                    chainedBooleanMips += `${jumpTo}\n`
                    break;
                default:
                    break;
            }
            chainedBooleanMips += `\nifBody${this.ifCounter}:\n`
        }
        
        return chainedBooleanMips;
    }

    /** Translates unary if conditions i.e. if x: ... to mips code */
    private _translateUnaryBoolean(condition: UnaryCondition, negated = false): string {
        let ifUnaryBoolean = ""
        ifUnaryBoolean += this._translateIfConditionComparand(condition.comparison as DataObject, "$t0")
        if (negated) {
            switch (condition.comparison.type) {
                case "int":
                    ifUnaryBoolean += `bne $t0, $0, `
                    break;
                case "string":
                    ifUnaryBoolean += `add $a0, $t0, $0\njal strEmpty\nbeq $v0, $0, `
                    this.functions.push('strEmpty')
                    break;
                case "artihmeticExpression":
                    ifUnaryBoolean += this.translateArithmetic(condition.comparison as ArtihmeticExpressionToken)
                    ifUnaryBoolean += `bne $t0, $0, `
                    break;
                case "boolean":
                    ifUnaryBoolean += `bne $t0, $0, `
                    break;
                case "variable-int":
                    ifUnaryBoolean += `bne $t0, $0, `
                    break;       
                case "variable-artihmeticExpression":
                    ifUnaryBoolean += `bne $t0, $0, `
                    break;     
                case "variable-string":
                    ifUnaryBoolean += `add $a0, $t0, $0\njal strEmpty\nbeq $v0, $0, `
                    this.functions.push('strEmpty');
                    break;
                case "variable-boolean":
                    ifUnaryBoolean += `bne $t0, $0, `
                    break;
                default:
                    break;
            }
        }

        else {
            switch (condition.comparison.type) {
                case "int":
                    ifUnaryBoolean += `beq $t0, $0, `
                    break;
                case "string":
                    ifUnaryBoolean += `add $a0, $t0, $0\njal strEmpty\nbne $v0, $0, `
                    this.functions.push('strEmpty')
                    break;
                case "artihmeticExpression":
                    ifUnaryBoolean += this.translateArithmetic(condition.comparison as ArtihmeticExpressionToken)
                    ifUnaryBoolean += `beq $t0, $0, `
                    break;
                case "boolean":
                    ifUnaryBoolean += `beq $t0, $0, `
                    break;
                case "variable-int":
                    ifUnaryBoolean += `beq $t0, $0, `
                    break;       
                case "variable-artihmeticExpression":
                    ifUnaryBoolean += `beq $t0, $0, `
                    break;     
                case "variable-string":
                    ifUnaryBoolean += `add $a0, $t0, $0\njal strEmpty\nbne $v0, $0, `
                    this.functions.push('strEmpty')
                    break;
                case "variable-boolean":
                    ifUnaryBoolean += `beq $t0, $0, `
                    break;
                default:
                    break;
            }
        }
        return ifUnaryBoolean;
    }

    /** Translates binary if conditions i.e. if x > y: ... to mips code */
    private _translateBinaryBoolean(condition: BinaryCondition): string{
        let ifBinaryBoolean = ""
        //comparands are of the same type
        if (condition.left.type.includes("string")){
            //comparands are of type string
            const leftComparand = this._translateIfConditionComparand(condition.left, '$a0')
            const rightComparand = this._translateIfConditionComparand(condition.right, '$a1')

            ifBinaryBoolean += leftComparand + rightComparand + 'jal strCmp\n'
            this.functions.push('strCmp');
            //strCmp will return v0 as 0 if a == b, 1 if a>b, -1 if a<b hqandle cases based on that
            switch (condition.comparison) {
                case "<":
                    ifBinaryBoolean += `li $t2, -1\nbne $v0, $t2, `
                    break;
                case "<=":
                    ifBinaryBoolean += `li $t2, 1\nbeq $v0, $t2, `
                    break;
                case ">":
                    ifBinaryBoolean += `li $t2, 1\nbne $v0, $t2, `
                    break;
                case ">=":
                    ifBinaryBoolean += `li $t2, -1\nbeq $v0, $t2, `
                    break;
                case "==":
                    ifBinaryBoolean += `bne $v0, $0, `
                    break;
                case "!=":
                    ifBinaryBoolean +=`beq $v0, $0, `
                    break;
            
                default:
                    break;
            }
        }

        else {
            //left comparand is stored in $t1
            const leftComparand = this._translateIfConditionComparand(condition.left, '$t1')
            console.log("left", leftComparand)
            //right comparand is stored in $t2
            const rightComparand = this._translateIfConditionComparand(condition.right, '$t2')
            console.log("right", rightComparand)
            ifBinaryBoolean += leftComparand + rightComparand
        
            switch (condition.comparison) {
                case "<":
                    ifBinaryBoolean += `bge $t1, $t2, `
                    break;
                case "<=":
                    ifBinaryBoolean += `bgt $t1, $t2, `
                    break;
                case ">":
                    ifBinaryBoolean += `ble $t1, $t2, `
                    break;
                case ">=":
                    ifBinaryBoolean += `bgt $t1, $t2, `
                    break;
                case "==":
                    ifBinaryBoolean += `bne $t1, $t2, `
                    break;
                case "!=":
                    ifBinaryBoolean +=`beq $t1, $t2, `
                    break;
            
                default:
                    break;
            }
        }
        console.log("translated", ifBinaryBoolean)
        return ifBinaryBoolean;
    }

    /** Translates the body of an if statement to equivalent mips code */
    public translateIfBody(body: Array<Token | DataObject>): string{
        let ifBodyMips = "";
        body.forEach(elem => {
            if ((elem as Token).token){
                //elem is a token
                console.log("if translating", elem)
                ifBodyMips += this.translate(elem as Token).mipsCode
            }
        })
        return ifBodyMips;
    }

    /** Translates comparands(things being compared) into appropriate types 
     * @param register register to store the operand in i.e. '$t0'
    */
    private _translateIfConditionComparand(comparand: Token | DataObject, register: string) {
        let comparandMips = ""
        if ((comparand as DataObject).value || (comparand as DataObject).value === 0 || (comparand as DataObject).value === "") {
            //comparand in a literal i.e. 3 or "hello"
            const comparandData = comparand as DataObject
            switch (comparandData.type) {
                case "int":
                    comparandMips += `li ${register}, ${comparandData.value}\n`
                    break;
                case "string":
                    comparandMips += `la ${register}, ${comparandData.value}\n`
                    break;
                case "boolean":
                    comparandMips += `li ${register}, ${comparandData.value ? "1" : "0"}`
                case "variable-int":
                    comparandMips += `lw ${register}, ${comparandData.value}\n`
                    break;
                case "variable-string":
                    comparandMips += `la ${register}, ${comparandData.value}\n`
                    break;
                case "variable-artihmeticExpression":
                    comparandMips += `lw ${register}, ${comparandData.value}\n`
                    break;
                case "variable-boolean":
                    comparandMips += `lw ${register}, ${comparandData.value}\n`
                    break;
                case "variable":
                    comparandMips += `la ${register}, ${comparandData.value}\n`
                    break;
                default:
                    break;
            }
        }
        else {
            //comparand is a token. 
            switch ((comparand as Token).token) {
                case "print":
                    //return error? technically python will evaluate the print and return false which i can do?
                    //unsupported for now..
                    break;
                case "input":
                    //unsupported feature so throw error
                    break;
                case "variableAssignment":
                    //throw error
                    break;
                case "ifStatement":
                    //throw erroe
                    break;
                case "stringConcatenation":
                    //also valid, but since theres a lack of temp variables this will be hard to do.... maybe unsupport?
                    break;
                case "artihmeticExpression":
                    //this is a valid case. evaluate the expression and store result(should be at $t0) at register
                    comparandMips += this.translateArithmetic(comparand as ArtihmeticExpressionToken)
                    comparandMips += `addi ${register}, $t0, 0\n`
                    break;
                default:
                    break;
            }
        }
        return comparandMips
    }

    /** Translates arithemetic tokens to mips code. Final evaluated value of the arithmetic expression is always stored 
     * in register $t0 */
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

    /** Translates a single arithmetic operation to mips code*/
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
                mipsCode += this._arithmeticOperationToString("div", { ...mipsOperation, operator: "/" }, freeRegister)
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
                if (mipsOperation.left.type.includes("variable")) {
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
                    if (mipsOperation.right.type.includes("variable")) {
                        mipsCode += `lw ${freeRegister}, ${mipsOperation.right.value}\n`
                    }
                    else if (mipsOperation.right.type === "int") {
                        mipsCode += `li ${freeRegister}, ${mipsOperation.right.value}\n`
                    }
                    rightRegister = freeRegister;
                }
                else {
                    if (mipsOperation.right.type.includes("variable")) {
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
                if (mipsOperation.left.type.includes("variable")) {
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
                    if (mipsOperation.right.type.includes("variable")) {
                        mipsCode += `lw ${freeRegister}, ${mipsOperation.right.value}\n`
                    }
                    else if (mipsOperation.right.type === "int") {
                        mipsCode += `li ${freeRegister}, ${mipsOperation.right.value}\n`
                    }
                    rightRegister = freeRegister;
                }
                else {
                    if (mipsOperation.right.type.includes("variable")) {
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
                if (mipsOperation.left.type.includes("variable")) {
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
                    if (mipsOperation.right.type.includes("variable")) {
                        mipsCode += `lw ${freeRegister}, ${mipsOperation.right.value}\n`
                    }
                    else if (mipsOperation.right.type === "int") {
                        mipsCode += `li ${freeRegister}, ${mipsOperation.right.value}\n`
                    }
                    rightRegister = freeRegister;
                }
                else {
                    if (mipsOperation.right.type.includes("variable")) {
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
    private _postOrderArithmetic(root: ArtihmeticExpressionToken | StringConcatenationToken): Array<{ operator: "+" | "-" | "*" | "/" | "//" | "%", left: any, right: any }> {
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