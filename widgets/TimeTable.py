import customtkinter as ctk

class TimeTable(ctk.CTkFrame):
    def __init__(self, master, **kwargs):
        super().__init__(master, **kwargs)
        
        # Définir une taille fixe pour le widget
        self.COLUMN_WIDTH = 150  # Largeur fixe pour chaque colonne
        self.WIDGET_WIDTH = (self.COLUMN_WIDTH * 7) + (120)  # 7 colonnes * largeur + (padding conteneur + padding entre colonnes)
        self.WIDGET_HEIGHT = 300
        
        self.colors = {
            "bg": "#1a1a1a",
            "day_header": "#2d2d2d",
            "event": "#3498db",
            "text": "#ffffff"
        }
        
        self.days = ["Lundi", "Mardi", "Mercredi", "Jeudi", "Vendredi", "Samedi", "Dimanche"]
        self.events = []
        self.grid_rowconfigure(0, weight=1)  # Permet l'extension verticale
        for i in range(len(self.days)):
            self.grid_columnconfigure(i, weight=1)  # Permet l'extension horizontale
        
        # Configuration de base
        self.configure(width=self.WIDGET_WIDTH,
                      height=self.WIDGET_HEIGHT,
                      fg_color=self.colors["bg"])
        self.pack_propagate(False)  # Empêche le widget de se redimensionner
        self.pack(expand=True, fill="both")
        
        # Création du conteneur principal avec taille fixe
        self.main_container = ctk.CTkFrame(self, fg_color="transparent",
                                         width=self.WIDGET_WIDTH,
                                         height=self.WIDGET_HEIGHT)
        self.main_container.pack(expand=True, fill="both", padx=20, pady=20)
        self.main_container.pack_propagate(False)
        
        # Configuration pour que les colonnes prennent toute la hauteur
        self.main_container.grid_rowconfigure(0, weight=1)
        
        # Création des colonnes pour chaque jour
        for i, day in enumerate(self.days):
            day_frame = ctk.CTkFrame(
                self.main_container,
                fg_color=self.colors["day_header"],
                corner_radius=10,
                width=self.COLUMN_WIDTH,
                height=self.WIDGET_HEIGHT - 40  # Hauteur totale moins padding
            )
            day_frame.grid(row=0, column=i, padx=5, pady=5, sticky="nsew")
            day_frame.grid_propagate(False)
            
            # Configuration pour que le contenu prenne toute la hauteur
            day_frame.grid_rowconfigure(1, weight=1)
            day_frame.grid_columnconfigure(0, weight=1)
            
            # En-tête du jour
            ctk.CTkLabel(
                day_frame,
                text=day,
                font=("Helvetica", 16, "bold"),
                text_color=self.colors["text"]
            ).grid(row=0, pady=10)
            
            # Conteneur pour les événements du jour
            events_frame = ctk.CTkFrame(
                day_frame,
                fg_color="transparent",
                width=self.COLUMN_WIDTH
            )
            events_frame.grid(row=1, sticky="nsew", padx=5, pady=5)
            events_frame.grid_propagate(False)
            setattr(self, f"events_frame_{day.lower()}", events_frame)
        
        # Configuration fixe des colonnes
        for i in range(len(self.days)):
            self.main_container.grid_columnconfigure(i, weight=0, minsize=self.COLUMN_WIDTH)

    def add_event(self, title, start_time, end_time, day, color=None):
        try:
            events_frame = getattr(self, f"events_frame_{day.lower()}")
            
            event_frame = ctk.CTkFrame(
                events_frame,
                fg_color=color or self.colors["event"],
                corner_radius=8,
                width=self.COLUMN_WIDTH - 20  # Largeur de colonne moins padding
            )
            event_frame.pack(fill="x", padx=5, pady=3)
            event_frame.pack_propagate(False)
            
            # Calcul du texte avec retour à la ligne
            title_wrapped = self.wrap_text(title, 15)
            time_text = f"{start_time}-{end_time}"
            
            # Label avec le titre qui peut avoir plusieurs lignes
            title_label = ctk.CTkLabel(
                event_frame,
                text=title_wrapped,
                text_color=self.colors["text"],
                font=("Helvetica", 12),
                wraplength=self.COLUMN_WIDTH - 30
            )
            title_label.pack(pady=(8, 2))
            
            # Label pour l'horaire
            time_label = ctk.CTkLabel(
                event_frame,
                text=time_text,
                text_color=self.colors["text"],
                font=("Helvetica", 11)
            )
            time_label.pack(pady=(0, 8))
            
            # Ajuster la hauteur du frame en fonction du contenu
            event_frame.configure(height=title_label.winfo_reqheight() + time_label.winfo_reqheight() + 20)
            
            self.events.append({
                "frame": event_frame,
                "title": title,
                "start": start_time,
                "end": end_time,
                "day": day
            })
            
        except Exception as e:
            print(f"Erreur lors de l'ajout de l'événement: {e}")

    def wrap_text(self, text, max_chars):
        words = text.split()
        lines = []
        current_line = []
        current_length = 0
        
        for word in words:
            if current_length + len(word) + 1 <= max_chars:
                current_line.append(word)
                current_length += len(word) + 1
            else:
                if current_line:
                    lines.append(" ".join(current_line))
                current_line = [word]
                current_length = len(word)
        
        if current_line:
            lines.append(" ".join(current_line))
        
        return "\n".join(lines)

    def refresh_events(self, events_data):
        # Convertir les événements actuels en dictionnaire pour une recherche facile
        current_events = {
            (event["title"], event["start"], event["end"], event["day"]): event["frame"]
            for event in self.events
        }
        
        # Convertir les nouveaux événements en ensemble pour la comparaison
        new_events = {
            (event["title"], event["start_time"], event["end_time"], event["day"])
            for event in events_data
        }
        
        # Supprimer uniquement les événements qui n'existent plus
        for event_key in list(current_events.keys()):
            if event_key not in new_events:
                current_events[event_key].destroy()
                self.events = [e for e in self.events if not (
                    e["title"] == event_key[0] and 
                    e["start"] == event_key[1] and 
                    e["end"] == event_key[2] and 
                    e["day"] == event_key[3]
                )]
        
        # Ajouter uniquement les nouveaux événements
        for event in events_data:
            event_key = (event["title"], event["start_time"], event["end_time"], event["day"])
            if event_key not in current_events:
                self.add_event(
                    event["title"],
                    event["start_time"],
                    event["end_time"],
                    event["day"]
                )

if __name__ == "__main__":
    app = ctk.CTk()
    app.geometry("1200x600")
    app.title("Emploi du temps")
    
    timetable = TimeTable(app)
    timetable.pack(expand=True, fill="both", padx=10, pady=10)
    
    # Test des événements
    timetable.add_event("Mathématiques", "08:00", "10:00", "Lundi")
    timetable.add_event("Physique", "10:00", "12:00", "Mardi")
    timetable.add_event("Informatique", "14:00", "16:00", "Mercredi")
    timetable.add_event("Anglais", "16:00", "18:00", "Jeudi")
    
    app.mainloop() 