export const DEFAULT_SUBJECTS = Object.freeze([
  { id: 'ciencies-fisiques-natura', name: 'Ciències Físiques i de la Natura', color: '#7651b5' },
  { id: 'ciencies-humanes-socials', name: 'Ciències Humanes i Socials', color: '#a45f2c' },
  { id: 'educacio-fisica', name: 'Educació Física', color: '#2f78ad' },
  { id: 'angles', name: 'Anglès', color: '#a53d68' },
  { id: 'catala', name: 'Català', color: '#0f8b83' },
  { id: 'castella', name: 'Castellà', color: '#b94f35' },
  { id: 'frances', name: 'Francès', color: '#315f9e' },
  { id: 'matematiques', name: 'Matemàtiques', color: '#4f883f' },
  { id: 'educacio-musical', name: 'Educació musical', color: '#8d4c8e' },
  { id: 'tecnologia', name: 'Tecnologia', color: '#3d7180' },
  { id: 'visual-plastica', name: 'Visual i Plàstica', color: '#b86633' },
  { id: 'projecte-integrador', name: 'Projecte Integrador', color: '#67723d' },
  { id: 'situacio-global', name: 'Situació Global', color: '#596787' },
])

export const DEFAULT_SUBJECT_COLORS = Object.freeze(Object.fromEntries(
  DEFAULT_SUBJECTS.map(({ id, color }) => [id, color]),
))
