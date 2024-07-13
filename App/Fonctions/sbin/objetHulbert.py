import logging
import os
import sys
import threading

from PIL import Image, ImageDraw, ImageFont
import pystray
from pystray import MenuItem as item

parent_dir = os.path.abspath(os.path.join(os.getcwd(), os.pardir))
sys.path.insert(0, parent_dir)

import App.Fonctions.bin.loggerConfig
from App.Fonctions.bin import read, write
from App.Fonctions;sbin import objetInterface

info = "OUVERTURE de : " + __name__
logging.info(info)

class Hulbert:
    def __init__(self, env):
        logging.info("DEBUT Creation Hulbert")

        self.icon_image = self.create_image_from_file(env)
        self.icon = None
        self.is_running = False

        write.toJson(env["PREF"]["cache"]["test"], env)
        var = read.fromJson(env["PREF"]["cache"]["test"])
        self.setup_icon()

        logging.debug("FIN Creation Hulbert")
        
    def setup_icon(self):
        logging.debug("setup icone")
        self.icon = pystray.Icon("HULBERT", self.icon_image, "Application en arrière-plan", self.create_menu())
        self.icon.run()

    def create_menu(self):
        if self.is_running == True:
            menu = (item('Afficher', self.show_app), item('Quitter', self.quit_app))
        else :
            menu  = (item('HULBERT', self.show_app), item('Quitter', self.quit_app))
        return menu

    def show_app(self, icon, item):
        if not self.is_running:
            self.is_running = True
            threading.Thread(target=self.start_new_app).start()
        else:
            logging.info("L'interface est déjà en cours")

    def start_new_app(self):
        new_app_window = App(self)
        new_app_window.run()
        self.is_running = False

    def quit_app(self, icon, item):
        if self.icon:
            self.icon.stop()
        if self.is_running:
            logging.warning("CODE MANQUANT")

    def create_image_from_file(self, env):
        try:
            img = Image.open(env["PREF"]["icone"])
            img = img.resize((32, 32), Image.ANTIALIAS)
            img = img.convert("RGBA")
            return img
        except Exception as e:
            logging.error(f"Error loading image: {e}")
            return self.create_placeholder_image()

    def create_placeholder_image(self):
        width, height = 8, 8
        img = Image.new('RGBA', (width, height), color=(255, 255, 255, 0))
        draw = ImageDraw.Draw(img)
        font = ImageFont.load_default()
        text = 'H'
        text_width, text_height = draw.textsize(text, font=font)
        # Calcul des coordonnées pour centrer le texte
        text_x = (width - text_width) // 2
        text_y = (height - text_height) // 2
        draw.text((text_x, text_y), text, fill="red", font=font)
        return img


