import type { CaseInput, ScheduledCase, WeeklyFullSchedule } from "./types"
import { DEFAULT_DAY, TURNOVER_MINUTES, OTS } from "./types"

export function scheduleEmergencyCase(
  emergencyCase: CaseInput,
  currentSchedule: WeeklyFullSchedule | undefined,
  currentDayIndex: number
): { 
  updatedSchedule: WeeklyFullSchedule | undefined
  displacedCases: ScheduledCase[]
  conflicts: string[]
} {
  if (!currentSchedule) {
    return {
      updatedSchedule: undefined,
      displacedCases: [],
      conflicts: ["No current schedule found"]
    }
  }

  const conflicts: string[] = []
  const displacedCases: ScheduledCase[] = []
  const updatedCases = [...currentSchedule.optimized.cases]

  // Find the best OT for emergency case (preferably one with least conflicts)
  let bestOT = 0
  let minConflicts = Infinity

  for (let otIndex = 0; otIndex < OTS; otIndex++) {
    const dayCases = updatedCases.filter(c => c.dayIndex === currentDayIndex && c.otIndex === otIndex)
    const conflicts = findConflicts(emergencyCase, dayCases, currentDayIndex)
    
    if (conflicts.length < minConflicts) {
      minConflicts = conflicts.length
      bestOT = otIndex
    }
  }

  // Get cases in the best OT for current day
  const dayCases = updatedCases.filter(c => c.dayIndex === currentDayIndex && c.otIndex === bestOT)
  const emergencyConflicts = findConflicts(emergencyCase, dayCases, currentDayIndex)

  // Schedule emergency case at the earliest available slot
  const emergencyStartMinute = findEarliestSlot(dayCases, emergencyCase.durationMinutes)
  const emergencyEndMinute = emergencyStartMinute + emergencyCase.durationMinutes

  const emergencyScheduledCase: ScheduledCase = {
    ...emergencyCase,
    otIndex: bestOT,
    startMinute: emergencyStartMinute,
    endMinute: emergencyEndMinute,
    dayIndex: currentDayIndex
  }

  // Handle conflicts by rescheduling displaced cases
  for (const conflict of emergencyConflicts) {
    const displacedCase = updatedCases.find(c => c.id === conflict.caseId)
    if (displacedCase) {
      // Try to reschedule to next available day
      const rescheduledCase = rescheduleCase(displacedCase, updatedCases, currentDayIndex)
      if (rescheduledCase) {
        // Remove original case and add rescheduled one
        const caseIndex = updatedCases.findIndex(c => c.id === displacedCase.id)
        updatedCases[caseIndex] = rescheduledCase
        displacedCases.push(displacedCase)
        conflicts.push(`Case ${displacedCase.id} rescheduled to Day ${rescheduledCase.dayIndex + 1}`)
      } else {
        conflicts.push(`Case ${displacedCase.id} could not be rescheduled - removed from schedule`)
        // Remove the case that couldn't be rescheduled
        const caseIndex = updatedCases.findIndex(c => c.id === displacedCase.id)
        updatedCases.splice(caseIndex, 1)
        displacedCases.push(displacedCase)
      }
    }
  }

  // Add emergency case to schedule
  updatedCases.push(emergencyScheduledCase)

  // Update the schedule
  const updatedSchedule: WeeklyFullSchedule = {
    ...currentSchedule,
    optimized: {
      ...currentSchedule.optimized,
      cases: updatedCases
    }
  }

  return {
    updatedSchedule,
    displacedCases,
    conflicts
  }
}

function findConflicts(
  emergencyCase: CaseInput,
  existingCases: ScheduledCase[],
  dayIndex: number
): Array<{ caseId: string; conflictType: string }> {
  const conflicts: Array<{ caseId: string; conflictType: string }> = []
  const emergencyStart = 0 // Emergency cases start immediately
  const emergencyEnd = emergencyCase.durationMinutes

  for (const existingCase of existingCases) {
    // Check for time overlap
    if (
      (emergencyStart < existingCase.endMinute && emergencyEnd > existingCase.startMinute) ||
      // Check for surgeon conflict
      emergencyCase.surgeon === existingCase.surgeon ||
      // Check for equipment conflict
      emergencyCase.equipment === existingCase.equipment
    ) {
      conflicts.push({
        caseId: existingCase.id,
        conflictType: "time_surgeon_equipment"
      })
    }
  }

  return conflicts
}

function findEarliestSlot(dayCases: ScheduledCase[], duration: number): number {
  // Sort cases by start time
  const sortedCases = [...dayCases].sort((a, b) => a.startMinute - b.startMinute)
  
  // Check if we can fit at the beginning of the day
  if (sortedCases.length === 0 || sortedCases[0].startMinute >= duration) {
    return 0
  }

  // Find gaps between cases
  for (let i = 0; i < sortedCases.length - 1; i++) {
    const currentEnd = sortedCases[i].endMinute + TURNOVER_MINUTES
    const nextStart = sortedCases[i + 1].startMinute
    const gap = nextStart - currentEnd
    
    if (gap >= duration) {
      return currentEnd
    }
  }

  // Try to fit at the end of the day
  const lastCase = sortedCases[sortedCases.length - 1]
  const endTime = lastCase.endMinute + TURNOVER_MINUTES
  if (endTime + duration <= DEFAULT_DAY.endMinute) {
    return endTime
  }

  // If no slot found, return 0 (will cause overtime)
  return 0
}

function rescheduleCase(
  caseToReschedule: ScheduledCase,
  allCases: ScheduledCase[],
  excludeDayIndex: number
): ScheduledCase | null {
  // Try to reschedule to next available day
  for (let dayIndex = 0; dayIndex < 7; dayIndex++) {
    if (dayIndex === excludeDayIndex) continue

    const dayCases = allCases.filter(c => c.dayIndex === dayIndex && c.otIndex === caseToReschedule.otIndex)
    const availableSlot = findEarliestSlot(dayCases, caseToReschedule.durationMinutes)
    
    if (availableSlot + caseToReschedule.durationMinutes <= DEFAULT_DAY.endMinute) {
      return {
        ...caseToReschedule,
        dayIndex,
        startMinute: availableSlot,
        endMinute: availableSlot + caseToReschedule.durationMinutes
      }
    }
  }

  return null
}
