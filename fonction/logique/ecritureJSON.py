import sys 
import json

def ecrireJSON(fichier,texte):
    try:
        test = json.loads(texte)
        with open(fichier,'w') as f:
            f.write(texte)
    except FileNotFoundError:
        print(f"Fichier {fichier} pas trouver")
    except json.JSONDecodeError:
        print(f"erreur dans le test json")
if len(sys.argv) == 2:
    print("erreur")
elif len(sys.argv) == 3:
    fichier = sys.argv[1]
    texte = sys.argv[2]
    ecrireJSON(fichier,texte)
elif len(sys.argv) == 1:
    print("fichier,tetxe.json")
