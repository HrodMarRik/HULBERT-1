
import subprocess
import time
import sys


while True:
################################## VARIABLE ##################################################################
	arbo_question ="/home/rick/Bureau/hulbert/biblio/question.txt"
	arbo_reponse ="/home/rick/Bureau/hulbert/biblio/reponse"
	arbo_profile ="/home/rick/Bureau/hulbert/biblio/profil"
	arbo_info ="/home/rick/Bureau/hulbert/biblio/info"
	arbo_fonction ="/home/rick/Bureau/hulbert/fonction/"
	x = 0
	num = ""
	reponse = ""
	si_executable = ""
	extraction_return = ""
	recherche_return = 0
	temp = 0
	calcule = 0

################################## FONCTION OBLIGATOIRE ######################################################
	instruction = sys.argv[1]
	calcule = module.detect_calcul(instruction)
	if calcule != 0: #ça ce lance que si il y a un calcule detécté
		temp = module.lancement_exe(arbo_fonction,"calcule.py",calcule)
		temp=float(temp.strip())
		print(f"le calcule : {calcule} = {temp}")
		instruction = instruction.replace(calcule,"")
	if instruction == "":#pas d'instruction
		print("\n")
		continue
	else:
		module.enregistrement_historique("ask",instruction)

################################## RECHERCHE DE L'INSTRUCTION ################################################
	recherche_return = module.recherche_doc(arbo_question,instruction) #cherche l'instruction dans le dossier

################################## INSTRUCTION INCONNUE ######################################################
	if recherche_return == -1:
		print(f"{instruction} | n'existe pas voulez vous la créé ou la lié a une autre?.")
		x = 0
		while x ==0:
			temp = input("\n-->")
			if temp == 'non':
				
				x = 1
			if temp == 'oui':
				temp = input("vous voulé créé ou lié?\n-->")
################################## ENREGISTREMENT DE L'INSTRUCTION ###########################################
			if temp == 'créé':
				with open(arbo_info,'r') as f: #je lis le nombre dans info
					num = f.read()

			
				num = module.changement_type("str",num)
				instruction = module.changement_type("str",instruction)
				while si_executable !="e" and si_executable !="r":
					si_executable =input("l'instruction vas lancer : un executable(e) ou une réponse(r)\n-->")
				temp ="µ"+si_executable.upper()+num+"µ"+instruction
				module.enregistrement_doc(arbo_question,temp)
				module.enregistrement_historique("rec",temp)
				recherche_return = module.recherche_doc(arbo_question,temp)

				with open(arbo_info,'w') as f: #j'augemente le nombre dans info
					num = module.changement_type("int",num)
					temp = num+1
					temp = module.changement_type("str",temp)
					f.write(temp)

				x =1
				temp = 0	
################################## LIE L'INSTRUCTION AVEC UNE AUTRE DEJA ENREGISTRER #########################
			if temp == 'lié':
				print("voici les réponse possible\n",module.extraction_doc(arbo_reponse),"\n")
				num = input("veuiller entré la référence -->")
				temp = module.extraction_doc(arbo_reponse,module.recherche_doc(arbo_reponse,num))
				print("\"",temp,"\" Est la réponse et la référence de votre instruction")
				extraction_return = module.extraction_doc(arbo_reponse,module.recherche_doc(arbo_reponse,num))
				print(extraction_return,"extraction_return")
				for char in str(extraction_return):
					if temp == 2:
						pass
					if temp == 1:
						if char =="µ":
							temp +=1
						else :
							num += char
					if temp == 0:
						if char =="µ":
							temp +=1
							continue
						else:
							continue
				phrase ="µ"+str(num)+"µ"+str(instruction)
				module.enregistrement_doc(arbo_question,phrase)
				module.enregistrement_historique("link",phrase)
				x = 1
################################## GESTION ERREURE ###########################################################
			if x == 0:
				print("frero tu dois juste me dire oui, non, créé ou lié gros sac a merde")

################################## INSTRUCTION CONNUE ########################################################
	if recherche_return > 0: #l'instruction renvoie à une ligne
		extraction_return = module.extraction_doc(arbo_question,recherche_return) #vas chercher la réponse	
		num = ""
		for char in str(extraction_return): #prend la reference de l'instruction
			if temp == 2:
				pass
			if temp == 1:
				if char =="µ":
					temp +=1
				else :
					num += char
			if temp == 0:
				if char =="µ":
					temp +=1
					continue
				else:
					continue
################################## INSTRUCTION EST UN EXECUTABLE #############################################
		if "E" in num: #executable
			num = "µ"+num+"µ"
			temp =0
			recherche_return = module.recherche_doc(arbo_reponse,num)
			if recherche_return == -1: #pas d'executable
				print("aucun executable trouver")
				print("veuiller créé l'executable pour vous assister a la création de l'executable")
			else:#il y a un executable
				extraction_return = module.extraction_doc(arbo_reponse,recherche_return)
				args = "" 
				for char in str(extraction_return):
					if temp == 3:
						if char =="µ":
							temp +=1
						else:
							args += char

					if temp == 2:
						if char =="µ":
							temp +=1
						else:
							si_executable += char

					if temp == 1:
						if char =="µ":
							temp +=1
					if temp == 0:
						if char=="µ":
							temp+=1
						else :
							si_executable += char
				module.lancement_exe(arbo_fonction,si_executable,args)
################################## INSTRUCTION EST UNE RÉPONSE ###############################################
		if "R" in num: #réponse simple
			num = "µ"+num+"µ"
			temp =0
			recherche_return = module.recherche_doc(arbo_reponse,num)
			if recherche_return == -1: #pas de réponse
				print("il n'y a pas de reponse enregistrer pour la question :",instruction,"\n")
				print("voulez vous en enregistré une ?")
				x = 0
				while x == 0:
					temp = input()
					if temp == "oui":
						print(f"la question est :{instruction} \n")
						y = 0
						while y != 1:
							reponse = input("quel réponse vu vous rentré ? \n-->")
							validation = input(f"vous validez la réponse : {reponse}\n")
							if validation =="oui":
								reponse = num + reponse
								module.enregistrement_doc(arbo_reponse,reponse)
								y = 1
								x = 1
							elif validation =="non":
								y = 1
								x = 1


					elif temp == "non":
						print("vous avez dis non\n")
						x +=1
					else:
						print("pas compris, veuiller me répondre par oui ou par non\n")
				temp = 0
			else: #il y a une réponse
				extraction_return = module.extraction_doc(arbo_reponse,recherche_return)
				for char in str(extraction_return):
					if temp == 2:
						reponse += char
					if temp == 1:
						if char =="µ":
							temp +=1
					if temp == 0:
						if char =="µ":
							temp +=1

				print(reponse)
				while True:
					user_input = module.input_with_timeout("Entrez quelque chose : ", 10)
					if user_input is not None:
					    print("Vous avez entré :", user_input)
					    break
					else :
						module.enregistrement_historique("ask",instruction,reponse,num)
						print("bonne journée")
						break
					


