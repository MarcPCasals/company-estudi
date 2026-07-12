# Company d'estudi

Eina tutorial perquè l'alumnat aprengui a apuntar, planificar, fer, revisar i reajustar la seva feina.

## Estat actual

La primera base funcional implementa:

- rols d'alumne i tutor;
- capes de visibilitat personal, tutorial, comunitària i agregada;
- projeccions de perfil perquè el tutor i la comunitat no rebin camps privats;
- codis d'accés aleatoris i regenerables;
- invalidació de sessions anteriors mitjançant versions de credencial;
- una pantalla mínima per comparar les vistes d'alumne, tutor i comunitat.

La interfície actual és deliberadament neutra. El disseny visual definitiu es treballarà després de validar els fluxos funcionals.

## Desenvolupament

```bash
npm install
npm run dev
```

## Comprovacions

```bash
npm test
npm run build
```

## Seguretat

La lògica actual és una base de domini. Abans d'utilitzar dades reals cal connectar un servei d'autenticació i persistència, guardar verificadors segurs dels codis i aplicar les mateixes regles al servidor o a la base de dades.

