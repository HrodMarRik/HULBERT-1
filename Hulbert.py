import customtkinter as ctk
import sys
import os
import threading
import time
from main import MainApplication
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

def update_timetable(app):
    """Mettre à jour l'emploi du temps"""
    try:
        # Simuler des données de la base de données
        events_data = [
            {"title": "Mathématiques", "start_time": "08:00", "end_time": "10:00", "day": "Lundi"},
            {"title": "Physique", "start_time": "10:00", "end_time": "12:00", "day": "Mardi"},
            {"title": "Informatique", "start_time": "14:00", "end_time": "16:00", "day": "Mercredi"},
            {"title": "Anglais", "start_time": "16:00", "end_time": "18:00", "day": "Jeudi"}
        ]
        
        # Trouver le widget TimeTable et mettre à jour ses événements
        for widget in app.main_frame.winfo_children():
            if isinstance(widget, ctk.CTkFrame):
                try:
                    inner_frame = widget.winfo_children()[0]
                    if inner_frame.winfo_children():  # Vérifier si le frame a des enfants
                        widget_inside = inner_frame.winfo_children()[0]
                        if widget_inside.__class__.__name__ == "TimeTable":
                            widget_inside.refresh_events(events_data)
                            logger.info("TimeTable mis à jour")
                            return  # Sortir dès qu'on a trouvé et mis à jour le TimeTable
                except Exception as e:
                    logger.error(f"Erreur mise à jour TimeTable: {e}")
                    
    except Exception as e:
        logger.error(f"Erreur update_timetable: {e}")

def auto_update(app):
    """Mise à jour automatique"""
    update_interval = 4
    last_update = 0
    
    try:
        while app.winfo_exists():
            current_time = time.time()
            if current_time - last_update >= update_interval:
                update_timetable(app)
                last_update = current_time
            time.sleep(1)  # Pause courte pour ne pas surcharger le CPU
    except Exception as e:
        logger.error(f"Erreur auto_update: {e}")

def main():
    """Fonction principale"""
    try:
        app = MainApplication()
        
        # Créer et démarrer le thread de mise à jour
        update_thread = threading.Thread(target=auto_update, args=(app,), daemon=True)
        update_thread.start()
        
        logger.info("Application Hulbert démarrée")
        
        # Démarrer l'application
        app.mainloop()
        
    except Exception as e:
        logger.error(f"Erreur application Hulbert: {e}")

if __name__ == "__main__":
    main()
