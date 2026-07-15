# Bloc 14 · Construcció, qualitat i preparació del pilot

Data de validació tècnica: 15 de juliol de 2026.

## Resultat

La construcció funcional prèvia al pilot queda completada i validada en navegador d'ordinador. La prova física de Safari a l'iPad i les decisions que depenen del pilot continuen pendents.

## Recorregut complet validat

S'ha executat el flux contra els emuladors reals d'Authentication i Firestore:

1. Entrada com a tutor de validació.
2. Creació de la primera classe i de les 13 sales d'assignatura.
3. Creació de dos alumnes amb codis personals.
4. Sortida del tutor i entrada d'un alumne amb codi de classe i codi personal.
5. Obertura de l'espai de deures i creació d'una tasca.
6. Comprovació que la tasca apareix al calendari setmanal.
7. Entrada a la Sala d'estudi i càrrega de la tasca com a focus disponible.

Validació visual d'ordinador: `1280 × 720`, sense desbordament horitzontal i sense errors de consola.

## Permisos i privacitat

Les regles de Firestore es comproven automàticament contra l'emulador. Les proves confirmen que:

- una persona no autenticada no pot llegir la classe ni el podi;
- cada alumne pot llegir les seves dades, però no les d'un company;
- el tutor pot veure la tasca acadèmica, però no la nota privada ni l'horari personal exacte;
- els alumnes poden veure el podi públic, però no consultar el rànquing complet ni l'XP d'un altre alumne;
- una nota privada no es pot introduir dins del document acadèmic compartit;
- un alumne no pot crear, modificar o eliminar tasques en nom d'un company;
- un alumne pot participar en una sala de classe, però no publicar avisos reservats al tutor;
- dues confirmacions simultànies del mateix bloc concedeixen XP una sola vegada.

La CI de GitHub executarà aquestes proves abans de construir i publicar l'aplicació.

## Pèrdua de dades i recuperació

- Les escriptures relacionades de tasques, historial i sessions utilitzen lots atòmics.
- El cronòmetre de la Sala d'estudi conserva una hora final estable i recupera la sessió després d'una recàrrega.
- Els blocs de Sala d'estudi tenen identificadors idempotents per evitar XP duplicat.
- L'estat de connexió diferencia dades sincronitzades, memòria cau i escriptures pendents.
- La persistència antiga del navegador es pot netejar sense afectar altres projectes.

## Incidència trobada i resolta

En crear la primera classe, alguns observadors de subcol·leccions podien rebre temporalment `permission-denied` abans que la nova classe fos visible per a totes les consultes. Les dades es creaven correctament, però la interfície podia requerir una recàrrega.

S'ha centralitzat una represa limitada dels observadors d'alumnes, sales, credencials i rànquing. El recorregut s'ha repetit des d'un emulador buit i els alumnes apareixen immediatament, sense recarregar ni mostrar errors.

## Proves pendents

- Safari en un iPad físic, incloent bloqueig, canvi d'orientació i pèrdua de connexió.
- Pilot de 6–8 setmanes amb alumnat real.
- Feedback d'alumnes i tutor.
- Validació del ritme d'XP, les emocions de Piu i la durada dels blocs.
- Revisió organitzativa i legal del tractament de dades abans del pilot real.
- Decisió posterior al pilot sobre què es manté, es modifica o s'elimina.

L'àudio i el vídeo ambientals queden fora del pilot inicial i es valoraran més endavant com una opció voluntària.
