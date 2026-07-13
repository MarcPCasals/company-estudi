# Calendari i pantalla «Avui»

El bloc 7 converteix terminis, sessions de treball i ocupacions personals en una
agenda útil fora de l'horari escolar. Manté separats els tres tipus d'element:

- **Termini:** moment límit d'un deure, treball o examen.
- **Sessió:** franja concreta que l'alumne ha confirmat per treballar.
- **Ocupació personal:** extraescolar, trajecte, àpat, descans o altre compromís.

## Privacitat de les ocupacions

Els detalls de les ocupacions viuen a `personalSchedule` i només els pot llegir
l'alumne. El tutor rep `availability/current`, amb hores disponibles i franges
bloquejades sense noms ni tipus d'activitat.

En desar la configuració inicial es creen automàticament els trajectes i descansos
recurrents de dilluns a divendres. Les extraescolars, els àpats i les altres
ocupacions les introdueix l'alumne amb el seu nom privat.

## Pantalla «Avui»

La pantalla mostra:

- un proper pas explicable;
- una línia temporal amb sessions, ocupacions i terminis;
- entregues pendents de les pròximes 48 hores;
- tasques pendents que encara no tenen sessió.

No hi ha cap puntuació oculta. Una data passada provoca una invitació a revisar i
reajustar, mai un càstig.

## Propostes de franja

El motor busca fins a tres franges durant la setmana actual i la següent. Té en
compte la sortida escolar, trajecte, descans, cap de setmana configurat, ocupacions,
sessions existents i termini de la tasca.

Per evitar sobreplanificar:

- proposa com a màxim una franja per dia per a cada consulta;
- limita una sessió suggerida a 60 minuts;
- deixa 15 minuts després d'una ocupació;
- reserva almenys 30 minuts lliures al final del dia.

Una proposta no escriu res a Firestore. Només crea o mou la sessió quan l'alumne
prem explícitament `Confirma aquesta franja`.

## Vista setmanal i dispositius

La setmana va de dilluns a diumenge i permet anar a la setmana anterior, següent
o tornar a l'actual. En ordinador i iPad horitzontal es mostren set columnes. En
iPad vertical passa a dues columnes i, en pantalles estretes, a una columna.
