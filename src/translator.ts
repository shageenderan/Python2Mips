import { parserOutput, textParams } from "./main";

/** Provides functions for translating tokens to mips */

export default class Translate {

    public translate = (pyCode: textParams) => {
        let mipsCode = ""
        switch (pyCode.type) {
            case "syscall":
                mipsCode += this.toSyscall(pyCode.function, pyCode.addr)
                break;
            default:
                mipsCode += "//some other code\n";
                break;
        }
        return mipsCode
    }

    private toSyscall = (func: string, addr?: string) => {
        let syscallFunc = ""
        switch (func) {
            case "print":
                syscallFunc += `la $a0, ${addr}\naddi $v0, $0, 4\nsyscall\n`;
                break;
            default:
                syscallFunc += "//some other code\n";
                break;
        }
        return syscallFunc
    }

}