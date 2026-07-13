import { getPiuAsset } from '../data/piuAssets.js'

export default function PiuVisual({ state = 'base', accessory = 'none', animationsEnabled = true }) {
  const asset = getPiuAsset(state)
  const source = `${import.meta.env.BASE_URL}mascota/piu/${asset.file}`
  return (
    <div className={`piu-visual${animationsEnabled ? ' animated' : ''}`}>
      {asset.available
        ? <img src={source} alt={asset.alt} loading="lazy" />
        : <div className="piu-placeholder" role="img" aria-label={`${asset.alt}. Il·lustració definitiva pendent.`}><span>Piu</span><small>imatge pendent</small></div>}
      {accessory !== 'none' && <span className="piu-accessory-label">Complement: {accessory}</span>}
    </div>
  )
}
