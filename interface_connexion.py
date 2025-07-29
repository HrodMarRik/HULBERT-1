import customtkinter as ctk
from rich.console import Console
from rich.logging import RichHandler
import logging

# Configuration du logging
console = Console()
logging.basicConfig(
    level=logging.INFO,
    format="%(message)s",
    datefmt="[%X]",
    handlers=[RichHandler(console=console, rich_tracebacks=True)]
)
logger = logging.getLogger("Hulbert")

class InterfaceConnexion(ctk.CTkFrame):
    def __init__(self, master, callback_connexion):
        super().__init__(master)
        self.callback_connexion = callback_connexion
        
        try:
            # Créer les widgets de connexion
            self.username_entry = ctk.CTkEntry(self, placeholder_text="Nom d'utilisateur")
            self.username_entry.pack(pady=10)
            
            self.password_entry = ctk.CTkEntry(self, placeholder_text="Mot de passe", show="*")
            self.password_entry.pack(pady=10)
            
            self.login_button = ctk.CTkButton(self, text="Se connecter", command=self.verifier_connexion)
            self.login_button.pack(pady=10)
            
            logger.info("Interface de connexion créée")
            
        except Exception as e:
            logger.error(f"Erreur création interface connexion: {e}")
    
    def verifier_connexion(self):
        """Vérifier la connexion"""
        try:
            # Ici, ajoutez votre logique de vérification
            # Pour cet exemple, on simule une connexion réussie
            logger.info("Connexion réussie")
            self.callback_connexion(True)
            self.destroy()  # Ferme la fenêtre de connexion
        except Exception as e:
            logger.error(f"Erreur vérification connexion: {e}")