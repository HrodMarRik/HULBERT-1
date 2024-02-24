import json
import tkinter as tk

class BDD:
    def __init__(self):
        self.data = {}
        try:
            with open('.default', 'r') as file:
                lines = file.readlines()
                for line in lines:
                    name, position, size, direction, link, type, cache = line.strip().split('-')
                    self.data[name] = {
                        'position': position,
                        'size': int(size),
                        'direction': direction,
                        'link': link,
                        'type': type,
                        'cache': cache
                    }
                    print(self.data[name])
        except FileNotFoundError:
            raise FileNotFoundError("Le fichier '.default' n'existe pas.")

    def save_to_file(self, filename):
        with open(filename, 'w') as file:
            for name, attributes in self.data.items():
                line = '-'.join([name, attributes['position'], str(attributes['size']),
                                attributes['direction'], attributes['link'],
                                attributes['type'], attributes['cache']]) + '\n'
                file.write(line)

    def ajouter(argv):
    	print(argv)

    def supprimer(argv):
    	print(argv)
class Application(tk.Tk):
    def __init__(self, bdd):
        tk.Tk.__init__(self)
        self.bdd = bdd
        self.title("Ma Fenêtre")
        self.geometry("500x500")

        # Exemple de création de widgets
        label = tk.Label(self, text="Exemple de fenêtre avec Tkinter")
        label.pack(pady=10)

        button_ajouter = tk.Button(self, text="Ajouter", command=lambda: BDD.ajouter("ajout"))
        button_ajouter.pack()

        button_suprimer = tk.Button(self, text="Supprimer", command=lambda: BDD.supprimer("supprimer"))
        button_suprimer.pack()

        self.protocol("WM_DELETE_WINDOW", self.on_closing)

    def on_closing(self):
        self.bdd.save_to_file('data.json')
        print("Données sauvegardées avec succès.")
        self.destroy()

    def create_window(self,position,size,direction,link,type,cache):
    	pass

if __name__ == "__main__":
    try:
        bdd = BDD()
        app = Application(bdd)
        app.mainloop()
    except FileNotFoundError as e:
        print(e)
