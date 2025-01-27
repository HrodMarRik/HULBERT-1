import customtkinter as ctk

class Button(ctk.CTkButton):
    def __init__(self, master, **kwargs):
        super().__init__(
            master,
            text="Bouton personnalisé",
            font=("Arial", 12, "bold"),
            corner_radius=8,
            hover_color="#2c5c9e",
            **kwargs
        ) 