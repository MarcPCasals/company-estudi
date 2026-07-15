# Piu · Lògica visual viva

> Especificació funcional del bloc 13.5. Aquest document decideix quan canvia la imatge de Piu i separa completament les emocions generals de l'evolució per XP de la Sala d'estudi.

## 1. Dos sistemes que no es barregen

### Piu adult emocional

S'utilitza a tota l'aplicació fora de la Sala d'estudi. La imatge respon a la pantalla, l'acció de l'alumne o un esdeveniment breu. El nivell d'XP no modifica mai aquest Piu.

### Piu evolutiu

S'utilitza exclusivament dins de l'ecosistema de la Sala d'estudi: preparació, blocs, pausa, resum, progrés específic de la sala i rànquings. La imatge depèn només de l'XP acumulat a la Sala d'estudi.

No es crearan 14 versions de cada emoció. Dins de la Sala d'estudi, el context funcional s'explicarà amb el text, el color de la pantalla i l'acció principal; Piu conservarà la imatge de la seva evolució actual.

## 2. Inventari de les 29 emocions adultes

| Fitxer | Lectura visual | Ús decidit per a l'MVP |
|---|---|---|
| `piu-repos.png` | Neutral i disponible | Reserva segura si no hi ha un context més concret |
| `piu-esperant.png` | Atent i amable | Estat neutral habitual en pantalles de consulta |
| `esperant.png` | Preparat per actuar | Hi ha una acció clara disponible, però no urgent |
| `esperant-entusiasmat.png` | Il·lusió abans de començar | Abans d'una acció voluntària important |
| `salutacio-normal.png` | Salutació discreta | Retorn a l'aplicació durant el mateix dia |
| `salutacio-alegre.png` | Benvinguda càlida | Primera entrada del dia |
| `pensant.png` | Reflexió concreta | Planificació, priorització o revisió d'una decisió |
| `imaginatiu.png` | Idea o possibilitat | Crear un pla, dividir una tasca o explorar alternatives |
| `comencant-estudiar-treballar.png` | Preparació amb material | Inici d'una tasca o d'un procés de treball fora de la Sala d'estudi |
| `concentrat-estudiant.png` | Esforç intens | Reservat; l'expressió pot semblar enfadada en mida petita |
| `concentrat-fent-feina.png` | Concentració activa | Estat de treball guiat fora de la Sala d'estudi |
| `estudiant-passant-ho-be.png` | Concentració agradable | Variant ocasional de treball sostingut, sense premi extra |
| `satisfet.png` | Calma després d'un pas | Desar o completar una acció petita correctament |
| `content.png` | Progrés visible | Completar una acció útil de mida mitjana |
| `molt-content.png` | Alegria intensa | Fita important, sense arribar a celebració excepcional |
| `orgullos.png` | Reconeixement serè | Assoliment personal o revisió setmanal completada |
| `celebracio.png` | Celebració màxima | Fita excepcional; ús breu i poc freqüent |
| `comencant-ratxa.png` | Primera medalla | Reservat per a una primera fita de constància, mai una ratxa diària obligatòria |
| `en-ratxa-llarga.png` | Medalla consolidada | Reservat per a una fita de constància flexible, mai per pressionar a entrar cada dia |
| `preocupat.png` | Alguna cosa necessita atenció | Error recuperable, desconnexió o dada important per revisar |
| `cansat.png` | Fatiga evident | Recomanació de pausa després d'ús continuat |
| `descansant.png` | Descans tranquil | Pausa escollida o final d'una activitat intensa |
| `temps-lliure-musica.png` | Oci relaxat amb música | Temps lliure disponible, variant estable del dia |
| `temps-lliure-rubik.png` | Oci lúdic amb un cub de Rubik | Temps lliure disponible, variant estable del dia |
| `dormint.png` | Dia tancat | Pantalla d'inici nocturna sense cap acció activa |
| `molest.png` | Retret directe | Exclòs de l'MVP |
| `enfadat.png` | Enuig dirigit a l'usuari | Exclòs de l'MVP |
| `decebut.png` | Decepció i judici | Exclòs de l'MVP |
| `molt-decebut-facepalm.png` | Ridiculització o frustració | Exclòs de l'MVP |

Les quatre imatges excloses es conservaran al repositori, però el motor d'estats no les podrà seleccionar.

## 3. Tipus d'estat

### Estats persistents

No tenen una durada fixa. Es mantenen mentre el context continuï sent vàlid:

- consulta neutral → `piu-esperant`;
- acció disponible → `esperant`;
- planificació → `pensant` o `imaginatiu`;
- treball actiu fora de la Sala → `concentrat-fent-feina`;
- pausa voluntària → `descansant`;
- temps lliure disponible → `temps-lliure-musica` o `temps-lliure-rubik`;
- ús continuat excessiu → `cansat`;
- nit sense activitat en curs → `dormint`;
- error recuperable → `preocupat`.

### Reaccions transitòries

Tenen una durada mínima, un límit de repetició i un estat de retorn:

| Reacció | Durada | Refredament | Retorn habitual |
|---|---:|---:|---|
| `salutacio-normal` | 4 s | una vegada per retorn | Estat persistent de la pantalla |
| `salutacio-alegre` | 6 s | una vegada al dia | Estat persistent de la pantalla |
| `satisfet` | 3 s | 20 s | Estat persistent anterior |
| `content` | 5 s | 60 s | Estat persistent anterior |
| `molt-content` | 6 s | 5 min | Estat persistent anterior |
| `orgullos` | 8 s | una vegada per fita | Estat persistent anterior |
| `celebracio` | 8 s | 10 min | `molt-content` durant 3 s i després estat persistent |
| `comencant-estudiar-treballar` | 5 s | una vegada per inici | Estat de treball corresponent |

Cap reacció transitòria durarà menys de 3 segons. Una reacció només podrà ser interrompuda per un estat de prioritat superior.

## 4. Taula de desencadenants

| Context | Desencadenant o condició | Imatge | Tipus | Missatge orientatiu |
|---|---|---|---|---|
| Inici | Primera entrada del dia | `salutacio-alegre` | Transitòria | «Bon dia! Mirem quin és el següent pas?» |
| Inici | Retorn durant el mateix dia | `salutacio-normal` | Transitòria | «Ja tornem a ser aquí.» |
| Inici | No hi ha res urgent | `piu-esperant` | Persistent | «Tot tranquil. Què vols avançar?» |
| Inici | Hi ha una acció planificada propera | `esperant-entusiasmat` | Persistent | «Quan vulguis, ho tenim preparat.» |
| Inici | L'alumne ja ha acabat la jornada i no té cap sessió ni ocupació en curs | `temps-lliure-musica` o `temps-lliure-rubik` | Persistent | «Ara tens temps lliure. Gaudeix-ne sense presses.» |
| Deures | S'obre la creació o edició d'una tasca | `pensant` | Persistent | «Ho deixem clar perquè després sigui fàcil començar.» |
| Deures | La tasca es desa correctament | `satisfet` | Transitòria | «Perfecte, ja ho tenim guardat.» |
| Deures | Una tasca passa a feta | `content` | Transitòria | «Un pas menys. Bona feina.» |
| Deures | Es completa una tasca important o amb diversos passos | `molt-content` | Transitòria | «Això sí que era un bon tros de feina.» |
| Planificació | S'ordenen, divideixen o reprogramen tasques | `pensant` | Persistent | «Mirem com encaixa millor.» |
| Planificació | Es creen alternatives o passos nous | `imaginatiu` | Persistent | «Podem provar una altra manera.» |
| Planificació | El pla queda desat | `satisfet` | Transitòria | «Ara el pla és més realista.» |
| Treball guiat fora de Sala | Es comença una tasca | `comencant-estudiar-treballar` | Transitòria | «Preparem només el que necessitem.» |
| Treball guiat fora de Sala | L'activitat continua | `concentrat-fent-feina` | Persistent | «Un pas cada vegada.» |
| Revisió setmanal | Es completa la revisió | `orgullos` | Transitòria | «Has mirat el procés, no només el resultat.» |
| Comunitat | Es publica una aportació útil | `content` | Transitòria | «Compartir-ho també ajuda la classe.» |
| Sistema | Hi ha desconnexió o un canvi pendent de sincronitzar | `preocupat` | Persistent | «Ho conservem aquí i ho sincronitzarem quan torni la connexió.» |
| Sistema | L'error es resol | `satisfet` | Transitòria | «Ja està resolt.» |
| Benestar | 50 minuts d'ús actiu continuat fora de la Sala | `cansat` | Persistent temporal | «Fa estona que hi som. Vols descansar una mica?» |
| Benestar | L'alumne accepta descansar | `descansant` | Persistent | «Descansar també forma part del pla.» |
| Nit | Després de les 22.30 i sense cap activitat en curs | `dormint` | Persistent | «Per avui ja està bé. Demà hi tornem.» |
| Fita de constància | Primera fita flexible assolida | `comencant-ratxa` | Transitòria | «Comença a notar-se la constància.» |
| Fita de constància | Fita flexible consolidada | `en-ratxa-llarga` | Transitòria | «Has trobat una manera de mantenir el ritme.» |

### Regles que eviten falses reaccions

- Un estat de càrrega no mostrarà `pensant` fins que hagin passat almenys 700 ms.
- Escriure, clicar o canviar de pestanya no generarà per si sol una celebració.
- Una mateixa acció no podrà activar dues reaccions positives consecutives.
- Tornar després d'inactivitat no provocarà cap retret ni cap imatge negativa.
- `cansat` depèn de temps d'ús actiu en primer pla, no del temps que la pestanya hagi quedat oberta.
- A la nit, qualsevol activitat funcional en curs tindrà prioritat sobre `dormint`.
- Les dues variants de temps lliure s'alternen de manera estable per alumne i dia, sense canviar a cada actualització de pantalla.

## 5. Prioritat dels estats

Quan coincideixen diverses condicions, el motor aplicarà aquest ordre:

1. error recuperable que requereix atenció → `preocupat`;
2. benestar o pausa acceptada → `cansat` / `descansant`;
3. celebració o fita excepcional;
4. reacció positiva immediata;
5. activitat funcional de la pantalla;
6. salutació;
7. context nocturn;
8. estat neutral → `piu-esperant`, amb `piu-repos` com a reserva tècnica.

El motor conservarà la reacció actual fins a completar-ne la durada mínima, excepte si apareix una condició de prioritat superior.

## 6. Contracte tècnic futur

La decisió quedarà centralitzada en una funció pura aproximadament equivalent a:

```js
resolvePiuVisualState({
  surface,
  activity,
  event,
  connection,
  activeMinutes,
  localTime,
  variantSeed,
  previousState,
  lastShownAt,
  reducedMotion,
})
```

La funció retornarà:

```js
{
  state,
  file,
  alt,
  message,
  priority,
  minimumDurationMs,
  cooldownMs,
  returnState,
}
```

Les pantalles no decidiran noms de fitxer. Només enviaran context i esdeveniments al motor.

## 7. Evolució per XP de la Sala d'estudi

Una sessió completa concedeix 20 XP i el màxim diari és de 40 XP. La corba està pensada per durar un curs escolar complet: la primera sessió no desbloqueja encara cap evolució i `Llegendari` exigeix una constància excepcional.

| Nivell | Evolució | Rang d'XP | Sessions completes per arribar-hi |
|---:|---|---:|---:|
| 1 | Ou | `0-39` | inicial |
| 2 | Ou esquerdat | `40-99` | 2 |
| 3 | Traient el cap | `100-199` | 5 |
| 4 | Acabat de néixer | `200-349` | 10 |
| 5 | Pollet | `350-549` | 18 |
| 6 | Adolescent | `550-799` | 28 |
| 7 | Adult | `800-1099` | 40 |
| 8 | Professional | `1100-1449` | 55 |
| 9 | Graduat | `1450-1849` | 73 |
| 10 | Aprenent de mag | `1850-2299` | 93 |
| 11 | Mag | `2300-2999` | 115 |
| 12 | Gran mag | `3000-3999` | 150 |
| 13 | Mestre del temps | `4000-5999` | 200 |
| 14 | Llegendari | `6000+` | 300 |

### Simulació del ritme

| Ritme d'ús | Després de 6 setmanes | Després de 8 setmanes | Després de 36 setmanes |
|---|---|---|---|
| 3 sessions completes per setmana | 360 XP · Pollet | 480 XP · Pollet | 2160 XP · Aprenent de mag |
| 1 sessió completa per dia lectiu | 600 XP · Adolescent | 800 XP · Adult | 3600 XP · Gran mag |
| 2 sessions completes per dia lectiu | 1200 XP · Professional | 1600 XP · Graduat | 7200 XP · Llegendari |

Amb el màxim de 40 XP durant cinc dies lectius per setmana, `Llegendari` necessita 30 setmanes. Un ritme constant d'una sessió diària arriba a `Gran mag` al final del curs, però no al nivell màxim. Així, les evolucions continuen sent visibles durant tot el curs i `Llegendari` queda reservat per a una constància extraordinària. Els rangs només es modificaran després d'observar dades reals del pilot.

## 8. Canvi i anunci d'una evolució

- L'evolució es recalcula després de confirmar un bloc amb XP.
- Si el nivell no canvia, la imatge s'actualitza sense cap celebració especial.
- Si es travessa un llindar, el resum mostra l'evolució anterior i la nova amb el missatge «Piu ha evolucionat».
- Cada evolució s'anuncia una sola vegada per alumne.
- La nova imatge apareix immediatament a totes les pantalles de la Sala d'estudi i al següent recalcul del rànquing.
- Els cinc alumnes visibles públicament mostren nom, XP i miniatura evolutiva.
- La posició privada mostra també l'evolució pròpia.
- L'XP no disminueix i Piu no retrocedeix d'etapa.
- Fora de la Sala d'estudi no es mostra ni s'anuncia aquesta evolució.

## 9. Decisions pendents de validació

- Comprovar amb alumnat si `concentrat-estudiant.png` sembla concentrat o enfadat.
- Comprovar si les dues imatges de medalla s'entenen sense parlar de ratxes diàries.
- Validar que `preocupat.png` comunica ajuda i no alarma.
- Validar que 50 minuts és un bon llindar abans de suggerir una pausa.
- Validar el ritme dels rangs d'XP durant les 6-8 setmanes del pilot.
