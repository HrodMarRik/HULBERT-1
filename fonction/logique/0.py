import json
import sys

#lecture base de donnée

def lecturejson(nom_fichier, cle_a_verifier = None):

    if cle_a_verifier != None:
        try: # si il y a une cle a verifier
            with open(nom_fichier, 'r') as fichier:
                donnees = json.load(fichier)
                if cle_a_verifier in donnees:
                    print(f"La clé '{cle_a_verifier}' est présente dans le fichier JSON.")
        except FileNotFoundError:
            print(f"Le fichier {nom_fichier} est introuvable.")
        except json.JSONDecodeError:
            print(f"Le fichier {nom_fichier} n'est pas au format JSON valide.")
    else : # on lis tout
        try: 
            with open(nom_fichier, 'r') as fichier:
                donnees = json.load(fichier)
                print(donnees)
        except FileNotFoundError:
            print(f"Le fichier {nom_fichier} est introuvable.")
        except json.JSONDecodeError:
            print(f"Le fichier {nom_fichier} n'est pas au format JSON valide.")

# Vérifier si le nom du fichier est passé en argument et une clé à vérifier est fournie
if len(sys.argv) == 3:
    nom_fichier = sys.argv[1]
    cle_a_verifier = sys.argv[2]
    lecturejson(nom_fichier, cle_a_verifier)
elif len(sys.argv) == 2:
    nom_fichier = sys.argv[1]
    lecturejson(nom_fichier)
elif len(sys.argv) == 1:
    print("fichier,*clef")
else:
    #erreur quand trop d'argument passé. 
    pass
