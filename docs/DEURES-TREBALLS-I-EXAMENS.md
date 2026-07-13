# Deures, treballs i exàmens

Aquest bloc implementa el cicle funcional de les tasques personals de l'alumne.
No construeix encara les vistes «Avui» i calendari, que corresponen al bloc 7.

## Entrada ràpida

L'alumne indica assignatura, descripció, abast (`deure`, `treball` o `examen`) i
termini. El termini pot estar confirmat, pendent de confirmar o encara sense
data. Opcionalment pot afegir una estimació, passos, material, una nota privada,
una petició d'ajuda i si cal entregar la feina.

La nota privada es desa a `tasks/{taskId}/private/details`. El tutor pot llegir
la tasca acadèmica i la petició d'ajuda, però les regles de Firestore li neguen
l'accés a aquest document privat.

## Planificació i regulació

Després de desar, l'eina ofereix `Planifica-la ara`. L'alumne concreta data,
hora i durada d'una primera sessió de treball. Això crea una sessió separada de
la data límit i situa la tasca en estat `planned`.

Els estats són:

- `needs_clarification`: cal aclarir què s'ha de fer.
- `pending`: està clar, però encara no té pla.
- `planned`: té una sessió prevista.
- `in_progress`: hi ha feina iniciada o avanç parcial.
- `done`: la feina està acabada.

L'alumne pot registrar 0, 25, 50, 75 o 100% d'avanç, reprogramar la sessió,
canviar el termini, reobrir una tasca o tornar-la a «per aclarir». Tots aquests
canvis s'afegeixen a l'historial; no generen puntuacions negatives.

## Fet i entregat

`Fet` descriu l'estat de la feina. `Entregat` és un camp diferent i només es pot
marcar quan la tasca ja està feta. Els exàmens o altres tasques sense entrega
utilitzen `not_required`.

## Possibles duplicats

Abans de crear una tasca, el navegador compara assignatura, text i data amb les
tasques obertes del mateix alumne. Si detecta una coincidència, només mostra un
avís amb les dues opcions: revisar-la o crear-la igualment. No fusiona, esborra
ni modifica registres automàticament. La detecció agregada de tota la classe es
manté reservada per al bloc 9.
