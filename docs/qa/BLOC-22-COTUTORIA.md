# Bloc 22 · Cotutoria i accés compartit

## Decisions de la primera versió

- Cada classe té un únic `tutor responsable` i, com a màxim, un `cotutor`.
- La classe i totes les dades pedagògiques són úniques. Acceptar una invitació només afegeix una autorització; no copia alumnes, tasques, sessions, XP, fils ni codis.
- El cotutor pot consultar i treballar amb el seguiment, la comunitat, els missatges, les revisions i les alertes pedagògiques compartides.
- Només el tutor responsable gestiona alumnes, codis d'accés, sales, horari general, cotutors, transferència de propietat i eliminació de la classe.
- No s'afegeixen notes internes noves en aquesta versió. Els fils tutorials continuen sent únics i l'autoria docent existent identifica qui ha escrit cada intervenció.
- El model `teacherIds` més la subcol·lecció `teacherMembers` permet ampliar el nombre de cotutors en el futur sense canviar el model, tot i que la interfície actual en limita un.

## Privacitat i seguretat

- El correu només resol la invitació. Un cop acceptada, el permís permanent depèn de l'UID autenticat.
- Una invitació pendent, rebutjada, revocada o caducada no concedeix accés a la classe.
- L'acceptació és una operació atòmica que actualitza invitació, classe i membre docent conjuntament.
- Les regles comproven el proveïdor Google, el compte convidat, l'estat i la caducitat abans d'acceptar.
- En retirar o abandonar una cotutoria, l'UID deixa immediatament de formar part de `teacherIds`; una pestanya oberta perd les lectures i escriptures següents.
- Els secrets i codis d'alumnes continuen sota el compte del tutor responsable. En transferir la responsabilitat, el secret es mou al nou responsable i s'elimina del compte anterior.
- Abans d'un ús real amb dades del centre cal confirmar la base d'ús, els comptes admesos i si es restringeix `educand.ad`. Aquesta decisió queda deliberadament pendent del pilot.

## Validació automatitzada

- Proves pures de normalització, autoc invitació, caducitat i rols.
- Proves amb l'emulador de Firestore per a invitació pendent, acceptació atòmica, compte incorrecte, accés pedagògic del cotutor, bloqueig de codis i configuració, usuari extern i retirada immediata.
- Suite completa: `111` proves superades i `12` proves d'emulador omeses en l'execució unitària ordinària.
- Suite específica de regles amb emulador: `11` proves superades.
- Compilació de producció validada amb Vite.

## Validació manual abans del pilot

- Fer el recorregut amb dos comptes Google reals: convidar, acceptar, canviar de classe, editar dades pedagògiques, retirar i tornar a provar una pestanya oberta.
- Provar rebuig, revocació, caducitat, reenviament i transferència amb dos dispositius.
- Confirmar amb dos docents que entenen la diferència entre responsable i cotutor.
- Auditar les consultes i notificacions després de perdre accés.
- Activar-ho primer en una classe de prova, revisar incidències i decidir si cal restringir el domini institucional.
