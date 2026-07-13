# Imatges de Piu

La integració ja està preparada, però mentre no hi hagi les il·lustracions definitives l’aplicació mostra un marcador neutre i no intenta carregar cap fitxer inexistent.

## Format recomanat

- PNG amb fons transparent per a la primera versió.
- Quadrat, entre 1000 × 1000 i 2000 × 2000 px.
- Sense espais ni majúscules al nom del fitxer.
- SVG natiu també és benvingut si el dibuix original és vectorial.
- Evitar JPG perquè no conserva la transparència.

Els noms previstos són `piu-base.png`, `piu-saluda.png`, `piu-escriu.png`, `piu-planifica.png`, `piu-estudia.png`, `piu-content.png`, `piu-celebra.png`, `piu-espera.png`, `piu-cansat.png` i `piu-dorm.png`.

Quan arribin les imatges, només cal posar-les en aquesta carpeta i marcar la variant corresponent com a `available: true` a `src/data/piuAssets.js`.
