# QA visual · bloc 12

Data: 13 de juliol de 2026

## Referència i implementació

- [Referència aprovada 1 + 3](bloc12-reference-1-plus-3.png)
- [Comparació directa](bloc12-comparacio.png)
- [iPad horitzontal](bloc12-ipad-horizontal.png)
- [iPad vertical](bloc12-ipad-vertical.png)
- [Mòbil reduït](bloc12-mobile.png)
- [Espai del tutor](bloc12-tutor.png)

## Resultat

- P0: cap incidència.
- P1: cap incidència oberta.
- P2: cap incidència oberta.
- P3: la quantitat i varietat de targetes canvia segons les dades reals de l’alumne; no és una diferència del sistema visual.

La implementació conserva l’estructura aprovada: barra de navegació, salutació editorial, resum de càrrega, dies de la setmana, franges amb colors d’assignatura i columna del següent pas. La pantalla no inventa sessions per omplir espai: el prototip de QA utilitza una sessió real de prova i ocupacions habituals.

## Responsive i accessibilitat

- 1194 × 834: sense desbordament horitzontal.
- 834 × 1194: sense desbordament horitzontal.
- 390 × 844: sense desbordament horitzontal; navegació inferior i selector de dies desplaçable.
- Idioma del document: català (`ca`).
- Un únic `h1` a la vista principal.
- Tots els botons visibles tenen nom accessible.
- Tots els selectors de color tenen etiqueta accessible.
- Controls visibles de 44 × 44 píxels o més.
- La informació d’assignatura combina color, text i icona.

## Pendent de validació humana

- Prova curta amb alumnes reals abans del pilot.
- Integració de les il·lustracions definitives del Piu quan estiguin disponibles.
