import tkinter as tk
import sys
import subprocess
import time


dico_frame = {}
dico_widget = {}
dico_var = {}
root = tk.Tk()
dico_frame["root"] = root

def demarrage():
    dico = {}
    preference("default")
    Menu()
    return dico
def Menu():
    global dico_frame
    #MENU
    menu = tk.Menu()


    #HULBERT

    menu_Hulbert = tk.Menu(menu, tearoff=0)

    menu_mode = tk.Menu(menu_Hulbert,tearoff=0)
    menu_mode.add_command(label="Orale",command=do)
    menu_mode.add_command(label="Visuel",command=do)
    menu_mode.add_command(label="OV",command=do)
    menu_Hulbert.add_cascade(label="Mode",menu=menu_mode)
    menu_Hulbert.add_command(label="Parametre",command=do)
    menu.add_cascade(label="Hulbert",menu=menu_Hulbert)


    #FILE
    menu_File = tk.Menu(menu, tearoff=0)
    menu.add_cascade(label='File', menu=menu_File)


    #PREFERENCE
    menu_Preference = tk.Menu(menu, tearoff=0)
    MENU_RESOLUTION = tk.Menu(menu_Preference,tearoff=0)
    MENU_RESOLUTION.add_command(label="Pleine Ecran",command=fullscreen,accelerator="F11")
    root.bind("<F11>", fullscreen)
    MENU_RESOLUTION.add_command(label="Fenêtrée",command=windowed,accelerator="esc")
    root.bind("<Escape>", windowed)
    menu_Preference.add_cascade(label="Résolution",menu=MENU_RESOLUTION)
    MENU_FONT = tk.Menu(menu_Preference,tearoff=0)
    MENU_FONT.add_command(label="Normal",command=do)
    MENU_FONT.add_command(label="Sombre",command=do)
    MENU_FONT.add_command(label="Claire",command=do)
    menu_Preference.add_cascade(label="Font",menu=MENU_FONT)
    MENU_AFFICHAGE = tk.Menu(menu_Preference,tearoff=0)
    MENU_AFFICHAGE.add_command(label="Normal",command=do)
    MENU_AFFICHAGE.add_command(label="Codage",command=do)
    MENU_AFFICHAGE.add_command(label="Test",command=do)
    MENU_AFFICHAGE.add_command(label="Machine",command=do)
    menu_Preference.add_cascade(label="Affichage",menu=MENU_AFFICHAGE)
    menu_Preference.add_command(label="Parametre",command=do)
    menu.add_cascade(label='Preference', menu=menu_Preference)

    #PROJECT
    menu_Project = tk.Menu(menu, tearoff=0)
    menu_Project.add_command(label="New Project",command=do)
    menu_Project.add_command(label="Open Project",command=do)
    menu.add_cascade(label='Project', menu=menu_Project)

    dico_frame["root"].config(menu=menu)      
def preference(ref):
    with open("/home/rick/Bureau/hulbert/fonction/interface/.visuel/preference/"+ref, 'r') as f:
        default_brut = f.read()
        default = default_brut.split('|')
        dico = {}

        for index, value in enumerate(default):
            dico2 = {}
            value = value.split("µ")
            for x in value:
                liste = x.split(",")
                key = liste[0]
                values = {}
                for item in liste[1:]:
                    parts = item.split("=")
                    if len(parts) == 2:
                        values[parts[0]] = parts[1]
                dico2[key] = values
            dico[str(index)] = dico2

    
    for nom_instance1, valeur1 in dico.items():
        if nom_instance1 == "0":#root
            for cle, value in dico["0"].items():
                if "geometry" in value:
                    root.geometry(dico[nom_instance1][cle]["geometry"])
                if "title" in value:
                    root.title(dico[nom_instance1][cle]["title"])  
                if "rowconfigure" in value: 
                    for x in range(int(dico[nom_instance1][cle]["rowconfigure"])):
                        root.rowconfigure(x,weight=1)
                if "columnconfigure" in value: 
                    for x in range(int(dico[nom_instance1][cle]["columnconfigure"])):
                        root.columnconfigure(x,weight=1)
                if "bg" in value:
                    root.configure(bg=dico[nom_instance1][cle]["bg"])
        elif nom_instance1 == "1":#frame
                for cle, value in dico["1"].items():
                    config_options = {}
                    grid_options = {}
                    rowconfigure = 0
                    columnconfigure = 0
                    if "parent" in value:
                        parent = dico[nom_instance1][cle]["parent"] 
                    if "row" in value:
                        grid_options["row"]=int(dico[nom_instance1][cle]["row"])
                    if "column" in value:
                        grid_options["column"]=int(dico[nom_instance1][cle]["column"])
                    if "rowconfigure" in value:
                        rowconfigure = int(dico[nom_instance1][cle]["rowconfigure"])
                    if "columnconfigure" in value:
                        columnconfigure = int(dico[nom_instance1][cle]["columnconfigure"])
                    if "rowspan" in value:
                        grid_options["rowspan"]=int(dico[nom_instance1][cle]["rowspan"])
                    if "columnspan" in value:
                        grid_options["columnspan"]=int(dico[nom_instance1][cle]["columnspan"])
                    if "sticky" in value:
                        grid_options['sticky']=dico[nom_instance1][cle]["sticky"]
                    if "bg" in value:
                        config_options['bg']=dico[nom_instance1][cle]['bg']
                    if 'borderwidth'in value:
                        config_options['borderwidth']=int(dico[nom_instance1][cle]["borderwidth"])
                    if 'relief' in value:
                        config_options['relief']=dico[nom_instance1][cle]['relief']
                    if 'width' in value:
                        config_options['width']=int(dico[nom_instance1][cle]["width"])
                    if 'height' in value:
                        config_options['height']=int(dico[nom_instance1][cle]["height"])
                    if 'highlightbackground' in value:
                        config_options['highlightbackground']=dico[nom_instance1][cle]['highlightbackground']
                    if 'highlightcolor' in value:
                        config_options['highlightcolor']=dico[nom_instance1][cle]['highlightcolor']
                    if 'highlightthickness' in value:
                        config_options['highlightthickness']=dico[nom_instance1][cle]['highlightthickness']
                    if 'cursor' in value :
                        config_options['cursor']=dico[nom_instance1][cle]['cursor']

                    set_frame(cle,parent,config_options,grid_options,rowconfigure,columnconfigure)
        elif nom_instance1 == "2":#widget
                for cle, value in dico["2"].items():
                    nom_widget = cle
                    config_options = {}
                    grid_options = {}
                    bind_option = {}
                    if "tk" in value:
                        tk = dico[nom_instance1][cle]['tk']
                    if "parent" in value:
                        parent = dico[nom_instance1][cle]['parent']
                #.configure
                    if "bg" in value:
                        config_options['bg']=dico[nom_instance1][cle]['bg']
                    if "fg" in value:
                        config_options['fg']=dico[nom_instance1][cle]['fg']
                    if "font" in value:
                        config_options['font']=dico[nom_instance1][cle]['font']
                    if "width" in value:
                        config_options['width']=dico[nom_instance1][cle]['width']
                    if "show" in value:
                        config_options['show']=dico[nom_instance1][cle]['show']
                    if "state" in value:
                        config_options['state']=dico[nom_instance1][cle]['state']
                    if "insertbackground " in value:
                        config_options['insertbackground']=dico[nom_instance1][cle]['insertbackground']
                    if "text" in value:
                        config_options['text']=dico[nom_instance1][cle]['text']
                #.grid
                    if "row" in value:
                        grid_options['row']=dico[nom_instance1][cle]['row']
                    if "column" in value:
                        grid_options['column']=dico[nom_instance1][cle]['column']
                    if "rowspan" in value:
                        grid_options['rowspan']=dico[nom_instance1][cle]['rowspan']
                    if "columnspan" in value:
                        grid_options['columnspan']=dico[nom_instance1][cle]['columnspan']
                    if "sticky" in value:
                        grid_options['sticky']=dico[nom_instance1][cle]['sticky']
                    if "padx" in value:
                        grid_options['padx']=dico[nom_instance1][cle]['padx']
                    if "ipadx" in value:
                        grid_options['ipadx']=dico[nom_instance1][cle]['ipadx']
                    if "pady" in value:
                        grid_options['pady']=dico[nom_instance1][cle]['pady']
                    if "ipady" in value:
                        grid_options['ipady']=dico[nom_instance1][cle]['ipady']
              

                # fonction set_widget
                    set_widget(nom_widget,tk,parent,config_options,grid_options,bind_option)
def set_frame(nom,parent, config_options=None, grid_options=None,rowconfigure=None,columnconfigure=None):
    global dico_frame
    if nom in dico_frame:
        pass
    else :
        frame = tk.Frame(dico_frame[parent])
        frame.name=nom
        dico_frame[nom] = frame
    if config_options :
        for option, value in config_options.items():
            dico_frame[nom].configure(**{option: value})
    if grid_options:
        dico_frame[nom].grid(**grid_options)
    if columnconfigure:
        for x in range(columnconfigure):
            dico_frame[nom].columnconfigure(x,weight=1)
    if rowconfigure:
        for x in range(rowconfigure):
            dico_frame[nom].rowconfigure(x,weight=1)
def set_widget(nom, tipe, parent, config_options=None, grid_options=None, bind_option=None):
    global dico_widget
    global dico_frame
    global dico_var
    
    if nom in dico_widget:
        widget = dico_widget[nom]
    else:
        if tipe == "Entry":
            commande_var = tk.StringVar()
            dico_var[nom]=commande_var
            widget = tk.Entry(dico_frame[parent], textvariable=dico_var[nom])
            widget.name = nom
            dico_widget[nom] = widget
            dico_widget[nom].focus_set()
        elif tipe == "Label":
            widget =tk.Label(dico_frame[parent])
            widget.nom=nom
            dico_widget[nom]=widget
        else:
            # Gérer d'autres types de widgets si nécessaire
            return None
        
    if config_options:
        for option, value in config_options.items():
            widget.configure(**{option: value})
    
    if grid_options:
        widget.grid(**grid_options)
def run_command(event):
    global dico_frame
    global dico_widget
    widget_focalise = dico_frame["root"].focus_get()
    if widget_focalise and isinstance(widget_focalise, tk.Entry):
        text = widget_focalise.get()
        python_executable = sys.executable
        autre_dossier_path = "/home/rick/Bureau/hulbert/fonction/"
        interface = "visuel"
        arguments = [text,interface]
        result = subprocess.run([python_executable, f"{autre_dossier_path}charon"] + arguments , stdout=subprocess.PIPE, stderr=subprocess.PIPE, text=True)

        reponse = result.stdout.strip()
        erreur = result.stderr.strip()
        widget_focalise.delete(0, tk.END)
        if reponse != '':
            affichage_reponse(reponse=reponse)
        if erreur != '':
            affichage_reponse(erreur=erreur)
    else:
        print("Aucun Entry n'est focalisé actuellement.")

def affichage_reponse(reponse=None,erreur=None):
    global dico_widget
    reponse_afficher = dico_widget['label_reponse'].cget('text')
    if reponse:
        reponse_afficher += (f"\n{reponse}")
    else:
        reponse_afficher += f"\nPas de réponse"
    if erreur:
        reponse_afficher += f"\n{erreur}"
    else:
        reponse_afficher += f"\nPas d'erreur"

    dico_widget['label_reponse'].configure(text=reponse_afficher)


def do(event=None):
    print("Touché")
def fullscreen(event=None):
    root.attributes('-fullscreen',True)
def windowed(event=None):
    root.attributes("-fullscreen",False)
    root.geometry("850x600")
def font_sombre(event=None):
    pass
def font_clair(event=None):
    pass


dico_frame["root"].bind("<Return>",run_command)
dico = demarrage()
root.mainloop()
