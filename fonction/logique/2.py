import os
import json
import socket
import sys



def get_directory_tree(folder):
    tree = {}
    tree[folder] = _get_directory_tree(folder)
    return tree

def _get_directory_tree(folder):
    tree = {}
    try:
        with os.scandir(folder) as entries:
            for entry in entries:
                if entry.is_dir():
                    if entry.is_symlink():
                        # Handle symbolic link
                        tree[entry.name] = entry.path
                    else:
                        tree[entry.name] = _get_directory_tree(entry.path)
                else:
                    tree[entry.name] = entry.path
    except Exception as e:
        print(f"Error scanning {folder}: {e}")
    return tree

def save_tree_to_json(tree, output_file):
    with open(output_file, 'w') as file:
        json.dump(tree, file, indent=2)

if __name__ == "__main__":
    hostname = socket.gethostname()
    output_file = hostname + "_arbo"
    if len(sys.argv) > 1:
        starting_folder = sys.argv[1]
    else:
        starting_folder = "/home/rick/Bureau/HULBERT"


    tree = get_directory_tree(starting_folder)
    save_tree_to_json(tree, output_file)

    print(f"L'arborescence a été enregistrée dans {output_file}")

