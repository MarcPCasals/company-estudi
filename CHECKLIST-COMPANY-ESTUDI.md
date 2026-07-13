# Checklist mestre - Company d'estudi

Treballarem **un bloc complet cada vegada** i no avançarem fins que estigui decidit, construït i comprovat.

## 1. Abast i fonament pedagògic

- [x] Definir l'eina com un entrenador d'autonomia, no una eina de vigilància.
- [x] Fixar el cicle: apuntar -> planificar -> fer -> revisar -> reajustar o demanar ajuda.
- [x] Separar avaluació formadora i qualificació acadèmica.
- [x] Tancar les competències tutorials: anticipació, descomposició, planificació realista, gestió del temps, regulació i ajuda; amb quatre nivells de progrés.
- [x] Definir una revisió setmanal breu i un feedback basat en observació, pregunta, estratègia i acord.
- [x] Fixar l'abast inicial: una tutoria, rols alumne/tutor i pilot de 6-8 setmanes amb el nucli funcional.

## 2. Rols, accés i privacitat

- [x] Tutor amb compte verificat.
- [x] Tutor crea la classe i dona d'alta els alumnes.
- [x] Alumne entra amb codi de classe i codi personal aleatori.
- [x] Separar espai personal, tutorial i comunitari.
- [x] El tutor veu informació acadèmica i patrons; no veu notes, extraescolars ni activitat en directe.
- [x] Definir i codificar la matriu inicial de permisos.
- [x] Fer els codis regenerables i revocables, invalidant sessions antigues.
- [x] Crear una primera validació de «Veure el meu perfil com el veu el tutor».
- [ ] Validar privacitat i tractament de dades abans del pilot real.

## 3. Assignatures i competències

- [x] Precarregar les assignatures d'EASEO.
- [x] Ignorar les àrees curriculars.
- [x] Utilitzar assignatures per a deures, calendari i sales.
- [x] Crear una sala independent per assignatura.
- [x] No utilitzar competències dins de les sales ni en deures normals.
- [ ] Permetre competències opcionals en exàmens o activitats grans.
- [ ] Confirmar el segon `C3` de Matemàtiques abans d'importar-les.

## 4. Base tècnica i model de dades

- [x] Connectar el repositori local amb GitHub.
- [x] Escollir i configurar Vite + React + JavaScript.
- [x] Mantenir una arquitectura Firebase Spark sense serveis de pagament.
- [x] Modelar classes, alumnes, assignatures, tasques, sessions, terminis, ocupacions i sales.
- [x] Separar tasca personal, proposta comunitària i tasca oficial.
- [x] Definir estats i historial de canvis.
- [x] Aplicar permisos a la base de dades, no només a la interfície.
- [x] Preparar sincronització, recuperació i funcionament amb mala connexió.
- [x] Configurar proves i desplegament.

## 5. Creació de classe i incorporació

- [x] Crear classe, assignatures i sales.
- [x] Afegir alumnes i generar codis.
- [x] Permetre optatives o sales amb membres diferents.
- [x] Crear el primer accés de l'alumne.
- [x] Explicar clarament què veu el tutor.
- [x] Configurar horari escolar, trajectes, extraescolars, descans i cap de setmana.
- [x] Gestionar codi perdut, canvi de dispositiu i canvi de classe.

## 6. Deures, treballs i exàmens

- [x] Crear «Afegir deure» ràpid: assignatura, descripció, data i abast.
- [x] Permetre data confirmada, per confirmar o sense data.
- [x] Afegir temps estimat, passos, material, notes privades i ajuda com a opcions.
- [x] Oferir `Planifica'l ara` després de desar.
- [x] Implementar els estats: per aclarir, pendent, planificat, en curs i fet.
- [x] Separar `Fet` de `Entregat`.
- [x] Permetre avanç parcial, reprogramació i data passada sense càstig.
- [x] Detectar duplicats sense fusionar-los automàticament.

## 7. Calendari i pantalla «Avui»

- [x] Mostrar per defecte només el temps útil fora de l'escola.
- [x] Dilluns, dimarts, dijous i divendres des de les 17 h; dimecres des de les 14 h.
- [x] Fer configurable el cap de setmana.
- [x] Separar terminis, sessions de treball i ocupacions personals.
- [x] Afegir extraescolars recurrents, trajectes, àpats i descans.
- [x] Proposar franges realistes sense omplir tot el temps lliure.
- [x] No moure ni afegir sessions sense confirmació.
- [x] Crear «Avui» amb: proper pas, línia temporal, entregues i tasques per planificar.
- [x] Crear la vista setmanal de dilluns a diumenge.
- [x] Adaptar-la a iPad horitzontal, iPad vertical i ordinador.

## 8. Espai del tutor i avaluació formadora

- [ ] Crear resum de classe amb peticions d'ajuda i excepcions útils.
- [ ] Crear calendari agregat de càrrega i terminis.
- [ ] Crear fitxa individual de l'alumne.
- [ ] Mostrar objectiu tutorial, revisions, evidències i feedback.
- [ ] Mostrar tendències explicables, mai una puntuació secreta.
- [ ] Permetre suggerir una sessió, però no editar el calendari de l'alumne.
- [ ] Crear avisos individuals, de grup i de classe amb to no culpabilitzador.

## 9. Comunitat i recordatoris col·lectius

- [ ] Crear sales amb dubtes, respostes, avisos, recursos i cercador.
- [ ] Mostrar bombolles de contingut nou i respostes directes.
- [ ] Permetre resposta útil, resposta validada i pregunta resolta.
- [ ] Afegir pregunta privada al tutor.
- [ ] Afegir moderació i denúncia; sense anonimat ni missatges privats entre alumnes.
- [ ] Detectar possibles deures comuns amb dades agregades.
- [ ] Utilitzar inicialment el llindar del 50% i un mínim de cinc alumnes.
- [ ] No mostrar qui l'ha apuntat o oblidat, ni afegir-lo automàticament.
- [ ] Permetre al tutor confirmar, corregir o descartar una tasca comuna.
- [ ] Configurar notificacions, resums i hores de silenci.

## 10. Gamificació i mascota

- [x] Premiar planificar, dividir, començar amb temps, reajustar i demanar ajuda.
- [x] No premiar crear moltes tasques, acumular minuts, notes o missatges.
- [x] Sense rànquings, càstigs ni mascota que mori o emmalalteixi.
- [ ] Definir XP, nivells, missions i constància setmanal flexible.
- [ ] Definir evolució i personalització de la mascota.
- [ ] Limitar accions repetides per evitar tasques falses.
- [ ] Crear missions cooperatives sense assenyalar ningú.
- [ ] Permetre reduir o desactivar la gamificació.

## 11. Validació funcional completa

- [ ] Provar l'alta de classe i l'accés amb codis.
- [ ] Provar el flux complet d'un deure i d'un examen.
- [ ] Provar calendari, extraescolars i reprogramació.
- [ ] Provar una proposta comunitària i una correcció de data.
- [ ] Provar un dubte a una sala i la moderació.
- [ ] Provar revisió setmanal i feedback tutorial.
- [ ] Provar els fluxos amb 5-8 alumnes i amb el tutor.
- [ ] Corregir problemes funcionals abans de decidir l'aspecte final.

## 12. Disseny visual i maquetació

> Aquest bloc va aquí perquè ja sabrem què ha de contenir cada pantalla, però encara no haurem construït la interfície definitiva.

- [ ] Explorar i comparar tres direccions visuals.
- [ ] Escollir una estètica juvenil, motivadora i no infantil.
- [ ] Definir colors d'assignatura configurables per alumne.
- [ ] Definir tipografia, icones, espais, targetes i estats.
- [ ] Dissenyar Avui, calendari, deures, comunitat, progrés i espai del tutor.
- [ ] Dissenyar la mascota i els elements de gamificació.
- [ ] Preparar iPad horitzontal, iPad vertical, ordinador i mòbil reduït.
- [ ] Garantir contrast, accessibilitat i informació no dependent només del color.
- [ ] Validar el prototip visual amb alumnes abans d'aplicar-lo a tota l'app.

## 13. Construcció, qualitat i pilot

- [ ] Construir blocs complets: dades, permisos, interfície i proves del mateix tema.
- [ ] Començar per accés i classe; continuar amb deures i calendari.
- [ ] Afegir després tutor, comunitat, avisos i gamificació.
- [ ] Aplicar el sistema visual aprovat.
- [ ] Provar permisos, privacitat, falsos positius i pèrdua de dades.
- [ ] Provar Safari a iPad i navegadors d'ordinador.
- [ ] Fer el pilot durant 6-8 setmanes.
- [ ] Recollir feedback d'alumnes i tutor.
- [ ] Decidir què es manté, es modifica o s'elimina abans d'ampliar l'eina.

## Després del pilot

- [ ] Valorar comptes institucionals, notificacions push i integracions.
- [ ] Valorar professorat de matèria amb permisos limitats.
- [ ] Valorar IA, repetició espaiada o plans d'estudi avançats.
- [ ] No afegir cap ampliació que distregui del nucli abans de validar-lo.
