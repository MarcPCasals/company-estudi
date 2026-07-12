# Creació de classe i incorporació

## Flux del tutor

1. El tutor entra amb Google.
2. Crea una classe indicant nom i curs.
3. L'aplicació crea el codi general, les 13 assignatures i les 13 sales.
4. El tutor pot modificar l'hora de sortida escolar de dilluns a divendres.
5. Afegeix els alumnes, un nom per línia.
6. Cada alumne rep un codi personal aleatori i un compte tècnic invisible.
7. El tutor pot convertir una sala en optativa i seleccionar-ne els membres.

## Identitat estable

El `studentId` no és l'UID d'Authentication. És un identificador estable de
Firestore. Això permet regenerar credencials sense perdre tasques, sessions,
historial ni configuració personal.

Quan es regenera un codi:

- es crea un compte tècnic nou;
- augmenta la versió de la credencial;
- el document de l'alumne conserva el mateix identificador;
- l'accés anterior queda marcat com inactiu;
- les Rules deixen d'acceptar l'UID anterior.

## Primer accés de l'alumne

L'alumne introdueix el codi de classe i el codi personal. Després veu:

- el seu nom i la classe;
- una explicació concreta del que veu el tutor;
- l'horari escolar configurat per la classe;
- el formulari de trajecte, descans i cap de setmana;
- un editor d'extraescolars i altres ocupacions recurrents.

Els noms de les ocupacions es desen a l'espai privat. El tutor només rep franges
agregades sense etiqueta, suficients per entendre la disponibilitat.

## Recuperació i canvis

- **Codi personal perdut:** el tutor el regenera i l'anterior queda revocat.
- **Canvi de dispositiu:** s'introdueixen els mateixos dos codis al dispositiu nou.
- **Canvi de classe:** es crea una credencial vinculada a la classe de destí,
  es manté el `studentId` i es desactiven l'accés i la pertinença anteriors.
- **Codi general:** el tutor el pot consultar dins de la gestió de la classe.

## Privacitat explicada a l'alumne

El tutor pot veure tasques escolars, sessions planificades, disponibilitat
resumida i revisions tutorials. No veu notes privades, noms d'extraescolars ni
activitat en directe.
