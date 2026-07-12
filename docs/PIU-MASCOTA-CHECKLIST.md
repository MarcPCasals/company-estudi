# Piu · Checklist de disseny i implementació

> Full de ruta per crear i integrar **Piu**, la mascota de *Company d'estudi*.
>
> **Idea central:** Piu no és un professor ni un sistema de vigilància. És un company d'estudi que acompanya l'alumne, reacciona al seu progrés i ajuda a construir hàbits sense culpabilitzar.

---

## 0. Principis de disseny

- [ ] Mantenir Piu com un **company**, no com una figura d'autoritat.
- [ ] Evitar missatges que renyin, pressionin o generin culpa.
- [ ] Reforçar la constància i el procés, no les notes ni el rendiment acadèmic.
- [ ] Fer que les reaccions siguin fàcils d'entendre d'una sola mirada.
- [ ] Utilitzar frases breus, naturals i adequades per a alumnat de secundària.
- [ ] Evitar una gamificació excessiva que distregui de l'objectiu principal.
- [ ] Fer que Piu aparegui només quan aporta orientació, feedback o calidesa.
- [ ] Garantir que l'aplicació continuï sent útil encara que les animacions estiguin desactivades.

### Identitat acordada

- **Nom:** Piu
- **Espècie:** pit-roig
- **Aplicació:** Company d'estudi
- **Personalitat:** proper, pacient, una mica còmic, expressiu i encoratjador
- **Rol:** company que planifica, estudia, descansa i celebra amb l'alumne
- **Estil visual:** senzill, bufó, reconeixible i llegible en mides petites

---

# BLOC 1 · Sistema visual base

## 1.1. Tancar el disseny definitiu de Piu

- [ ] Seleccionar una única versió base del personatge.
- [ ] Definir les proporcions definitives del cap, cos, ales, potes, bec i ulls.
- [ ] Simplificar les formes perquè es reconegui bé a 32 × 32 px.
- [ ] Definir la paleta cromàtica principal.
- [ ] Definir el contorn o sistema d'ombres.
- [ ] Evitar detalls petits que es perdin en pantalla.
- [ ] Crear una vista frontal o tres quarts com a postura principal.
- [ ] Comprovar que no s'assembli excessivament a Duo de Duolingo.

## 1.2. Guia visual mínima

Crear un document breu amb:

- [ ] colors exactes en HEX;
- [ ] proporcions del cos;
- [ ] mida i posició dels ulls;
- [ ] forma del bec;
- [ ] forma del pit taronja;
- [ ] tipus d'ombres;
- [ ] gruix de línia, si n'hi ha;
- [ ] expressions que encaixen amb el personatge;
- [ ] expressions o deformacions que s'han d'evitar;
- [ ] marge de seguretat al voltant del personatge.

## 1.3. Formats i estructura d'arxius

- [ ] Crear una carpeta específica: `public/mascota/piu/`.
- [ ] Desar cada postura com una imatge independent.
- [ ] Exportar PNG amb fons transparent.
- [ ] Utilitzar una resolució base d'entre 1000 × 1000 i 2000 × 2000 px.
- [ ] Mantenir proporció quadrada o marges coherents.
- [ ] Crear SVG natiu quan el disseny vectorial estigui disponible.
- [ ] Evitar JPG.
- [ ] Utilitzar noms en minúscules, sense espais i amb guions.

### Convenció de noms

```text
piu-base.png
piu-saluda.png
piu-escriu.png
piu-planifica.png
piu-estudia.png
piu-celebra.png
piu-espera.png
piu-cansat.png
piu-dorm.png
```

Quan existeixi versió vectorial:

```text
piu-base.svg
piu-saluda.svg
...
```

---

# BLOC 2 · Paquet visual inicial assumible

L'objectiu de la primera versió és treballar amb **vuit o nou estats útils**, no crear desenes d'il·lustracions.

## 2.1. Estats imprescindibles per a l'MVP

### Piu base

- [ ] **Base / neutral**
  - Dret i atent.
  - Expressió amable.
  - Serveix com a estat de reserva.

### Entrada i registre escolar

- [ ] **Saludant**
  - Una ala aixecada.
  - Apareix en entrar a l'aplicació.

- [ ] **Escrivint o apuntant deures**
  - Amb llibreta i llapis.
  - Apareix durant el registre de tasques a l'escola.

### Planificació i estudi a casa

- [ ] **Pensatiu / planificant**
  - Mirant una agenda, calendari o llista.
  - Apareix quan l'alumne ordena les tasques.

- [ ] **Estudiant / concentrat**
  - Amb un llibre o quadern.
  - Apareix durant una sessió de feina.

### Feedback positiu

- [ ] **Content**
  - Somriure clar però no exagerat.
  - Apareix després d'una acció correcta o d'un petit progrés.

- [ ] **Celebrant**
  - Saltant, volant lleugerament o amb confeti.
  - Reservat per acabar una tasca, un bloc o el pla del dia.

### Inactivitat i descans

- [ ] **Esperant / avorrit**
  - Assegut o estirat a terra.
  - No ha de transmetre culpa ni tristesa extrema.
  - Apareix després d'un període d'inactivitat moderat.

- [ ] **Cansat**
  - Plomes una mica caigudes, ulls mig tancats.
  - Apareix després d'una sessió llarga o de molta interacció continuada.

- [ ] **Dormint al niu**
  - Apareix quan el dia està completat o en horari nocturn.

## 2.2. Estats ajornats per a una segona fase

- [ ] Sorprès per un assoliment nou.
- [ ] Orgullós amb una medalla.
- [ ] Alleujat després de replanificar.
- [ ] Amb motxilla.
- [ ] Amb una tassa o manta durant una pausa.
- [ ] Amb papers desordenats després d'un error.
- [ ] Amb decoracions estacionals.
- [ ] Variants amb complements desbloquejables.

---

# BLOC 3 · Rutina diària de Piu

Piu ha de reaccionar al moment funcional de l'alumne, més que no pas simplement a l'hora del dia.

## 3.1. Durant l'escola

Objectiu: ajudar a capturar bé els deures i compromisos abans de marxar.

- [ ] Mostrar Piu saludant en la primera entrada del dia.
- [ ] Mostrar Piu escrivint mentre s'afegeixen deures.
- [ ] Celebrar discretament quan les dades bàsiques estan completes.
- [ ] Recordar camps oblidats sense renyar.
- [ ] No activar encara el mode d'estudi si l'alumne només està registrant tasques.

### Missatges orientatius

- “Què tenim per avui?”
- “Ho apuntem abans que se'ns escapi.”
- “Perfecte, ja ho tenim guardat.”
- “Ens falta posar quan ho faràs.”

## 3.2. En arribar a casa

Objectiu: convertir la llista de deures en un pla realista.

- [ ] Donar la benvinguda amb Piu planificant.
- [ ] Mostrar les tasques pendents del dia.
- [ ] Ajudar a escollir l'ordre de treball.
- [ ] Proposar començar per una tasca concreta.
- [ ] Mostrar clarament una sola acció següent.

### Missatges orientatius

- “Som-hi? Mirem què toca.”
- “Per quina comencem?”
- “Fem un pla que puguem complir.”
- “Primer aquesta. Després ja veurem la següent.”

## 3.3. Durant l'estudi

Objectiu: acompanyar sense interrompre constantment.

- [ ] Mostrar Piu concentrat durant la sessió.
- [ ] Reduir els missatges mentre el temporitzador està actiu.
- [ ] Fer una animació discreta en completar un bloc.
- [ ] Proposar una pausa quan la sessió sigui massa llarga.
- [ ] Mostrar Piu cansat si hi ha un ús continuat excessiu.
- [ ] Evitar recompensar estudiar sense descans.

### Missatges orientatius

- “Ja hi som.”
- “Una cosa cada vegada.”
- “Una menys.”
- “Portem una bona estona. Fem una pausa?”
- “Descansar també forma part del pla.”

## 3.4. En acabar

Objectiu: tancar el dia i reforçar la sensació de progrés.

- [ ] Mostrar Piu celebrant en completar una tasca important.
- [ ] Mostrar una celebració més completa en acabar el pla del dia.
- [ ] Convidar a revisar què queda pendent.
- [ ] Permetre replanificar sense considerar-ho un fracàs.
- [ ] Acabar amb Piu al niu quan no queda res urgent.

### Missatges orientatius

- “Fet!”
- “Una menys.”
- “Ho hem aconseguit.”
- “Avui hem avançat.”
- “La resta la podem replanificar.”
- “Bona feina. Ara toca descansar.”

---

# BLOC 4 · Sistema d'energia

L'energia ha de comunicar l'estat del dia i fomentar l'equilibri. No ha de convertir-se en una vida virtual que l'alumne pugui “matar” o abandonar.

## 4.1. Definir què representa

- [ ] Decidir si representa l'energia de Piu, el ritme del dia o el progrés compartit.
- [ ] Explicar-ho amb una frase senzilla a la interfície.
- [ ] Evitar que baixi per no haver tret bona nota.
- [ ] Evitar penalitzacions severes per no entrar un dia.
- [ ] Fer que es recuperi amb accions útils i descans.

### Proposta inicial

L'energia representa **com va la rutina compartida del dia**.

Augmenta quan l'alumne:

- apunta una tasca amb informació suficient;
- planifica quan la farà;
- inicia una sessió;
- completa un bloc;
- marca una tasca com a feta;
- revisa i replanifica de manera realista.

Disminueix o canvia d'estat quan:

- hi ha tasques sense revisar durant diversos dies;
- l'alumne deixa una sessió oberta massa estona;
- acumula molta estona de treball sense pausa;
- passa el dia sense revisar el seu pla.

## 4.2. Nivells visuals inicials

- [ ] **Alt:** Piu actiu i content.
- [ ] **Mitjà:** Piu neutral i atent.
- [ ] **Baix:** Piu esperant o avorrit.
- [ ] **Sobrecàrrega:** Piu cansat; recomana descansar.
- [ ] **Dia tancat:** Piu dorm al niu.

## 4.3. Regles que cal evitar

- [ ] No perdre tota l'energia d'un dia per l'altre.
- [ ] No utilitzar vermell agressiu com a càstig.
- [ ] No mostrar Piu malalt, ferit o plorant per inactivitat.
- [ ] No obligar a entrar a l'aplicació per mantenir-lo “viu”.
- [ ] No premiar l'ús prolongat de pantalla.
- [ ] No crear competició pública d'energia entre alumnes.

---

# BLOC 5 · El niu i l'entorn

El niu ha de donar context a Piu sense convertir l'aplicació en un joc de decoració.

## 5.1. MVP del niu

- [ ] Crear un niu senzill i coherent amb l'estil de Piu.
- [ ] Utilitzar-lo com a lloc de descans i tancament del dia.
- [ ] Mostrar-lo en una zona secundària de la interfície.
- [ ] Fer que Piu hi dormi quan el pla està completat.
- [ ] Evitar una pantalla de casa complexa en la primera versió.

## 5.2. Evolució futura opcional

- [ ] Afegir una branca o arbre mínim.
- [ ] Fer aparèixer una fulla o flor per constància acumulada.
- [ ] Afegir petits objectes relacionats amb hàbits consolidats.
- [ ] Introduir variacions estacionals només si no compliquen el manteniment.
- [ ] Evitar compres, monedes o recompenses materials excessives.

---

# BLOC 6 · Llenguatge i missatges

## 6.1. To de veu

- [ ] Parlar en primera persona del plural quan tingui sentit: “comencem”, “ho tenim”.
- [ ] Utilitzar frases molt curtes.
- [ ] Mostrar comprensió davant dels canvis de pla.
- [ ] Normalitzar el descans i la replanificació.
- [ ] Evitar infantilitzar l'alumnat.
- [ ] Evitar exclamacions i celebracions constants.
- [ ] Reservar els missatges més intensos per a assoliments reals.

## 6.2. Reformulacions positives

| Evitar | Utilitzar |
|---|---|
| “No has estudiat.” | “Encara no hem començat.” |
| “Fa dies que no entres.” | “Fa dies que no coincidim.” |
| “Has perdut la ratxa.” | “Avui podem reprendre el ritme.” |
| “No has completat el pla.” | “Què replanifiquem?” |
| “Has treballat massa poc.” | “Fem un primer pas petit?” |
| “Continua estudiant.” | “Vols fer un bloc més o descansar?” |

## 6.3. Banc inicial de missatges

- [ ] Preparar entre 3 i 5 variants per cada situació.
- [ ] Evitar repetir exactament el mateix missatge cada dia.
- [ ] Associar cada missatge a un estat de Piu.
- [ ] Revisar el llenguatge amb alumnat real abans de tancar-lo.

---

# BLOC 7 · Lògica d'estats i integració tècnica

## 7.1. Definir un model d'estat centralitzat

- [ ] Crear un únic component o servei que decideixi quin Piu es mostra.
- [ ] Evitar condicions disperses per tota l'aplicació.
- [ ] Prioritzar estats quan coincideixen diverses condicions.
- [ ] Definir un estat de reserva segur: `base`.

### Exemple d'estats

```ts
type PiuState =
  | 'base'
  | 'saluda'
  | 'escriu'
  | 'planifica'
  | 'estudia'
  | 'content'
  | 'celebra'
  | 'espera'
  | 'cansat'
  | 'dorm';
```

## 7.2. Definir desencadenants

- [ ] Primera entrada del dia → `saluda`.
- [ ] Formulari de nova tasca o deures → `escriu`.
- [ ] Ordenació del pla → `planifica`.
- [ ] Temporitzador o sessió activa → `estudia`.
- [ ] Acció completada → `content`.
- [ ] Pla del dia completat → `celebra` i després `dorm`.
- [ ] Inactivitat moderada → `espera`.
- [ ] Sessió massa llarga → `cansat`.
- [ ] Horari nocturn o dia tancat → `dorm`.

## 7.3. Prioritat orientativa d'estats

Quan coincideixen diverses condicions:

1. necessitat de descans;
2. celebració immediata;
3. sessió d'estudi activa;
4. planificació o registre;
5. inactivitat;
6. salutació;
7. estat base.

- [ ] Documentar aquesta prioritat al codi.
- [ ] Evitar canvis ràpids i contradictoris d'una imatge a una altra.
- [ ] Establir una durada mínima per als estats transitoris.

## 7.4. Accessibilitat i rendiment

- [ ] Afegir text alternatiu descriptiu o marcar la imatge com a decorativa segons el cas.
- [ ] Respectar `prefers-reduced-motion`.
- [ ] Permetre desactivar animacions.
- [ ] Comprimir els PNG.
- [ ] Utilitzar SVG quan sigui possible.
- [ ] Fer càrrega diferida de variants no visibles.
- [ ] Evitar que Piu desplaci contingut o provoqui salts de layout.
- [ ] Comprovar contrast i llegibilitat dels globus de text.

---

# BLOC 8 · Animacions mínimes

Les primeres animacions han de ser subtils i reutilitzables.

## 8.1. Animacions assumibles

- [ ] Parpelleig ocasional.
- [ ] Inclinació lleu del cap.
- [ ] Petit moviment de respiració.
- [ ] Moviment curt d'una ala.
- [ ] Salt breu en completar una tasca.
- [ ] Entrada i sortida suau del globus de text.

## 8.2. Criteris

- [ ] No animar constantment tots els elements.
- [ ] Evitar sons automàtics.
- [ ] Limitar les celebracions intenses.
- [ ] No interrompre la lectura o l'escriptura.
- [ ] Utilitzar CSS abans d'introduir sistemes d'animació complexos.
- [ ] Deixar Lottie o animació avançada per a una fase posterior.

---

# BLOC 9 · Validació amb alumnat

## 9.1. Prova visual

- [ ] Mostrar el full de personatge a un grup reduït d'alumnes.
- [ ] Preguntar què creuen que sent o fa Piu en cada postura.
- [ ] Comprovar si totes les expressions s'interpreten correctament.
- [ ] Detectar si el personatge sembla massa infantil.
- [ ] Preguntar quines expressions els resulten motivadores o molestes.

## 9.2. Prova funcional

- [ ] Observar si Piu ajuda a identificar l'acció següent.
- [ ] Comprovar si els missatges interrompen massa.
- [ ] Revisar si la barra d'energia s'entén sense explicacions llargues.
- [ ] Confirmar que l'estat d'inactivitat no genera culpa.
- [ ] Comprovar si el cansament incentiva pauses saludables.
- [ ] Valorar si la celebració és proporcional a l'acció.

## 9.3. Preguntes de validació

- “Què creus que t'està dient Piu?”
- “Et sembla un company, un professor o un joc?”
- “Hi ha algun missatge que et faria sentir malament?”
- “Quina reacció t'ajudaria a començar?”
- “Quan creus que Piu hauria de descansar?”
- “Et distreu o t'ajuda?”

---

# BLOC 10 · Ordre de treball recomanat

## Fase 1 · Definició

- [ ] Validar aquest document.
- [ ] Tancar el disseny base de Piu.
- [ ] Definir colors, proporcions i estil.
- [ ] Decidir la ubicació de la mascota dins la interfície.

## Fase 2 · Paquet visual MVP

- [ ] Crear el full de personatge amb totes les variants inicials.
- [ ] Revisar la coherència entre postures.
- [ ] Separar cada postura.
- [ ] Exportar PNG transparents.
- [ ] Crear o vectoritzar els SVG quan sigui viable.
- [ ] Incorporar els arxius a `public/mascota/piu/`.

## Fase 3 · Integració estàtica

- [ ] Crear el component visual de Piu.
- [ ] Implementar els deu estats definits.
- [ ] Afegir missatges associats.
- [ ] Comprovar mides responsive.
- [ ] Implementar l'estat base de reserva.

## Fase 4 · Lògica de rutina

- [ ] Connectar Piu amb el registre de deures.
- [ ] Connectar Piu amb la planificació a casa.
- [ ] Connectar Piu amb les sessions d'estudi.
- [ ] Connectar Piu amb la finalització de tasques.
- [ ] Implementar l'estat de descans i el niu.

## Fase 5 · Energia

- [ ] Definir la fórmula inicial.
- [ ] Implementar els nivells visuals.
- [ ] Afegir límits per evitar penalitzacions excessives.
- [ ] Validar que fomenti descans i constància.
- [ ] Ajustar les regles amb dades d'ús reals.

## Fase 6 · Animació i poliment

- [ ] Afegir parpelleig i respiració.
- [ ] Afegir celebració breu.
- [ ] Implementar `prefers-reduced-motion`.
- [ ] Optimitzar els recursos visuals.
- [ ] Revisar accessibilitat.

## Fase 7 · Prova pilot

- [ ] Provar-ho amb un grup reduït.
- [ ] Recollir feedback específic sobre Piu.
- [ ] Ajustar missatges i freqüència d'aparició.
- [ ] Eliminar reaccions que distreguin o culpabilitzin.
- [ ] Decidir quins estats futurs mereixen ser creats.

---

# BLOC 11 · Definició de “fet” per a l'MVP

La primera versió de Piu es considerarà completada quan:

- [ ] existeixi un disseny base estable i documentat;
- [ ] hi hagi almenys les variants base, saluda, escriu, planifica, estudia, content, celebra, espera, cansat i dorm;
- [ ] cada variant tingui PNG transparent optimitzat;
- [ ] els arxius segueixin una convenció de noms coherent;
- [ ] Piu reaccioni a registrar, planificar, estudiar, completar i descansar;
- [ ] el sistema d'energia tingui regles simples i no culpabilitzadores;
- [ ] el niu aparegui com a estat de descans;
- [ ] els missatges siguin breus, variats i adequats per a secundària;
- [ ] les animacions es puguin reduir o desactivar;
- [ ] s'hagi fet almenys una prova amb alumnat real;
- [ ] el feedback de la prova pilot s'hagi documentat.

---

# Aparcament d'idees futures

Aquestes idees no formen part de l'MVP i només s'han de recuperar després de validar l'ús real:

- [ ] complements desbloquejables per constància;
- [ ] petites evolucions visuals del niu;
- [ ] decoració estacional;
- [ ] medalles o objectes simbòlics;
- [ ] més expressions emocionals;
- [ ] animacions Lottie;
- [ ] microsons opcionals;
- [ ] fulls d'adhesius o material imprès;
- [ ] personalització limitada de Piu;
- [ ] variants per assoliments especials.

---

## Resum de l'abast inicial

La primera versió ha de prioritzar:

1. un personatge coherent i recognoscible;
2. deu estats que responguin als moments reals d'ús;
3. missatges de companyia, no de control;
4. una energia que representi ritme i equilibri;
5. un niu senzill com a símbol de descans;
6. integració clara amb apuntar, planificar, estudiar, revisar i descansar.

> **Piu no premia passar més temps davant la pantalla. Premia organitzar-se, començar, avançar, revisar i saber descansar.**
