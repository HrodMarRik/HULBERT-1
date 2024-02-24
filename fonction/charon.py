import sys
import subprocess
import datetime

class BDD(object):
	def __init__(self):
		super(BDD, self).__init__()
		self.data = {}
		self.data.update( { argv : sys.argv[0: ] } )
        try:
            with open("BDD/fonction/charon.json","r") as file:
                seed_data = json.load(file)
                self.data.update(seed_data)
        except Exception as e:
            raise e

class main(object):
	def __init__(self,bdd):
		super(main, self).__init__()
		self.bdd = bdd

	def fonction(self):
		pass

	def protocole(self):
		for fonction in protocole:
			fonction(fonction)

	def texte(self):
		pass
		

if __name__ == '__main__':
	bdd = BDD()
	main(bdd)
		


