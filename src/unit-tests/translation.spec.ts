import Translate from '../translator';
import { expect } from 'chai';
import 'mocha';
import { PrintToken } from '../objects/tokens';

const pyTranslator = new Translate();
describe('Testing converting Python Print Statements to Mips Print Syscalls', () => {

   const printString:PrintToken = {
      token: "print",
      properties: {
         prompt: [
            {
               type: "string",
               value: "str0"
            }
         ]
      }
   }
   const printInteger:PrintToken = {
      token: "print",
      properties: {
         prompt: [
            {
               type: "int",
               value: 3,
            }
         ]
      }
   }

   const printVariable:PrintToken = {
      token: "print",
      properties: {
         prompt: [
            {
               type: "variable",
               value: "testVar"
            }
         ]
      }
   }

   const printSimpleArthimetic:PrintToken = {
      "token": "print",
      "properties": {
         "prompt": [
            {
               "token": "artihmeticExpression",
               "properties": {
                  "operator": "+",
                  "left": {
                     "token": "artihmeticExpression",
                     "properties": {
                        "operator": "/",
                        "left": {
                           "token": "artihmeticExpression",
                           "properties": {
                              "operator": "*",
                              "left": {
                                 "type": "int",
                                 "value": 9
                              },
                              "right": {
                                 "type": "int",
                                 "value": 30
                              }
                           }
                        },
                        "right": {
                           "type": "int",
                           "value": 5
                        }
                     }
                  },
                  "right": {
                     "type": "int",
                     "value": 32
                  }
               },
               "type": "artihmeticExpression"
            }
         ]
      }
   }

   it('Translate: Print(String) ', () => {
      const result = pyTranslator.translate(printString);
      expect(result).to.equal(`la $a0, str0\naddi $v0, $0, 4\nsyscall\n` + 
      `#printing newline\naddi $a0, $0, 0xA #ascii code for LF(newline), if you have any trouble try 0xD for CR.\naddi $v0, $0, 11 #syscall 11 prints the lower 8 bits of $a0 as an ascii character.\nsyscall\n` +
      `addi $v0, $0, 10\nsyscall\n`);
   });

   it('Translate: Print(Integer) ', () => {
      const result = pyTranslator.translate(printInteger);
      expect(result).to.equal(`addi $a0 $0 3\naddi $v0, $0, 1\nsyscall\n` +
      `#printing newline\naddi $a0, $0, 0xA #ascii code for LF(newline), if you have any trouble try 0xD for CR.\naddi $v0, $0, 11 #syscall 11 prints the lower 8 bits of $a0 as an ascii character.\nsyscall\n` + 
      `addi $v0, $0, 10\nsyscall\n`);
   });

   it('Translate: Print(printVariable) ', () => {
      const result = pyTranslator.translate(printVariable);
      expect(result).to.equal(`la $a0, testVar\naddi $v0, $0, 4\nsyscall\n` +
      `#printing newline\naddi $a0, $0, 0xA #ascii code for LF(newline), if you have any trouble try 0xD for CR.\naddi $v0, $0, 11 #syscall 11 prints the lower 8 bits of $a0 as an ascii character.\nsyscall\n` + 
      `addi $v0, $0, 10\nsyscall\n`);
   });

   it('Translate: Print(Simple Arthimetic Expression) ', () => {
      const result = pyTranslator.translate(printSimpleArthimetic);
      expect(result).to.equal("li $t0, 9\nli $t2, 30\nmult $t0, $t2\nmflo $t0\nli $t1, 5\ndiv $t0, $t1\nmflo $t0\nli $t1, 32\nadd $t0, $t0, $t1\nadd $a0 $0 $t0\naddi $v0, $0, 1\nsyscall\n" +
      `#printing newline\naddi $a0, $0, 0xA #ascii code for LF(newline), if you have any trouble try 0xD for CR.\naddi $v0, $0, 11 #syscall 11 prints the lower 8 bits of $a0 as an ascii character.\nsyscall\n` +
      `addi $v0, $0, 10\nsyscall\n`);
   });

});