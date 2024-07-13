import json
import xml.etree.ElementTree as ET
import logging
import os
import sys

parent_dir = os.path.abspath(os.path.join(os.getcwd(), os.pardir))
sys.path.insert(0, parent_dir)

import App.Fonctions.bin.loggerConfig

def toJson(fichier, contenu):
    try:
        with open(fichier, 'w', encoding='utf-8') as f:
            json.dump(contenu, f, ensure_ascii=False, indent=4)
        logging.info(f"Successfully wrote to JSON file: {fichier}")
    except Exception as e:
        logging.error(f"Error writing to JSON file {fichier}: {e}")

def toXml(fichier, contenu):
    try:
        root = dictToXmlElement(contenu, 'root')
        tree = ET.ElementTree(root)
        tree.write(fichier, encoding='utf-8', xml_declaration=True)
        logging.info(f"Successfully wrote to XML file: {fichier}")
    except Exception as e:
        logging.error(f"Error writing to XML file {fichier}: {e}")

def dictToXmlElement(data, tag):
    element = ET.Element(tag)
    for key, val in data.items():
        child = ET.Element(key)
        if isinstance(val, dict):
            child.extend(dictToXmlElement(val, key))
        else:
            child.text = str(val)
        element.append(child)
    return element

def toTxt(fichier, contenu):
    try:
        with open(fichier, 'w', encoding='utf-8') as f:
            for line in contenu.get('lines', []):
                f.write(line + '\n')
        logging.info(f"Successfully wrote to TXT file: {fichier}")
    except Exception as e:
        logging.error(f"Error writing to TXT file {fichier}: {e}")
