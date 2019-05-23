export class DataObject {
    /** The type of data, i.e. string, int, variable etc.. */
    type: string | null;
    /** value of a string */
    value?: string | number;
    /** used in rare cases to indicate a space is needed */
    spaced?: boolean;
}

export interface StringConcatProperties{
    addedStrings: Array<DataObject>;
}

export interface ArtihmeticExpressionProperties{
    operator: "+" | "-" | "*" | "/";
    left: ArtihmeticExpressionToken | DataObject;
    right: ArtihmeticExpressionToken | DataObject; 
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

export class PrintToken {
    token : string;
    properties: {
        prompt: Array< DataObject | ArtihmeticExpressionToken >;
    }

}

export class InputToken {
    token: string;
    type: "int" | "string" | null;
    properties: {
        prompt: Array< DataObject | ArtihmeticExpressionToken >;
    }
}

export class VariableAssignmentDataObject extends DataObject{
    initialDeclaration: boolean;
}

export class VariableAssignmentToken {
    token: string;
    properties: {
        variable: string;
        value: DataObject |  ArtihmeticExpressionToken | InputToken | StringConcatenationToken;

        /** indicates the space taken by this variable(including the null terminator '\0') BEFORE this variable assignment */
        space?: number;
    }
}

 