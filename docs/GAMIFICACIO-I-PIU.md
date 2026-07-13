# Gamificació formadora i integració de Piu

## Finalitat

La gamificació reforça decisions d’organització. No mesura rendiment acadèmic, no forma part de l’avaluació i no serveix per comparar alumnes. Els XP personals només els veu l’alumne.

## Accions reconegudes

| Acció | XP | Límit setmanal | Repetició per origen |
|---|---:|---:|---|
| Planificar una tasca | 10 | 3 | Una vegada per tasca |
| Dividir-la en dos passos o més | 10 | 3 | Una vegada per tasca |
| Començar quan falten almenys 24 hores | 12 | 3 | Una vegada per tasca |
| Reajustar un pla | 8 | 2 | Una vegada per tasca i setmana |
| Demanar ajuda explícitament | 8 | 2 | Una vegada per tasca |
| Fer la revisió setmanal | 12 | 1 | Una vegada per setmana |

No donen XP: crear una tasca sense organitzar-la, els minuts acumulats, les notes, els missatges, les respostes del fòrum o entrar cada dia.

Cada reconeixement té un identificador determinista. Una mateixa acció sobre una mateixa tasca no es pot comptar dues vegades. Els límits setmanals eviten que crear tasques artificials generi XP indefinidament.

## Nivells i evolució

Els nivells són acumulatius i no es perden:

1. Primer pas · 0 XP.
2. Niu preparat · 40 XP.
3. Branca florida · 100 XP.
4. Racó d’estudi · 180 XP.
5. Company constant · 300 XP.

L’evolució transforma l’entorn i el niu, no la salut de Piu. Piu no mor, no emmalalteix i no plora perquè l’alumne no hagi entrat. Els complements previstos són una agenda, una motxilla i una manta de descans; sempre hi ha l’opció de no utilitzar-ne cap.

## Constància flexible

La constància setmanal progressa quan l’alumne practica fins a tres tipus diferents d’hàbit durant la setmana. No exigeix dies consecutius, no torna a zero com a càstig i normalitza els descansos.

## Missions

Les tres missions personals setmanals reforcen planificar, dividir i revisar. Les missions cooperatives les crea el tutor amb un hàbit i un objectiu de contribucions.

Cada alumne pot aportar una vegada a una missió si ja ha practicat aquell hàbit durant la setmana. La classe i el tutor només veuen el total; el marcador individual de contribució queda dins l’espai privat de l’alumne. No hi ha rànquing ni llista de participants.

## Controls de l’alumne

- Mode complet: Piu, XP, constància i missions.
- Mode reduït: Piu, nivell i constància, sense missions visibles.
- Mode desactivat: l’eina de tasques, calendari i tutoria continua funcionant sense gamificació i deixa de registrar XP nous.
- Les animacions suaus es poden desactivar i també respecten `prefers-reduced-motion`.

## Imatges pendents

La lògica visual té un estat de reserva neutre i no intenta carregar recursos que encara no existeixen. Les instruccions i els noms dels fitxers són a `public/mascota/piu/README.md`. Quan arribin les il·lustracions, no caldrà canviar la lògica de XP, missions o preferències.
