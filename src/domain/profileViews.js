const safeTaskForTutor = ({ privateNote: _privateNote, ...task }) => task

const safeSessionForTutor = ({ exactStart: _exactStart, ...session }) => session

const occupiedBlockForTutor = ({ day, durationMinutes }) => ({
  day,
  durationMinutes,
  label: 'Ocupat',
})

export const getStudentProfileView = (profile) => structuredClone(profile)

export const getTutorProfileView = (profile) => ({
  studentId: profile.studentId,
  classId: profile.classId,
  displayName: profile.displayName,
  academicTasks: profile.academicTasks.map(safeTaskForTutor),
  studySessions: profile.studySessions.map(safeSessionForTutor),
  personalAvailability: profile.personalSchedule.map(occupiedBlockForTutor),
  weeklyReview: profile.weeklyReview.submitted,
  tutorialGoal: profile.tutorialGoal,
  helpRequests: profile.helpRequests,
})

export const getCommunityProfileView = (profile) => ({
  studentId: profile.studentId,
  classId: profile.classId,
  displayName: profile.displayName,
  avatar: profile.gamification.sharedAvatar,
})

