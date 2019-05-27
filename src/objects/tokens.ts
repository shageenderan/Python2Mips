export class DataObject {
    /** The type of data, i.e. string, int, variable etc.. */
    type: string | null;
    /** value of a string */
    value?: string | number;
    /** used in rare cases to indicate a space is needed */
    spaced?: boolean;
}

export class Token {
    token: "print" | "input" | "artihmeticExpression" | "stringConcatenation" | "variableAssignment" | "ifStatement";
    type?: string;
    properties: StringConcatProperties | ArtihmeticExpressionProperties | VariableAssignmentProperties | IfTokenProperties | IOTokenProperties
}

export interface StringConcatProperties {
    addedStrings: Array<DataObject>;
}

export interface ArtihmeticExpressionProperties {
    operator: "+" | "-" | "*" | "/";
    left: ArtihmeticExpressionToken | DataObject;
    right: ArtihmeticExpressionToken | DataObject;
}

export interface IOTokenProperties {
    prompt: Array<DataObject | ArtihmeticExpressionToken>;
}

export interface VariableAssignmentProperties {
    variable: string;
    value: DataObject | ArtihmeticExpressionToken | InputToken | StringConcatenationToken;

    /** indicates the space taken by this variable(including the null terminator '\0') BEFORE this variable assignment */
    space?: number;
}

export interface IfCondition {
    left: Token | DataObject;
    comparision: "<" | "<=" | ">" | ">=" | "==" | "!=";
    right: Token | DataObject;
}

export interface IfTokenProperties {
    condition: IfCondition;
    body: Array<Token | DataObject>
    alternate: Array<Token | DataObject>
}

export class PrintToken {
    token: string;
    properties: IOTokenProperties;
}

export class InputToken {
    token: string;
    type: "int" | "string" | null;
    properties: IOTokenProperties;
}

export class VariableAssignmentDataObject extends DataObject {
    initialDeclaration: boolean;
}

export class VariableAssignmentToken {
    token: string;
    properties: VariableAssignmentProperties;
}

export class StringConcatenationToken {
    token: string;
    properties: StringConcatProperties

}

export class ArtihmeticExpressionToken {
    token: string;
    type: string;
    properties: ArtihmeticExpressionProperties
}

export class IfToken {
    token: string;
    properties: IfTokenProperties;
}