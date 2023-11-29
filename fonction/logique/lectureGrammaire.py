# stdin = liste en json
# stdout = dico en json

import sys
import json



def grammaire(mot):
	lien="/home/rick/Bureau/HULBERT/lib/grammaire"+"/"+mot[0].upper()+"/"+str(len(mot))
	ID = mot[0].upper() + str(len(mot))
	try:
		with open(lien, "r") as f:
			doc = ""
			while doc != "EOF":
				doc = f.readline()
				doc = json.loads(doc)
				if doc[mot]:
					DEF = doc[mot]
					return(DEF)
			
	except Exception as e:
		print(f"erreur =\n{str(e)}")
		ticket(mot,str(e))

	return None

def ticket(mot,erreur):
	lien_ticket_grammaire = "/home/rick/Bureau/HULBERT/lib/ticket/grammaire/"

	with open(lien_ticket_grammaire+mot,"a+") as f:
		f.write(erreur+"\n")

global dico_mots
global liste_mots
dico_mots = {}
liste_mots = json.loads(sys.argv[1])


for mot in liste_mots:
	dico_mots[mot]=grammaire(mot)


print(json.dumps(dico_mots))



