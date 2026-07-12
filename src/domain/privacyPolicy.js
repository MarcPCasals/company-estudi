export const ROLES = Object.freeze({
  STUDENT: 'student',
  TUTOR: 'tutor',
})

export const VISIBILITY = Object.freeze({
  PERSONAL: 'personal',
  TUTORIAL: 'tutorial',
  COMMUNITY: 'community',
  AGGREGATED: 'aggregated',
})

const belongsToClass = (viewer, classId) => viewer.classIds?.includes(classId)

export const canViewResource = ({ viewer, resource }) => {
  if (!viewer || !resource) return false

  if (resource.visibility === VISIBILITY.PERSONAL) {
    return viewer.role === ROLES.STUDENT && viewer.studentId === resource.ownerStudentId
  }

  if (resource.visibility === VISIBILITY.TUTORIAL) {
    const isOwner =
      viewer.role === ROLES.STUDENT && viewer.studentId === resource.ownerStudentId
    const isTutor = viewer.role === ROLES.TUTOR && belongsToClass(viewer, resource.classId)
    return isOwner || isTutor
  }

  if (resource.visibility === VISIBILITY.COMMUNITY) {
    return belongsToClass(viewer, resource.classId)
  }

  if (resource.visibility === VISIBILITY.AGGREGATED) {
    return viewer.role === ROLES.TUTOR && belongsToClass(viewer, resource.classId)
  }

  return false
}

export const canEditResource = ({ viewer, resource }) => {
  if (!canViewResource({ viewer, resource })) return false

  if (viewer.role === ROLES.STUDENT) {
    return (
      resource.createdByRole === ROLES.STUDENT &&
      viewer.studentId === resource.ownerStudentId
    )
  }

  return viewer.role === ROLES.TUTOR && resource.createdByRole === ROLES.TUTOR
}
