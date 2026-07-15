import { useEffect, useMemo, useState } from 'react'
import { addOfficialTaskToStudent, createRoomPost, loadCommunitySettings, loadRoomRead, markRoomRead, observeAccessibleRooms, observeOfficialTasks, observeRoomPosts, observeRoomReports, observeUsefulMarks, reportPost, resolveReport, saveCommunitySettings, toggleUsefulMark, updatePostState } from '../services/communityService.js'

const POST_LABELS = { question: 'Dubte', resource: 'Recurs', notice: 'Avís' }
const toMillis = (value) => value?.toMillis?.() ?? ((value?.seconds ?? 0) * 1000)
const formatPostDate = (value) => {
  const milliseconds = toMillis(value)
  return milliseconds ? new Intl.DateTimeFormat('ca-AD', { dateStyle: 'medium' }).format(new Date(milliseconds)) : 'Ara mateix'
}

function UsefulButton({ classId, roomId, postId, studentId }) {
  const [marks, setMarks] = useState([])
  useEffect(() => observeUsefulMarks({ classId, roomId, postId }, setMarks), [classId, roomId, postId])
  const active = marks.includes(studentId)
  return <button type="button" className="secondary" onClick={() => toggleUsefulMark({ classId, roomId, postId, studentId, active })}>{active ? '✓ Útil' : 'Marca útil'} · {marks.length}</button>
}

function RoomBadge({ classId, room, visitedAt, onCount }) {
  useEffect(() => observeRoomPosts({ classId, roomId: room.id }, (items) => onCount(items.filter((post) => !visitedAt || toMillis(post.createdAt) > visitedAt).length), () => {}), [classId, room.id, visitedAt])
  return null
}

export default function CommunitySpace({ classId, role, actorId, actorName, studentId = null }) {
  const [rooms, setRooms] = useState([])
  const [roomId, setRoomId] = useState('')
  const [posts, setPosts] = useState([])
  const [postsByRoom, setPostsByRoom] = useState({})
  const [viewMode, setViewMode] = useState('recent')
  const [activityFilter, setActivityFilter] = useState('all')
  const [counts, setCounts] = useState({})
  const [visited, setVisited] = useState({})
  const [search, setSearch] = useState('')
  const [composerOpen, setComposerOpen] = useState(false)
  const [selectedPostId, setSelectedPostId] = useState(null)
  const [draft, setDraft] = useState({ type: role === 'tutor' ? 'notice' : 'question', title: '', body: '' })
  const [reply, setReply] = useState('')
  const [reports, setReports] = useState([])
  const [officialTasks, setOfficialTasks] = useState([])
  const [settings, setSettings] = useState({ mode: 'daily_summary', quietStart: '21:30', quietEnd: '07:30' })
  const [status, setStatus] = useState({ state: 'idle', message: '' })

  useEffect(() => observeAccessibleRooms({ classId }, (items) => { setRooms(items); setRoomId((current) => { if (current && items.some((room) => room.id === current)) return current; try { const remembered = globalThis.localStorage?.getItem(`company-estudi:last-room:${classId}`); if (remembered && items.some((room) => room.id === remembered)) return remembered } catch {} return items[0]?.id || '' }) }), [classId])
  useEffect(() => {
    const stops = rooms.map((room) => observeRoomPosts({ classId, roomId: room.id }, (items) => setPostsByRoom((current) => ({ ...current, [room.id]: items })), () => {}))
    return () => stops.forEach((stop) => stop())
  }, [classId, rooms.map((room) => room.id).join('|')])
  useEffect(() => {
    if (!studentId || !rooms.length) return undefined
    Promise.all(rooms.map(async (room) => [room.id, await loadRoomRead({ classId, studentId, roomId: room.id })])).then((entries) => setVisited((current) => ({ ...Object.fromEntries(entries), ...current })))
    return undefined
  }, [classId, studentId, rooms.map((room) => room.id).join('|')])
  useEffect(() => {
    if (!studentId || !roomId || viewMode !== 'room') return
    const now = Date.now()
    setVisited((current) => ({ ...current, [roomId]: now }))
    setCounts((current) => ({ ...current, [roomId]: 0 }))
    markRoomRead({ classId, studentId, roomId })
  }, [classId, studentId, roomId, viewMode])
  useEffect(() => roomId ? observeRoomPosts({ classId, roomId }, setPosts, (error) => setStatus({ state: 'error', message: error.message })) : undefined, [classId, roomId])
  useEffect(() => role === 'tutor' && roomId ? observeRoomReports({ classId, roomId }, setReports, () => {}) : undefined, [classId, roomId, role])
  useEffect(() => observeOfficialTasks({ classId }, setOfficialTasks, () => {}), [classId])
  useEffect(() => { if (studentId) loadCommunitySettings({ classId, studentId }).then((value) => value && setSettings(value)) }, [classId, studentId])

  const currentRoom = rooms.find((room) => room.id === roomId)
  const visibleParents = useMemo(() => posts
    .filter((post) => !post.parentPostId && (role === 'tutor' || !post.hidden))
    .sort((left, right) => toMillis(right.createdAt) - toMillis(left.createdAt)), [posts, role])
  const filteredPosts = useMemo(() => {
    const term = search.trim().toLowerCase()
    return term ? visibleParents.filter((post) => `${post.title} ${post.body} ${post.authorName}`.toLowerCase().includes(term)) : visibleParents
  }, [visibleParents, search])
  const selectedPost = visibleParents.find((post) => post.id === selectedPostId)
  const responses = selectedPost ? posts.filter((post) => post.parentPostId === selectedPost.id && (role === 'tutor' || !post.hidden)) : []

  const selectRoom = (id) => {
    setViewMode('room')
    setRoomId(id)
    setPosts(postsByRoom[id] ?? [])
    setSelectedPostId(null)
    setComposerOpen(false)
    setSearch('')
    const now = Date.now()
    setVisited((current) => ({ ...current, [id]: now }))
    setCounts((current) => ({ ...current, [id]: 0 }))
    if (studentId) markRoomRead({ classId, studentId, roomId: id })
    try { globalThis.localStorage?.setItem(`company-estudi:last-room:${classId}`, id) } catch {}
  }
  const recentThreads = useMemo(() => rooms.flatMap((room) => {
    const roomPosts = postsByRoom[room.id] ?? []
    return roomPosts.filter((post) => !post.parentPostId && (role === 'tutor' || !post.hidden)).map((post) => ({ ...post, roomId: room.id, roomName: room.name, responseCount: roomPosts.filter((item) => item.parentPostId === post.id && (role === 'tutor' || !item.hidden)).length }))
  }).filter((post) => activityFilter === 'all'
    || (activityFilter === 'mine' && post.authorStudentId === studentId)
    || (activityFilter === 'unanswered' && post.responseCount === 0)
    || (activityFilter === 'resolved' && post.resolved)
    || (activityFilter === 'resources' && post.type === 'resource'))
    .filter((post) => !search.trim() || `${post.title} ${post.body} ${post.authorName} ${post.roomName}`.toLowerCase().includes(search.trim().toLowerCase()))
    .sort((left, right) => toMillis(right.createdAt) - toMillis(left.createdAt)), [activityFilter, postsByRoom, role, rooms, search, studentId])
  const activeRooms = rooms.filter((room) => (postsByRoom[room.id]?.some((post) => !post.parentPostId && (role === 'tutor' || !post.hidden))) || room.id === roomId)
  const submitPost = async (event) => {
    event.preventDefault()
    setStatus({ state: 'loading', message: 'Publicant…' })
    try {
      await createRoomPost({ classId, roomId, author: { role, id: actorId, name: actorName }, input: draft })
      setDraft((current) => ({ ...current, title: '', body: '' }))
      setComposerOpen(false)
      setStatus({ state: 'success', message: role === 'tutor' ? 'Publicació enviada.' : 'El teu dubte ja és al fòrum.' })
    } catch (error) { setStatus({ state: 'error', message: error.message }) }
  }
  const submitReply = async (event) => {
    event.preventDefault()
    if (!selectedPost || !reply.trim()) return
    try {
      await createRoomPost({ classId, roomId, author: { role, id: actorId, name: actorName }, parentPostId: selectedPost.id, input: { body: reply } })
      setReply('')
      setStatus({ state: 'success', message: 'Resposta publicada.' })
    } catch (error) { setStatus({ state: 'error', message: error.message }) }
  }

  return <section className="community-space">
    <div className="community-heading">
      <div><p className="eyebrow">Fòrum de la classe</p><h2>Comunitat</h2><p>Comparteix dubtes i ajuda els companys a les sales de cada assignatura.</p></div>
      <span>Les publicacions mostren sempre qui les ha escrit.</span>
    </div>

    <div className="community-forum-layout">
      <aside className="forum-sidebar" aria-label="Sales del fòrum">
        <strong>Comença aquí</strong>
        <button type="button" className={viewMode === 'recent' ? 'room-card active recent-room-button' : 'room-card recent-room-button'} onClick={() => { setViewMode('recent'); setSelectedPostId(null); setComposerOpen(false) }}>Activitat recent</button>
        <strong>Sales amb activitat</strong>
        <div className="room-cards">{activeRooms.map((room) => <button type="button" className={viewMode === 'room' && roomId === room.id ? 'room-card active' : 'room-card'} key={room.id} onClick={() => selectRoom(room.id)}><span>{room.name}</span>{studentId && counts[room.id] > 0 && <b>{counts[room.id]}</b>}{studentId && <RoomBadge classId={classId} room={room} visitedAt={visited[room.id]} onCount={(count) => setCounts((current) => ({ ...current, [room.id]: count }))} />}</button>)}</div>
        <details className="all-community-rooms"><summary>Totes les sales ({rooms.length})</summary><div className="room-cards">{rooms.filter((room) => !activeRooms.some((active) => active.id === room.id)).map((room) => <button type="button" className="room-card" key={room.id} onClick={() => selectRoom(room.id)}>{room.name}</button>)}</div></details>
      </aside>

      {viewMode === 'recent' && <main className="community-room community-recent"><header className="forum-room-header"><div><p className="eyebrow">Totes les sales</p><h3>Activitat recent</h3></div></header><div className="community-activity-filters" role="group" aria-label="Filtra l’activitat">{[['all', 'Tot'], ['mine', 'Els meus dubtes'], ['unanswered', 'Sense resposta'], ['resolved', 'Resolts'], ['resources', 'Recursos']].map(([value, label]) => <button type="button" className={activityFilter === value ? '' : 'secondary'} aria-pressed={activityFilter === value} key={value} onClick={() => setActivityFilter(value)}>{label}</button>)}</div><label className="community-global-search">Cerca a totes les sales<input value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Tema, dubte, persona o assignatura…" /></label><div className="forum-thread-list">{recentThreads.length === 0 && <div className="forum-empty"><strong>Encara no hi ha activitat amb aquest filtre</strong><p>Pots entrar en una sala i obrir el primer dubte.</p></div>}{recentThreads.map((post) => <article className="forum-thread-row" key={`${post.roomId}-${post.id}`}><button type="button" className="forum-thread-open" onClick={() => { selectRoom(post.roomId); setSelectedPostId(post.id); setReply('') }}><span className={`post-type ${post.type}`}>{POST_LABELS[post.type] ?? post.type}</span><span className="thread-summary"><strong>{post.title}</strong><small>{post.roomName} · {post.authorName} · {formatPostDate(post.createdAt)}</small></span>{post.resolved && <span className="resolved-badge">Resol</span>}<span className="thread-replies"><b>{post.responseCount}</b>{post.responseCount === 1 ? ' resposta' : ' respostes'} <i aria-hidden="true">›</i></span></button></article>)}</div></main>}

      {viewMode === 'room' && roomId && <main className="community-room">
        <header className="forum-room-header">
          <div><p className="eyebrow">Sala actual</p><h3>{currentRoom?.name ?? 'Sala'}</h3></div>
          {!selectedPost && <button type="button" onClick={() => setComposerOpen((open) => !open)}>{composerOpen ? 'Tanca' : role === 'tutor' ? '+ Nova publicació' : '+ Obre un dubte'}</button>}
        </header>

        {!selectedPost && composerOpen && <form className="community-post-form" onSubmit={submitPost}>
          <div><h3>{role === 'tutor' ? 'Nova publicació' : 'Quin dubte tens?'}</h3><p>Posa un títol clar perquè els companys entenguin ràpidament en què et poden ajudar.</p></div>
          <label>Tipus<select value={draft.type} onChange={(event) => setDraft({ ...draft, type: event.target.value })}>{role === 'student' && <option value="question">Dubte</option>}<option value="resource">Recurs</option>{role === 'tutor' && <option value="notice">Avís</option>}{role === 'tutor' && <option value="question">Pregunta</option>}</select></label>
          <label>Títol<input required maxLength="100" value={draft.title} onChange={(event) => setDraft({ ...draft, title: event.target.value })} placeholder="Ex.: Com es resol l’exercici 4?" /></label>
          <label className="post-body-label">Explica-ho<textarea required maxLength="2000" value={draft.body} onChange={(event) => setDraft({ ...draft, body: event.target.value })} placeholder="Explica què has provat i en quin punt t’has encallat…" /></label>
          <div className="composer-actions"><button type="button" className="secondary" onClick={() => setComposerOpen(false)}>Cancel·la</button><button>Publica al fòrum</button></div>
        </form>}

        {!selectedPost && <>
          <div className="community-toolbar"><label><span>Cerca només a aquesta sala</span><input value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Dubte, tema o persona…" /></label><span>{filteredPosts.length} {filteredPosts.length === 1 ? 'fil' : 'fils'}</span></div>
          <div className="forum-thread-list">
            {!filteredPosts.length && <div className="forum-empty"><strong>{search ? 'No hem trobat cap fil' : 'Encara no hi ha cap conversa'}</strong><p>{search ? 'Prova una altra cerca.' : role === 'tutor' ? 'Pots obrir la primera publicació de la sala.' : 'Obre el primer dubte i comença la conversa.'}</p></div>}
            {filteredPosts.map((post) => {
              const responseCount = posts.filter((item) => item.parentPostId === post.id && (role === 'tutor' || !item.hidden)).length
              return <article className={`forum-thread-row ${post.hidden ? 'hidden' : ''}`} key={post.id}>
                <button type="button" className="forum-thread-open" onClick={() => { setSelectedPostId(post.id); setReply('') }}>
                  <span className={`post-type ${post.type}`}>{POST_LABELS[post.type] ?? post.type}</span>
                  <span className="thread-summary"><strong>{post.title}</strong><small>{post.authorName} · {formatPostDate(post.createdAt)}</small></span>
                  {post.resolved && <span className="resolved-badge">Resol</span>}
                  <span className="thread-replies"><b>{responseCount}</b>{responseCount === 1 ? ' resposta' : ' respostes'} <i aria-hidden="true">›</i></span>
                </button>
              </article>
            })}
          </div>
        </>}

        {selectedPost && <article className={`community-post thread-detail ${selectedPost.hidden ? 'hidden' : ''}`}>
          <button type="button" className="thread-back" onClick={() => setSelectedPostId(null)}>← Torna a tots els fils</button>
          <header><span className={`post-type ${selectedPost.type}`}>{POST_LABELS[selectedPost.type] ?? selectedPost.type}</span><div><h3>{selectedPost.title}</h3><small>{selectedPost.authorName} · {formatPostDate(selectedPost.createdAt)}</small></div>{selectedPost.resolved && <span className="resolved-badge">Dubte resolt</span>}</header>
          <p className="thread-body">{selectedPost.body}</p>
          <div className="community-post-actions">{studentId && <UsefulButton classId={classId} roomId={roomId} postId={selectedPost.id} studentId={studentId} />}{selectedPost.type === 'question' && (role === 'tutor' || selectedPost.authorStudentId === studentId) && <button type="button" className="secondary" onClick={() => updatePostState({ classId, roomId, postId: selectedPost.id, changes: { resolved: !selectedPost.resolved } })}>{selectedPost.resolved ? 'Reobre el dubte' : 'Marca com a resolt'}</button>}{studentId && selectedPost.authorStudentId !== studentId && <button type="button" className="secondary" onClick={() => reportPost({ classId, roomId, postId: selectedPost.id, studentId, reason: 'Revisió de moderació sol·licitada.' })}>Demana revisió</button>}{role === 'tutor' && <button type="button" className="secondary" onClick={() => updatePostState({ classId, roomId, postId: selectedPost.id, changes: { hidden: !selectedPost.hidden } })}>{selectedPost.hidden ? 'Mostra' : 'Oculta'}</button>}</div>
          <section className="community-replies"><h4>Respostes ({responses.length})</h4>{!responses.length && <p className="no-replies">Encara no hi ha cap resposta. Pots ser la primera persona a ajudar.</p>}{responses.map((item) => <article key={item.id}><div><strong>{item.authorName}</strong><small>{formatPostDate(item.createdAt)}</small></div><p>{item.body}</p>{item.validated && <b>✓ Resposta validada pel tutor</b>}<div>{role === 'tutor' && <button type="button" className="secondary" onClick={() => updatePostState({ classId, roomId, postId: item.id, changes: { validated: !item.validated } })}>{item.validated ? 'Treu la validació' : 'Valida la resposta'}</button>}{studentId && <UsefulButton classId={classId} roomId={roomId} postId={item.id} studentId={studentId} />}</div></article>)}</section>
          <form className="reply-box" onSubmit={submitReply}><label>La teva resposta<textarea required value={reply} onChange={(event) => setReply(event.target.value)} placeholder="Escriu una resposta que ajudi a avançar…" /></label><button>Publica la resposta</button></form>
        </article>}

        {role === 'tutor' && reports.filter((item) => item.status === 'open').map((report) => <div className="moderation-alert" key={report.id}><span>Hi ha una publicació pendent de revisar.</span><button type="button" onClick={() => resolveReport({ classId, roomId, reportId: report.id })}>Marca revisada</button></div>)}
      </main>}
    </div>

    {studentId && <details className="community-preferences"><summary>Preferències de notificació</summary><form onSubmit={async (event) => { event.preventDefault(); await saveCommunitySettings({ classId, studentId, input: settings }); setStatus({ state: 'success', message: 'Preferències de notificació desades.' }) }}><label>Mode<select value={settings.mode} onChange={(event) => setSettings({ ...settings, mode: event.target.value })}><option value="instant">Avisos dins l’app</option><option value="daily_summary">Resum diari</option><option value="disabled">Desactivades</option></select></label><label>Silenci des de<input type="time" value={settings.quietStart} onChange={(event) => setSettings({ ...settings, quietStart: event.target.value })} /></label><label>Fins a<input type="time" value={settings.quietEnd} onChange={(event) => setSettings({ ...settings, quietEnd: event.target.value })} /></label><button>Desa els canvis</button></form></details>}
    {studentId && officialTasks.length > 0 && <section className="official-community-tasks"><h3>Tasques confirmades pel tutor</h3>{officialTasks.map((task) => <article key={task.id}><strong>{task.title}</strong><span>No s’ha afegit automàticament.</span><button type="button" onClick={() => addOfficialTaskToStudent({ classId, studentId, task })}>Afegeix al meu espai</button></article>)}</section>}
    {status.message && <p className={`form-status ${status.state}`} role="status">{status.message}</p>}
  </section>
}
