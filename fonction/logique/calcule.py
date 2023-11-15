import sys



def forme(expression):
    calcule = []
    num = ""
    expression+="µ"
    for char in expression:
        if char.isdigit() or char == ".":
            num += char
        else :
            if num =="":
                if char == "-":
                    num+=char
            else:    
                calcule.append(num)
                calcule.append(char)
                num = ""

    return calcule
def trie(expression):
    nombre_nb=len(expression)/2
    nombre_op=len(expression)-nombre_nb-1
    x = 1
    temp=0
    resultat=0
    while expression[x] !="µ":
        if expression[x] == "*":
            temp = (float(expression[x-1])*float(expression[x+1]))
            expression[x-1]=str(temp)
            expression.pop(x)
            expression.pop(x)
            temp = 0
        elif expression[x] == "/":
            temp = (float(expression[x-1])/float(expression[x+1]))
            expression[x-1]=str(temp)
            expression.pop(x)
            expression.pop(x)
            temp = 0
        elif expression[x] == "+":
            temp = x
            while temp<len(expression)and expression[temp] != '/' and expression[temp] != '*' :

                temp +=2
            if temp>len(expression):
                temp = 0
                while expression[x] !="µ":
                    if expression[x]=="+":
                        expression[x] = str((float(expression[x-1])+float(expression[x+1])))
                        expression.pop(x+1)
                        expression.pop(x-1)
                    elif expression[x]=="-":
                        
                        expression[x] = str((float(expression[x-1])-float(expression[x+1])))
                        expression.pop(x+1)
                        expression.pop(x-1)
            elif expression[temp] =='*':
                expression[temp] =str((float(expression[temp-1])*float(expression[temp+1])))
                expression.pop(temp+1)
                expression.pop(temp-1)
            elif expression[temp] =='/':
                expression[temp] =str((float(expression[temp-1])/float(expression[temp+1])))
                expression.pop(temp+1)
                expression.pop(temp-1)
        elif expression[x] == "-":
            temp = x
            while temp<len(expression)and expression[temp] != '/' and expression[temp] != '*' :
                temp +=2
            if temp>len(expression):
                temp = 0
                while expression[x] !="µ":
                    if expression[x]=="+":
                        expression[x] =str((float(expression[x-1])+float(expression[x+1])))
                        expression.pop(x+1)
                        expression.pop(x-1)
                    elif expression[x]=="-":
                        expression[x] = str((float(expression[x-1])-float(expression[x+1])))
                        expression.pop(x+1)
                        expression.pop(x-1)

            elif expression[temp] =='*':
                expression[temp] =str((float(expression[temp-1])*float(expression[temp+1])))
                expression.pop(temp+1)
                expression.pop(temp-1)

            elif expression[temp] =='/':
                expression[temp] =str((float(expression[temp-1])/float(expression[temp+1])))
                expression.pop(temp+1)
                expression.pop(temp-1)


        else :
            print("il y a une erreur quelque part dans l'analyse des opérateur, dans trie de calcule.py")


    return expression[0]
        

if __name__ == '__main__':
    expression = sys.argv[1]
    forme = forme(expression)
    trie = trie(forme)
    print(trie)

"""

2-4*3

"""