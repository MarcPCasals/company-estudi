# Bloc 13.6 · Validació de la Sala d'estudi

Data de la comprovació tècnica: 13 de juliol de 2026.

## Resultat

La lògica automatitzable i la interfície inicial de la Sala d'estudi funcionen correctament. Les validacions pedagògiques amb alumnes i les proves físiques de llarga durada continuen pendents del pilot.

## Comprovacions superades

- Flux d'estats complet: preparació, primer bloc, revisió, pausa, segon bloc, revisió i resum.
- Cronòmetres de `30 + 15 + 30` i modalitat avançada `45 + 15 + 45`.
- Càlcul del temps a partir de l'hora final, no d'un comptador acumulatiu.
- Pausa i represa sense perdre segons.
- Persistència local i recuperació després de recarregar o tancar la pestanya.
- Sortida voluntària amb missatge explícit de no-penalització.
- Identificador únic determinista per cada combinació de sessió i bloc.
- Regla idempotent que no torna a concedir XP a un bloc ja registrat.
- Transacció concurrent real contra els emuladors Auth i Firestore: dues confirmacions simultànies produeixen un sol bloc, 4 XP totals i un únic bloc recompensat.
- Límit diari de 40 XP.
- Canvi exacte de les 14 evolucions als seus llindars, inclosos els valors immediatament anteriors.
- Marcador inicial `0 / 40 XP` i indicació de la pròxima evolució.
- Vista sense desbordament horitzontal a 1280 px, iPad horitzontal de 1024 × 768 i iPad vertical de 768 × 1024.
- Cap error de React o JavaScript detectat a la consola durant la prova visual.

## Prova interactiva realitzada

1. S'ha obert la Sala d'estudi en una superfície temporal de validació de desenvolupament, retirada després de la prova.
2. S'ha començat un bloc de 30 minuts amb un objectiu concret.
3. S'ha interromput a `29:53`.
4. S'ha recarregat la pàgina.
5. La Sala ha recuperat el mateix bloc, objectiu, estat pausat i temps `29:53`.
6. S'ha reprès el bloc.
7. S'ha obert el diàleg de sortida i s'ha comprovat el missatge que no hi ha pèrdua ni penalització.
8. S'ha sortit amb calma i s'ha comprovat que la sessió local quedava eliminada.

## Cobertura automatitzada

- 15 fitxers de proves ordinàries superats, amb 82 proves.
- 1 prova d'integració Firebase addicional superada contra els emuladors.
- 83 proves superades en total incloent la integració.
- Compilació de producció correcta.

## Comprovacions pendents

- Fer una sessió cronometrada completa de 75 minuts en un iPad físic.
- Bloquejar i desbloquejar l'iPad durant cada fase.
- Tallar i recuperar la connexió real mentre s'està registrant un bloc.
- Fer el pilot amb alumnes durant 6-8 setmanes.
- Validar la lectura emocional de Piu i el ritme anual de les evolucions.
- Decidir amb dades del pilot si s'activa definitivament `45 + 15 + 45`.

## Validació de l'emulador

S'ha instal·lat OpenJDK 26.0.1 mitjançant Homebrew i s'ha configurat `JAVA_HOME`. Els emuladors Auth i Firestore arrenquen correctament. La prova es pot repetir amb `npm run test:emulators`.
