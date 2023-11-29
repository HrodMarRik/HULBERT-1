import json
import sys	


"""
prend un ou plusieur objet(dico)
pour chaque objet : 

on ouvre le doc reference 
on verifie si l'objet existe deja :
	
	si oui on ecrit juste le contenue 
	sinon on le créé

"""


try:
	dico = json.loads(sys.argv[1])
except Exception as e:
	raise e





for clef in dico:
	chemin = "/home/rick/Bureau/HULBERT/lib/grammaire/"+clef[0].upper()+"/"+str(len(clef))
	print(chemin)
	contenue = dico[clef]
	try:
		with open(chemin,'r') as f:
			doc = f.read()
			doc = json.loads(doc)
	except FileNotFoundError:
		with open(chemin,'w+') as f:
			f.write(json.dumps(dico))
	except Exception as e:
		raise e

	for x in dico[clef]:
		TYPE = x.split("=")[0]
		TYPE_value =x.split("=")[1]