export interface DataObject {
    /** The type of data, i.e. string, int, variable etc.. */
    type: string | null;
    /** value of a string */
    value?: string | number;
    /** used in rare cases to indicate a space is needed */
    spaced?: boolean;
}

export class ArtihmeticExpressionToken {
    token: string;
    type: string;
    properties: {
        operator: "+" | "-" | "*" | "/";
        left: ArtihmeticExpressionToken | DataObject;
        right: ArtihmeticExpressionToken | DataObject;  
    }
}

export class PrintToken {
    token : string;
    properties: {
        prompt: Array< DataObject | ArtihmeticExpressionToken >;
    }

}

export class InputToken {
    token: string;
    properties: {
        prompt: Array< DataObject | ArtihmeticExpressionToken >;
    }
}

export class VariableAssignmentToken {
    token: string;
    properties: {
        variable: string;
        value: DataObject |  ArtihmeticExpressionToken | InputToken
        type: string;
    }
}

 