import subprocess
import time
import schedule
import json

class BDD(object):
    
    def __init__(self):
        super(BDD, self).__init__()
        self.data = {}
        try:
            with open("BDD/.seed.json","r") as file:
                seed_data = json.load(file)
                self.data.update(seed_data)
        except Exception as e:
            raise e

    def save(self): #A REFAIRE DOIS LIRE LES DATA ET COMPARER A LA BDD
        try:
            with open("BDD/.seed.json","w") as file:
                seed_data = json.dumps(self.data["seed"])
                file.write(seed_data)
        except Exception as e:
            raise e

    def read(self,clef): # lis dans la bdd
        self.data[]

    def write(self,clef,data): # ecris dans la bdd
        self.data[]

class BACK:
    def __init__(self, bdd):
        self.bdd = bdd

    def seconde(self):
        if self.bdd.seed.BACK["seconde"]:
            main.charon(self.bdd.seed.BACK["seconde"], "BACK")
        else:
            pass

    def minute(self):
        if self.bdd.seed.BACK["minute"]:
            main.charon(self.bdd.seed.BACK["minute"], "BACK")
        else:
            pass

    def heure(self):
        if self.bdd.seed.BACK["heure"]:
            main.charon(self.bdd.seed.BACK["heure"], "BACK")
        else:
            pass

    def jours(self):
        if self.bdd.seed.BACK["jours"]:
            main.charon(self.bdd.seed.BACK["jours"], "BACK")
        else:
            pass

    def semaine(self):
        if self.bdd.seed.BACK["semaine"]:
            main.charon(self.bdd.seed.BACK["semaine"], "BACK")
        else:
            pass

    def mois(self):
        if self.bdd.seed.BACK["mois"]:
            main.charon(self.bdd.seed.BACK["mois"], "BACK")
        else:
            pass

    def run(self):
        schedule.every(1).seconds.do(self.seconde)
        schedule.every().minutes.do(self.minute)
        schedule.every().hour.do(self.heure)
        schedule.every().day.at("00:00").do(self.jours)
        schedule.every().week.do(self.semaine)
        schedule.every().month.do(self.mois)

        while True:
            schedule.run_pending()
            time.sleep(1) 

class main(object):
    
    def __init__(self,bdd):
        super(main, self).__init__()
        self.bdd = bdd
        # lancement protocole de seed dans charon

    def charon(argv):
        try:
            process = subprocess.Popen("fonction/charon.py", stdout=subprocess.PIPE, stderr=subprocess.PIPE)
            stdout, stderr = process.communicate()
            if process.returncode == 0:
                print("Sortie standard :\n", stdout.decode())
            else:
                print("Erreur :\n", stderr.decode())
        except FileNotFoundError:
            print("Le programme spécifié n'a pas été trouvé.")
        except Exception as e:
            print("Une erreur s'est produite :", e)

    def enregistrement(self):
        pass
                        
if __name__ == '__main__':
    bdd = BDD()
    back = BACK(bdd)
    main(bdd)
