import customtkinter as ctk

class InterfaceConnexion(ctk.CTkFrame):
    def __init__(self, master, callback_connexion):
        super().__init__(master)
        self.callback_connexion = callback_connexion
        
        # Créer les widgets de connexion
        self.username_entry = ctk.CTkEntry(self, placeholder_text="Nom d'utilisateur")
        self.username_entry.pack(pady=10)
        
        self.password_entry = ctk.CTkEntry(self, placeholder_text="Mot de passe", show="*")
        self.password_entry.pack(pady=10)
        
        self.login_button = ctk.CTkButton(self, text="Se connecter", command=self.verifier_connexion)
        self.login_button.pack(pady=10)
    
    def verifier_connexion(self):
        # Ici, ajoutez votre logique de vérification
        # Pour cet exemple, on simule une connexion réussie
        self.callback_connexion(True)
        self.destroy()  # Ferme la fenêtre de connexion