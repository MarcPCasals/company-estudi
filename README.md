# Company d'estudi

Eina tutorial perquè l'alumnat aprengui a apuntar, planificar, fer, revisar i reajustar la seva feina.

## Estat actual

La primera base funcional implementa:

- rols d'alumne i tutor;
- capes de visibilitat personal, tutorial, comunitària i agregada;
- projeccions de perfil perquè el tutor i la comunitat no rebin camps privats;
- codis d'accés aleatoris i regenerables;
- invalidació de sessions anteriors mitjançant versions de credencial;
- una pantalla mínima per comparar les vistes d'alumne, tutor i comunitat;
- configuració de Firebase mitjançant variables d'entorn;
- autenticació de tutor amb Google i sessió tècnica anònima per a l'alumne;
- unes Firestore Rules inicials, tancades per defecte.
- una funció segura d'intercanvi de codis, preparada per desplegar.

La interfície actual és deliberadament neutra. El disseny visual definitiu es treballarà després de validar els fluxos funcionals.

## Desenvolupament

```bash
npm install
npm run dev
```

La configuració pública de Firebase és a `.env.example`. Per al flux complet d'autenticació i Firestore, consulta [docs/FIREBASE-SETUP.md](docs/FIREBASE-SETUP.md).

## Comprovacions

```bash
npm test
npm run build
```

## Seguretat

La sessió anònima de Firebase no dona accés per si sola a les dades d'un alumne. La Cloud Function verifica els codis, en guarda només resums segurs i crea una sessió autoritzada amb caducitat. El seu desplegament requereix activar el pla Blaze i crear el secret `CODE_PEPPER`, tal com explica [docs/FIREBASE-SETUP.md](docs/FIREBASE-SETUP.md). No s'han d'utilitzar dades reals fins que aquest flux i les Rules estiguin provats amb l'emulador.
