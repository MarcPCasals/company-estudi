export const demoProfile = {
  studentId: 'student-1',
  classId: 'class-3a',
  displayName: 'Alba M.',
  academicTasks: [
    {
      id: 'task-1',
      subject: 'Castellà',
      title: 'Exercicis 4-8, pàgina 36',
      deadline: '2026-07-17T23:59:00+02:00',
      status: 'planned',
      plannedDays: ['Dimecres'],
      estimatedMinutes: 20,
      privateNote: 'Recordar de preguntar el dubte de l’exercici 6.',
    },
  ],
  studySessions: [
    {
      id: 'session-1',
      taskId: 'task-1',
      day: 'Dimecres',
      durationMinutes: 20,
      exactStart: '17:45',
    },
  ],
  personalSchedule: [
    {
      id: 'personal-1',
      label: 'Entrenament de futbol',
      day: 'Dimecres',
      exactStart: '16:00',
      durationMinutes: 90,
    },
  ],
  privateNotes: 'Aquesta setmana vull provar de començar abans.',
  weeklyReview: {
    draft: 'Encara ho estic pensant.',
    submitted: {
      workedWell: 'Dividir el treball en dues parts.',
      nextGoal: 'Estimar millor els exercicis de matemàtiques.',
      helpStatus: 'under-control',
    },
  },
  tutorialGoal: {
    competency: 'Gestió del temps',
    description: 'Comparar el temps estimat i el real en tres tasques.',
  },
  helpRequests: [],
  gamification: {
    xp: 340,
    level: 4,
    sharedAvatar: 'Company explorador',
  },
  technicalActivity: {
    lastLoginAt: '2026-07-12T09:12:00+02:00',
  },
}

