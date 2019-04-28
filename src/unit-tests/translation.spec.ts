import Translate from '../translator';
import { expect } from 'chai';
import 'mocha';
import { PrintToken } from '../objects/tokens';

const pyTranslator = new Translate();
describe('Testing converting Python Print Statements to Mips Print Syscalls', () => {

   const HelloWorld:PrintToken = {
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
   const Int:PrintToken = {
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

   const Variable:PrintToken = {
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

   const SimpleArthimetic:PrintToken = {
      token: "print",
      properties: {
         prompt: [
            {
               token: "artihmeticExpression",
               properties: {
                  operator: "+",
                  left: {
                     type: "int",
                     value: 2
                  },
                  right: {
                     type: "int",
                     value: 2
                  }
               },
               type: "artihmeticExpression"
            }
         ]
      }
   }

   it('Translate Printing String ', () => {
      const result = pyTranslator.translate(HelloWorld);
      expect(result).to.equal(`la $a0, str0\naddi $v0, $0, 4\nsyscall\n`);
   });

   it('Translate Printing Integer ', () => {
      const result = pyTranslator.translate(Int);
      expect(result).to.equal(`addi $a0 $0 3\naddi $v0, $0, 1\nsyscall\n`);
   });

   it('Translate Printing Variable ', () => {
      const result = pyTranslator.translate(Variable);
      expect(result).to.equal(`la $a0, testVar\naddi $v0, $0, 4\nsyscall\n`);
   });

   it('Translate Printing Simple Arthimetic Expression ', () => {
      const result = pyTranslator.translate(SimpleArthimetic);
      expect(result).to.equal("some arthimetic expression");
   });

});