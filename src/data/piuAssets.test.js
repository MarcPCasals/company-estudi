import { describe, expect, it } from 'vitest'
import { getPiuAsset } from './piuAssets.js'

describe('recursos visuals de Piu', () => {
  it('utilitza piu-repos com a imatge general', () => {
    expect(getPiuAsset('base')).toMatchObject({
      file: 'emocions/piu-repos.png',
      available: true,
    })
  })

  it('utilitza les emocions disponibles i manté una reserva segura', () => {
    expect(getPiuAsset('celebrate')).toMatchObject({ file: 'emocions/celebracio.png' })
    expect(getPiuAsset('free_time_music')).toMatchObject({ file: 'emocions/nova-musica.png' })
    expect(getPiuAsset('free_time_rubik')).toMatchObject({ file: 'emocions/nou-rubik.png' })
    expect(getPiuAsset('estat-inexistent')).toEqual(getPiuAsset('base'))
  })
})
