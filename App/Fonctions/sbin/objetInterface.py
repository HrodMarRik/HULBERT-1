import os
import sys
import logging 

parent_dir = os.path.abspath(os.path.join(os.getcwd(), os.pardir))
sys.path.insert(0, parent_dir)

import App.Fonctions.bin.loggerConfig


info = "OUVERTURE DE : " + __name__
logging.debug(info)


class interface(object):
	"""docstring for interface"""
	def __init__(self, arg):
		super(interface, self).__init__()
		self.arg = arg
