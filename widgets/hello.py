import customtkinter as ctk

class hello(ctk.CTkFrame):
    def __init__(self, master):
        super().__init__(
            master=master,
            fg_color="pink",
            corner_radius=8
        )
        
        self.label = ctk.CTkLabel(
            master=self,
            text="Hello World",
            text_color="green",
            font=("Arial", 12, "bold")
        )
        
        self.label.pack(padx=10, pady=10)
