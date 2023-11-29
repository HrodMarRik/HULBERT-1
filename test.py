import subprocess
import sys
print("\n")
commande = [sys.argv[1], '--help']

result = subprocess.run(commande, stdout=subprocess.PIPE, stderr=subprocess.PIPE, text=True)
sortie = result.stdout
erreurs = result.stderr

mots_utilisation = ["Utilisation","utilisation","Usage","usage",commande[0]]
mots_option = ["-", "--"]

utilisation = []
option = []
definition = []

lignes = sortie.splitlines()
for line in lignes:
	line = line.lstrip()
	if any(line.startswith(mot) for mot in mots_utilisation):
		print(line)
		utilisation += [line]
	elif any(line.startswith(mot) for mot in mots_option):
		print(line)
		option +=  [line]
	else:
		definition += [line]
if erreurs:
    print("Erreurs:")
    print(erreurs)

#erreur : lancement d'une app, --help -h 



# Utilisation
for line in utilisation:
	print(line+)

# argument 

for line in option:
	print(line)


# definition

for line in definition:
	print(line)


print("\n")

