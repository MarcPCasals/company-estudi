# Configuració de Firebase

## Authentication

Activa aquests proveïdors a **Authentication -> Sign-in method**:

- Google, per al tutor.
- Anonymous, per crear la sessió tècnica de l'alumne abans de validar els seus codis.

## Authorized domains

A **Authentication -> Settings -> Authorized domains**, comprova o afegeix:

- `localhost`, per al desenvolupament local.
- `127.0.0.1`, només si també s'utilitza aquesta adreça per desenvolupar.
- `marcpcasals.github.io`, per a GitHub Pages. No s'hi posa `/company-estudi/`.
- `company-estudi.firebaseapp.com`, que normalment ja apareix pel projecte.
- `company-estudi.web.app`, si en algun moment també es desplega amb Firebase Hosting.

Per al desplegament inicial a GitHub Pages s'utilitzarà `signInWithPopup`, no `signInWithRedirect`.

## Firestore

1. Crea la base de dades en mode producció.
2. Revisa `firestore.rules`.
3. Publica les regles només després de validar-les amb l'emulador i dades fictícies.

Les regles parteixen d'aquesta estructura:

```text
classes/{classId}
  students/{studentId}
    private/
    tasks/
    studySessions/
    personalSchedule/
    availability/
    tutorialSubmissions/
    tutorFeedback/
  rooms/{roomId}
    posts/
    reports/
  taskCandidates/
  aggregates/

studentSessions/{firebaseAuthUid}
accessCredentials/
```

## Punt de seguretat imprescindible

El navegador no validarà directament `codi de classe + codi personal` contra una col·lecció llegible. El flux segur serà:

1. L'alumne inicia una sessió anònima de Firebase Authentication.
2. Una Cloud Function rep els dos codis.
3. La funció comprova el verificador segur del codi i la versió de la credencial.
4. La funció crea `studentSessions/{uid}` amb `classId`, `studentId`, `credentialVersion` i `active`.
5. Les Rules comproven aquesta sessió en cada accés.

La funció `exchangeStudentCodes`, situada a `functions/src/index.js`, ja implementa
aquest intercanvi. També limita els intents fallits a cinc cada deu minuts i crea
sessions amb una durada màxima de trenta dies.

Les credencials del servidor seguiran aquesta estructura, sempre amb resums HMAC
i mai amb els codis originals:

```text
accessCredentials/{classCodeDigest}
  classId
  active
  students/{studentCodeDigest}
    studentId
    credentialVersion
    active
```

## Cloud Functions i pla Blaze

El desplegament de Cloud Functions i l'ús de Secret Manager requereixen que el
projecte estigui vinculat al pla Blaze. Un cop activat:

```bash
openssl rand -hex 32 | npx firebase-tools functions:secrets:set CODE_PEPPER --data-file=- --project company-estudi
npx firebase-tools deploy --only functions:exchangeStudentCodes --project company-estudi
```

`CODE_PEPPER` és un secret exclusiu del servidor. No s'ha de copiar a `.env`, al
frontend, a GitHub ni a cap document compartit.

`accessCredentials` i l'escriptura de `studentSessions` estan bloquejats als clients. Les Cloud Functions amb Admin SDK no depenen de les Firestore Rules.

## Variables d'entorn

La configuració pública de l'app és a `.env.example`. Copia-la a `.env.local` per desenvolupar. `.env.local` queda exclòs de Git.

La configuració web de Firebase identifica el projecte però no substitueix les Rules, l'autenticació ni App Check. No s'hi han de posar claus de comptes de servei, claus de servidor ni altres secrets.
