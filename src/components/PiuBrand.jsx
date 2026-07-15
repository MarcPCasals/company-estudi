export default function PiuBrand({ className, onClick }) {
  return (
    <button type="button" className={className} onClick={onClick} aria-label="Torna a la pàgina inicial">
      <img className="piu-brand-icon" src={`${import.meta.env.BASE_URL}favicon.svg`} alt="" aria-hidden="true" />
      <span>Piu</span>
    </button>
  )
}
