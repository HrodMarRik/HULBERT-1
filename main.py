import customtkinter as ctk
from tkinter import *
from interface_connexion import InterfaceConnexion
import os
import importlib.util
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

class MainApplication(ctk.CTk):
    def __init__(self):
        super().__init__()
        
        self.widgets_added = set()
        
        self.widget_connexion = InterfaceConnexion(self, self.on_connexion_callback)
        self.widget_connexion.pack(expand=True)
        
        self.interface_principale_visible = False
        self.creer_interface_principale()
        self.cacher_interface_principale()
        self.bind_all('<Button-3>', self.on_right_click)

    def creer_interface_principale(self):
        self.title("Hulbert GUI")
        
        # Correction pour Windows - utiliser state au lieu de -zoomed
        try:
            self.state('zoomed')  # Pour Windows
        except:
            try:
                self.attributes('-zoomed', True)  # Pour Linux
            except:
                self.attributes('-fullscreen', True)  # Fallback
        
        # Couleurs cohérentes avec le thème
        self.configure(bg="#2b2b2b")
        
        # Menu avec couleurs cohérentes
        self.menu_bar = Menu(
            self, 
            bg="#2b2b2b",           # Même couleur que le fond principal
            fg="#ffffff",           # Texte blanc
            activebackground="#4a4a4a",  # Couleur au survol
            activeforeground="#ffffff",  # Texte au survol
            relief="flat", 
            bd=0,
            font=("Arial", 10)      # Police cohérente
        )
        self.config(menu=self.menu_bar)
        
        # Menu Fichier avec couleurs cohérentes
        self.file_menu = Menu(
            self.menu_bar, 
            tearoff=0, 
            bg="#2b2b2b",           # Même couleur que le fond principal
            fg="#ffffff",           # Texte blanc
            activebackground="#4a4a4a",  # Couleur au survol
            activeforeground="#ffffff",  # Texte au survol
            relief="flat", 
            bd=0,
            font=("Arial", 10)      # Police cohérente
        )
        self.menu_bar.add_cascade(
            label="Fichier", 
            menu=self.file_menu, 
            font=("Arial", 10, "bold")
        )
        
        # Menu widgets avec couleurs cohérentes
        self.widget_menu = Menu(
            self.file_menu, 
            tearoff=0, 
            bg="#2b2b2b",           # Même couleur que le fond principal
            fg="#ffffff",           # Texte blanc
            activebackground="#4a4a4a",  # Couleur au survol
            activeforeground="#ffffff",  # Texte au survol
            relief="flat", 
            bd=0,
            font=("Arial", 10)      # Police cohérente
        )
        self.file_menu.add_cascade(label="Nouveau widget", menu=self.widget_menu)
        
        # Widgets disponibles
        widgets = ["TimeTable", "label_widget", "hello"]
        for widget in widgets:
            self.widget_menu.add_command(
                label=widget, 
                command=lambda w=widget: self.ajouter_widget(w),
                font=("Arial", 9)
            )
        
        self.file_menu.add_separator()
        self.file_menu.add_command(
            label="Quitter", 
            command=self.quit, 
            font=("Arial", 9)
        )
        
        # Interface principale
        self.main_frame = ctk.CTkFrame(self, fg_color="#2b2b2b", corner_radius=10)
        self.main_frame.name = "main_frame"
        self.main_frame.pack(fill=BOTH, expand=True, padx=10, pady=10)
        
        self.status_bar = ctk.CTkLabel(
            self, 
            text="Prêt", 
            anchor="w", 
            fg_color="#333333", 
            corner_radius=5,
            font=("Arial", 11)
        )
        self.status_bar.pack(side=BOTTOM, fill=X, padx=10, pady=5)

    def cacher_interface_principale(self):
        for attr in ['menu_bar', 'main_frame', 'status_bar']:
            if hasattr(self, attr):
                try:
                    getattr(self, attr).forget()
                except:
                    pass
        
    def afficher_interface_principale(self):
        try:
            self.config(menu=self.menu_bar)
            self.main_frame.pack(fill=BOTH, expand=True, padx=10, pady=10)
            self.status_bar.pack(side=BOTTOM, fill=X, padx=10, pady=5)
        except Exception as e:
            logger.error(f"Erreur affichage interface: {e}")
        
    def on_connexion_callback(self, success):
        if success:
            try:
                self.widget_connexion.destroy()
                self.afficher_interface_principale()
            except Exception as e:
                logger.error(f"Erreur callback connexion: {e}")
            
    def ajouter_widget(self, widget_name="Button"):
        if widget_name in self.widgets_added:
            logger.warning(f"Le widget {widget_name} est déjà présent")
            return
        
        try:
            # Créer le container
            container = ctk.CTkFrame(self.main_frame, fg_color="orange", corner_radius=0)
            inner_frame = ctk.CTkFrame(container, fg_color=self.main_frame._fg_color)
            inner_frame.pack(padx=5, pady=5, fill="both", expand=True)
            
            # Charger le widget
            nouveau_widget = self.charger_widget(widget_name, inner_frame)
            if not nouveau_widget:
                container.destroy()
                return
                
            nouveau_widget.pack(padx=5, pady=5)
            self.widgets_added.add(widget_name)
            
            # Positionner le widget
            self.positionner_widget(container)
            self.rendre_widget_deplacable(container)
            
            logger.info(f"Widget {widget_name} ajouté avec succès")
            
        except Exception as e:
            logger.error(f"Erreur ajout widget {widget_name}: {e}")

    def charger_widget(self, widget_name, parent):
        """Charger un widget depuis un fichier ou créer un widget par défaut"""
        try:
            if os.path.exists(f"widgets/{widget_name}.py"):
                spec = importlib.util.spec_from_file_location(widget_name, f"widgets/{widget_name}.py")
                module = importlib.util.module_from_spec(spec)
                spec.loader.exec_module(module)
                widget_class = getattr(module, widget_name)
                return widget_class(parent)
            else:
                return self.creer_widget_defaut(widget_name, parent)
        except Exception as e:
            logger.error(f"Erreur chargement widget {widget_name}: {e}")
            return None

    def creer_widget_defaut(self, widget_name, parent):
        """Créer un widget par défaut"""
        try:
            if widget_name.lower() == "button":
                return ctk.CTkButton(parent, text="Bouton", font=("Arial", 12, "bold"),
                                   corner_radius=8, hover_color="#2c5c9e")
            elif widget_name.lower() == "label":
                return ctk.CTkLabel(parent, text="Label", font=("Arial", 12))
            else:
                logger.error(f"Type de widget non reconnu: {widget_name}")
                return None
        except Exception as e:
            logger.error(f"Erreur création widget défaut {widget_name}: {e}")
            return None

    def positionner_widget(self, container):
        """Positionner un widget sans collision"""
        try:
            container.place(x=0, y=0)
            self.update_idletasks()
            
            width = container.winfo_reqwidth()
            height = container.winfo_reqheight()
            container.configure(width=width, height=height)
            container.pack_propagate(False)
            
            # Algorithme de positionnement simplifié
            x, y = 0, 0
            step = 20
            
            while not self.position_libre(container, x, y):
                x += step
                if x + width > self.main_frame.winfo_width():
                    x = 0
                    y += step
                if y + height > self.main_frame.winfo_height():
                    x, y = 0, 0
                    break
            
            container.place(x=x, y=y)
            
        except Exception as e:
            logger.error(f"Erreur positionnement widget: {e}")
            container.place(x=0, y=0)

    def position_libre(self, container, x, y):
        """Vérifier si une position est libre"""
        try:
            width = container.winfo_width()
            height = container.winfo_height()
            
            for widget in self.main_frame.winfo_children():
                if widget != container and isinstance(widget, ctk.CTkFrame):
                    other_x, other_y = widget.winfo_x(), widget.winfo_y()
                    other_w, other_h = widget.winfo_width(), widget.winfo_height()
                    
                    # Vérifier collision
                    if not (x + width < other_x or x > other_x + other_w or
                           y + height < other_y or y > other_y + other_h):
                        return False
            
            return (x + width <= self.main_frame.winfo_width() and 
                    y + height <= self.main_frame.winfo_height())
        except Exception as e:
            logger.error(f"Erreur vérification position: {e}")
            return True

    def rendre_widget_deplacable(self, container):
        """Rendre un widget déplaçable"""
        def start_drag(event):
            try:
                container._drag_start_x = event.x
                container._drag_start_y = event.y
                container.configure(fg_color="#ff8c00")
                container.lift()
            except Exception as e:
                logger.error(f"Erreur début drag: {e}")

        def do_drag(event):
            try:
                delta_x = event.x - container._drag_start_x
                delta_y = event.y - container._drag_start_y
                
                new_x = container.winfo_x() + delta_x
                new_y = container.winfo_y() + delta_y
                
                # Limites de la fenêtre
                window_w = self.main_frame.winfo_width()
                window_h = self.main_frame.winfo_height()
                widget_w = container.winfo_width()
                widget_h = container.winfo_height()
                
                new_x = max(0, min(new_x, window_w - widget_w))
                new_y = max(0, min(new_y, window_h - widget_h))
                
                # Vérifier collisions
                if self.position_libre(container, new_x, new_y):
                    container.place(x=new_x, y=new_y)
            except Exception as e:
                logger.error(f"Erreur drag: {e}")

        def stop_drag(event):
            try:
                container.configure(fg_color="orange")
            except Exception as e:
                logger.error(f"Erreur fin drag: {e}")

        try:
            container.bind('<Button-1>', start_drag)
            container.bind('<B1-Motion>', do_drag)
            container.bind('<ButtonRelease-1>', stop_drag)
        except Exception as e:
            logger.error(f"Erreur binding drag: {e}")

    def on_right_click(self, event):
        """Gestion du clic droit simplifié"""
        try:
            widget = event.widget
            
            # Trouver le container parent
            while widget and widget != self.main_frame:
                if isinstance(widget, ctk.CTkFrame) and widget.cget("fg_color") == "orange":
                    break
                widget = widget.master
            
            if widget == self.main_frame:
                logger.info("Clic droit sur main_frame")
            elif isinstance(widget, ctk.CTkFrame):
                try:
                    inner_frame = widget.winfo_children()[0]
                    widget_inside = inner_frame.winfo_children()[0]
                    logger.info(f"Clic droit sur {widget_inside.__class__.__name__}")
                except IndexError:
                    logger.warning("Widget sans contenu détecté")
        except Exception as e:
            logger.error(f"Erreur clic droit: {e}")

if __name__ == "__main__":
    try:
        app = MainApplication()
        app.mainloop()
    except Exception as e:
        logger.error(f"Erreur application principale: {e}") 
