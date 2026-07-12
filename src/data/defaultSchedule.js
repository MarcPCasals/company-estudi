export const WEEK_DAYS = Object.freeze([
  { id: 'monday', label: 'Dilluns' },
  { id: 'tuesday', label: 'Dimarts' },
  { id: 'wednesday', label: 'Dimecres' },
  { id: 'thursday', label: 'Dijous' },
  { id: 'friday', label: 'Divendres' },
  { id: 'saturday', label: 'Dissabte' },
  { id: 'sunday', label: 'Diumenge' },
])

export const DEFAULT_SCHOOL_SCHEDULE = Object.freeze({
  monday: { schoolEndsAt: '17:00' },
  tuesday: { schoolEndsAt: '17:00' },
  wednesday: { schoolEndsAt: '14:00' },
  thursday: { schoolEndsAt: '17:00' },
  friday: { schoolEndsAt: '17:00' },
  saturday: { schoolEndsAt: null },
  sunday: { schoolEndsAt: null },
})
