import customtkinter as ctk
import subprocess

class GUI(ctk.CTk):
    def __init__(self):
        super().__init__()
        self.title("Terminal GUI")
        self.geometry("600x400")
        
        self.create_widgets()

    def create_widgets(self):
        self.main_frame = ctk.CTkFrame(self)
        self.main_frame.pack(fill="both", expand=True, padx=10, pady=10)

        self.open_terminal_button = ctk.CTkButton(self.main_frame, text="Ouvrir Terminal GNOME", command=self.open_gnome_terminal)
        self.open_terminal_button.pack(pady=20)

    def open_gnome_terminal(self):
        # Utiliser subprocess pour ouvrir un terminal GNOME
        try:
            subprocess.run(["gnome-terminal"])
        except Exception as e:
            print(f"Erreur lors de l'ouverture du terminal : {e}")
    
    def run(self):
        self.mainloop()

if __name__ == "__main__":
    app = GUI()
    app.run()
