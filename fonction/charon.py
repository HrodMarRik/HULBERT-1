import sys
import subprocess
import datetime


#verification que la base de donné existe



def gestion_entrer():
	"""
	SQL ou doc texte ?

	base de donnée avec : 
		-Protocole 
		-arboresence (des base de donné + du PC) ?
		-profile ?
	"""
	dico_info["commande_initial"]=sys.argv[1]

	pass
def lancement_fonction(fonction,args):
	"""
	lancement de la fonction, enregistre le dico avec la reponse et les erreures (si il n'y en a pas la case est None)

	"""
	T1 = datetime.now()
	#lancement de la fonction demander avec ses arguments 

	#enregistrement de la sortie et des erreures dans le dico globale
	T2 = datetime.now()
	#enregistrement du temps d'execution dans le dico globale
	pass
def verification_args(fonction):
	"""verifie que les argument demander sont dans les base de données  --> si oui elle est remplacer dans le dico.
																		--> sinon elle programme la recherche dans la liste_fonction.
	"""															  
	pass
def historique(fonction):
	pass
def gestion_sortie():

	#envoie les donné orale à une fonction
	#envoie les donné ecrite pour l'interface visuel
	print(f"dico_info :\n{dico_info}")
	pass

def lecture_sql(clef):
	#connéxion a la base de donné + curseur

	#recherche de la clef (clef = mon argument, exemple : taille_# = 1m87)

	#lecture de la clef 
	pass
	connexion = 
	curseur =
	valeur =
	if valeur:
		return valeur
	else:
		return False



global liste_fonction
global historique
global dico_info




dico_info["temps_entrer"] = datetime.now()
gestion_entrer()
dico_info["temps_boucle"] = datetime.now()
while True: #boucle du Protocole avec les fonctions à lancer

	if len(liste_fonction) == 0 
		
		#virification que le protocole à été initialiser (historique) 
		if len(historique) != 0:
			dico_info["to_interface_erreur"] = "MESSAGE ERREUR rien dans la liste mais action dans historique"
			break

		#cherche une reponse pour l'interface
		for cle in dico:
		    if cle.startswith("to_interface"):
		        break
		
	else : #lancement de la fonction 0 dans la liste. 

		#récupération des argument pour la fonction 0 en la lancant à vide :
		dico_info[liste_fonction[0]+"_args"] = lancement_fonction(liste_fonction[0],args = None)

		#verification des argument --> mise a jour de la liste...boucle :
		args = verification_args(liste_fonction[0]):

		#la verification ce passe sans prblm : on lance la fonction 0 :
		if args != False:
			lancement_fonction(liste_fonction[0],dico_info[args])

		#pas les argument --> erreur
		else:
			dico_info["to_interface_erreur"] = f"MESSAGE ERREUR manque d'information pour la fonction {liste_fonction[0]}"
			break
	
		

		#mise a jour boucle avec l'incrémentation et l'historique.
		historique(liste_fonction[0])
		liste_fonction.pop[0]
dico_info["temps_sortie"] = datetime.now()
gestion_sortie()


