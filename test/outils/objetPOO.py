class Discussion:
    """Ceci est une docstring qui ne sert à rien,
mais est multiligne."""
    def __init__(self):
        self.noms = "Hulbert"
        self.liste = ["truc", 1, True]
        self.dict = {
        	"type" : ["int", "bool", "str", "char"],
        	"sexe" : ["feminin", "masculin"]
        }
    def CREATE(self):
        """Méthode pour créer une ressource."""
        print(f"CREATION")

    def READ(self):
        """Méthode pour lire une ressource."""
        pass

    def UPDATE(self):
        """Méthode pour mettre à jour une ressource."""
        pass

    def DELETE(self):
        """Méthode pour supprimer une ressource."""
        pass
