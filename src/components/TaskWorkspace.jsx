import { useEffect, useMemo, useState } from 'react'
import { DEFAULT_SUBJECTS } from '../data/subjects.js'
import {
  DEADLINE_CERTAINTY,
  DELIVERY_STATUS,
  TASK_STATUS,
  TASK_TYPE,
  createDeadline,
  findPotentialDuplicateTasks,
} from '../domain/dataModel.js'
import { PIU_EVENT, PIU_SURFACE, resolvePiuVisualState } from '../domain/piuVisualState.js'
import { buildWeekDays, suggestStudySlots, validateStudySlot } from '../domain/calendarPlanning.js'
import { observeStudentCalendar } from '../services/calendarService.js'
import {
  createStudentTask,
  loadPrivateTaskDetails,
  observeStudentTasks,
  planStudentTask,
  setStudentTaskHelpRequested,
  updatePrivateTaskDetails,
  updateStudentTaskDeadline,
  updateStudentTaskDelivery,
  updateStudentTaskProgress,
  updateStudentTaskStatus,
} from '../services/taskService.js'
import PiuVisual from './PiuVisual.jsx'

const STATUS_LABELS = {
  [TASK_STATUS.NEEDS_CLARIFICATION]: 'Per aclarir',
  [TASK_STATUS.PENDING]: 'Pendent',
  [TASK_STATUS.PLANNED]: 'Planificada',
  [TASK_STATUS.IN_PROGRESS]: 'En curs',
  [TASK_STATUS.DONE]: 'Feta',
}

const TYPE_LABELS = {
  [TASK_TYPE.HOMEWORK]: 'Deure',
  [TASK_TYPE.PROJECT]: 'Treball',
  [TASK_TYPE.EXAM]: 'Examen',
}

const CERTAINTY_LABELS = {
  [DEADLINE_CERTAINTY.CONFIRMED]: 'Data confirmada',
  [DEADLINE_CERTAINTY.TO_CONFIRM]: 'Data per confirmar',
  [DEADLINE_CERTAINTY.WITHOUT_DATE]: 'Sense data',
}

const pad = (value) => String(value).padStart(2, '0')

const toLocalInputValue = (value) => {
  if (!value) return ''
  const date = new Date(value)
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}T${pad(date.getHours())}:${pad(date.getMinutes())}`
}

const tomorrowDate = () => {
  const date = new Date()
  date.setDate(date.getDate() + 1)
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`
}

const initialForm = () => ({
  subjectId: DEFAULT_SUBJECTS[0].id,
  title: '',
  taskType: TASK_TYPE.HOMEWORK,
  deadlineCertainty: DEADLINE_CERTAINTY.CONFIRMED,
  deadlineDate: tomorrowDate(),
  deadlineTime: '',
  estimatedMinutes: '',
  stepsText: '',
  material: '',
  privateNote: '',
  helpRequested: false,
  requiresDelivery: true,
  needsClarification: false,
})

const formToInput = (form) => ({
  subjectId: form.subjectId,
  title: form.title,
  taskType: form.taskType,
  deadline: {
    certainty: form.deadlineCertainty,
    at: form.deadlineCertainty === DEADLINE_CERTAINTY.WITHOUT_DATE
      ? null
      : `${form.deadlineDate}T${form.deadlineTime || '23:59'}`,
  },
  estimatedMinutes: form.estimatedMinutes,
  steps: form.stepsText.split('\n').map((step) => step.trim()).filter(Boolean),
  material: form.material,
  privateNote: form.privateNote,
  helpRequested: form.helpRequested,
  requiresDelivery: form.requiresDelivery,
  needsClarification: form.needsClarification,
})

const deadlineForDuplicateCheck = (input) => createDeadline({
  certainty: input.deadline.certainty,
  at: input.deadline.certainty === DEADLINE_CERTAINTY.WITHOUT_DATE
    ? null
    : new Date(input.deadline.at).toISOString(),
})

const formatDate = (value) => new Intl.DateTimeFormat('ca-AD', {
  dateStyle: 'medium',
  timeStyle: 'short',
}).format(new Date(value))

function QuickInbox({ session, onCreated, onStatus }) {
  const [text, setText] = useState('')
  const [subjectId, setSubjectId] = useState('')
  const submit = async (event) => {
    event.preventDefault()
    if (!subjectId) { onStatus('error', 'Tria l’assignatura: la bústia no la inventarà per tu.'); return }
    try {
      const task = await createStudentTask({ classId: session.classId, studentId: session.studentId, input: { subjectId, title: text, taskType: TASK_TYPE.HOMEWORK, deadline: { certainty: DEADLINE_CERTAINTY.WITHOUT_DATE, at: null }, estimatedMinutes: '', steps: [], material: '', privateNote: '', helpRequested: false, requiresDelivery: false, needsClarification: true } })
      setText(''); setSubjectId(''); onCreated(task.id); onStatus('success', 'Apuntat a la bústia. No hem inventat ni termini ni durada.', PIU_EVENT.TASK_SAVED)
    } catch (error) { onStatus('error', error.message) }
  }
  return <form className="quick-inbox" onSubmit={submit}><div><span className="eyebrow">Bústia ràpida</span><strong>Apunta-ho ara i completa-ho després</strong><small>No interpretarem dades ambigües.</small></div><input required minLength="2" maxLength="200" aria-label="Què vols recordar?" placeholder="Exercicis 4–8, dijous" value={text} onChange={(event) => setText(event.target.value)} /><select required aria-label="Assignatura de la nota ràpida" value={subjectId} onChange={(event) => setSubjectId(event.target.value)}><option value="">Tria assignatura…</option>{DEFAULT_SUBJECTS.map((subject) => <option value={subject.id} key={subject.id}>{subject.name}</option>)}</select><button>Apunta</button></form>
}

function AddTaskForm({ tasks, session, onCreated, onStatus }) {
  const [form, setForm] = useState(initialForm)
  const [duplicateWarning, setDuplicateWarning] = useState(null)

  const update = (field, value) => setForm((current) => ({ ...current, [field]: value }))

  const persist = async (input) => {
    onStatus('loading', 'Desant la tasca i el seu historial…')
    try {
      const task = await createStudentTask({
        classId: session.classId,
        studentId: session.studentId,
        input,
      })
      setForm(initialForm())
      setDuplicateWarning(null)
      onCreated(task.id)
      onStatus('success', 'Tasca desada. Ara pots planificar quan la faràs.', PIU_EVENT.TASK_SAVED)
    } catch (error) {
      onStatus('error', error.message)
    }
  }

  const submit = async (event) => {
    event.preventDefault()
    try {
      const input = formToInput(form)
      const candidate = {
        subjectId: input.subjectId,
        title: input.title,
        deadline: deadlineForDuplicateCheck(input),
      }
      const duplicates = findPotentialDuplicateTasks(candidate, tasks)
      if (duplicates.length > 0) {
        setDuplicateWarning({ input, duplicates })
        return
      }
      await persist(input)
    } catch (error) {
      onStatus('error', error.message)
    }
  }

  return (
    <form className="task-creator" onSubmit={submit}>
      <div className="task-form-heading">
        <div>
          <p className="eyebrow">Entrada ràpida</p>
          <h3>Afegir deure, treball o examen</h3>
        </div>
      </div>

      <div className="task-quick-fields">
        <label>
          Assignatura
          <select value={form.subjectId} onChange={(event) => update('subjectId', event.target.value)}>
            {DEFAULT_SUBJECTS.map((subject) => (
              <option key={subject.id} value={subject.id}>{subject.name}</option>
            ))}
          </select>
        </label>
        <label>
          Tipus
          <select
            value={form.taskType}
            onChange={(event) => {
              update('taskType', event.target.value)
              if (event.target.value === TASK_TYPE.EXAM) update('requiresDelivery', false)
            }}
          >
            <option value={TASK_TYPE.HOMEWORK}>Deure</option>
            <option value={TASK_TYPE.PROJECT}>Treball</option>
            <option value={TASK_TYPE.EXAM}>Examen</option>
          </select>
        </label>
      </div>

      <label>
        Què has de fer?
        <input required minLength={2} maxLength={200} value={form.title} onChange={(event) => update('title', event.target.value)} placeholder="Exercicis 4–8 de la pàgina 36" />
      </label>

      {[TASK_TYPE.PROJECT, TASK_TYPE.EXAM].includes(form.taskType) && <div className="large-task-guide" role="note"><strong>Prepara aquesta activitat gran</strong><p>Indica el temps estimat i escriu els passos. El planificador setmanal els repartirà en blocs de màxim 60 minuts i en dies diferents quan hi hagi capacitat.</p></div>}

      <div className="task-quick-fields">
        <label>
          Termini
          <select value={form.deadlineCertainty} onChange={(event) => update('deadlineCertainty', event.target.value)}>
            <option value={DEADLINE_CERTAINTY.CONFIRMED}>Data confirmada</option>
            <option value={DEADLINE_CERTAINTY.TO_CONFIRM}>Data per confirmar</option>
            <option value={DEADLINE_CERTAINTY.WITHOUT_DATE}>Sense data</option>
          </select>
        </label>
        {form.deadlineCertainty !== DEADLINE_CERTAINTY.WITHOUT_DATE && (
          <label>
            Data
            <input required type="date" value={form.deadlineDate} onChange={(event) => update('deadlineDate', event.target.value)} />
          </label>
        )}
        {form.deadlineCertainty !== DEADLINE_CERTAINTY.WITHOUT_DATE && <label>Hora exacta (opcional)<input type="time" value={form.deadlineTime} onChange={(event) => update('deadlineTime', event.target.value)} /><span className="field-note">Si la deixes buida, comptarem el final del dia.</span></label>}
      </div>

      <details className="task-options">
        <summary>Opcions de planificació i privacitat</summary>
        <div className="task-options-content">
          <label>
            Temps estimat (minuts)
            <input type="number" min="5" max="1200" step="5" value={form.estimatedMinutes} onChange={(event) => update('estimatedMinutes', event.target.value)} />
          </label>
          <label>
            Passos, un per línia
            <textarea rows={4} value={form.stepsText} onChange={(event) => update('stepsText', event.target.value)} placeholder={'Llegir el tema\nFer un esquema\nPracticar'} />
          </label>
          <label>
            Material necessari
            <input maxLength={500} value={form.material} onChange={(event) => update('material', event.target.value)} />
          </label>
          <label>
            Nota privada
            <textarea rows={3} maxLength={1000} value={form.privateNote} onChange={(event) => update('privateNote', event.target.value)} />
            <span className="field-note">Només la pots llegir tu. El tutor no hi té accés.</span>
          </label>
          <label className="checkbox-label">
            <input type="checkbox" checked={form.helpRequested} onChange={(event) => update('helpRequested', event.target.checked)} />
            Necessito ajuda amb aquesta tasca
          </label>
          <label className="checkbox-label">
            <input type="checkbox" checked={form.needsClarification} onChange={(event) => update('needsClarification', event.target.checked)} />
            Encara he d’aclarir exactament què cal fer
          </label>
          <label className="checkbox-label">
            <input type="checkbox" checked={form.requiresDelivery} onChange={(event) => update('requiresDelivery', event.target.checked)} />
            S’ha d’entregar
          </label>
        </div>
      </details>

      {duplicateWarning && (
        <div className="duplicate-warning" role="alert">
          <strong>Potser ja tens aquesta tasca apuntada</strong>
          {duplicateWarning.duplicates.map((task) => <span key={task.id}>{task.title}</span>)}
          <p>No les hem fusionat ni modificat. Decideix si vols crear-ne una altra.</p>
          <div className="actions">
            <button type="button" onClick={() => persist(duplicateWarning.input)}>Crea-la igualment</button>
            <button type="button" className="secondary" onClick={() => setDuplicateWarning(null)}>Torna a revisar</button>
          </div>
        </div>
      )}

      <button type="submit">Desa la tasca</button>
    </form>
  )
}

function PlanTaskForm({ task, planningData, schoolSchedule, onClose, onStatus }) {
  const weekDays = useMemo(() => [...buildWeekDays(new Date()), ...buildWeekDays(new Date(Date.now() + 7 * 86_400_000))], [planningData])
  const suggestions = useMemo(() => suggestStudySlots({ task, weekDays, availability: planningData.availability, schoolSchedule, sessions: planningData.sessions, occupations: planningData.occupations }), [task, weekDays, planningData, schoolSchedule])
  const [scheduledAt, setScheduledAt] = useState(toLocalInputValue(task.nextPlannedSessionAt) || toLocalInputValue(suggestions[0]?.scheduledAt))
  const [durationMinutes, setDurationMinutes] = useState(Math.min(task.estimatedMinutes ?? 30, 240))
  const [reason, setReason] = useState('')

  const submit = async (event) => {
    event.preventDefault()
    onStatus('loading', task.activeSessionId ? 'Reprogramant la sessió…' : 'Creant la sessió de treball…')
    try {
      const validation = validateStudySlot({ task, scheduledAt, durationMinutes: Number(durationMinutes), availability: planningData.availability, schoolSchedule, sessions: planningData.sessions, occupations: planningData.occupations })
      if (!validation.valid) throw new Error(validation.reason)
      await planStudentTask(task, { scheduledAt, durationMinutes, reason })
      onStatus('success', task.activeSessionId
        ? 'Sessió reprogramada. Reajustar el pla no és cap penalització.'
        : 'Tasca planificada correctament.', PIU_EVENT.PLAN_SAVED)
      onClose()
    } catch (error) {
      onStatus('error', error.message)
    }
  }

  return (
    <form className="plan-task-form" onSubmit={submit}>
      <strong>{task.activeSessionId ? 'Reprograma la propera sessió' : 'Planifica-la ara'}</strong>
      {suggestions.length > 0 && <div className="task-slot-suggestions" aria-label="Franges realistes proposades">{suggestions.map((slot) => <button type="button" className="secondary" key={slot.id} onClick={() => { setScheduledAt(toLocalInputValue(slot.scheduledAt)); setDurationMinutes(slot.durationMinutes) }}>{formatDate(slot.scheduledAt)} · {slot.durationMinutes} min</button>)}</div>}
      {suggestions.length === 0 && <p className="field-note">No trobem cap franja còmoda ara mateix. Revisa ocupacions, disponibilitat o termini.</p>}
      <div className="task-quick-fields">
        <label>Quan <input required type="datetime-local" value={scheduledAt} onChange={(event) => setScheduledAt(event.target.value)} /></label>
        <label>Durada (min) <input required type="number" min="10" max="240" step="5" value={durationMinutes} onChange={(event) => setDurationMinutes(event.target.value)} /></label>
      </div>
      {task.activeSessionId && (
        <label>Què ha canviat? <input maxLength={300} value={reason} onChange={(event) => setReason(event.target.value)} placeholder="Avui necessito més temps per descansar" /></label>
      )}
      <div className="actions">
        <button type="submit">Confirma el pla</button>
        <button type="button" className="secondary" onClick={onClose}>Ara no</button>
      </div>
    </form>
  )
}

function DeadlineEditor({ task, onStatus }) {
  const [certainty, setCertainty] = useState(task.deadline?.certainty ?? DEADLINE_CERTAINTY.WITHOUT_DATE)
  const [at, setAt] = useState(toLocalInputValue(task.deadline?.at))
  const [reason, setReason] = useState('')

  const submit = async (event) => {
    event.preventDefault()
    onStatus('loading', 'Actualitzant el termini…')
    try {
      await updateStudentTaskDeadline(task, { certainty, at }, reason)
      onStatus('success', 'Termini actualitzat sense cap penalització.', PIU_EVENT.PLAN_SAVED)
    } catch (error) {
      onStatus('error', error.message)
    }
  }

  return (
    <details className="task-inline-editor">
      <summary>Canvia el termini</summary>
      <form onSubmit={submit}>
        <select value={certainty} onChange={(event) => setCertainty(event.target.value)}>
          {Object.entries(CERTAINTY_LABELS).map(([value, label]) => <option key={value} value={value}>{label}</option>)}
        </select>
        {certainty !== DEADLINE_CERTAINTY.WITHOUT_DATE && <input required type="datetime-local" value={at} onChange={(event) => setAt(event.target.value)} />}
        <input maxLength={300} value={reason} onChange={(event) => setReason(event.target.value)} placeholder="Motiu opcional" />
        <button type="submit">Actualitza</button>
      </form>
    </details>
  )
}

function PrivateNoteEditor({ task, onStatus }) {
  const [loaded, setLoaded] = useState(false)
  const [note, setNote] = useState('')

  const load = async (event) => {
    if (!event.currentTarget.open || loaded) return
    try {
      const details = await loadPrivateTaskDetails(task)
      setNote(details.privateNote ?? '')
      setLoaded(true)
    } catch (error) {
      onStatus('error', error.message)
    }
  }

  const save = async (event) => {
    event.preventDefault()
    onStatus('loading', 'Desant la nota privada…')
    try {
      await updatePrivateTaskDetails(task, note)
      onStatus('success', 'Nota privada desada. Continua sent invisible per al tutor.', PIU_EVENT.TASK_SAVED)
    } catch (error) {
      onStatus('error', error.message)
    }
  }

  return (
    <details className="task-inline-editor private-note-editor" onToggle={load}>
      <summary>La meva nota privada</summary>
      {!loaded && <p>Carregant…</p>}
      {loaded && (
        <form onSubmit={save}>
          <textarea rows={3} maxLength={1000} value={note} onChange={(event) => setNote(event.target.value)} />
          <span className="field-note">Aquest text no és llegible pel tutor.</span>
          <button type="submit">Desa la nota</button>
        </form>
      )}
    </details>
  )
}

function TaskCard({ task, isRecentlyCreated, planning, setPlanning, onStatus, planningData, schoolSchedule }) {
  const subject = DEFAULT_SUBJECTS.find((item) => item.id === task.subjectId)
  const deadlinePassed = task.deadline?.at
    && new Date(task.deadline.at).getTime() < Date.now()
    && task.status !== TASK_STATUS.DONE

  const changeStatus = async (nextStatus, reason = '') => {
    onStatus('loading', 'Actualitzant l’estat…')
    try {
      await updateStudentTaskStatus(task, nextStatus, reason)
      onStatus('success', nextStatus === TASK_STATUS.DONE
        ? 'Tasca marcada com a feta. Recorda que “feta” i “entregada” són coses diferents.'
        : 'Estat actualitzat.', nextStatus === TASK_STATUS.DONE ? PIU_EVENT.TASK_COMPLETED : PIU_EVENT.TASK_SAVED)
    } catch (error) {
      onStatus('error', error.message)
    }
  }

  const updateProgress = async (event) => {
    onStatus('loading', 'Desant l’avanç…')
    try {
      await updateStudentTaskProgress(task, Number(event.target.value))
      onStatus('success', 'Avanç parcial desat.', PIU_EVENT.TASK_SAVED)
    } catch (error) {
      onStatus('error', error.message)
    }
  }

  const toggleHelp = async () => {
    onStatus('loading', 'Actualitzant la petició d’ajuda…')
    try {
      await setStudentTaskHelpRequested(task, !task.helpRequested)
      onStatus('success', task.helpRequested ? 'Petició d’ajuda retirada.' : 'El tutor podrà veure que necessites ajuda.')
    } catch (error) {
      onStatus('error', error.message)
    }
  }

  const toggleDelivery = async () => {
    const next = task.deliveryStatus === DELIVERY_STATUS.DELIVERED
      ? DELIVERY_STATUS.NOT_DELIVERED
      : DELIVERY_STATUS.DELIVERED
    onStatus('loading', 'Actualitzant l’entrega…')
    try {
      await updateStudentTaskDelivery(task, next)
      onStatus('success', next === DELIVERY_STATUS.DELIVERED ? 'Entrega registrada.' : 'Entrega marcada com a pendent.')
    } catch (error) {
      onStatus('error', error.message)
    }
  }

  return (
    <article className={`task-card status-${task.status}`}>
      <div className="task-card-heading">
        <div>
          <span className="task-type">{TYPE_LABELS[task.taskType] ?? 'Tasca'} · {subject?.name ?? task.subjectId}</span>
          <h4>{task.title}</h4>
        </div>
        <span className={`task-status ${task.status}`}>{STATUS_LABELS[task.status]}</span>
      </div>

      <div className="task-metadata">
        <span>{CERTAINTY_LABELS[task.deadline?.certainty]}</span>
        {task.deadline?.at && <strong>{formatDate(task.deadline.at)}</strong>}
        {task.estimatedMinutes && <span>Estimació: {task.estimatedMinutes} min</span>}
        {task.nextPlannedSessionAt && <span>Propera sessió: {formatDate(task.nextPlannedSessionAt)}</span>}
      </div>

      {deadlinePassed && (
        <p className="past-deadline-note">El termini ha passat. Revisa què necessites fer o reprogramar; això no genera cap càstig.</p>
      )}
      {task.helpRequested && <p className="help-requested-note">Has indicat que necessites ajuda.</p>}
      {task.steps?.length > 0 && (
        <ol className="task-steps">{task.steps.map((step, index) => <li key={`${index}-${step}`}>{step}</li>)}</ol>
      )}
      {task.material && <p><strong>Material:</strong> {task.material}</p>}

      {task.status === TASK_STATUS.IN_PROGRESS && (
        <label className="progress-control">
          Avanç: {task.progressPercent}%
          <select value={task.progressPercent} onChange={updateProgress}>
            {[0, 25, 50, 75, 100].map((value) => <option key={value} value={value}>{value}%</option>)}
          </select>
        </label>
      )}

      <div className="task-primary-action">
        {task.status === TASK_STATUS.NEEDS_CLARIFICATION && <button type="button" onClick={() => changeStatus(TASK_STATUS.PENDING)}>Ja ho tinc clar</button>}
        {task.status === TASK_STATUS.PENDING && !isRecentlyCreated && <button type="button" onClick={() => setPlanning(planning ? '' : task.id)}>Planifica-la</button>}
        {task.status === TASK_STATUS.PLANNED && <button type="button" onClick={() => changeStatus(TASK_STATUS.IN_PROGRESS)}>Comença la tasca</button>}
        {task.status === TASK_STATUS.IN_PROGRESS && <button type="button" onClick={() => changeStatus(TASK_STATUS.DONE)}>Completa la tasca</button>}
        {task.status === TASK_STATUS.DONE && <button type="button" className="secondary" onClick={() => changeStatus(TASK_STATUS.PENDING, 'La reobro per revisar-la.')}>Reprèn-la</button>}
      </div>

      <details className="task-more-actions"><summary>Més opcions</summary><div className="task-actions">
        {task.activeSessionId && task.status !== TASK_STATUS.DONE && <button type="button" className="secondary" onClick={() => setPlanning(planning ? '' : task.id)}>Reprograma</button>}
        {task.status === TASK_STATUS.IN_PROGRESS && <button type="button" className="secondary" onClick={() => changeStatus(TASK_STATUS.PLANNED, 'Necessito reajustar el pla.')}>Pausa i reajusta</button>}
        {task.status !== TASK_STATUS.DONE && <button type="button" className="secondary" onClick={() => changeStatus(TASK_STATUS.NEEDS_CLARIFICATION, 'Necessito aclarir què cal fer.')}>He d’aclarir-ho</button>}
        <button type="button" className="secondary" onClick={toggleHelp}>{task.helpRequested ? 'Ja no necessito ajuda' : 'Demana ajuda'}</button>
        {task.status === TASK_STATUS.DONE && task.requiresDelivery && <button type="button" className="secondary" onClick={toggleDelivery}>{task.deliveryStatus === DELIVERY_STATUS.DELIVERED ? 'Marca no entregada' : 'Marca entregada'}</button>}
      </div></details>

      {task.status === TASK_STATUS.DONE && task.requiresDelivery && (
        <p className={`delivery-state ${task.deliveryStatus}`}>
          Feina feta · {task.deliveryStatus === DELIVERY_STATUS.DELIVERED ? 'Entregada' : 'Encara no consta com entregada'}
        </p>
      )}
      {planning && <PlanTaskForm task={task} planningData={planningData} schoolSchedule={schoolSchedule} onClose={() => setPlanning('')} onStatus={onStatus} />}
      <div className="task-secondary-editors">
        <DeadlineEditor task={task} onStatus={onStatus} />
        <PrivateNoteEditor task={task} onStatus={onStatus} />
      </div>
    </article>
  )
}

export default function TaskWorkspace({ session }) {
  const [tasks, setTasks] = useState([])
  const [status, setStatus] = useState({ state: 'idle', message: '' })
  const [recentlyCreatedId, setRecentlyCreatedId] = useState('')
  const [planningTaskId, setPlanningTaskId] = useState('')
  const [filter, setFilter] = useState('open')
  const [sort, setSort] = useState('deadline')
  const [subjectFilter, setSubjectFilter] = useState('all')
  const [helpOnly, setHelpOnly] = useState(false)
  const [creationOpen, setCreationOpen] = useState(false)
  const [piuEvent, setPiuEvent] = useState(null)
  const [planningData, setPlanningData] = useState({ sessions: [], occupations: [], availability: null })

  useEffect(() => observeStudentTasks(
    { classId: session.classId, studentId: session.studentId },
    setTasks,
    (error) => setStatus({ state: 'error', message: error.message }),
  ), [session.classId, session.studentId])

  useEffect(() => observeStudentCalendar(
    { classId: session.classId, studentId: session.studentId },
    setPlanningData,
    (error) => setStatus({ state: 'error', message: error.message }),
  ), [session.classId, session.studentId])

  const visibleTasks = useMemo(() => tasks.filter((task) => {
    if (filter === 'all') return true
    if (filter === 'done') return task.status === TASK_STATUS.DONE
    return task.status !== TASK_STATUS.DONE
  }).filter((task) => subjectFilter === 'all' || task.subjectId === subjectFilter)
    .filter((task) => !helpOnly || task.helpRequested)
    .sort((left, right) => sort === 'subject'
      ? String(left.subjectId).localeCompare(String(right.subjectId), 'ca')
      : sort === 'status'
        ? String(left.status).localeCompare(String(right.status), 'ca')
        : String(left.deadline?.at ?? '9999').localeCompare(String(right.deadline?.at ?? '9999'))), [filter, helpOnly, sort, subjectFilter, tasks])

  const piu = resolvePiuVisualState({
    surface: PIU_SURFACE.TASKS,
    activity: planningTaskId ? 'planning' : null,
    event: piuEvent,
    hasError: status.state === 'error',
  })

  useEffect(() => {
    if (!piuEvent) return undefined
    const timeout = window.setTimeout(() => setPiuEvent(null), piu.minimumDurationMs)
    return () => window.clearTimeout(timeout)
  }, [piu.minimumDurationMs, piuEvent])

  const reportStatus = (state, message, event = null) => {
    setStatus({ state, message })
    if (event) setPiuEvent(event)
  }
  const created = (taskId) => {
    setRecentlyCreatedId(taskId)
    setPlanningTaskId('')
    setCreationOpen(false)
  }

  return (
    <section className="task-workspace" aria-labelledby="task-workspace-title">
      <div className="task-workspace-heading">
        <div>
          <p className="eyebrow">Deures, treballs i exàmens</p>
          <h2 id="task-workspace-title">Les meves tasques</h2>
        </div>
        <span>{tasks.filter((task) => task.status !== TASK_STATUS.DONE).length} obertes</span>
      </div>

      {(planningTaskId || piuEvent || status.state === 'error') && <aside className="piu-context-card" aria-live="polite">
        <PiuVisual state={piu.state} />
        <p>{piu.message}</p>
      </aside>}

      {recentlyCreatedId && tasks.find((task) => task.id === recentlyCreatedId)?.status !== TASK_STATUS.PLANNED && (
        <div className="plan-now-callout">
          <strong>Tasca desada.</strong>
          <span>El següent pas útil és decidir quan la començaràs.</span>
          <button type="button" onClick={() => setPlanningTaskId(recentlyCreatedId)}>Planifica-la ara</button>
        </div>
      )}

      <div className="task-list-heading">
        <h3>Tasques apuntades</h3>
        <div className="task-filters" aria-label="Filtra les tasques">
          {[['open', 'Obertes'], ['done', 'Fetes'], ['all', 'Totes']].map(([value, label]) => (
            <button type="button" className={filter === value ? '' : 'secondary'} aria-pressed={filter === value} key={value} onClick={() => setFilter(value)}>{label}</button>
          ))}
        </div>
      </div>

      <details className="task-advanced-filters"><summary>Ordena i filtra</summary><div><label>Ordena per<select value={sort} onChange={(event) => setSort(event.target.value)}><option value="deadline">Termini</option><option value="subject">Assignatura</option><option value="status">Estat</option></select></label><label>Assignatura<select value={subjectFilter} onChange={(event) => setSubjectFilter(event.target.value)}><option value="all">Totes</option>{DEFAULT_SUBJECTS.map((subject) => <option value={subject.id} key={subject.id}>{subject.name}</option>)}</select></label><label className="checkbox-label"><input type="checkbox" checked={helpOnly} onChange={(event) => setHelpOnly(event.target.checked)} />Només les que necessiten ajuda</label></div></details>

      {visibleTasks.length === 0 && <p className="empty-task-list">No hi ha tasques en aquesta vista.</p>}
      <div className="task-list">
        {visibleTasks.map((task) => (
          <TaskCard
            key={task.id}
            task={task}
            isRecentlyCreated={task.id === recentlyCreatedId}
            planning={planningTaskId === task.id}
            setPlanning={setPlanningTaskId}
            onStatus={reportStatus}
            planningData={planningData}
            schoolSchedule={session.schoolSchedule}
          />
        ))}
      </div>

      <details className="task-creation-panel" open={creationOpen}><summary onClick={(event) => { event.preventDefault(); setCreationOpen((current) => !current) }}>+ Apunta una tasca</summary><QuickInbox session={session} onCreated={() => { setRecentlyCreatedId(''); setPlanningTaskId(''); setCreationOpen(false) }} onStatus={reportStatus} /><AddTaskForm tasks={tasks} session={session} onCreated={created} onStatus={reportStatus} /></details>
      {status.message && <p className={`form-status ${status.state}`} role="status">{status.message}</p>}
    </section>
  )
}
