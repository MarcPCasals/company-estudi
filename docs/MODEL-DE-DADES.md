# Model de dades inicial

Aquest model cobreix el nucli funcional sense decidir encara la interfície visual.

## Relacions principals

```text
classes/{classId}
  subjects/{subjectId}
  rooms/{subjectId}
  taskCandidates/{candidateId}
  officialTasks/{officialTaskId}
  students/{studentId}
    tasks/{taskId}
      private/details
      history/{historyId}
    studySessions/{sessionId}
    personalSchedule/{occupationId}

studentAccess/{firebaseAuthUid}
tutors/{tutorId}/classSecrets/{classId}
```

## Entitats

### Classe

Conté el nom, el curs, el tutor propietari, les assignatures actives i la
configuració general. No conté codis d'accés en text visible.

### Alumne

Pertany a una sola classe en aquesta primera versió. Conté el nom visible,
l'estat actiu i la versió de la credencial. Les seves dades privades pengen del
seu document.

### Assignatura

Representa l'assignatura acadèmica i permet vincular deures, exàmens i colors.
No és una àrea curricular ni converteix les converses en evidències d'avaluació.

### Sala

És l'espai comunitari d'una assignatura. Comparteix l'identificador de
l'assignatura, però és una entitat separada perquè conversa i calendari tenen
permisos i comportaments diferents.

### Tasca

El sistema separa tres registres diferents:

- `personal_task`: pertany a un alumne i viu dins de `students/{studentId}/tasks`.
  Les notes privades no són camps d'aquest document: viuen a
  `tasks/{taskId}/private/details`, que el tutor no pot llegir.
- `community_candidate`: és una coincidència agregada encara no confirmada. Viu
  a `taskCandidates` i no conté identitats ni notes privades.
- `official_task`: la confirma el tutor i viu a `officialTasks`. Que sigui oficial
  no l'afegeix automàticament al calendari personal de l'alumne.

Tots tres referencien una assignatura i poden descriure un termini, però no són
intercanviables. Una proposta només esdevé oficial mitjançant una acció del tutor,
i l'alumne decideix si incorpora la tasca oficial al seu espai personal.

### Estat i entrega

Cada tasca personal indica també si és un deure, un treball o un examen, i pot
incloure temps estimat, passos, material, petició d'ajuda i necessitat d'entrega.
L'estat de treball personal pot ser:

- `needs_clarification`: falta concretar què s'ha de fer.
- `pending`: està clar, però encara no s'ha planificat.
- `planned`: té almenys una sessió prevista, encara que la vista de calendari es
  construeixi en un bloc posterior.
- `in_progress`: l'alumne ja hi està treballant.
- `done`: la feina està acabada.

L'entrega és un camp separat: `not_required`, `not_delivered` o `delivered`.
Marcar una tasca com `done` no la converteix automàticament en `delivered`.
Una tasca feta es pot reobrir per revisar-la o reajustar-la.

### Historial de canvis

Cada tasca personal té una subcol·lecció `history`. Els esdeveniments registren
creació, canvi d'estat, progrés, reprogramació, canvi de termini, entrega o
petició d'ajuda. Només es poden afegir: no es poden editar ni esborrar.

Reprogramar o tornar a un estat anterior és una evidència de regulació, no una
penalització. Per això l'historial no conté puntuacions negatives.

### Termini

No és una col·lecció independent: és un objecte dins de la tasca. Pot ser
`confirmed`, `to_confirm` o `without_date`, amb zona horària `Europe/Andorra`.
Això evita crear dos elements diferents per al mateix deure.

### Sessió d'estudi

És un bloc de treball planificat al calendari. Referencia una tasca, però té
inici, durada i progrés propis. Moure una sessió no canvia el termini de la tasca.

### Ocupació personal

Representa extraescolars, trajectes, àpats, descans o altres franges no
disponibles. Es desa a `personalSchedule` i només és llegible per l'alumne. El
tutor només podrà veure un resum de disponibilitat, mai el detall.

## Decisions de privacitat

- Les ocupacions personals queden dins de l'espai privat de l'alumne.
- Les notes privades de les tasques són documents separats i les regles de
  Firestore només en permeten l'accés a l'alumne propietari.
- El tutor pot veure tasques i sessions necessàries per a l'acompanyament.
- Les sales són comunitàries per als membres de la classe.
- Les propostes comunitàries no conserven la identitat de qui ha creat tasques semblants.
- Una tasca oficial no modifica automàticament el calendari personal.
- Els codis i verificadors d'accés viuen fora de l'arbre llegible pels alumnes.
- Cada UID tècnic només obté accés si existeix el seu vincle a `studentAccess`.
