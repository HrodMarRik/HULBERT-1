import os
import sys
import logging 

parent_dir = os.path.abspath(os.path.join(os.getcwd(), os.pardir))
sys.path.insert(0, parent_dir)

import App.Fonctions.bin.loggerConfig
import App.Fonctions.bin as BIN
 
info = "OUVERTURE DE : " + __name__
logging.debug(info)


class interface():
	def __init__(self, env):
		logging.debug("DEBUT CREATION interface")

		if env["PREF"]["interface"] == "graphique":
			logging.info("LANCEMENT de l'interface graphique")
