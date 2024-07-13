import logging
import os

def setup_logging():
    # Chemin absolu vers le répertoire racine de votre projet
    root_dir = os.path.abspath(os.path.join(os.path.dirname(__file__), '..', '..'))  # Adapté à votre structure

    # Configurer les handlers pour les fichiers uniquement
    file_handler_debug = logging.FileHandler('/var/log/HULBERT/debug.log')
    file_handler_debug.setLevel(logging.DEBUG)
    file_formatter_debug = logging.Formatter('%(levelname)s - %(pathname)s : %(lineno)d - %(message)s')
    file_handler_debug.setFormatter(file_formatter_debug)

    file_handler_error = logging.FileHandler('/var/log/HULBERT/errors.log')
    file_handler_error.setLevel(logging.ERROR)
    file_formatter_error = logging.Formatter('%(levelname)s - %(pathname)s : %(lineno)d - %(message)s')
    file_handler_error.setFormatter(file_formatter_error)

    # Configurer le handler pour la console
    console_handler = logging.StreamHandler()
    console_handler.setLevel(logging.INFO)  # N'afficher que les messages INFO et supérieurs dans la console
    
    # Format personnalisé pour la console avec chemin relatif à partir de /HULBERT
    console_formatter = logging.Formatter('%(levelname)s - %(pathname)s : %(lineno)d - %(message)s')
    console_handler.setFormatter(console_formatter)

    # Configurer le logger racine
    logger = logging.getLogger()
    logger.setLevel(logging.DEBUG)  # Niveau global du logger (DEBUG pour tout enregistrer)
    logger.addHandler(file_handler_debug)
    logger.addHandler(file_handler_error)
    logger.addHandler(console_handler)

    # Fonction pour formater le chemin relatif à partir de /HULBERT
    def custom_pathname(record):
        return os.path.relpath(record.pathname, start=root_dir)

    # Appliquer la fonction de formatage personnalisé pour la console
    logging.StreamHandler.format = lambda self, record: f"{record.levelname} - {custom_pathname(record)}:{record.lineno} - {record.getMessage()}"

# Appeler la fonction de configuration du logging au chargement du module
setup_logging()
