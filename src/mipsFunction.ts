export const mipsFunctions = {
    strConcat: `
# strConcat -- append string
#
# RETURNS:
#   None, but $s0 is updated to end of destination string buffer
#
# arguments:
#   a0 -- address of destination buffer
#   a1 -- address of source buffer
#
# clobbers:
#   v0 -- current char
strConcat:
lb      $v0,0($a1)              # get the current char
beqz    $v0,strcat_done         # is char 0? if yes, done

sb      $v0,0($a0)              # store the current char

addi    $a0,$a0,1               # advance destination pointer
addi    $a1,$a1,1               # advance source pointer
j       strConcat

strcat_done:
sb      $zero,0($a0)            # add EOS
add     $s0,$a0,$0              # storing end pointer in $s0
jr      $ra                     # return\n
`,
    strCmp: `
# strCmp -- compares two strings; a and b
#
# RETURNS:
#   v0 --  0 if a == b
#      --  1 if a > b
#      -- -1 if a < b
#
# arguments:
#   a0 -- address of first string  (a)
#   a1 -- address of second string (b)
#
# clobbers:
#   v0 -- current char
strCmp:
add     $t1,$0,$a0           # t1=first string address
add     $t2,$0,$a1           # t2=second string address

loop:
lb      $t3,0($t1)              #load a byte from string 1
lb      $t4,0($t2)              #load a byte from string 2
beqz    $t3,checklower          #str1 is finished - if str2 is not also finished str1 < str2
beqz    $t4,higher              #str2 is finished -> str2 > str1
blt     $t3,$t4,lower           #if str1 < str2 -> str1 is lower
bgt     $t3,$t4,higher          #if str1 > str2 -> str1 is higher
addi    $t1,$t1,1               #t1 points to the next byte of str1
addi    $t2,$t2,1               #t2 points to the next byte of str2
#checking for user input as user input will have an extra "\\n" at the end.
lb      $t5, 0($t1)
lb      $t6, 0($t2)
xor 	$t0, $t5, $t6		    #check if (t5 == 10 and t6 == 0) or (t5 == 0 and t6 == 10) Note: 10 = ASCII for '\\n'
li 	    $t7, 10
beq 	$t0, $t7, checknewline
j       loop

checknewline:
beq     $t5, $t7, stringonenewline		#str1 has a newline so check the next letter of str1
beq     $t6, $t7, stringtwonewline		#str2 is a newline so check the next letter of str2
j       loop

checklower:
beqz    $t4,equal
j       lower

equal:
li      $v0,0
jr      $ra

lower:
li      $v0,-1
jr      $ra

higher:
li      $v0,1
jr      $ra

stringonenewline:
addi    $t1,$t1,1               #t1 points to the next byte of str1
lb      $t5, 0($t1)
beqz 	$t5, equal		        #check if at end of string
j 	    higher

stringtwonewline:
addi    $t2,$t2,1               #t2 points to the next byte of str2
lb      $t6, 0($t2)
beqz 	$t6, equal		        #check if at end of string
j 	    lower\n
`,
    strEmpty:
`
# strEmpty -- checks if a string is empty
#
# RETURNS:
#   v0 --  1 if string is empty
#      --  0 otherwise
#
#
# arguments:
#   a0 -- address of string to check
#
strEmpty:
lb      $t0,0($a0)              #load first char from string 
beqz    $t0, isEmpty
li      $t1, 10
bne     $t0, $t1, notEmpty      #check if string is only a newline
lb      $t0,1($a0)              #load second char from string 
beqz    $t0, isEmpty
j       notEmpty

isEmpty:
li      $v0, 1
jr      $ra

notEmpty:
li      $v0, 0
jr      $ra
`,
    printArray:
`
# printArray -- prints all the contents of an Array
#
# RETURNS:
#   Nothing
#
#
# arguments:
#   a0 -- address of the array to print
#
# clobbers:
#   --length of list is stored at position 0 of the array
printArray:
addi        $t0, $0, 0 # t0 = 0
addi        $t1, $a0, 0 # $t1 = address of the_list
lw          $t2, ($t1)  # $t2 = size of list
li          $a0, '['
addi        $v0, $0, 11
syscall
bge         $t0, $t2, endPrint

printLoop:
addi        $t3, $0, 4
mult        $t3, $t0
mflo        $t4
add         $t4, $t4, $t3 # $t4 = $t0 * 4 + 4
add         $t4, $t4, $t1
lw          $a0, ($t4) # load current item value into $a0
addi        $v0, $0, 1
syscall     # print current item
addi        $t0, $t0, 1 # $t0 = $t0 + 1
bge         $t0, $t2, endPrint
addi        $a0, $0, 44 # print a comma - ascii code 44
addi        $v0, $0, 11
syscall
addi        $a0, $0, 32 # print a space - ascii code 32
addi        $v0, $0, 11
syscall
j           printLoop

endPrint:
li          $a0, ']'
addi        $v0, $0, 11
syscall
jr          $ra`,
    len:
`
# len -- calculates length of an Array
#
# RETURNS:
#   v0 - length of the array
#
#
# arguments:
#   a0 -- address of the array
#
# clobbers:
#   --length of list is stored at position 0 of the array
len:
addi        $t0, $a0, 0 # $t0 = address of the_list
lw          $v0, ($t0)  # $v0 = size of list
jr          $ra
`,

}