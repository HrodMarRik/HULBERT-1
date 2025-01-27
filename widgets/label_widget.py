import customtkinter as ctk
from tkinter import Menu

class label_widget(ctk.CTkLabel):
    def __init__(self, master):
        super().__init__(
            master=master,
            text="Hello World",
            font=("Arial", 12, "bold"),
            fg_color="#333333",
            corner_radius=8,
            padx=10,
            pady=5
        )
        
        # Créer le menu contextuel
        self.menu_contextuel = Menu(
            master, 
            tearoff=0, 
            bg="#333333", 
            fg="#ffffff",
            activebackground="#4a4a4a", 
            activeforeground="#ffffff"
        )
        self.menu_contextuel.add_command(
            label="Supprimer",
            command=self.supprimer
        )
        
    def supprimer(self):
        self.destroy() 