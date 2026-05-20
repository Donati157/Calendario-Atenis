// Barrel — fachada da camada OOP do calendário.

export {
  CalendarEvent,
  type EventCategory,
  type SerializedEvent,
} from "./CalendarEvent"

export {
  StudyEvent,
  ExamEvent,
  AssignmentEvent,
  SchoolDayEvent,
  SpecialDayEvent,
  eventFromJSON,
  isStudyEvent,
  isExamEvent,
  isAssignmentEvent,
  isSchoolDayEvent,
  isSpecialDayEvent,
} from "./EventTypes"

export { Period } from "./Period"
export { EventList } from "./EventList"
export { CalendarGrid, type DayCell } from "./CalendarGrid"
export { EventScheduler } from "./EventScheduler"

// Engine de rotação (substitui o antigo jose-schedule.ts).
export {
  ANCHOR,
  SPECIAL_EVENTS,
  RotationEngine,
  ROTATION_ID_PREFIX,
  MAX_DATE,
  isAfterMax,
} from "./rotation"
