import logging
import os
import sys
from concurrent.futures import ThreadPoolExecutor

from PIL import Image
import pystray
from pystray import Icon as icon, MenuItem as item

# Adjust path to include parent directory
parent_dir = os.path.abspath(os.path.join(os.getcwd(), os.pardir))
sys.path.insert(0, parent_dir)

# Import local modules
import App.Fonctions.sbin.objetHulbert as Hu
import App.Fonctions.bin.testMachine as testMachine
import App.Fonctions.bin.testReseau as testReseau

import App.Fonctions.bin.loggerConfig


def run_test_machine():
    systeme_info = testMachine.main()
    return systeme_info

def run_test_reseau():
    reseau_info = testReseau.main()
    return reseau_info

def launch_hulbert(env):
    logging.debug("lancement de HULBERT")
    app = Hu.Hulbert(env)
    logging.debug("Hulbert application finished\n")

if __name__ == "__main__":
    with ThreadPoolExecutor() as executor:
        future_machine = executor.submit(run_test_machine)
        future_reseau = executor.submit(run_test_reseau)
        
        systeme_info = future_machine.result()
        reseau_info = future_reseau.result()

        # la lecture des preference vienne completer le env
        env = {
            "INFO systeme" : systeme_info,
            "INFO reseau" : reseau_info,
            "PREF" : {
                "icone" : "../Resources/ico.png",
                "cache" : {
                    "test" : "cache/test.json"
                },
                "interface" : "graphique",
                "bin" : "/home/rick/Bureau/projet/HULBERT/App/Fonctions/bin",
                "sbin" : "/home/rick/Bureau/projet/HULBERT/App/Fonctions/sbin",
                "Database" : "/home/rick/Bureau/projet/HULBERT/Database",
                "Resources" : "/home/rick/Bureau/projet/HULBERT/Resources",
                "Routes" : "/home/rick/Bureau/projet/HULBERT/Routes",


            },
        }
        logging.debug(env)

        executor.submit(launch_hulbert, env)