import sys
# input : (a*b)=r[modulo]
#  		  a=r[modulo]
def recherche(a=None,b=None,r=None,modulo=None):
	x = 1
	if a==None:
		while True:
			if x == 100:
				break
			if (x*b)%modulo == r:
				print(f"pour x*{b} congrue à {r} modulo {modulo} : x ={x}")
				break
			x +=1
	elif b ==None:
		while True:
			if x == 100:
				break
			if (x*a)%modulo == r:
				print(f"pour x*{a} congrue à {r} modulo {modulo} : x ={x}")
				break
			x +=1
	elif r ==None:
		r = (a*b)%modulo
		if isinstance(r,int) :
			print(f"pour ({a}*{b})/{modulo} r = {r}")
			
		else :
			print(f"la valeur de r n'est pas decimal (r={r})")
			
	elif modulo ==None:
		while True:
			if x == 100:
				break
			if (a*b)%x==r:
				print(f"{a}*{b} congrue à {r} modulo {x}")
				break
			x +=1

calcule = sys.argv[1].split("=")[0]
rm = sys.argv[1].split("=")[1]
r = rm.split("[")[0]
modulo = rm.split("[")[1]
modulo = modulo.split("]")[0]
print(f"calcule ={calcule}, r ={r}, modulo ={modulo}")
				

recherche(a=a,b=b,r=r,modulo=modulo)
