export const PIU_ASSETS = Object.freeze({
  base: { file: 'piu-base.png', alt: 'Piu atent i preparat', available: false },
  saluda: { file: 'piu-saluda.png', alt: 'Piu saludant', available: false },
  escriu: { file: 'piu-escriu.png', alt: 'Piu apuntant una tasca', available: false },
  planifica: { file: 'piu-planifica.png', alt: 'Piu planificant', available: false },
  estudia: { file: 'piu-estudia.png', alt: 'Piu estudiant', available: false },
  content: { file: 'piu-content.png', alt: 'Piu content pel progrés', available: false },
  celebra: { file: 'piu-celebra.png', alt: 'Piu celebrant un pas important', available: false },
  espera: { file: 'piu-espera.png', alt: 'Piu esperant tranquil·lament', available: false },
  cansat: { file: 'piu-cansat.png', alt: 'Piu recordant que convé descansar', available: false },
  dorm: { file: 'piu-dorm.png', alt: 'Piu dormint al niu', available: false },
})

export const getPiuAsset = (state = 'base') => PIU_ASSETS[state] ?? PIU_ASSETS.base
