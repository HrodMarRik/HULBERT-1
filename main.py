import customtkinter as ctk
from tkinter import *
from interface_connexion import InterfaceConnexion
import os
import importlib.util

class MainApplication(ctk.CTk):
    def __init__(self):
        super().__init__()
        
        # Ajouter un dictionnaire pour suivre les widgets ajoutés
        self.widgets_added = set()  # Ensemble pour stocker les types de widgets déjà ajoutés
        
        self.widget_connexion = InterfaceConnexion(self, self.on_connexion_callback)
        self.widget_connexion.pack(expand=True)
        
        self.interface_principale_visible = False
        self.creer_interface_principale()
        self.cacher_interface_principale()
        self.bind_all('<Button-3>', self.on_right_click)

    def creer_interface_principale(self):
        self.title("Hulbert GUI")
        self.attributes('-zoomed', True)
        
        self.configure(bg="#2b2b2b")
        
        self.menu_bar = Menu(self, bg="#333333", fg="#ffffff", activebackground="#4a4a4a", 
                           activeforeground="#ffffff", relief="flat", bd=0)
        self.config(menu=self.menu_bar)
        
        self.file_menu = Menu(self.menu_bar, tearoff=0, bg="#333333", fg="#ffffff",
                            activebackground="#4a4a4a", activeforeground="#ffffff",
                            relief="flat", bd=0)
        self.menu_bar.add_cascade(label="Fichier", menu=self.file_menu, 
                                font=("Arial", 10, "bold"))
        self.widget_menu = Menu(self.file_menu, tearoff=0, bg="#333333", fg="#ffffff",
                              activebackground="#4a4a4a", activeforeground="#ffffff",
                              relief="flat", bd=0)
        self.file_menu.add_cascade(label="Nouveau widget", menu=self.widget_menu)
        
        self.widget_menu.add_command(label="TimeTable", 
                                   command=lambda: self.ajouter_widget("TimeTable"),
                                   font=("Arial", 9))
        self.widget_menu.add_command(label="Label", 
                                   command=lambda: self.ajouter_widget("label_widget"),
                                   font=("Arial", 9))
        self.widget_menu.add_command(label="Hello", 
                            command=lambda: self.ajouter_widget("hello"),
                            font=("Arial", 9))
        self.file_menu.add_separator()
        self.file_menu.add_command(label="Quitter", command=self.quit,
                                 font=("Arial", 9))
        
        self.main_frame = ctk.CTkFrame(self, fg_color="#2b2b2b", corner_radius=10)
        self.main_frame.name = "main_frame"
        self.main_frame.pack(fill=BOTH, expand=True, padx=10, pady=10)
        
        self.status_bar = ctk.CTkLabel(self, text="Prêt", anchor="w", 
                                     fg_color="#333333", corner_radius=5,
                                     font=("Arial", 11))
        self.status_bar.pack(side=BOTTOM, fill=X, padx=10, pady=5)

    def cacher_interface_principale(self):
        if hasattr(self, 'menu_bar'):
            self.menu_bar.forget()
        if hasattr(self, 'main_frame'):
            self.main_frame.pack_forget()
        if hasattr(self, 'status_bar'):
            self.status_bar.pack_forget()
        
    def afficher_interface_principale(self):
        self.config(menu=self.menu_bar)
        
        self.main_frame.pack(fill=BOTH, expand=True, padx=10, pady=10)
        
        self.status_bar.pack(side=BOTTOM, fill=X, padx=10, pady=5)
        
    def on_connexion_callback(self, success):
        if success:
            self.widget_connexion.destroy()
            self.afficher_interface_principale()
            
    def ajouter_widget(self, widget_name="Button"):
        # Vérifier si le widget existe déjà
        if widget_name in self.widgets_added:
            print(f"Le widget {widget_name} est déjà présent dans l'interface")
            return
        
        # Créer d'abord un frame conteneur
        container = ctk.CTkFrame(
            self.main_frame, 
            fg_color="orange", 
            corner_radius=0
        )
        
        # Créer un autre frame à l'intérieur pour le padding
        inner_frame = ctk.CTkFrame(
            container, 
            fg_color=self.main_frame._fg_color
        )
        inner_frame.pack(padx=5, pady=5, fill="both", expand=True)
        
        # Créer le widget dans le inner_frame
        if os.path.exists(f"widgets/{widget_name}.py"):
            try:
                spec = importlib.util.spec_from_file_location(widget_name, f"widgets/{widget_name}.py")
                module = importlib.util.module_from_spec(spec)
                spec.loader.exec_module(module)
                widget_class = getattr(module, widget_name)
                nouveau_widget = widget_class(inner_frame)
                self.widgets_added.add(widget_name)
            except Exception as e:
                print(f"Erreur lors du chargement du widget {widget_name}: {e}")
                return
        else:
            if widget_name.lower() == "button":
                nouveau_widget = ctk.CTkButton(inner_frame, text="Bouton",
                                             font=("Arial", 12, "bold"),
                                             corner_radius=8,
                                             hover_color="#2c5c9e")
                self.widgets_added.add("button")
            elif widget_name.lower() == "label":
                nouveau_widget = ctk.CTkLabel(inner_frame, text="Label",
                                            font=("Arial", 12))
                self.widgets_added.add("label")
            else:
                print(f"Type de widget non reconnu: {widget_name}")
                return

        nouveau_widget.pack(padx=5, pady=5)
        
        # Placer temporairement pour obtenir les dimensions naturelles
        container.place(x=0, y=0)
        self.update_idletasks()  # Force la mise à jour des dimensions
        
        # Obtenir les dimensions naturelles
        width = container.winfo_reqwidth()
        height = container.winfo_reqheight()
        
        # Configurer les dimensions finales basées sur les dimensions naturelles
        container.configure(width=width, height=height)
        container.pack_propagate(False)  # Figer la taille après l'avoir définie
        
        # Trouver une position libre
        position_trouvee = False
        x, y = 0, 0
        step = 20  # Pas de déplacement
        
        while not position_trouvee:
            collision = False
            
            # Vérifier les collisions à cette position
            for widget in self.main_frame.winfo_children():
                if widget != container and isinstance(widget, ctk.CTkFrame):
                    # Coordonnées du nouveau widget
                    curr_x1 = x
                    curr_y1 = y
                    curr_x2 = x + container.winfo_width()
                    curr_y2 = y + container.winfo_height()
                    
                    # Coordonnées de l'autre widget
                    other_x1 = widget.winfo_x()
                    other_y1 = widget.winfo_y()
                    other_x2 = other_x1 + widget.winfo_width()
                    other_y2 = other_y1 + widget.winfo_height()
                    
                    # Vérifier s'il y a collision
                    if not (curr_x2 < other_x1 or curr_x1 > other_x2 or
                           curr_y2 < other_y1 or curr_y1 > other_y2):
                        collision = True
                        break
            
            # Si pas de collision et dans les limites de la fenêtre
            if not collision and x + container.winfo_width() <= self.main_frame.winfo_width() and y + container.winfo_height() <= self.main_frame.winfo_height():
                position_trouvee = True
            else:
                # Déplacer à la position suivante
                x += step
                if x + container.winfo_width() > self.main_frame.winfo_width():
                    x = 0
                    y += step
                
                # Si on a parcouru toute la fenêtre, augmenter le pas
                if y + container.winfo_height() > self.main_frame.winfo_height():
                    y = 0
                    step += 20
                    if step > 100:  # Limite de sécurité
                        x = 0
                        y = 0
                        break
        
        # Placer le widget à la position trouvée
        container.place(x=x, y=y)
        
        # Rendre le container déplaçable
        self.rendre_widget_deplacable(container)

    def rendre_widget_deplacable(self, container):
        def start_drag(event):
            container._drag_start_x = event.x
            container._drag_start_y = event.y
            container.configure(fg_color="#ff8c00")
            # Mettre le widget en premier plan pendant le déplacement
            container.lift()

        def do_drag(event):
            delta_x = event.x - container._drag_start_x
            delta_y = event.y - container._drag_start_y
            
            # Calculer la nouvelle position
            new_x = container.winfo_x() + delta_x
            new_y = container.winfo_y() + delta_y
            
            # Obtenir les dimensions
            container_width = container.winfo_width()
            container_height = container.winfo_height()
            window_width = self.main_frame.winfo_width()
            window_height = self.main_frame.winfo_height()
            
            # Vérifier les collisions avec les autres widgets
            can_move = True
            for widget in self.main_frame.winfo_children():
                if widget != container and isinstance(widget, ctk.CTkFrame):
                    # Coordonnées du widget actuel
                    curr_x1 = new_x
                    curr_y1 = new_y
                    curr_x2 = new_x + container_width
                    curr_y2 = new_y + container_height
                    
                    # Coordonnées de l'autre widget
                    other_x1 = widget.winfo_x()
                    other_y1 = widget.winfo_y()
                    other_x2 = other_x1 + widget.winfo_width()
                    other_y2 = other_y1 + widget.winfo_height()
                    
                    # Vérifier s'il y a collision
                    if not (curr_x2 < other_x1 or curr_x1 > other_x2 or
                           curr_y2 < other_y1 or curr_y1 > other_y2):
                        can_move = False
                        break
            
            # Vérifier les limites de la fenêtre
            new_x = max(0, min(new_x, window_width - container_width))
            new_y = max(0, min(new_y, window_height - container_height))
            
            # Déplacer uniquement si pas de collision
            if can_move:
                container.place(x=new_x, y=new_y)

        def stop_drag(event):
            container.configure(fg_color="orange")

        container.bind('<Button-1>', start_drag)
        container.bind('<B1-Motion>', do_drag)
        container.bind('<ButtonRelease-1>', stop_drag)

    def on_right_click(self, event):
        widget = event.widget
        
        # Remonter jusqu'au widget parent CTkFrame si on clique sur un Canvas
        if isinstance(widget, Canvas):
            parent = widget.master
            while parent and isinstance(parent, Canvas):
                parent = parent.master
            widget = parent if parent else widget
        
        # Trouver le container (CTkFrame orange) si on clique sur un widget à l'intérieur
        while widget and widget != self.main_frame:
            if isinstance(widget, ctk.CTkFrame) and widget.cget("fg_color") == "orange":
                break
            widget = widget.master
        
        # Afficher le nom approprié
        if widget == self.main_frame:
            print(f"Clic droit sur main_frame")
        elif isinstance(widget, ctk.CTkFrame):
            # Trouver le widget à l'intérieur du container
            inner_frame = widget.winfo_children()[0]  # Premier enfant (inner_frame)
            widget_inside = inner_frame.winfo_children()[0]  # Premier enfant de inner_frame
            widget_type = widget_inside.__class__.__name__
            print(f"Clic droit sur {widget_type}")
        else:
            print("Widget non reconnu")

if __name__ == "__main__":
    app = MainApplication()
    app.mainloop() 
