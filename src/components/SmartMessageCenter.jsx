import { BellRinging } from '@phosphor-icons/react/dist/csr/BellRinging'

const LEVEL_LABEL = { suggestion: 'Suggeriment', reminder: 'Recordatori', alert: 'Alerta', help: 'Potser necessites ajuda' }

export default function SmartMessageCenter({ messages, onAction, onSnooze, onDismiss }) {
  if (!messages.length) return null
  return <section className="smart-message-center" aria-labelledby="smart-message-title">
    <header><BellRinging size={26} weight="duotone" aria-hidden="true" /><div><span>Ajuda en el moment útil</span><h2 id="smart-message-title">Piu et proposa</h2></div></header>
    <div>{messages.map((item) => <article className={`smart-message ${item.level}`} key={item.id}>
      <span>{LEVEL_LABEL[item.level]}</span><h3>{item.title}</h3><p>{item.body}</p><details><summary>Per què m’ho mostra?</summary><p>{item.reason}</p></details>
      <div className="actions"><button type="button" onClick={() => onAction(item, item.action)}>{item.action.label}</button>{item.secondaryAction?.view && <button type="button" className="secondary" onClick={() => onAction(item, item.secondaryAction)}>{item.secondaryAction.label}</button>}<button type="button" className="text-button" onClick={() => onSnooze(item)}>Més tard</button>{item.dismissible && <button type="button" className="text-button" onClick={() => onDismiss(item)}>{item.secondaryAction?.status === 'dismissed' ? item.secondaryAction.label : item.dismissLabel}</button>}</div>
    </article>)}</div>
  </section>
}
