import customtkinter as ctk
from tkinter import *
from tkcalendar import Calendar, DateEntry
from datetime import datetime, timedelta
import json
import os
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

class TimeTable(ctk.CTkFrame):
    def __init__(self, master, **kwargs):
        super().__init__(master, **kwargs)
        
        # Configuration
        self.WIDGET_WIDTH = 800
        self.WIDGET_HEIGHT = 600
        
        # Couleurs cohérentes avec le thème
        self.colors = {
            "bg": "#2b2b2b",
            "calendar_bg": "#333333",
            "calendar_fg": "#ffffff",
            "selected_bg": "#4a4a4a",
            "event_bg": "#3498db",
            "text": "#ffffff"
        }
        
        # Données des événements
        self.events = {}
        self.load_events()
        
        # Configuration de base
        self.configure(
            width=self.WIDGET_WIDTH,
            height=self.WIDGET_HEIGHT,
            fg_color=self.colors["bg"]
        )
        self.pack_propagate(False)
        
        # Créer l'interface
        self.creer_interface()
        
    def creer_interface(self):
        """Créer l'interface du widget"""
        try:
            # Frame principal
            main_container = ctk.CTkFrame(self, fg_color="transparent")
            main_container.pack(expand=True, fill="both", padx=20, pady=20)
            
            # Titre
            title_label = ctk.CTkLabel(
                main_container,
                text="Agenda Personnel",
                font=("Arial", 18, "bold"),
                text_color=self.colors["text"]
            )
            title_label.pack(pady=(0, 20))
            
            # Frame pour le calendrier et les événements
            content_frame = ctk.CTkFrame(main_container, fg_color="transparent")
            content_frame.pack(expand=True, fill="both")
            
            # Colonne gauche - Calendrier
            calendar_frame = ctk.CTkFrame(content_frame, fg_color=self.colors["calendar_bg"])
            calendar_frame.pack(side="left", fill="y", padx=(0, 10))
            
            # Calendrier tkcalendar
            self.calendar = Calendar(
                calendar_frame,
                selectmode='day',
                year=datetime.now().year,
                month=datetime.now().month,
                day=datetime.now().day,
                background=self.colors["calendar_bg"],
                foreground=self.colors["calendar_fg"],
                selectbackground=self.colors["selected_bg"],
                normalbackground=self.colors["calendar_bg"],
                normalforeground=self.colors["calendar_fg"],
                weekendbackground=self.colors["calendar_bg"],
                weekendforeground=self.colors["calendar_fg"],
                othermonthbackground=self.colors["calendar_bg"],
                othermonthforeground="#666666",
                bordercolor=self.colors["calendar_bg"],
                headersbackground=self.colors["calendar_bg"],
                headersforeground=self.colors["calendar_fg"],
                font=("Arial", 10)
            )
            self.calendar.pack(padx=10, pady=10)
            
            # Lier l'événement de sélection de date
            self.calendar.bind("<<CalendarSelected>>", self.on_date_selected)
            
            # Colonne droite - Événements
            events_frame = ctk.CTkFrame(content_frame, fg_color=self.colors["calendar_bg"])
            events_frame.pack(side="right", fill="both", expand=True)
            
            # Titre des événements
            events_title = ctk.CTkLabel(
                events_frame,
                text="Événements du jour",
                font=("Arial", 14, "bold"),
                text_color=self.colors["text"]
            )
            events_title.pack(pady=10)
            
            # Frame pour la liste des événements
            self.events_list_frame = ctk.CTkScrollableFrame(
                events_frame,
                fg_color="transparent",
                height=300
            )
            self.events_list_frame.pack(fill="both", expand=True, padx=10, pady=10)
            
            # Frame pour ajouter des événements
            add_event_frame = ctk.CTkFrame(events_frame, fg_color="transparent")
            add_event_frame.pack(fill="x", padx=10, pady=10)
            
            # Champs pour ajouter un événement
            add_title_label = ctk.CTkLabel(add_event_frame, text="Nouvel événement:", font=("Arial", 12))
            add_title_label.pack(anchor="w")
            
            # Titre de l'événement
            self.event_title_entry = ctk.CTkEntry(
                add_event_frame,
                placeholder_text="Titre de l'événement",
                width=200
            )
            self.event_title_entry.pack(pady=5, anchor="w")
            
            # Heure de début
            time_frame = ctk.CTkFrame(add_event_frame, fg_color="transparent")
            time_frame.pack(fill="x", pady=5)
            
            ctk.CTkLabel(time_frame, text="Début:").pack(side="left")
            self.start_hour = ctk.CTkEntry(time_frame, placeholder_text="HH", width=50)
            self.start_hour.pack(side="left", padx=(5, 2))
            ctk.CTkLabel(time_frame, text=":").pack(side="left")
            self.start_minute = ctk.CTkEntry(time_frame, placeholder_text="MM", width=50)
            self.start_minute.pack(side="left", padx=(2, 10))
            
            ctk.CTkLabel(time_frame, text="Fin:").pack(side="left")
            self.end_hour = ctk.CTkEntry(time_frame, placeholder_text="HH", width=50)
            self.end_hour.pack(side="left", padx=(5, 2))
            ctk.CTkLabel(time_frame, text=":").pack(side="left")
            self.end_minute = ctk.CTkEntry(time_frame, placeholder_text="MM", width=50)
            self.end_minute.pack(side="left", padx=(2, 0))
            
            # Bouton d'ajout
            add_button = ctk.CTkButton(
                add_event_frame,
                text="Ajouter événement",
                command=self.ajouter_evenement,
                fg_color=self.colors["event_bg"],
                hover_color="#2980b9"
            )
            add_button.pack(pady=10, anchor="w")
            
            # Charger les événements du jour actuel
            self.afficher_evenements_du_jour()
            
            logger.info("Widget TimeTable avec tkcalendar créé avec succès")
            
        except Exception as e:
            logger.error(f"Erreur création interface TimeTable: {e}")
    
    def on_date_selected(self, event=None):
        """Appelé quand une date est sélectionnée dans le calendrier"""
        try:
            selected_date = self.calendar.get_date()
            logger.info(f"Date sélectionnée: {selected_date}")
            self.afficher_evenements_du_jour()
        except Exception as e:
            logger.error(f"Erreur sélection date: {e}")
    
    def ajouter_evenement(self):
        """Ajouter un nouvel événement"""
        try:
            # Récupérer les données
            titre = self.event_title_entry.get().strip()
            start_h = self.start_hour.get().strip()
            start_m = self.start_minute.get().strip()
            end_h = self.end_hour.get().strip()
            end_m = self.end_minute.get().strip()
            
            if not titre:
                logger.warning("Titre d'événement vide")
                return
            
            # Validation des heures
            try:
                start_time = f"{int(start_h):02d}:{int(start_m):02d}"
                end_time = f"{int(end_h):02d}:{int(end_m):02d}"
            except ValueError:
                logger.warning("Format d'heure invalide")
                return
            
            # Date sélectionnée
            selected_date = self.calendar.get_date()
            
            # Créer l'événement
            event = {
                "title": titre,
                "start_time": start_time,
                "end_time": end_time,
                "date": selected_date
            }
            
            # Ajouter à la liste
            if selected_date not in self.events:
                self.events[selected_date] = []
            self.events[selected_date].append(event)
            
            # Sauvegarder
            self.save_events()
            
            # Rafraîchir l'affichage
            self.afficher_evenements_du_jour()
            
            # Vider les champs
            self.event_title_entry.delete(0, END)
            self.start_hour.delete(0, END)
            self.start_minute.delete(0, END)
            self.end_hour.delete(0, END)
            self.end_minute.delete(0, END)
            
            logger.info(f"Événement ajouté: {titre} le {selected_date}")
            
        except Exception as e:
            logger.error(f"Erreur ajout événement: {e}")
    
    def afficher_evenements_du_jour(self):
        """Afficher les événements du jour sélectionné"""
        try:
            # Vider la liste
            for widget in self.events_list_frame.winfo_children():
                widget.destroy()
            
            selected_date = self.calendar.get_date()
            
            if selected_date in self.events and self.events[selected_date]:
                # Trier les événements par heure de début
                events = sorted(self.events[selected_date], key=lambda x: x["start_time"])
                
                for event in events:
                    self.creer_widget_evenement(event)
            else:
                # Aucun événement
                no_event_label = ctk.CTkLabel(
                    self.events_list_frame,
                    text="Aucun événement pour ce jour",
                    text_color="#888888",
                    font=("Arial", 12)
                )
                no_event_label.pack(pady=20)
                
        except Exception as e:
            logger.error(f"Erreur affichage événements: {e}")
    
    def creer_widget_evenement(self, event):
        """Créer un widget pour afficher un événement"""
        try:
            event_frame = ctk.CTkFrame(
                self.events_list_frame,
                fg_color=self.colors["event_bg"],
                corner_radius=8
            )
            event_frame.pack(fill="x", pady=5, padx=5)
            
            # Titre de l'événement
            title_label = ctk.CTkLabel(
                event_frame,
                text=event["title"],
                text_color=self.colors["text"],
                font=("Arial", 12, "bold")
            )
            title_label.pack(pady=(8, 2), padx=10, anchor="w")
            
            # Heures
            time_text = f"{event['start_time']} - {event['end_time']}"
            time_label = ctk.CTkLabel(
                event_frame,
                text=time_text,
                text_color=self.colors["text"],
                font=("Arial", 11)
            )
            time_label.pack(pady=(0, 8), padx=10, anchor="w")
            
            # Bouton supprimer
            delete_button = ctk.CTkButton(
                event_frame,
                text="Supprimer",
                command=lambda: self.supprimer_evenement(event),
                fg_color="#e74c3c",
                hover_color="#c0392b",
                width=80,
                height=25
            )
            delete_button.pack(pady=(0, 8), padx=10, anchor="e")
            
        except Exception as e:
            logger.error(f"Erreur création widget événement: {e}")
    
    def supprimer_evenement(self, event):
        """Supprimer un événement"""
        try:
            selected_date = self.calendar.get_date()
            if selected_date in self.events:
                self.events[selected_date] = [e for e in self.events[selected_date] if e != event]
                self.save_events()
                self.afficher_evenements_du_jour()
                logger.info(f"Événement supprimé: {event['title']}")
        except Exception as e:
            logger.error(f"Erreur suppression événement: {e}")
    
    def load_events(self):
        """Charger les événements depuis un fichier"""
        try:
            if os.path.exists("events.json"):
                with open("events.json", "r", encoding="utf-8") as f:
                    self.events = json.load(f)
                logger.info("Événements chargés depuis le fichier")
            else:
                self.events = {}
        except Exception as e:
            logger.error(f"Erreur chargement événements: {e}")
            self.events = {}
    
    def save_events(self):
        """Sauvegarder les événements dans un fichier"""
        try:
            with open("events.json", "w", encoding="utf-8") as f:
                json.dump(self.events, f, ensure_ascii=False, indent=2)
            logger.info("Événements sauvegardés")
        except Exception as e:
            logger.error(f"Erreur sauvegarde événements: {e}")
    
    def refresh_events(self, events_data):
        """Méthode de compatibilité avec l'ancien système"""
        try:
            # Convertir les anciennes données au nouveau format
            for event in events_data:
                date = event.get("date", "2024-01-01")  # Date par défaut
                if date not in self.events:
                    self.events[date] = []
                
                new_event = {
                    "title": event["title"],
                    "start_time": event["start_time"],
                    "end_time": event["end_time"],
                    "date": date
                }
                self.events[date].append(new_event)
            
            self.save_events()
            self.afficher_evenements_du_jour()
            logger.info("Événements rafraîchis")
            
        except Exception as e:
            logger.error(f"Erreur rafraîchissement événements: {e}")

if __name__ == "__main__":
    # Test du widget
    app = ctk.CTk()
    app.geometry("900x700")
    app.title("Test TimeTable Widget")
    
    timetable = TimeTable(app)
    timetable.pack(expand=True, fill="both", padx=10, pady=10)
    
    app.mainloop() 