# Configuració gratuïta de Firebase

El projecte utilitza exclusivament el pla **Spark**, sense compte de facturació.
No necessita Cloud Functions, Cloud Run, Secret Manager ni cap servei Blaze.

## Authentication

A **Authentication -> Sign-in method**, activa:

- **Google**, per als tutors.
- **Email/Password**, per als comptes tècnics dels alumnes.

Es pot desactivar **Anonymous**, perquè ja no forma part de l'arquitectura.

Els alumnes continuen veient només `codi de classe + codi personal`. L'aplicació
transforma aquests codis en un correu tècnic i una contrasenya derivats amb
SHA-256. No són dades personals ni es mostren a l'alumne.

## Authorized domains

A **Authentication -> Settings -> Authorized domains**, mantén:

- `localhost`, per al desenvolupament local.
- `127.0.0.1`, si també s'utilitza localment.
- `marcpcasals.github.io`, per a GitHub Pages.
- `company-estudi.firebaseapp.com`.
- `company-estudi.web.app`, només si s'utilitza Firebase Hosting.

No s'hi posa `https://`, cap port ni `/company-estudi/`.

## Flux gratuït d'accés de l'alumne

1. El tutor crea una classe amb el seu compte Google.
2. El navegador genera codis aleatoris amb entropia criptogràfica.
3. Una segona instància interna de Firebase Authentication crea el compte tècnic
   de l'alumne sense tancar la sessió del tutor.
4. Firestore vincula l'UID tècnic amb `classId`, `studentId` i la versió de la
   credencial a `studentAccess/{uid}`.
5. Quan l'alumne introdueix els dos codis, Firebase Authentication comprova les
   credencials derivades.
6. Les Rules només permeten l'accés si l'UID, l'alumne i la versió coincideixen.

Un compte de Firebase creat fora d'aquest flux no té cap document
`studentAccess` i, per tant, no pot llegir dades.

## Estructura relacionada amb l'accés

```text
classes/{classId}
  students/{studentId}
  subjects/{subjectId}
  rooms/{subjectId}

studentAccess/{firebaseAuthUid}

tutors/{tutorId}/classSecrets/{classId}
  students/{studentId}
```

`classSecrets` només és accessible pel tutor propietari. Els alumnes no poden
llegir els codis propis ni els dels companys des de Firestore.

## Regeneració i revocació

La versió de la credencial forma part de la derivació tècnica. Quan es regenera
un codi, es crea una credencial nova i el document de l'alumne passa a la versió
següent. Les Rules deixen d'acceptar automàticament l'UID anterior.

## Límits i comportament del pla Spark

El projecte no té facturació vinculada. Si algun servei arribés a la seva quota
gratuïta, quedaria limitat fins que la quota es renovés; no generaria un cobrament.

## Connexió, persistència i recuperació

Al web, la persistència entre sessions només s'activa amb consentiment explícit
en un dispositiu propi o assignat. En dispositius compartits s'utilitza memòria
temporal i les dades desapareixen en tancar la sessió del navegador.

Quan la persistència està activa:

- Firestore conserva localment les dades que l'usuari ja ha consultat.
- Les escriptures locals es mostren immediatament i queden pendents si no hi ha xarxa.
- En recuperar la connexió, Firebase les sincronitza automàticament.
- La interfície diferencia còpia local, canvis pendents i dades sincronitzades.
- Abans d'esborrar la còpia local, l'aplicació exigeix connexió i espera que les
  escriptures pendents hagin arribat al servidor.
- En tancar la sessió sense persistència, la pàgina es recarrega i elimina la
  memòria temporal de la sessió anterior.

Els canvis atòmics que no necessiten lectures prèvies s'implementaran amb lots
d'escriptura, perquè es poden posar a la cua sense connexió. Les transaccions es
reservaran per a operacions que exigeixen dades actualitzades i requeriran xarxa.

## Variables d'entorn

La configuració pública de Firebase és a `.env.example`. En local es copia a
`.env.local`, que queda exclòs de Git. No s'hi guarden contrasenyes, comptes de
servei ni secrets de servidor.
