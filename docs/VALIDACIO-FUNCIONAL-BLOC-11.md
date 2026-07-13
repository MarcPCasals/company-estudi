# Validació funcional completa · Bloc 11

Data de la validació: 13 de juliol de 2026.

## Entorn de prova

La validació s’ha fet amb els emuladors locals de Firebase Authentication i Firestore, carregant les mateixes regles de seguretat que utilitza l’aplicació. Les dades de prova no han arribat al projecte de producció i no han generat cap cost.

L’aplicació només es connecta als emuladors quan s’executa en desenvolupament amb `VITE_USE_FIREBASE_EMULATORS=true`. La versió publicada continua connectant-se al projecte real.

Dades utilitzades:

- una classe de prova amb les 13 sales d’assignatura;
- un tutor de validació amb proveïdor Google simulat localment;
- sis alumnes amb sis credencials tècniques diferents;
- cinc alumnes amb el mateix deure i un sisè sense apuntar-lo;
- un deure dividit en passos, un examen, una sessió i una reprogramació;
- un dubte públic, una resposta d’un company, una resposta del tutor i una denúncia;
- una revisió setmanal i un feedback tutorial.

## Resultats

| Flux | Resultat | Evidència funcional |
|---|---|---|
| Alta de classe | Correcte | Es creen la classe, el codi general, les assignatures i les 13 sales. |
| Alta de 5–8 alumnes | Correcte | Sis alumnes creats amb codis personals diferents. |
| Accés amb codis | Correcte | Alba, Biel, Carla, Dani i Emma han accedit només al seu espai. |
| Deure complet | Correcte | Assignatura, passos, material, ajuda, nota privada, planificació i historial. |
| Examen | Correcte | Creat com a examen, sense obligació d’entrega i amb termini. |
| Calendari i ocupacions | Correcte | Trajecte, descans i ocupació personal es mostren al calendari; el tutor només rep disponibilitat resumida. |
| Reprogramació | Correcte | La sessió es pot reajustar amb motiu i queda vinculada a la tasca. |
| Detecció comunitària | Correcte | Amb cinc coincidències entre sis alumnes apareix una proposta agregada amb llindar 5, sense identitats. |
| Confirmació i correcció | Correcte | El tutor confirma la proposta; la conversió d’una data corregida a termini oficial està coberta per una prova automàtica. |
| No afegir automàticament | Correcte | La tasca oficial apareix com a proposta i cada alumne decideix si l’afegeix. |
| Dubte i respostes | Correcte | Dubte a Castellà, resposta de Biel, resposta del tutor, validació i marcatge com a resolt. |
| Moderació | Correcte | Denúncia visible només al tutor i tancada amb «Marca revisada». |
| Revisió setmanal | Correcte | La revisió d’Alba apareix a la seva fitxa tutorial. |
| Feedback formador | Correcte | El tutor envia observació, pregunta, estratègia i acord; Alba els veu al seu espai. |
| Privacitat | Correcte | El tutor no veu la nota privada ni el nom de l’extraescolar; veu evidències explicables i disponibilitat resumida. |
| Gamificació associada | Correcte | Les accions reals activen XP, nivell 2, constància 3/3 i les tres missions personals. |

## Problemes detectats i correccions

1. S’ha afegit un mode local d’emuladors per poder provar autenticació, codis i regles sense tocar dades reals.
2. S’ha afegit un accés de tutor exclusiu de l’entorn local, amb identitat Google simulada. No existeix a producció.
3. S’ha centralitzat i provat la conversió de la data corregida d’una proposta comunitària.
4. S’ha corregit el nom del tutor simulat perquè el test local no introdueixi caràcters mal codificats.

No s’han observat errors de consola durant els fluxos finals. La compilació de producció és correcta i les 57 proves automatitzades passen.

## Com repetir la validació

En dos terminals diferents:

```bash
JAVA_HOME=/opt/homebrew/opt/openjdk@21 PATH=/opt/homebrew/opt/openjdk@21/bin:$PATH npm run emulators
npm run dev:emulators -- --host 127.0.0.1
```

Després, obrir `http://127.0.0.1:5173/` i utilitzar el botó **Entra com a tutor de validació**.

La validació visual, els diferents formats d’iPad i la prova pilot amb alumnat real corresponen als blocs 12 i 13; no s’han barrejat amb aquesta comprovació funcional.
