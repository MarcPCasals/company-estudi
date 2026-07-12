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
- autenticació de tutor amb Google i comptes tècnics gratuïts per als alumnes;
- unes Firestore Rules inicials, tancades per defecte.
- arquitectura compatible amb el pla Spark, sense Cloud Functions ni facturació.
- creació de classes, alumnes, codis, sales optatives i incorporació inicial;
- regeneració de credencials i canvi de classe amb identitat d'alumne estable;

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

Els codis es transformen localment en credencials tècniques de Firebase Authentication. Les Firestore Rules només autoritzen un UID vinculat prèviament pel tutor a un alumne actiu amb la mateixa versió de credencial. El projecte es manté al pla Spark i no necessita cap servei amb facturació. Consulta [docs/FIREBASE-SETUP.md](docs/FIREBASE-SETUP.md).
