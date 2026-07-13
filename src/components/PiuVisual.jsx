import { getPiuAsset } from '../data/piuAssets.js'

export default function PiuVisual({ state = 'base', accessory = 'none', animationsEnabled = true }) {
  const asset = getPiuAsset(state)
  const source = `${import.meta.env.BASE_URL}mascota/piu/${asset.file}`
  if (!asset.available) return null
  return (
    <div className={`piu-visual${animationsEnabled ? ' animated' : ''}`}>
      <img src={source} alt={asset.alt} loading="lazy" />
      {accessory !== 'none' && <span className="piu-accessory-label">Complement: {accessory}</span>}
    </div>
  )
}
