import json
import xml.etree.ElementTree as ET
import logging
import os
import sys

parent_dir = os.path.abspath(os.path.join(os.getcwd(), os.pardir))
sys.path.insert(0, parent_dir)

import App.Fonctions.bin.loggerConfig

def fromJson(fichier):
    try:
        with open(fichier, 'r', encoding='utf-8') as f:
            data = json.load(f)
        logging.info(f"Successfully read JSON file: {fichier}")
        return data
    except Exception as e:
        logging.error(f"Error reading JSON file {fichier}: {e}")
        return None

def fromXml(fichier):
    try:
        tree = ET.parse(fichier)
        root = tree.getroot()
        data = parseXmlElement(root)
        logging.info(f"Successfully read XML file: {fichier}")
        return data
    except Exception as e:
        logging.error(f"Error reading XML file {fichier}: {e}")
        return None

def parseXmlElement(element):
    data = {}
    for child in element:
        if len(child):
            data[child.tag] = parseXmlElement(child)
        else:
            data[child.tag] = child.text
    return data

def fromTxt(fichier):
    try:
        with open(fichier, 'r', encoding='utf-8') as f:
            lines = f.readlines()
        data = {'lines': [line.strip() for line in lines]}
        logging.info(f"Successfully read TXT file: {fichier}")
        return data
    except Exception as e:
        logging.error(f"Error reading TXT file {fichier}: {e}")
        return None
