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

- [x] Crear resum de classe amb peticions d'ajuda i excepcions útils.
- [x] Crear calendari agregat de càrrega i terminis.
- [x] Crear fitxa individual de l'alumne.
- [x] Mostrar objectiu tutorial, revisions, evidències i feedback.
- [x] Mostrar tendències explicables, mai una puntuació secreta.
- [x] Permetre suggerir una sessió, però no editar el calendari de l'alumne.
- [x] Crear avisos individuals, de grup i de classe amb to no culpabilitzador.

## 9. Comunitat i recordatoris col·lectius

- [x] Crear sales amb dubtes, respostes, avisos, recursos i cercador.
- [x] Mostrar bombolles de contingut nou i respostes directes.
- [x] Permetre resposta útil, resposta validada i pregunta resolta.
- [x] Afegir pregunta privada al tutor.
- [x] Afegir moderació i denúncia; sense anonimat ni missatges privats entre alumnes.
- [x] Detectar possibles deures comuns amb dades agregades.
- [x] Utilitzar inicialment el llindar del 50% i un mínim de cinc alumnes.
- [x] No mostrar qui l'ha apuntat o oblidat, ni afegir-lo automàticament.
- [x] Permetre al tutor confirmar, corregir o descartar una tasca comuna.
- [x] Configurar notificacions, resums i hores de silenci.

## 10. Gamificació i mascota

- [x] Premiar planificar, dividir, començar amb temps, reajustar i demanar ajuda.
- [x] No premiar crear moltes tasques, acumular minuts, notes o missatges.
- [x] Sense rànquings, càstigs ni mascota que mori o emmalalteixi.
- [x] Definir XP, nivells, missions i constància setmanal flexible.
- [x] Definir evolució i personalització de la mascota.
- [x] Limitar accions repetides per evitar tasques falses.
- [x] Crear missions cooperatives sense assenyalar ningú.
- [x] Permetre reduir o desactivar la gamificació general; aquesta preferència no desactiva l'XP propi de la Sala d'estudi.

## 11. Validació funcional completa

- [x] Provar l'alta de classe i l'accés amb codis.
- [x] Provar el flux complet d'un deure i d'un examen.
- [x] Provar calendari, extraescolars i reprogramació.
- [x] Provar una proposta comunitària i una correcció de data.
- [x] Provar un dubte a una sala i la moderació.
- [x] Provar revisió setmanal i feedback tutorial.
- [x] Provar els fluxos amb 5-8 alumnes i amb el tutor.
- [x] Corregir problemes funcionals abans de decidir l'aspecte final.

## 12. Disseny visual i maquetació

> Direcció 1 + 3 aprovada i aplicada. Queden dues validacions externes: les il·lustracions definitives del Piu i una prova curta amb alumnes.

- [x] Explorar i comparar tres direccions visuals.
- [x] Escollir una estètica juvenil, motivadora i no infantil.
- [x] Definir colors d'assignatura configurables per alumne.
- [x] Definir tipografia, icones, espais, targetes i estats.
- [x] Dissenyar Avui, calendari, deures, comunitat, progrés i espai del tutor.
- [x] Dissenyar els elements de gamificació i reservar l'espai de la mascota.
- [ ] Integrar les il·lustracions definitives del Piu quan estiguin disponibles.
- [x] Preparar iPad horitzontal, iPad vertical, ordinador i mòbil reduït.
- [x] Garantir contrast, accessibilitat i informació no dependent només del color.
- [ ] Validar el prototip visual amb alumnes abans del pilot.

## 13. Sala d'estudi i evolució de Piu

> La Sala d'estudi serà un entorn de concentració guiada. No premiarà les notes ni el temps acumulat passivament: reforçarà l'hàbit conscient de començar, mantenir la concentració i completar blocs curts d'estudi.

### 13.1. Propòsit i estructura de la sessió

- [x] Definir la Sala d'estudi com un espai guiat per crear hàbits, no com un simple cronòmetre.
- [x] Fixar per a la primera versió una sessió de `30 minuts d'estudi + 15 minuts de pausa + 30 minuts d'estudi`.
- [x] Reservar `45 + 15 + 45` com a modalitat avançada posterior, pendent de validar amb alumnes.
- [x] Definir els estats de la sessió: preparació, primer bloc, tancament del bloc, pausa, segon bloc i resum final.
- [x] Dissenyar una pantalla clara amb Piu, el temps restant, el bloc actual i una única acció principal.
- [x] Substituir el cronòmetre sempre visible per un marc verd circular que es buida, amb consulta opcional del temps durant 5 segons.
- [x] Mostrar Piu treballant al primer bloc, més concentrat al segon i alternar Música/Rubik durant la pausa.
- [x] Enfosquir suaument els laterals durant els blocs i celebrar-ne el final amb confeti accessible.
- [x] Permetre sortir voluntàriament de la sessió sense càstig ni missatges culpabilitzadors.

### 13.2. Final de bloc i experiència

- [x] Concedir experiència per completar conscientment cada bloc d'estudi, no per acumular minuts amb el cronòmetre obert.
- [x] No concedir experiència durant la pausa.
- [x] Fer que l'experiència de la Sala d'estudi sigui individual i desvinculada de notes i qualificacions; l'XP i l'evolució de Piu poden alimentar un podi públic de constància.
- [x] Concedir 4 XP en completar el primer bloc i 16 XP en completar el segon (inclou la bonificació de sessió completa): 20 XP per sessió completa.
- [x] Permetre tantes sessions d’estudi com l’alumne vulgui, amb un màxim de 40 XP al dia.
- [x] Si l’alumne ja ha completat una sessió aquell dia, demanar-li si es troba amb energia abans de començar-ne una altra i oferir-li descansar.
- [x] Permetre acabar després del primer bloc amb 4 XP, o abandonar un bloc a mitges sense XP ni penalització.
- [x] Afegir al final de cada bloc una confirmació breu, com ara `He acabat el bloc` i `Què has pogut avançar?`.
- [x] Tractar un bloc interromput sense XP complet, amb possibilitat de reprendre'l i sense penalització.
- [x] Crear un resum final amb els blocs completats, una observació breu de l'alumne i l'XP obtingut.
- [x] Mantenir sempre actiu l'XP de la Sala d'estudi perquè és el motor de l'evolució de Piu.
- [x] Permetre que el tutor vegi l'XP total i el nivell de cada alumne, però no el cronòmetre en directe ni les reflexions privades.
- [x] Mostrar a tota la classe només els 3 alumnes del podi i els 2 següents aspirants; no publicar la resta de la classificació.
- [x] Mostrar privadament a cada alumne la seva posició respecte de tota la classe i avisar-lo quan puja o baixa; amb el pla gratuït, el tutor recalcula automàticament aquestes posicions quan té oberta l'aplicació.

### 13.3. Evolució visual de Piu

- [x] Utilitzar l'experiència obtinguda a la Sala d'estudi per fer avançar l'evolució visual de Piu.
- [x] Utilitzar les il·lustracions d'`evolució Piu` disponibles al repositori com a estats visuals de progrés.
- [x] Fer que l'evolució representi constància i capacitat d'estudi, mai salut, tristesa o abandonament de la mascota.
- [x] Inventariar les 14 imatges d'evolució disponibles i associar cada etapa a un llindar d'XP.
- [x] Decidir que l'XP de la Sala d'estudi tindrà un comptador propi, separat de l'XP general de gamificació.
- [x] Mostrar de manera comprensible quant falta per arribar a la següent evolució, sense generar pressió.
- [x] Oferir, sense imposar-lo, el mode avançat `45 + 15 + 45` a partir del nivell 7 (`Piu adult`, 800 XP), mantenint sempre disponible el mode de 30 minuts.

### 13.4. Funcionament segur i fiable

- [x] Fer que el cronòmetre es basi en hores d'inici i final desades, perquè continuï sent correcte si es bloqueja l'iPad o es tanca la pestanya.
- [x] Definir què passa quan l'alumne perd la connexió, canvia de dispositiu o torna després d'una interrupció.
- [x] Evitar que dues pestanyes o dos dispositius comptabilitzin el mateix bloc dues vegades.
- [x] Afegir avisos opcionals de final de bloc i final de pausa, sense dependre obligatòriament del so.
- [x] Respectar `prefers-reduced-motion`, la navegació amb teclat, el contrast i la lectura clara del temps restant.
- [x] Garantir que el tutor no pugui veure activitat en directe; només, si es decideix, un resum posterior i pedagògicament útil.

### 13.5. Motor visual viu de Piu

> Piu tindrà dos sistemes visuals independents. Fora de la Sala d'estudi sempre serà el Piu adult amb emocions i reaccions. Les 14 evolucions per XP només apareixeran dins de la Sala d'estudi i als seus rànquings.

- [x] Separar explícitament el sistema d'emocions del sistema d'evolució per XP.
- [x] Decidir que les emocions generals utilitzaran sempre el Piu adult, independentment del nivell de Sala d'estudi.
- [x] Limitar les 14 imatges d'evolució a la Sala d'estudi, el seu resum de progrés i els rànquings de constància.
- [x] Inventariar les 29 imatges emocionals disponibles i descriure què comunica cadascuna.
- [x] Classificar-les en estats persistents (`repòs`, `estudiant`, `descansant`, `dormint`) i reaccions transitòries (`saluda`, `pensa`, `content`, `celebra`, `preocupat`).
- [x] Definir una taula única de desencadenants: pantalla, acció, condició, imatge, missatge, prioritat, durada mínima i estat de retorn.
- [x] Decidir exactament quan Piu pensa, està content, celebra, espera, es cansa o es preocupa.
- [x] Mostrar una de les dues reaccions de temps lliure quan la jornada ja ha acabat i no hi ha cap sessió ni ocupació en curs.
- [x] Excloure `enfadat`, `molest`, `decebut` i `molt-decebut-facepalm` de l'MVP perquè poden transmetre retret, judici o culpa.
- [x] Definir prioritats quan coincideixen diversos estats i evitar salts ràpids o contradictoris entre imatges.
- [x] Fixar durades mínimes, temps de refredament i límits de repetició perquè Piu sembli viu sense distreure.
- [x] Centralitzar la decisió emocional en un únic `resolvePiuVisualState(...)`, amb estat neutre de reserva i proves de les combinacions principals.
- [x] Revisar i ratificar per al pilot els 14 rangs d'XP de la Sala d'estudi, simulant tres ritmes d'ús diferents.
- [x] Mostrar en cada entrada del podi o rànquing la imatge evolutiva que correspon a l'XP d'aquell alumne.
- [x] Respectar animacions reduïdes, text alternatiu i preferències visuals sense perdre la informació funcional.
- [x] Documentar tota la lògica detallada a `docs/PIU-LOGICA-VIVA.md` abans d'implementar-la.

### 13.6. Validació

- [x] Simular automatitzadament el flux complet `30 + 15 + 30` i validar visualment l'inici de sessió en ordinador, iPad horitzontal i iPad vertical, sense desbordament horitzontal.
- [x] Provar pausa, recàrrega de la pestanya, recuperació al mateix segon, represa i abandonament sense penalització.
- [x] Verificar amb proves que la sessió local conserva l'hora final i es pot recuperar després de tancar o recarregar la pestanya.
- [ ] Repetir pausa, represa, dispositiu bloquejat i pèrdua de connexió en un iPad físic durant una sessió cronometrada completa.
- [x] Comprovar la protecció lògica contra XP duplicat: decisió idempotent i identificador únic estable per sessió i bloc.
- [x] Confirmar amb els emuladors Auth i Firestore que dues confirmacions simultànies del mateix bloc creen un únic registre i només concedeixen 4 XP una vegada.
- [x] Comprovar automàticament que les 14 evolucions de Piu canvien exactament als llindars definits.
- [ ] Validar amb alumnes si 30 minuts facilita començar i si la pausa de 15 minuts ajuda a reprendre el segon bloc.
- [ ] Decidir després del pilot si s'activa la modalitat avançada `45 + 15 + 45`.
- [ ] Validar que els alumnes interpreten correctament les emocions de Piu i que cap reacció genera culpa o confusió.
- [ ] Validar que l'evolució per XP té un ritme motivador durant les 6-8 setmanes del pilot.

> Resultats i límits de la comprovació registrats a `docs/qa/BLOC-13.6-VALIDACIO.md`.

## 14. Construcció i qualitat base

- [x] Construir blocs complets: dades, permisos, interfície i proves del mateix tema.
- [x] Començar per accés i classe; continuar amb deures i calendari.
- [x] Afegir després tutor, comunitat, avisos i gamificació.
- [x] Aplicar el sistema visual aprovat.
- [x] Provar permisos, privacitat, falsos positius i pèrdua de dades.
- [x] Provar el recorregut complet en navegador d'ordinador, sense errors de consola ni desbordament horitzontal.

## 15. Fiabilitat, adaptació a iPad i accessibilitat prepilot

> L'auditoria funcional de l'espai de l'alumne ha confirmat una base pedagògica i visual sòlida, però també problemes transversals que poden impedir un ús ràpid o generar desconfiança. Aquest bloc s'ha de completar abans de continuar simplificant pantalles o afegint funcions.

### 15.1. iPad vertical i disseny adaptable

- [x] Corregir el desbordament horitzontal de la pantalla inicial a `768 × 1024` i altres amplades intermèdies d'iPad.
- [x] Convertir l'òrbita de la pantalla inicial en una composició adaptable que mantingui visibles Piu, les sis entrades i els textos sense retalls.
- [x] Corregir el desbordament dels formularis i targetes de Deures, inclòs el botó de desar, en iPad vertical.
- [x] Revisar Avui, calendari, Comunitat, Progrés, Missatges, configuració i Sala d'estudi en iPad vertical, sense limitar la comprovació a l'inici i Deures.
- [x] Evitar qualsevol amplada mínima interna que provoqui desplaçament horitzontal de tota la pàgina.
- [x] Definir punts de ruptura específics per a mòbil, iPad vertical, iPad horitzontal i ordinador, sense franges intermèdies sense cobrir.
- [x] Garantir que les accions principals, el perfil i la sortida continuïn visibles o accessibles en totes les amplades.

### 15.2. Navegació i accessibilitat

- [x] Fer que la navegació principal mostri totes les seccions o adopti una barra inferior o un menú compacte quan no hi caben.
- [x] Donar un nom accessible a tots els botons d'icona del menú amb `aria-label` o text visualment ocult; no amagar l'única etiqueta amb `display: none`.
- [x] Mantenir visible l'estat actiu sense dependre només del color.
- [x] Garantir objectius tàctils mínims de 44 × 44 píxels i un ordre de focus coherent.
- [x] Provar navegació completa amb teclat, VoiceOver, zoom al 200% i `prefers-reduced-motion`.
- [x] Mesurar el contrast dels textos secundaris, placeholders, estats desactivats, insígnies i vores; no donar-lo per validat només visualment.

### 15.3. Notificacions i informació fiable

- [x] Eliminar el comptador fix de `2 continguts nous` de Comunitat.
- [x] Calcular les notificacions amb dades reals i marcar-les com a llegides quan l'alumne entra a la sala o al fil corresponent.
- [x] Evitar insígnies sobre la publicació pròpia o sobre la sala que l'alumne ja està llegint.
- [x] Revisar que tots els comptadors de Deures, Missatges, Comunitat i calendari coincideixin amb el contingut real.
- [x] Crear proves automàtiques dels comptadors buits, nous, llegits i actualitzats des d'un altre dispositiu.

> Validació del bloc 15 (15/07/2026): recorregut real de totes les vistes a `768 × 1024`, iPad horitzontal i amplada equivalent a zoom del 200%, sense desbordament ni errors de consola; navegació exposada amb noms accessibles i objectius de 44 px; 91 proves unitàries i 7 proves amb emuladors de Firebase superades.

## 16. Motor únic de planificació i «Planifica la setmana en 2 minuts»

> Aquesta és la millora funcional prioritària. Deures, Avui i Calendari han d'utilitzar un únic motor de disponibilitat. Cap pantalla podrà suggerir o confirmar una sessió que una altra pantalla consideri incompatible.

### 16.1. Unificar la planificació

- [x] Substituir la proposta fixa de `demà a les 17:30` de Deures per les franges realistes del motor de calendari.
- [x] Utilitzar el mateix validador en `Planifica-la ara`, `Reprograma`, Avui, calendari i suggeriments del tutor.
- [x] Bloquejar o advertir abans de confirmar una sessió que se solapa amb escola, trajecte, descans, àpat, extraescolar, altra ocupació o altra sessió.
- [x] Respectar sempre el final del dia, el marge entre activitats, el descans mínim i el temps lliure que l'alumne ha decidit conservar.
- [x] Tornar a calcular propostes quan canvia una ocupació, un termini, una estimació o una sessió.
- [x] Provar explícitament el cas detectat a l'auditoria: descans de `17:15–17:45` i intent de sessió a les `17:30`.

### 16.2. Coherència d'Avui i Calendari

- [x] Corregir la contradicció entre `0 tasques per planificar` i l'existència d'una tasca pendent de planificació.
- [x] Mostrar un valor real al costat de `Temps d'estudi previst avui` o eliminar l'etiqueta quan no hi ha dada.
- [x] Situar trajectes, descansos i sessions a l'hora correcta de la línia temporal; no mostrar un bloc de les `14:00` sota l'eix de les `17:00`.
- [x] Quan l'alumne demana franges, mostrar el resultat dins de la zona visible, moure-hi el focus i anunciar-lo de manera accessible.
- [x] Diferenciar més clarament una sessió de treball del termini d'entrega de la mateixa tasca.
- [x] Afegir avisos visibles de solapament i de dies sobrecarregats al calendari setmanal.
- [x] Mostrar càrrega planificada i disponibilitat real per dia, per exemple `45 min planificats de 90 min disponibles`.
- [x] Permetre obrir la tasca corresponent directament des d'una sessió o un termini del calendari.

### 16.3. Planifica la setmana en 2 minuts

- [x] Crear una entrada clara `Planifica la setmana en 2 minuts` des d'Inici, Avui o Calendari.
- [x] Agrupar totes les tasques pendents de planificar i ordenar-les per termini, importància i incertesa.
- [x] Calcular la capacitat real de la setmana a partir de l'horari escolar, trajectes, descans, ocupacions, sessions existents i temps lliure protegit.
- [x] Proposar una distribució setmanal completa, no només una franja per a una tasca.
- [x] Dividir treballs llargs i preparació d'exàmens en diverses sessions repartides en dies diferents.
- [x] Presentar dues o tres alternatives quan no hi ha una única distribució clarament millor.
- [x] Permetre confirmar, moure, escurçar o descartar cada bloc abans de desar el conjunt.
- [x] No crear ni moure cap sessió fins a la confirmació explícita de l'alumne.
- [x] Mostrar de manera comprensible per què s'ha proposat cada franja: termini, disponibilitat, descans respectat i marge conservat.
- [x] Detectar quan la càrrega no cap realment i ajudar a prioritzar, dividir, demanar ajuda o renegociar un termini; no presentar un pla impossible.
- [x] Si una sessió no es completa, oferir l'endemà un reajustament del pla sense penalització ni missatge culpabilitzador.
- [x] Permetre tornar a executar el planificador després d'un canvi i mostrar què es manté i què es proposa moure.
- [x] Crear proves de setmanes buides, normals, sobrecarregades, amb examen, amb treball llarg i amb diverses ocupacions.

### 16.4. Captura ràpida i preparació d'activitats grans

- [x] Valorar una `Bústia ràpida` per apuntar en una línia una dada incompleta, com `Mates, exercicis 4–8, dijous`, i completar-ne els detalls després.
- [x] Fer que la bústia mai inventi assignatura, termini o durada quan la informació és ambigua.
- [x] Crear un flux específic per a exàmens i treballs que pregunti què cal preparar, quants passos hi ha i en quants dies convé repartir-ho.
- [x] Connectar els passos d'un treball o examen amb les sessions distribuïdes del planificador setmanal.

> Validació del bloc 16 (15/07/2026): pla de 120 minuts dividit en dos dies i confirmat en navegador a `768 × 1024`, sense desbordament ni errors de consola; cap sessió creada abans de confirmar; 97 proves unitàries i 7 proves amb emuladors de Firebase superades.

## 17. Simplificació del recorregut diari de l'alumne

> L'objectiu d'aquest bloc és reduir decisions i desplaçaments, no eliminar les opcions avançades. Cada pantalla haurà de tenir una acció principal clara i mostrar la resta només quan sigui necessària.

### 17.1. Inici orientat al següent pas

- [x] Convertir la pantalla inicial en una resposta clara a `Què em convé fer ara?`.
- [x] Crear una targeta principal i adaptable de `Següent pas` amb una única acció: començar, planificar, revisar, reajustar, demanar ajuda o descansar.
- [x] Evitar repetir la mateixa tasca simultàniament a Avui, Deures, Radar i Propera sessió.
- [x] Fer que Piu reforci la decisió principal en lloc de donar un missatge que pugui contradir una entrega o una sessió pròxima.
- [x] Reduir o amagar automàticament els blocs buits de feedback, missatges o activitat.
- [x] Donar més prioritat visual a una tasca urgent o no planificada que a una secció sense novetats.
- [x] Mantenir accés ràpid a totes les seccions sense perdre la jerarquia del següent pas.

### 17.2. Deures més ràpids i menys carregats

- [x] Tancar per defecte el formulari de creació i obrir-lo amb `+ Apunta una tasca`.
- [x] Canviar l'etiqueta `Abast` per `Tipus`.
- [x] Fer opcional l'hora exacta d'entrega i utilitzar una hora final del dia només com a detall intern quan no s'ha indicat.
- [x] Després de desar, mostrar una sola invitació a planificar; eliminar crides duplicades de `Planifica-la ara`.
- [x] Mostrar una única acció principal segons l'estat: planificar, començar, actualitzar l'avanç, reprendre o completar.
- [x] Revisar la redundància entre `Comença`, el selector percentual i `Marca com a feta`.
- [x] Mantenir estimació, passos, material, nota privada, ajuda i aclariments com a opcions progressives.
- [x] Prioritzar la llista de tasques per sobre del formulari quan ja hi ha contingut.
- [x] Reduir les targetes contextuals grans de Piu a Deures i Calendari quan només mostren un estat neutre; reservar l'espai ampli per a missatges que realment ajudin a decidir.
- [x] Afegir ordenació i filtres útils per termini, assignatura, estat i necessitat d'ajuda, sense convertir-los en una barra permanent massa complexa.

### 17.3. Configuració personal més comprensible

- [x] Separar `El meu temps` de `Aparença i colors`.
- [x] Prioritzar trajecte, descans, disponibilitat i ocupacions en el primer accés; deixar els colors per a una personalització posterior.
- [x] Permetre aplicar una ocupació recurrent a diversos dies sense crear-la repetidament.
- [x] Permetre duplicar una ocupació i editar-ne només el dia o l'hora.
- [x] Detectar solapaments entre ocupacions abans de desar.
- [x] Mostrar una previsualització setmanal de la disponibilitat resultant, com ara `Dilluns pots estudiar de 19:15 a 21:30`.
- [x] Mantenir el botó de desar accessible sense haver de recórrer tota la pàgina.

### 17.4. Revisió diària mínima

- [x] Valorar una revisió de 30 segons al final del dia amb tres sortides: `fet`, `ho reajusto` o `necessito ajuda`.
- [x] Utilitzar-la per actualitzar el pla de l'endemà, no per crear una puntuació o una ratxa.
- [x] No mostrar-la si aquell dia no hi havia cap tasca o sessió prevista.

> Validació del bloc 17 (15/07/2026): recorregut real d'Inici, Deures i Configuració a `768 × 1024`, sense desbordament ni errors de consola; solapaments bloquejats abans de desar; 99 proves unitàries i 7 proves amb emuladors de Firebase superades.

## 18. Progrés, missatges, Comunitat i coherència de l'XP

### 18.1. Separar progrés, missatges i revisió

- [x] Fer que `Missatges del tutor` obri directament el canal privat i no el començament de la pantalla de gamificació.
- [x] Separar clarament `Hàbits i progrés`, `Missatges` i `Revisió setmanal`, amb pantalles, pestanyes o ancoratges accessibles.
- [x] Mantenir el feedback del tutor al costat dels missatges i acords tutorials, no enterrat sota preferències de Piu.
- [x] Plegar o traslladar les preferències de gamificació a configuració.
- [x] Ocultar selectors sense opcions reals, com ara complements de Piu quan només existeix `Sense complement`.
- [x] Simplificar la revisió setmanal amb respostes ràpides i un únic camp opcional, mantenint la possibilitat d'una reflexió més llarga.
- [x] Enllaçar la missió `Mira enrere per avançar` directament amb la revisió corresponent.

### 18.2. Explicar els dos sistemes d'experiència

- [x] Diferenciar textualment i visualment `XP d'hàbits` i `XP de Sala d'estudi`.
- [x] Explicar per què un alumne pot tenir, per exemple, `20 XP d'hàbits` i `0 XP de Sala d'estudi` sense haver perdut cap progrés.
- [x] Corregir el text que afirma que tots els XP són privats: només els XP generals ho són; els XP de Sala d'estudi poden aparèixer al podi i als aspirants.
- [x] Repetir la mateixa explicació de privacitat a Progrés, Sala d'estudi i configuració.
- [ ] Validar amb alumnes que entenen la diferència sense necessitar una explicació del tutor.

### 18.3. Comunitat útil des del primer dia

- [x] Crear una vista inicial `Activitat recent` que agrupi fils de les sales accessibles.
- [x] Afegir filtres `Els meus dubtes`, `Sense resposta`, `Resolts` i, si aporta valor, `Recursos`.
- [x] Permetre cercar a totes les sales o deixar clar quan la cerca només afecta la sala actual.
- [x] Evitar que tretze sales buides siguin la primera experiència; destacar només sales amb activitat o assignatures de l'alumne.
- [x] Fer determinista la sala inicial i recordar l'última sala visitada.
- [x] Mantenir el formulari de dubte plegat i la conversa en una vista separada, tal com ja està plantejat.

> Validació tècnica del bloc 18 (15/07/2026): recorregut real com a alumne per Missatges, Revisió, Progrés i Comunitat a `768 × 1024`, sense desbordament horitzontal ni errors de consola; 99 proves unitàries i 7 proves amb emuladors de Firebase superades. La validació de comprensió dels dos XP amb alumnes es manté pendent per al pilot del bloc 20.

## 19. Sala d'estudi més flexible i immersiva

- [x] Afegir una modalitat inicial curta, com `20–25 minuts`, o una sessió d'un únic bloc, sense eliminar el format `30 + 15 + 30`.
- [ ] Validar amb alumnes si la sessió mínima actual de 75 minuts dificulta començar.
- [x] Revisar si el mode avançat `45 + 15 + 45`, de 105 minuts totals, és pedagògicament convenient abans d'activar-lo.
- [x] Seleccionar per defecte la pròxima tasca planificada o urgent, mantenint `Estudi lliure` com a alternativa.
- [x] Ocultar la navegació global, el perfil i les notificacions durant un bloc de concentració; conservar només pausa i sortida segura.
- [x] Canviar `Interromp el bloc` per `Pausa el bloc` i mantenir l'explicació de represa sense penalització.
- [x] Reduir o plegar el podi abans de començar perquè l'objectiu i la preparació continuïn sent la decisió principal.
- [x] Mostrar el rànquing i l'evolució amb més protagonisme al resum o entre sessions, no durant el focus.
- [x] Mantenir el cronòmetre ocult, el marc verd, les transicions suaus, el diàleg de sortida i la celebració accessible.
- [x] Comprovar el recorregut curt, normal i avançat amb tasca planificada, estudi lliure, pausa, abandonament i represa.

> Decisió del mode avançat: es conserva com a opció voluntària desbloquejada a partir de 800 XP, mai com a recomanació inicial; el text recorda que només convé triar-lo si l'alumne té energia. Validació tècnica del bloc 19 (15/07/2026): modalitats `25`, `30 + 15 + 30` i `45 + 15 + 45`; selecció automàtica de tasca planificada; focus immersiu, pausa, represa i sortida segura comprovats a `768 × 1024`, sense desbordament ni errors de consola. La validació amb alumnes sobre la barrera dels 75 minuts es manté pendent per al pilot del bloc 20.

## 20. Validació final i pilot

> No iniciar el pilot fins que els blocs 15–19 estiguin construïts i comprovats en proporció al risc. Les millores s'han agrupat expressament per evitar moltes iteracions petites.

- [x] Fer una auditoria de regressió completa del cicle `apuntar -> planificar -> fer -> revisar -> reajustar o demanar ajuda`.
- [x] Comprovar que una mateixa tasca manté estat, termini i sessió coherents a Inici, Deures, Avui, Calendari, Sala d'estudi i vista del tutor.
- [x] Provar setmanes normals, buides i sobrecarregades amb diferents horaris i ocupacions.
- [x] Provar el recorregut complet en ordinador, iPad horitzontal i iPad vertical, sense retalls ni desbordament horitzontal.
- [ ] Provar Safari en un iPad físic.
- [ ] Fer una prova d'accessibilitat amb teclat, VoiceOver, zoom i moviment reduït.
- [ ] Validar amb un grup petit si poden apuntar una tasca, planificar-la i trobar el següent pas sense explicació del tutor.
- [ ] Validar específicament `Planifica la setmana en 2 minuts` i observar si redueix temps, errors i sensació de càrrega.
- [ ] Fer el pilot durant 6-8 setmanes.
- [ ] Recollir feedback d'alumnes i tutor per pantalla i per flux, no només una valoració general.
- [ ] Decidir què es manté, es modifica o s'elimina abans d'ampliar l'eina.

> Validació tècnica del bloc 20 (15/07/2026): recorregut complet auditat amb captures a ordinador i simulació d'iPad vertical i horitzontal; coherència de la mateixa tasca comprovada entre Inici, Deures, Avui, Calendari, Sala d'estudi i vista del tutor. S'han corregit l'avís de planificació que quedava obsolet i la informació d'estat/sessió de la vista del tutor. Els casos de setmana buida, normal i sobrecarregada també tenen cobertura de domini automatitzada. Informe i evidències: `docs/qa/BLOC-20-VALIDACIO-FINAL-I-PILOT.md`. La prova física amb Safari, la passada manual completa d'accessibilitat i totes les validacions amb alumnes continuen pendents.

## 21. Missatges intel·ligents i alertes pedagògiques

> Els missatges intel·ligents han d'ajudar l'alumne quan encara és a temps d'actuar. No poden convertir-se en vigilància, pressió ni una successió de notificacions. S'implementaran per capes: primer el motor segur i explicable; després els casos prioritaris; finalment els suggeriments avançats, només si el pilot demostra que aporten valor.

### 21.1. Motor únic, prioritats i proteccions

- [ ] Crear un motor únic que rebi el context de tasques, terminis, exàmens, sessions, disponibilitat, ocupacions, revisions, peticions d'ajuda i activitat agregada de la classe.
- [ ] Definir una fitxa per a cada missatge amb: identificador, destinatari, condició exacta, dades necessàries, nivell, prioritat, text, explicació, accions, lloc on apareix, freqüència màxima, caducitat i condició de resolució.
- [x] Classificar els missatges en `suggeriment`, `recordatori`, `alerta` i `petició d'ajuda`, sense utilitzar un to d'alarma quan només hi ha una recomanació.
- [x] Resoldre els conflictes de prioritat perquè una alerta important no quedi amagada sota una felicitació o un recordatori menor.
- [x] Mostrar un màxim reduït de missatges alhora i establir temps de refredament per evitar repeticions i fatiga.
- [x] Permetre `Ara no`, `Recorda-m'ho més tard`, `No és per a mi` o `No ho tornis a mostrar` quan sigui pedagògicament segur.
- [ ] Fer que cada missatge desaparegui tan bon punt l'acció ja s'ha fet, la dada ha canviat o ha passat el moment útil.
- [x] No treure XP, crear ratxes negatives, culpabilitzar ni penalitzar per ignorar, ajornar o descartar un missatge.
- [x] Explicar breument per què apareix una recomanació i quines dades l'han activada.
- [x] No executar canvis de calendari, crear tasques ni iniciar sessions sense confirmació explícita de l'alumne.
- [ ] Respectar la preferència horària, el descans, el temps lliure protegit, el moviment reduït i les opcions de notificació.
- [x] Separar els missatges dins de l'aplicació de futures notificacions push; la primera versió funcionarà sense push.
- [x] Desar només l'estat mínim necessari: mostrat, ajornat, descartat, acceptat o resolt; evitar historials de vigilància innecessaris.
- [x] Permetre al tutor conèixer peticions d'ajuda i patrons pedagògics justificats, però no cada suggeriment privat ni cada clic de l'alumne.

### 21.2. Primera versió prioritària

- [x] Recordar la revisió setmanal el diumenge a partir de les `18:00` si encara no està feta, amb `Fes la revisió`, `Recorda-m'ho més tard` i `Aquesta setmana no`.
- [x] No recordar la revisió si ja està feta o si aquella setmana no hi havia cap tasca ni sessió prevista.
- [x] Detectar diumenge al vespre o dilluns al matí una setmana amb tasques però sense sessions i oferir `Planifica la setmana en 2 minuts`.
- [ ] Avisar quan un canvi de termini, una tasca llarga o un examen afecta un pla ja confirmat i permetre revisar només les franges afectades.
- [ ] Detectar quan la càrrega estimada no cap dins del temps real i oferir prioritzar, dividir o demanar ajuda, sense presentar un pla impossible.
- [x] Avisar d'una sessió prevista que no s'ha pogut fer i permetre `Reprograma`, `Ja l'he feta` o `Descarta-la`, sense parlar de fracàs.
- [x] Detectar una tasca urgent que encara està al `0%` i proposar una sessió curta o una altra franja realista.
- [x] Detectar quan el temps restant estimat ja no cap abans del termini i oferir reorganitzar, simplificar passos o demanar ajuda.
- [ ] Detectar una tasca començada però bloquejada durant diversos dies i oferir dividir el següent pas, fer una Sala curta o demanar ajuda.

### 21.3. Preparació progressiva d'exàmens

- [x] Set dies abans d'un examen sense preparació definida, preguntar què cal preparar i oferir dividir-ho en temes, exercicis, apunts, dubtes i sessions.
- [x] Tres dies abans, si encara queda preparació, recomanar una Sala curta de `25 minuts` o buscar una altra franja.
- [ ] Dos dies abans, recomanar una sessió normal de `75 minuts` només si queda prou feina, hi ha disponibilitat real i el dia no està carregat.
- [x] Oferir dividir els `75 minuts` en dues sessions curtes quan sigui més saludable o realista.
- [x] Un dia abans, prioritzar un repàs essencial, revisar dubtes i preparar material; no suggerir intentar recuperar tota la preparació pendent.
- [ ] Reconèixer quan la preparació prevista ja és suficient i oferir repàs breu o descans en lloc de recomanar sempre més estudi.
- [ ] Adaptar totes les recomanacions a les sessions ja completades, al progrés real, a l'energia indicada i a la disponibilitat de l'alumne.
- [x] No recomanar automàticament el mode avançat de `105 minuts`; conservar-lo com a decisió voluntària segons les regles de la Sala.

### 21.4. Detecció comunitària de possibles tasques

- [x] Detectar una possible tasca comuna només quan un llindar mínim, inicialment tres alumnes de la mateixa classe, registra informació prou semblant d'assignatura, contingut i termini.
- [x] Mostrar a l'alumne que no la té: `Diversos companys han apuntat una possible tasca... Comprova si també la tens`, sense presentar-la com a informació oficial.
- [ ] Oferir `Sí, afegeix-la`, `No és per a mi` i `Necessito confirmar-ho`; no crear-la automàticament.
- [x] No revelar quins alumnes l'han apuntada ni permetre deduir-ho a partir del missatge.
- [ ] Agrupar formulacions semblants per evitar avisos duplicats sobre els mateixos deures.
- [x] Permetre descartar definitivament una proposta que no correspon a l'alumne.
- [x] No concedir XP per originar o confirmar aquestes propostes, per no incentivar entrades falses.
- [ ] Definir normalització i similitud prudents; davant del dubte, no fusionar tasques diferents.
- [x] Detectar informació contradictòria sobre termini, exercicis, material o abast i mostrar-la a l'alumne com una dada que cal confirmar.
- [ ] Oferir davant d'una contradicció `Pregunta a la Comunitat`, `Marca-ho com a dubte` o `Pregunta al tutor`.
- [x] Crear també una alarma visible al tutor quan aparegui informació contradictòria, amb l'assignatura, les versions agregades i el nombre de coincidències, però sense assenyalar alumnes.
- [ ] Permetre que el tutor confirmi la versió correcta, indiqui que no disposa de la informació o tanqui l'alarma com a no aplicable.
- [ ] Propagar la confirmació del tutor com una correcció clara als alumnes afectats, sense sobreescriure les seves dades sense permís.

### 21.5. Seguiment diari, terminis i organització

- [x] Avisar discretament `15–30 minuts` abans d'una sessió i oferir preparar el material, sense exigir començar-la.
- [ ] Detectar un dia massa carregat, massa sessions seguides o un final posterior a l'hora límit i proposar moure una sessió.
- [ ] Quan es cancel·li una ocupació i aparegui una franja lliure, oferir una tasca urgent però mantenir sempre l'opció explícita `Conserva el temps lliure`.
- [ ] Quan passi un termini sense confirmació, preguntar si la tasca s'ha entregat, s'ha de reprogramar o necessita ajuda; no marcar-la automàticament com a no feta.
- [ ] Quan coincideixin diverses tasques urgents, proposar una prioritat i explicar-la per termini, marge, durada i importància.
- [x] Recordar el material necessari abans d'una sessió només quan la tasca tingui material registrat.
- [x] Detectar una tasca llarga sense passos i oferir dividir-la abans de planificar-la.
- [ ] Tornar a mostrar un dubte o una petició d'ajuda sense resoldre quan s'apropi el termini i facilitar escriure al tutor.
- [ ] Detectar elements incomplets de la Bústia ràpida i oferir completar assignatura, termini o durada sense inventar dades.

### 21.6. Descans, benestar i reforç positiu

- [ ] Després de dues sessions completades el mateix dia, preguntar per l'energia abans de suggerir-ne una altra.
- [ ] Alertar quan una sessió acabaria més tard del límit personal i buscar una altra franja.
- [ ] Detectar plans sense descans suficient entre escola i estudi i oferir conservar un marge saludable.
- [ ] Mostrar `Has completat el que havies planificat per avui. La resta pot esperar` quan realment ja no queda cap acció necessària.
- [ ] Utilitzar felicitacions escasses i descriptives sobre conductes útils: començar amb dies de marge, reajustar abans d'una urgència, respectar descansos, dividir una tasca o demanar ajuda a temps.
- [ ] No felicitar per estudiar més hores, competir amb altres alumnes o mantenir ratxes; no comparar el comportament individual amb el de la classe.
- [ ] Revisar tots els textos amb alumnes per comprovar que cap missatge transmet culpa, diagnòstic, judici o pressió excessiva.

### 21.7. Alertes i patrons útils per al tutor

- [ ] Mostrar al tutor les peticions d'ajuda explícites i els dubtes que continuen oberts quan s'apropa el termini.
- [ ] Alertar el tutor quan diversos alumnes acumulen el mateix dubte sobre una tasca o examen.
- [x] Alertar el tutor quan existeixi informació contradictòria sobre una tasca, encara que cap alumne hagi demanat ajuda explícitament.
- [ ] Mostrar patrons agregats quan una part rellevant de la classe indica que la càrrega setmanal no cap en el temps disponible.
- [ ] Detectar tasques amb diversos reajustaments sense avanç i presentar-les com a possible necessitat d'acompanyament, no com a falta de compromís.
- [ ] Mostrar patrons agregats de planificació massa tardana o de manca de marge abans d'un examen.
- [ ] Avisar quan una part significativa de la classe encara no ha pogut planificar la preparació d'un examen pròxim.
- [ ] Fer que cada alarma del tutor indiqui el motiu, la quantitat d'alumnes afectats, les accions possibles i quan es considerarà resolta.
- [x] No mostrar al tutor cronòmetres en directe, reflexions privades, missatges descartats ni una cronologia de vigilància individual.

### 21.8. Missatges avançats reservats per a una fase posterior

> Aquests casos queden documentats des d'ara però no entraran a la primera iteració. Només s'activaran després de validar el motor, la freqüència i la comprensió dels missatges prioritaris.

- [ ] Valorar recordatoris contextuals basats en canvis de rutina, cancel·lacions o disponibilitat inesperada després del primer pilot.
- [ ] Valorar recomanacions més fines segons estimació restant, energia declarada i historial recent, sense crear perfils opacs ni diagnòstics.
- [ ] Valorar resums intel·ligents per al tutor que agrupin tendències setmanals, sempre amb llindars mínims i dades agregades.
- [ ] Valorar notificacions push opcionals només quan els missatges dins de l'aplicació ja hagin demostrat utilitat i no generin fatiga.
- [ ] Valorar comptes institucionals o integracions amb calendaris i plataformes oficials abans de considerar qualsevol dada externa com a font confirmada.
- [ ] No incorporar IA generativa per decidir prioritats o redactar alertes personals fins que existeixin regles deterministes, explicables i auditables.

### 21.9. Proves, desplegament gradual i criteris de decisió

- [ ] Crear proves unitàries per a cada desencadenant, prioritat, caducitat, ajornament, resolució i límit de freqüència.
- [ ] Provar dates i hores límit, inclosos diumenge a les `18:00`, canvis de dia, zona horària, períodes sense classe i vacances.
- [ ] Provar exàmens a set, tres, dos i un dia amb preparació buida, parcial, suficient i amb un dia sobrecarregat.
- [ ] Provar coincidències comunitàries reals, falsos positius, duplicats, contradiccions i intents d'abús.
- [x] Provar els permisos amb emuladors perquè cap alumne pugui veure identitats, dades privades o alarmes internes del tutor.
- [ ] Verificar que alumne i tutor reben la versió correcta de l'alerta contradictòria i que la resolució es propaga de manera segura.
- [ ] Provar teclat, VoiceOver, zoom, moviment reduït i anuncis accessibles quan apareix o canvia un missatge.
- [ ] Activar primer els missatges prioritaris amb un grup petit i registrar utilitat, comprensió, accions, ajornaments, descartaments i queixes de freqüència.
- [ ] Mesurar si els missatges ajuden a començar abans, reajustar amb temps i demanar ajuda; no utilitzar més temps dins de l'aplicació com a indicador d'èxit.
- [ ] Permetre desactivar per tipus els suggeriments no essencials durant el pilot.
- [ ] Revisar cada missatge després de 6–8 setmanes i decidir `mantenir`, `modificar`, `reduir freqüència` o `eliminar`.
- [ ] Activar els missatges avançats només després d'una decisió explícita basada en el pilot.

> Primera iteració tècnica del bloc 21 (15/07/2026): motor determinista amb quatre nivells, priorització, màxim de dos missatges simultanis, explicació del motiu, ajornament de tres hores i descartament privat; recordatori setmanal, setmana sense planificar, sessions perdudes, risc de termini i preparació progressiva d'exàmens. La detecció comunitària s'activa a partir de tres alumnes, no revela identitats i incorpora contradiccions agregades publicables pel tutor. 111 proves unitàries i 11 proves amb emuladors superades. Els punts no marcats continuen reservats per a la següent iteració o per al pilot.

## 22. Cotutoria i accés compartit a una classe

> El creador de la classe serà el `tutor responsable` i podrà convidar un altre docent com a `cotutor` mitjançant el seu correu. Tots dos treballaran sobre la mateixa classe i les mateixes dades dels alumnes: no es crearà cap còpia ni una classe paral·lela. Aquest bloc requereix autenticació docent, regles de permisos i una validació específica de privacitat abans d'activar-lo.

### 22.1. Model de propietat i rols

- [x] Mantenir un únic `tutor responsable`, que serà el docent creador de la classe.
- [x] Afegir el rol `cotutor` com a membre docent autoritzat de la mateixa classe.
- [x] Fer que tutor responsable i cotutor vegin la mateixa llista d'alumnes, fitxes, tasques, planificació, progrés, missatges, revisions i alertes pedagògiques autoritzades.
- [x] Garantir que les accions dels dos docents modifiquin les mateixes dades i apareguin a l'altre sense duplicacions.
- [x] No duplicar la classe, els alumnes, els codis d'accés, els fils, els XP ni les sessions quan s'afegeixi un cotutor.
- [x] Reservar al tutor responsable la gestió dels cotutors, la transferència de propietat i l'eliminació definitiva de la classe.
- [x] Decidir explícitament si el cotutor pot afegir o eliminar alumnes, regenerar codis, modificar la configuració general i exportar dades.
- [x] Permetre ampliar en el futur a més d'un cotutor sense haver de redissenyar el model, però limitar la primera versió a un cotutor si simplifica la validació.

### 22.2. Invitació segura per correu

- [x] Crear l'acció `Convida un cotutor` només per al tutor responsable.
- [x] Demanar el correu del docent, mostrar-lo per confirmar i evitar invitacions accidentals per errors tipogràfics.
- [x] Normalitzar el correu i impedir convidar el mateix compte, un correu ja vinculat o duplicar una invitació pendent.
- [x] Crear una invitació amb estat `pendent`, `acceptada`, `rebutjada`, `caducada` o `revocada`.
- [x] No concedir accés a les dades de la classe fins que el docent convidat iniciï sessió amb el mateix correu i accepti explícitament.
- [x] Mostrar al docent convidat el nom de la classe, el tutor responsable i l'abast de l'accés abans d'acceptar.
- [x] Permetre rebutjar la invitació sense crear cap relació ni revelar informació dels alumnes.
- [x] Fer caducar les invitacions després d'un termini raonable i permetre al tutor responsable reenviar-les o revocar-les.
- [x] Valorar restringir les invitacions a comptes institucionals o dominis autoritzats abans d'un desplegament real al centre.
- [x] No indicar si un correu extern existeix al sistema més enllà del necessari per completar la invitació.

### 22.3. Experiència compartida dels docents

- [x] Mostrar clarament a la capçalera de la classe qui és el tutor responsable i qui és el cotutor.
- [x] Fer que el cotutor trobi la classe compartida al seu inici, diferenciada de les classes creades per ell.
- [x] Permetre canviar entre classes pròpies i compartides sense tornar a iniciar sessió.
- [ ] Mostrar en modificacions sensibles quin docent ha fet el canvi i quan, sense convertir-ho en un registre de vigilància excessiu.
- [x] Sincronitzar en temps real les actualitzacions rellevants perquè dos docents no treballin amb versions incoherents.
- [ ] Detectar edicions simultànies de la mateixa dada i evitar que una actualització silenciosa n'esborri una altra.
- [x] Fer que els missatges privats amb alumnes indiquin quin docent respon, mantenint un únic fil tutorial compartit quan sigui la decisió pedagògica adoptada.
- [x] Decidir si hi haurà notes internes compartides entre tutor i cotutor i separar-les clarament dels missatges visibles per l'alumne.
- [x] Fer arribar al cotutor les alertes pedagògiques i les contradiccions comunitàries de la classe amb les mateixes regles que al tutor responsable.

### 22.4. Retirada, sortida i transferència

- [x] Permetre al tutor responsable retirar l'accés del cotutor amb una confirmació clara.
- [x] Fer que la retirada sigui efectiva immediatament a les regles de dades, encara que el cotutor mantingui una pestanya oberta.
- [x] Permetre que el cotutor abandoni voluntàriament la classe compartida.
- [x] Conservar les dades de la classe quan marxa un cotutor; només s'elimina la seva autorització.
- [x] Conservar l'autoria pedagògica mínima dels canvis ja realitzats quan es retira un docent.
- [x] Crear un procés explícit de transferència del rol de tutor responsable a un cotutor acceptat.
- [ ] No permetre que el tutor responsable abandoni o elimini el seu compte deixant una classe sense responsable; exigir transferència o tancament previ.
- [ ] Demanar una confirmació reforçada abans d'eliminar una classe compartida i avisar el cotutor de la decisió.

### 22.5. Dades, permisos i seguretat

- [x] Modelar els membres docents de la classe amb identificadors d'usuari verificats, rol, estat, data d'alta i docent que els ha convidat; no utilitzar el correu com a únic permís permanent.
- [x] Fer servir el correu només per resoldre la invitació i vincular-la després al compte autenticat corresponent.
- [x] Actualitzar les regles de Firestore perquè només el tutor responsable i els cotutors acceptats puguin llegir les dades tutorials de la classe.
- [x] Restringir amb regles, i no només amb la interfície, les accions reservades al tutor responsable.
- [x] Impedir que un docent s'afegeixi ell mateix com a cotutor modificant directament una petició o un document.
- [x] Impedir que un alumne, un tutor d'una altra classe o una invitació pendent accedeixin a dades compartides.
- [ ] Revisar l'abast de dades personals i la base d'ús abans d'habilitar cotutoria amb comptes reals del centre.
- [ ] Incloure les classes compartides en còpies de seguretat i exportacions sense duplicar alumnes ni documents.
- [ ] Definir què passa si se suspèn o s'elimina el compte d'un dels dos docents.

### 22.6. Proves i desplegament gradual

- [ ] Provar el recorregut complet: convidar, acceptar, veure la classe, editar dades compartides, rebre actualitzacions i retirar l'accés.
- [ ] Provar invitacions a correu propi, correu incorrecte, duplicat, ja acceptat, rebutjat, caducat i revocat.
- [x] Provar amb emuladors que una invitació pendent no concedeix accés i que una acceptada només el concedeix al compte correcte.
- [x] Provar tots els permisos diferenciats entre tutor responsable, cotutor, alumne i usuari extern.
- [ ] Provar dues sessions docents simultànies modificant la mateixa classe i resoldre conflictes sense pèrdua silenciosa de dades.
- [x] Provar que retirar un cotutor talla lectures i escriptures immediatament.
- [ ] Provar transferència de propietat, sortida voluntària, eliminació del compte i eliminació de la classe.
- [ ] Auditar que cap vista, consulta, alerta o notificació reveli dades d'una classe després de perdre'n l'accés.
- [ ] Validar la comprensió dels rols i els permisos amb dos docents abans d'ampliar-ne l'ús.
- [ ] Activar primer la cotutoria en una sola classe de prova i revisar incidències abans de desplegar-la a totes les classes.

## Després del pilot

- [ ] Valorar comptes institucionals, notificacions push i integracions.
- [ ] Valorar professorat de matèria amb permisos limitats.
- [ ] Valorar IA, repetició espaiada o plans d'estudi avançats.
- [ ] Valorar música o vídeos ambientals opcionals per a la Sala d'estudi, amb activació voluntària i controls de so.
- [ ] No afegir cap ampliació que distregui del nucli abans de validar-lo.
