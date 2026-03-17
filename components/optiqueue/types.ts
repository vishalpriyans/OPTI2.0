export type CaseInput = {
  id: string
  name: string
  durationMinutes: number
  surgeon: string
  equipment: string
  priority: 1 | 2 | 3 | 4 | 5
}

export type ScheduledCase = CaseInput & {
  otIndex: number // 0..4
  startMinute: number // minutes after day start
  endMinute: number
  dayIndex: number // 0-6 (Monday-Sunday)
}

export type DayWindow = {
  startMinute: number // 0 at 07:00
  endMinute: number // 600 at 17:00
}

export type WeekWindow = {
  days: DayWindow[]
  startDate: Date // Monday of the week
}

export type WeeklyScheduleResult = {
  cases: ScheduledCase[]
  idleMinutes: number
  overtimeMinutes: number
  waitCost: number
  dailyStats: {
    [dayIndex: number]: {
      idleMinutes: number
      overtimeMinutes: number
      utilizationRate: number
    }
  }
}

export type ScheduleResult = {
  cases: ScheduledCase[]
  idleMinutes: number
  overtimeMinutes: number
  waitCost: number
}

export type FullSchedule = {
  optimized: ScheduleResult
  baseline: ScheduleResult
  kpis: KPIs
}

export type WeeklyFullSchedule = {
  optimized: WeeklyScheduleResult
  baseline: WeeklyScheduleResult
  kpis: KPIs
  weekWindow: WeekWindow
}

export type KPIs = {
  utilizationRate: number
  totalProjectedOvertime: number
  baselineUtilizationRate: number
  baselineOvertime: number
}

export const DEFAULT_DAY: DayWindow = { startMinute: 0, endMinute: 10 * 60 } // 07:00-17:00 => 600 min
export const DEFAULT_WEEK: WeekWindow = {
  days: Array.from({ length: 7 }, () => ({ ...DEFAULT_DAY })),
  startDate: new Date()
}
export const OTS = 5
export const TURNOVER_MINUTES = 30
export const DAYS_OF_WEEK = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun']

export function minutesToTime(dayStartHour = 7, minsAfterStart: number) {
  const totalMinutes = dayStartHour * 60 + minsAfterStart
  const hh = Math.floor(totalMinutes / 60)
  const mm = totalMinutes % 60
  const h12 = ((hh + 11) % 12) + 1
  const ampm = hh >= 12 ? "PM" : "AM"
  return `${h12}:${mm.toString().padStart(2, "0")} ${ampm}`
}
