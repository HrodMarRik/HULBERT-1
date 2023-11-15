import sys
from datetime import datetime

date_format = '%A %d %B %Y'
time_format = '%Hh:%Mmin'

if __name__ == '__main__':
    args = sys.argv[1:]
    now = datetime.now()
    for arg in args:
        if 'date' in arg:
            print(now.strftime(date_format))
        elif 'heure' in arg:
            print(now.strftime(time_format))
        else:
            print("Aucun argument valide n'a été donné.")
