import type { ScheduledCase } from "./types"
import { OTS, DEFAULT_DAY, TURNOVER_MINUTES } from "./types"
import type { ConflictConstraint } from "./conflict-detector"

const DAY_END = DEFAULT_DAY.endMinute
const TURNOVER = TURNOVER_MINUTES

type ResolveResult = { cases: ScheduledCase[]; fixed: boolean }

// ── Internal helpers ──────────────────────────────────────────────────────────

/** Last endMinute of any case in a given OT (0 if OT is empty) */
function lastEndInOT(cases: ScheduledCase[], otIndex: number): number {
  return cases
    .filter(c => c.otIndex === otIndex)
    .reduce((max, c) => Math.max(max, c.endMinute), 0)
}

/**
 * Find the OT (excluding the given one) where the next free slot starts earliest.
 * Returns { otIndex, nextFreeMinute }.
 */
function findBestOT(
  cases: ScheduledCase[],
  excludeOtIndex: number
): { otIndex: number; nextFreeMinute: number } {
  let best = { otIndex: -1, nextFreeMinute: Infinity }
  for (let ot = 0; ot < OTS; ot++) {
    if (ot === excludeOtIndex) continue
    const free = lastEndInOT(cases, ot) + TURNOVER
    if (free < best.nextFreeMinute) {
      best = { otIndex: ot, nextFreeMinute: free }
    }
  }
  return best
}

/** Pick which of two cases to move — never move emergency (priority 1) */
function pickCaseToMove(a: ScheduledCase, b: ScheduledCase): ScheduledCase {
  if (a.priority === 1) return b
  if (b.priority === 1) return a
  // higher priority number = lower urgency → move that one
  if (a.priority !== b.priority) return a.priority > b.priority ? a : b
  // same priority → move the one that starts later
  return a.startMinute >= b.startMinute ? a : b
}

/** Replace one case in the array by ID, returning a new array */
function replaceCase(cases: ScheduledCase[], updated: ScheduledCase): ScheduledCase[] {
  return cases.map(c => (c.id === updated.id ? updated : c))
}

// ── Conflict-type resolvers ───────────────────────────────────────────────────

function resolveSurgeonOrEquipment(
  toMove: ScheduledCase,
  anchor: ScheduledCase,
  cases: ScheduledCase[]
): ResolveResult {
  const newStart = anchor.endMinute + TURNOVER
  const newEnd = newStart + toMove.durationMinutes

  if (newEnd <= DAY_END) {
    return {
      cases: replaceCase(cases, { ...toMove, startMinute: newStart, endMinute: newEnd }),
      fixed: true,
    }
  }

  // No room in current OT — find best alternative OT
  const best = findBestOT(cases, toMove.otIndex)
  if (best.otIndex === -1) return { cases, fixed: false }

  const altStart = best.nextFreeMinute
  const altEnd = altStart + toMove.durationMinutes
  if (altEnd > DAY_END) return { cases, fixed: false }

  return {
    cases: replaceCase(cases, {
      ...toMove,
      otIndex: best.otIndex,
      startMinute: altStart,
      endMinute: altEnd,
    }),
    fixed: true,
  }
}

function resolveTimeOrOT(
  toMove: ScheduledCase,
  anchor: ScheduledCase,
  cases: ScheduledCase[]
): ResolveResult {
  // Try shifting later in the same OT
  const newStart = anchor.endMinute + TURNOVER
  const newEnd = newStart + toMove.durationMinutes

  if (newEnd <= DAY_END) {
    return {
      cases: replaceCase(cases, { ...toMove, startMinute: newStart, endMinute: newEnd }),
      fixed: true,
    }
  }

  // No room — reassign to OT with most free time
  const best = findBestOT(cases, toMove.otIndex)
  if (best.otIndex === -1) return { cases, fixed: false }

  const altStart = best.nextFreeMinute
  const altEnd = altStart + toMove.durationMinutes
  if (altEnd > DAY_END) return { cases, fixed: false }

  return {
    cases: replaceCase(cases, {
      ...toMove,
      otIndex: best.otIndex,
      startMinute: altStart,
      endMinute: altEnd,
    }),
    fixed: true,
  }
}

function resolvePriority(
  emergency: ScheduledCase,
  nonEmergency: ScheduledCase,
  cases: ScheduledCase[]
): ResolveResult {
  // Swap their start times; keep each duration intact
  const updatedEmergency: ScheduledCase = {
    ...emergency,
    startMinute: nonEmergency.startMinute,
    endMinute: nonEmergency.startMinute + emergency.durationMinutes,
  }
  const updatedNonEmergency: ScheduledCase = {
    ...nonEmergency,
    startMinute: emergency.startMinute,
    endMinute: emergency.startMinute + nonEmergency.durationMinutes,
  }
  const fixed = replaceCase(replaceCase(cases, updatedEmergency), updatedNonEmergency)
  return { cases: fixed, fixed: true }
}

// ── Public API ────────────────────────────────────────────────────────────────

export function resolveConflict(
  conflict: ConflictConstraint,
  scheduledCases: ScheduledCase[]
): ResolveResult {
  const [idA, idB] = conflict.affectedCases
  const caseA = scheduledCases.find(c => c.id === idA)
  const caseB = scheduledCases.find(c => c.id === idB)

  // If either case no longer exists in the schedule, nothing to fix
  if (!caseA || !caseB) return { cases: scheduledCases, fixed: false }

  switch (conflict.type) {
    case "surgeon":
    case "equipment": {
      const toMove = pickCaseToMove(caseA, caseB)
      const anchor = toMove.id === caseA.id ? caseB : caseA
      return resolveSurgeonOrEquipment(toMove, anchor, scheduledCases)
    }

    case "time":
    case "ot": {
      const toMove = pickCaseToMove(caseA, caseB)
      const anchor = toMove.id === caseA.id ? caseB : caseA
      return resolveTimeOrOT(toMove, anchor, scheduledCases)
    }

    case "priority": {
      const emergency    = caseA.priority === 1 ? caseA : caseB
      const nonEmergency = caseA.priority === 1 ? caseB : caseA
      return resolvePriority(emergency, nonEmergency, scheduledCases)
    }

    default:
      return { cases: scheduledCases, fixed: false }
  }
}
