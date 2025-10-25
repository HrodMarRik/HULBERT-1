@echo off
echo Configuration SSH automatique...
echo.

REM Configuration
set USERNAME=Hulbert
set HOSTNAME=51.178.24.242
set PASSWORD=POURRIS333?
set PUBLIC_KEY=ssh-rsa AAAAB3NzaC1yc2EAAAADAQABAAACAQCsicngm36aVHBSpVcL/ysQ/gBr9bgBfLTGq7iBeNScnZzvmMt2xDVCcJGcMkDqbHumBo57KlIH9P9quCyQOT+yhj87ASwXHFjd0Lq0dl4TzYkwHcTDTicyJSC9tIrYD5d6hK7sk87z2zUJlWpZycc0Z6gh+Dae3YZq1aFss2Aan/kW2A3DBa1BAYLef66QJGtCtQP8WVhR2kcQWdEJq2mX/PpPVSCI332pbCSrSkdpn6CKC3V2CdvIADGt0BhE7+wTaQapEHB9+P/T0Vt4oJ/O4Qifc0LR3oENkRtuWRPkhldl+9AstePMX3Ekd5A/T0cgrvIYVTb1nvA/G3sBFJo3c8SBmSB8gGTec51woj7UgWlTSw9rccqe/aY0SnH++Gg/n//IygIuhBzrQ2TkP98jEixQLCa498RcV4pI+Kk3npMlim7mxT5St5pQf/WoKaAZ+Z7vnJiBYR6c1LbMTY1Ziu7+dQNKMXT87WGnTHes5z1Go0p93iZ6WCmcA94dUS0Df17HiQvgobZxldAf5KZsLdDACIWvNxKgfP7ODK0zbDUjqoYg17B+GqmA5gXiIYxaT150MWQu/WdaLRLwZZeLwYBADtN9odXXvbjrFiv1c2tdwPV61SKbsEjfgma0l1GiZGE8Dzl0EH0YfYaJGEkRRCXulFhXZH90vNXaMOGmqQ== hulbert@vps

echo Etape 1: Creation du repertoire .ssh...
echo mkdir -p ~/.ssh > temp_commands.txt
echo chmod 700 ~/.ssh >> temp_commands.txt
echo echo "%PUBLIC_KEY%" ^>^> ~/.ssh/authorized_keys >> temp_commands.txt
echo chmod 600 ~/.ssh/authorized_keys >> temp_commands.txt
echo chown Hulbert:Hulbert ~/.ssh/authorized_keys >> temp_commands.txt

echo Etape 2: Execution des commandes sur le VPS...
echo %PASSWORD% | ssh %USERNAME%@%HOSTNAME% "bash -s" < temp_commands.txt

echo Etape 3: Test de la connexion...
ssh hrodmarrik "echo 'Connexion SSH reussie sans mot de passe !'"

echo.
echo Configuration terminee !
echo Vous pouvez maintenant vous connecter avec: ssh hrodmarrik

REM Nettoyage
del temp_commands.txt

pause
