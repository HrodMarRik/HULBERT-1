import customtkinter as ctk
import sys
import os
import threading
import time
from main import MainApplication

def update_timetable(app):
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
            inner_frame = widget.winfo_children()[0]
            if inner_frame.winfo_children():  # Vérifier si le frame a des enfants
                widget_inside = inner_frame.winfo_children()[0]
                if widget_inside.__class__.__name__ == "TimeTable":
                    widget_inside.refresh_events(events_data)
                    return  # Sortir dès qu'on a trouvé et mis à jour le TimeTable

def auto_update(app):
    update_interval = 4
    last_update = 0
    
    while app.winfo_exists():
        current_time = time.time()
        if current_time - last_update >= update_interval:
            update_timetable(app)
            last_update = current_time
        time.sleep(1)  # Pause courte pour ne pas surcharger le CPU

def main():
    app = MainApplication()
    
    # Créer et démarrer le thread de mise à jour
    update_thread = threading.Thread(target=auto_update, args=(app,), daemon=True)
    update_thread.start()
    
    # Démarrer l'application
    app.mainloop()

if __name__ == "__main__":
    main()
