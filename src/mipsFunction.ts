export const mipsFunctions = {
    strConcat: `
# strConcat -- append string
#
# RETURNS:
#   s0 -- updated to end of destination
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
add     $s0, $a0, $0            # storing end pointer in $s0
jr      $ra                     # return\n
`
}