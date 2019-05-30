export const mipsFunctions = {
    strConcat: `
# strConcat -- append string
#
# RETURNS:
#   None, but $s0 is updated to end of destination string buffer
#
# arguments:
#   a0 -- pointer to destination buffer
#   a1 -- pointer to source buffer
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
#   a0 -- pointer to first string(a)
#   a1 -- pointer to second string(b)
#
# clobbers:
#   v0 -- current char
strcmp:
add     $t0,$zero,$zero         # t0=0
add     $t1,$zero,$a0           # t1=first string address
add     $t2,$zero,$a1           # t2=second string address

loop:
lb      $t3,0($t1)              #load a byte from string 1
lb      $t4,0($t2)              #load a byte from string 2
beqz    $t3,checklower          #str1 is finished - if str2 is not also finished str1 < str2
beqz    $t4,higher              #str2 is finished -> str2 > str1
blt     $t3,$t4,lower           #if str1 < str2 -> str1 is lower
bgt     $t3,$t4,higher          #if str1 > str2 -> str1 is higher
addi    $t1,$t1,1               #t1 points to the next byte of str1
addi    $t2,$t2,1               #t2 points to the next byte of str2
lb	$t5, 0($t1)
lb	$t6, 0($t2)
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
jr      $ra\n
`,
}