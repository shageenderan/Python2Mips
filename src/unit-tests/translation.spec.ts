import Translate from '../translator';
import { expect } from 'chai';
import 'mocha';
import { PrintToken, InputToken, ArtihmeticExpressionToken } from '../objects/tokens';

const pyTranslator = new Translate();

describe('Testing converting artihmetic expressions to Mips code', () => {
   // 5 - 3*3 + 3 * 2
   const test1 = {
      "token": "artihmeticExpression",
      "properties": {
         "operator": "+",
         "left": {
            "token": "artihmeticExpression",
            "properties": {
               "operator": "-",
               "left": {
                  "type": "int",
                  "value": 5
               },
               "right": {
                  "token": "artihmeticExpression",
                  "properties": {
                     "operator": "*",
                     "left": {
                        "type": "int",
                        "value": 3
                     },
                     "right": {
                        "type": "int",
                        "value": 3
                     }
                  }
               }
            }
         },
         "right": {
            "token": "artihmeticExpression",
            "properties": {
               "operator": "*",
               "left": {
                  "type": "int",
                  "value": 3
               },
               "right": {
                  "type": "int",
                  "value": 2
               }
            }
         }
      },
      "type": "artihmeticExpression"
   };

   // (2+3) * (6-3*8)
   const test2 = {
      "token": "artihmeticExpression",
      "properties": {
         "operator": "*",
         "left": {
            "token": "artihmeticExpression",
            "properties": {
               "operator": "+",
               "left": {
                  "type": "int",
                  "value": 2
               },
               "right": {
                  "type": "int",
                  "value": 3
               }
            }
         },
         "right": {
            "token": "artihmeticExpression",
            "properties": {
               "operator": "-",
               "left": {
                  "type": "int",
                  "value": 6
               },
               "right": {
                  "token": "artihmeticExpression",
                  "properties": {
                     "operator": "*",
                     "left": {
                        "type": "int",
                        "value": 3
                     },
                     "right": {
                        "type": "int",
                        "value": 8
                     }
                  }
               }
            }
         }
      },
      "type": "artihmeticExpression"
   };

   // (2-3) * (6-3*8) + 90/45
   const test3 = {
      "token": "artihmeticExpression",
      "properties": {
         "operator": "+",
         "left": {
            "token": "artihmeticExpression",
            "properties": {
               "operator": "*",
               "left": {
                  "token": "artihmeticExpression",
                  "properties": {
                     "operator": "-",
                     "left": {
                        "type": "int",
                        "value": 2
                     },
                     "right": {
                        "type": "int",
                        "value": 3
                     }
                  }
               },
               "right": {
                  "token": "artihmeticExpression",
                  "properties": {
                     "operator": "-",
                     "left": {
                        "type": "int",
                        "value": 6
                     },
                     "right": {
                        "token": "artihmeticExpression",
                        "properties": {
                           "operator": "*",
                           "left": {
                              "type": "int",
                              "value": 3
                           },
                           "right": {
                              "type": "int",
                              "value": 8
                           }
                        }
                     }
                  }
               }
            }
         },
         "right": {
            "token": "artihmeticExpression",
            "properties": {
               "operator": "/",
               "left": {
                  "type": "int",
                  "value": 90
               },
               "right": {
                  "type": "int",
                  "value": 45
               }
            }
         }
      },
      "type": "artihmeticExpression"
   }

   it('Translate: ArtihmeticExpression(5 - 3*3 + 3 * 2) ', () => {
      const result = pyTranslator.translate(test1 as ArtihmeticExpressionToken);
      expect(result.mipsCode).to.equal('li $t2, 3\nli $t0, 3\nmult $t2, $t0\nmflo $t0\nli $t2, 5\nsub $t0, $t2, $t0\nli $t2, 3\nli $t1, 2\nmult $t2, $t1\nmflo $t1\nadd $t0, $t0, $t1\n');
   });

   it('Translate: ArtihmeticExpression((2+3) * (6-3*8)) ', () => {
      const result = pyTranslator.translate(test2 as ArtihmeticExpressionToken);
      expect(result.mipsCode).to.equal('li $t2, 2\nli $t0, 3\nadd $t0, $t2, $t0\nli $t2, 3\nli $t1, 8\nmult $t2, $t1\nmflo $t1\nli $t2, 6\nsub $t1, $t2, $t1\nmult $t0, $t1\nmflo $t0\n');
   });

   it('Translate: ArtihmeticExpression((2-3) * (6-3*8) + 90/45) ', () => {
      const result = pyTranslator.translate(test3 as ArtihmeticExpressionToken);
      expect(result.mipsCode).to.equal('li $t2, 2\nli $t0, 3\nsub $t0, $t2, $t0\nli $t2, 3\nli $t1, 8\nmult $t2, $t1\nmflo $t1\nli $t2, 6\nsub $t1, $t2, $t1\nmult $t0, $t1\nmflo $t0\nli $t2, 90\nli $t1, 45\ndiv $t2, $t1\nmflo $t1\nadd $t0, $t0, $t1\n');
   });

});

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
      expect(result.mipsCode).to.equal(`la $a0, str0\naddi $v0, $0, 4\nsyscall\n` + 
      `#printing newline\naddi $a0, $0, 0xA #ascii code for LF(newline), if you have any trouble try 0xD for CR.\naddi $v0, $0, 11 #syscall 11 prints the lower 8 bits of $a0 as an ascii character.\nsyscall\n`);
   });

   it('Translate: Print(Integer) ', () => {
      const result = pyTranslator.translate(printInteger);
      expect(result.mipsCode).to.equal(`addi $a0 $0 3\naddi $v0, $0, 1\nsyscall\n` +
      `#printing newline\naddi $a0, $0, 0xA #ascii code for LF(newline), if you have any trouble try 0xD for CR.\naddi $v0, $0, 11 #syscall 11 prints the lower 8 bits of $a0 as an ascii character.\nsyscall\n`);
   });

   it('Translate: Print(Variable) ', () => {
      const result = pyTranslator.translate(printVariable);
      expect(result.mipsCode).to.equal(`la $a0, testVar\naddi $v0, $0, 4\nsyscall\n` +
      `#printing newline\naddi $a0, $0, 0xA #ascii code for LF(newline), if you have any trouble try 0xD for CR.\naddi $v0, $0, 11 #syscall 11 prints the lower 8 bits of $a0 as an ascii character.\nsyscall\n`);
   });

   it('Translate: Print(Simple Arthimetic Expression) ', () => {
      const result = pyTranslator.translate(printSimpleArthimetic);
      expect(result.mipsCode).to.equal('li $t1, 9\nli $t0, 30\nmult $t1, $t0\nmflo $t0\nli $t1, 5\ndiv $t0, $t1\nmflo $t0\nli $t1, 32\nadd $t0, $t0, $t1\nadd $a0 $0 $t0\naddi $v0, $0, 1\nsyscall\n#printing newline\naddi $a0, $0, 0xA #ascii code for LF(newline), if you have any trouble try 0xD for CR.\naddi $v0, $0, 11 #syscall 11 prints the lower 8 bits of $a0 as an ascii character.\nsyscall\n');
   });

});

describe('Testing converting Python Input Statements to Mips Input Syscalls', () => {

   const inputVoid:InputToken = {
      "token": "input",
      "properties": {
         "prompt": [
            {
               "type": null
            }
         ]
      },
      "type": null
   }

   const inputString:InputToken = {
      "token": "input",
      "properties": {
         "prompt": [
            {
               "type": "string",
               "value": "str0"
            }
         ]
      },
      "type": null
   }

   const inputStringComp:InputToken = {
      "token": "input",
      "properties": {
         "prompt": [
            {
               "type": "string",
               "value": "str0"
            },
            {
               "type": "string",
               "value": "str1"
            }
         ]
      },
      "type": null
   }

   const inputInt:InputToken = {
      "token": "input",
      "properties": {
         "prompt": [
            {
               "type": "int",
               "value": 3
            }
         ]
      },
      "type": null
   }

   const inputSimpleArithmetic = {
      "token": "input",
      "properties": {
         "prompt": [
            {
               "token": "artihmeticExpression",
               "properties": {
                  "operator": "+",
                  "left": {
                     "type": "int",
                     "value": 3
                  },
                  "right": {
                     "token": "artihmeticExpression",
                     "properties": {
                        "operator": "*",
                        "left": {
                           "type": "int",
                           "value": 3
                        },
                        "right": {
                           "type": "int",
                           "value": 2
                        }
                     }
                  }
               },
               "type": "artihmeticExpression"
            }
         ]
      },
      "type": null
   }

   it('Translate: Input() ', () => {
      const result = pyTranslator.translate(inputVoid);
      expect(result.mipsCode).to.equal(`la $a0, STR_ADDRESS #[WARNING]:reading a string but not assigning it anywhere\nli $a1, MAX_SPACE_FOR_STR\naddi $v0, $0,8\nsyscall\n`);
   });

   it('Translate: Input(String) ', () => {
      const result = pyTranslator.translate(inputString);
      expect(result.mipsCode).to.equal(`la $a0, str0\naddi $v0, $0, 4\nsyscall\nla $a0, STR_ADDRESS #[WARNING]:reading a string but not assigning it anywhere\nli $a1, MAX_SPACE_FOR_STR\naddi $v0, $0,8\nsyscall\n`);
   });

   it('Translate: Input(String + String) ', () => {
      const result = pyTranslator.translate(inputStringComp);
      expect(result.mipsCode).to.equal(`la $a0, str0\naddi $v0, $0, 4\nsyscall\nla $a0, str1\naddi $v0, $0, 4\nsyscall\nla $a0, STR_ADDRESS #[WARNING]:reading a string but not assigning it anywhere\nli $a1, MAX_SPACE_FOR_STR\naddi $v0, $0,8\nsyscall\n`);
   });

   it('Translate: Input(Int) ', () => {
      const result = pyTranslator.translate(inputInt);
      expect(result.mipsCode).to.equal(`addi $a0 $0 3\naddi $v0, $0, 1\nsyscall\nla $a0, STR_ADDRESS #[WARNING]:reading a string but not assigning it anywhere\nli $a1, MAX_SPACE_FOR_STR\naddi $v0, $0,8\nsyscall\n`);
   });

   it('Translate: Input(3+3*2) ', () => {
      const result = pyTranslator.translate(inputSimpleArithmetic);
      expect(result.mipsCode).to.equal('li $t1, 3\nli $t0, 2\nmult $t1, $t0\nmflo $t0\nli $t1, 3\nadd $t0, $t1, $t0\nadd $a0 $0 $t0\naddi $v0, $0, 1\nsyscall\nla $a0, STR_ADDRESS #[WARNING]:reading a string but not assigning it anywhere\nli $a1, MAX_SPACE_FOR_STR\naddi $v0, $0,8\nsyscall\n');
   });

});