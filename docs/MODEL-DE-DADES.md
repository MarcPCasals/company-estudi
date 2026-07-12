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

- `personal_task`: pertany a un alumne, viu dins de `students/{studentId}/tasks`
  i pot contenir una nota privada.
- `community_candidate`: és una coincidència agregada encara no confirmada. Viu
  a `taskCandidates` i no conté identitats ni notes privades.
- `official_task`: la confirma el tutor i viu a `officialTasks`. Que sigui oficial
  no l'afegeix automàticament al calendari personal de l'alumne.

Tots tres referencien una assignatura i poden descriure un termini, però no són
intercanviables. Una proposta només esdevé oficial mitjançant una acció del tutor,
i l'alumne decideix si incorpora la tasca oficial al seu espai personal.

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
- El tutor pot veure tasques i sessions necessàries per a l'acompanyament.
- Les sales són comunitàries per als membres de la classe.
- Les propostes comunitàries no conserven la identitat de qui ha creat tasques semblants.
- Una tasca oficial no modifica automàticament el calendari personal.
- Els codis i verificadors d'accés viuen fora de l'arbre llegible pels alumnes.
- Cada UID tècnic només obté accés si existeix el seu vincle a `studentAccess`.
