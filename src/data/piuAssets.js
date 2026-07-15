export const PIU_ASSETS = Object.freeze({
  base: { file: 'emocions/piu-repos.png', alt: 'Piu en repòs i preparat per acompanyar-te', available: true },
  neutral: { file: 'emocions/piu-esperant.png', alt: 'Piu atent i disponible', available: true },
  ready: { file: 'emocions/esperant.png', alt: 'Piu preparat per començar', available: true },
  ready_excited: { file: 'emocions/esperant-entusiasmat.png', alt: 'Piu espera amb il·lusió', available: true },
  greeting_normal: { file: 'emocions/salutacio-normal.png', alt: 'Piu et saluda', available: true },
  greeting_happy: { file: 'emocions/salutacio-alegre.png', alt: 'Piu et dona una benvinguda alegre', available: true },
  thinking: { file: 'emocions/pensant.png', alt: 'Piu està pensant', available: true },
  imaginative: { file: 'emocions/imaginatiu.png', alt: 'Piu imagina una altra possibilitat', available: true },
  starting_work: { file: 'emocions/comencant-estudiar-treballar.png', alt: 'Piu prepara el material per treballar', available: true },
  focused_study: { file: 'emocions/concentrat-estudiant.png', alt: 'Piu està profundament concentrat en el segon bloc', available: true },
  focused_work: { file: 'emocions/concentrat-fent-feina.png', alt: 'Piu treballa amb concentració', available: true },
  enjoying_study: { file: 'emocions/estudiant-passant-ho-be.png', alt: 'Piu estudia concentrat i tranquil', available: true },
  satisfied: { file: 'emocions/satisfet.png', alt: 'Piu està satisfet amb el pas que has fet', available: true },
  happy: { file: 'emocions/content.png', alt: 'Piu està content pel teu progrés', available: true },
  very_happy: { file: 'emocions/molt-content.png', alt: 'Piu està molt content per una fita important', available: true },
  proud: { file: 'emocions/orgullos.png', alt: 'Piu reconeix amb orgull la teva constància', available: true },
  celebrate: { file: 'emocions/celebracio.png', alt: 'Piu celebra una fita excepcional', available: true },
  first_consistency: { file: 'emocions/comencant-ratxa.png', alt: 'Piu reconeix una primera fita de constància', available: true },
  long_consistency: { file: 'emocions/en-ratxa-llarga.png', alt: 'Piu reconeix una constància consolidada', available: true },
  concerned: { file: 'emocions/preocupat.png', alt: 'Piu indica que hi ha alguna cosa per revisar', available: true },
  tired: { file: 'emocions/cansat.png', alt: 'Piu suggereix fer una pausa', available: true },
  resting: { file: 'emocions/descansant.png', alt: 'Piu descansa tranquil·lament', available: true },
  free_time_music: { file: 'emocions/nova-musica.png', alt: 'Piu gaudeix del temps lliure escoltant música', available: true },
  free_time_rubik: { file: 'emocions/nou-rubik.png', alt: 'Piu gaudeix del temps lliure jugant amb un cub de Rubik', available: true },
  sleeping: { file: 'emocions/dormint.png', alt: 'Piu dorm perquè el dia ja està tancat', available: true },

  // Àlies antics mentre les pantalles passen al motor central.
  saluda: { file: 'emocions/salutacio-alegre.png', alt: 'Piu et saluda alegrement', available: true },
  escriu: { file: 'emocions/pensant.png', alt: 'Piu pensa com deixar clara la tasca', available: true },
  planifica: { file: 'emocions/pensant.png', alt: 'Piu està planificant', available: true },
  estudia: { file: 'emocions/concentrat-fent-feina.png', alt: 'Piu treballa amb concentració', available: true },
  content: { file: 'emocions/content.png', alt: 'Piu està content pel teu progrés', available: true },
  celebra: { file: 'emocions/celebracio.png', alt: 'Piu celebra una fita important', available: true },
  espera: { file: 'emocions/piu-esperant.png', alt: 'Piu espera atent', available: true },
  cansat: { file: 'emocions/cansat.png', alt: 'Piu suggereix descansar', available: true },
  dorm: { file: 'emocions/dormint.png', alt: 'Piu dorm tranquil·lament', available: true },
})

export const EXCLUDED_PIU_STATES = Object.freeze(['annoyed', 'angry', 'disappointed', 'facepalm'])

export const getPiuAsset = (state = 'base') => PIU_ASSETS[state] ?? PIU_ASSETS.base
