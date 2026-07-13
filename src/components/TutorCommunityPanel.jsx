import { useEffect, useMemo, useState } from 'react'
import { detectCommonTasks } from '../domain/communityPolicy.js'
import { answerPrivateQuestion, observeCandidateDecisions, observePrivateQuestions, resolveCommonCandidate } from '../services/communityService.js'
import { observeTutorClassActivity } from '../services/tutorialService.js'
import CommunitySpace from './CommunitySpace.jsx'

function PrivateQuestionInbox({ classId, students }) {
  const [questions, setQuestions] = useState({}); const [responses, setResponses] = useState({})
  useEffect(() => { const stops = students.map((student) => observePrivateQuestions({ classId, studentId: student.id }, (items) => setQuestions((current) => ({ ...current, [student.id]: items })), () => {})); return () => stops.forEach((stop) => stop()) }, [classId, students.map((item) => item.id).join('|')])
  const open = students.flatMap((student) => (questions[student.id] ?? []).filter((item) => item.status === 'open').map((item) => ({ ...item, studentName: student.displayName })))
  return <section className="private-question-inbox"><h3>Preguntes privades</h3>{!open.length && <p>No hi ha preguntes pendents.</p>}{open.map((item) => <article key={item.id}><strong>{item.studentName}</strong><p>{item.body}</p><textarea value={responses[item.id] ?? ''} onChange={(event) => setResponses({ ...responses, [item.id]: event.target.value })} /><button type="button" onClick={() => answerPrivateQuestion({ classId, studentId: item.ownerStudentId, questionId: item.id, response: responses[item.id] })}>Respon en privat</button></article>)}</section>
}

export default function TutorCommunityPanel({ tutorId, classroom, students }) {
  const [activity, setActivity] = useState({ tasksByStudent: {}, sessionsByStudent: {} }); const [decisions, setDecisions] = useState([]); const [corrections, setCorrections] = useState({})
  useEffect(() => observeTutorClassActivity({ classId: classroom.id, students }, setActivity, () => {}), [classroom.id, students.map((item) => item.id).join('|')])
  useEffect(() => observeCandidateDecisions({ classId: classroom.id }, setDecisions), [classroom.id])
  const candidates = useMemo(() => detectCommonTasks({ students, tasksByStudent: activity.tasksByStudent }).filter((candidate) => !decisions.some((decision) => decision.fingerprint === candidate.fingerprint && ['confirmed', 'dismissed'].includes(decision.status))), [students, activity, decisions])
  return <section className="tutor-community-panel"><CommunitySpace classId={classroom.id} role="tutor" actorId={tutorId} actorName="Tutor/a" />
    <section className="common-task-review"><div><p className="eyebrow">Detecció agregada</p><h3>Possibles deures comuns</h3><p>Llindar: 50% de la classe i un mínim de cinc alumnes. No es mostra cap identitat.</p></div>{students.length < 5 && <p>Calen almenys cinc alumnes actius per activar aquesta detecció.</p>}{!candidates.length && students.length >= 5 && <p>No hi ha coincidències pendents de revisió.</p>}{candidates.map((candidate) => { const correction = corrections[candidate.fingerprint] ?? {}; const deadlineValue = correction.deadlineAt ?? (candidate.deadline?.at ? new Date(new Date(candidate.deadline.at).getTime() - new Date(candidate.deadline.at).getTimezoneOffset() * 60000).toISOString().slice(0, 16) : ''); return <article key={candidate.fingerprint}><span>{candidate.count} coincidències · llindar {candidate.requiredCount}</span><label>Títol<input value={correction.title ?? candidate.title} onChange={(event) => setCorrections({ ...corrections, [candidate.fingerprint]: { ...correction, title: event.target.value } })} /></label><label>Data corregida<input type="datetime-local" value={deadlineValue} onChange={(event) => setCorrections({ ...corrections, [candidate.fingerprint]: { ...correction, deadlineAt: event.target.value } })} /></label><div className="actions"><button type="button" onClick={() => resolveCommonCandidate({ tutorId, classId: classroom.id, candidate, action: 'confirmed', correction: { title: correction.title ?? candidate.title, deadline: correction.deadlineAt ? { certainty: 'confirmed', at: new Date(correction.deadlineAt).toISOString(), timezone: 'Europe/Andorra' } : candidate.deadline } })}>Confirma o corregeix</button><button type="button" className="secondary" onClick={() => resolveCommonCandidate({ tutorId, classId: classroom.id, candidate, action: 'dismissed' })}>Descarta</button></div><small>No s’afegirà a cap alumne automàticament.</small></article> })}</section>
    <PrivateQuestionInbox classId={classroom.id} students={students} />
  </section>
}
