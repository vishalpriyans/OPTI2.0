import { type CaseInput, type DayWindow, OTS, type ScheduleResult, type ScheduledCase } from "./types"

function clone<T>(x: T): T {
  return JSON.parse(JSON.stringify(x))
}

type ResourceState = {
  // For each resource (surgeon/equipment), track blocks of busy time
  surgeons: Record<string, Array<{ start: number; end: number }>>
  equipment: Record<string, Array<{ start: number; end: number }>>
}

function canFit(resources: ResourceState, start: number, end: number, surgeon: string, equipment: string) {
  const seg = { start, end }
  const overlaps = (a: { start: number; end: number }, b: { start: number; end: number }) =>
    a.start < b.end && b.start < a.end
  const listCheck = (arr?: Array<{ start: number; end: number }>) => (arr || []).some((b) => overlaps(seg, b))
  if (listCheck(resources.surgeons[surgeon])) return false
  if (listCheck(resources.equipment[equipment])) return false
  return true
}

function addResource(resources: ResourceState, start: number, end: number, surgeon: string, equipment: string) {
  resources.surgeons[surgeon] ||= []
  resources.equipment[equipment] ||= []
  resources.surgeons[surgeon].push({ start, end })
  resources.equipment[equipment].push({ start, end })
}

function earliestFeasibleStart(
  otTimeline: Array<{ end: number }>,
  resources: ResourceState,
  desiredStart: number,
  duration: number,
  day: DayWindow,
  surgeon: string,
  equipment: string,
) {
  // Find earliest time >= desiredStart where resource constraints allow
  // Timeline provides last end per OT row for sequential placement (with turnover)
  let t = Math.max(desiredStart, otTimeline.length ? otTimeline[otTimeline.length - 1].end : day.startMinute)
  // If OT has cases already, respect turnover after last end
  if (otTimeline.length) {
    t = Math.max(t, otTimeline[otTimeline.length - 1].end)
  }
  // Iterate forward until resources fit; step granularity 5 minutes
  while (t + duration <= day.endMinute + 12 * 60 /* allow overtime search */) {
    if (canFit(resources, t, t + duration, surgeon, equipment)) {
      return t
    }
    t += 5
  }
  return t // may go into overtime
}

function scheduleInOrder(cases: CaseInput[], day: DayWindow, turnover: number): ScheduleResult {
  // Build per-OT timelines and global resource state to respect constraints
  const perOT: Array<{ list: ScheduledCase[] }> = Array.from({ length: OTS }, () => ({ list: [] }))
  const resources: ResourceState = { surgeons: {}, equipment: {} }

  for (const c of cases) {
    // choose OT with earliest ready time
    let best: { otIndex: number; start: number } | null = null
    for (let ot = 0; ot < OTS; ot++) {
      const lastEnd = perOT[ot].list.length
        ? perOT[ot].list[perOT[ot].list.length - 1].endMinute + turnover
        : day.startMinute
      const start = earliestFeasibleStart(
        [{ end: lastEnd }],
        resources,
        lastEnd,
        c.durationMinutes,
        day,
        c.surgeon,
        c.equipment,
      )
      if (!best || start < best.start) best = { otIndex: ot, start }
    }
    const otIndex = best!.otIndex
    const startMinute = best!.start
    const endMinute = startMinute + c.durationMinutes
    perOT[otIndex].list.push({ ...c, otIndex, startMinute, endMinute })
    addResource(resources, startMinute, endMinute, c.surgeon, c.equipment)
  }

  const scheduled = perOT.flatMap((o) => o.list).sort((a, b) => a.startMinute - b.startMinute)
  return withMetrics(scheduled, day, turnover)
}

function withMetrics(scheduledCases: ScheduledCase[], day: DayWindow, turnover: number): ScheduleResult {
  // Idle time: sum of idle gaps within day window across OTs
  // Overtime: total minutes beyond day.endMinute for each OT day-end
  // Wait cost: sum(priority * wait) where wait is startMinute since day start (all cases available at 07:00)
  const perOT: Array<ScheduledCase[]> = Array.from({ length: OTS }, () => [])
  scheduledCases.forEach((c) => {
    perOT[c.otIndex].push(c)
  })
  perOT.forEach((list) => list.sort((a, b) => a.startMinute - b.startMinute))

  let idle = 0
  let overtime = 0
  for (let ot = 0; ot < OTS; ot++) {
    const list = perOT[ot]
    let t = day.startMinute
    for (const sc of list) {
      if (sc.startMinute > t) idle += Math.max(0, Math.min(sc.startMinute, day.endMinute) - Math.min(t, day.endMinute))
      t = sc.endMinute + turnover
    }
    const lastEnd = list.length ? list[list.length - 1].endMinute : day.startMinute
    const otEnd = Math.max(lastEnd, t - turnover)
    if (otEnd > day.endMinute) overtime += otEnd - day.endMinute
  }

  const waitCost = scheduledCases.reduce((acc, c) => acc + c.priority * Math.max(0, c.startMinute - day.startMinute), 0)
  return { cases: scheduledCases, idleMinutes: idle, overtimeMinutes: overtime, waitCost }
}

export function optimizeSchedule(casesInput: CaseInput[], day: DayWindow, turnover: number): ScheduleResult {
  const cases = clone(casesInput)
  // Greedy heuristic: sort by priority (urgent first) then by duration (longest first)
  cases.sort((a, b) => a.priority - b.priority || b.durationMinutes - a.durationMinutes)
  return scheduleInOrder(cases, day, turnover)
}

export function baselineSchedule(casesInput: CaseInput[], day: DayWindow, turnover: number): ScheduleResult {
  // Baseline: naive order (input order) with same feasibility constraints
  return scheduleInOrder(casesInput, day, turnover)
}

export function computeKPIs(optimized: ScheduleResult, baseline: ScheduleResult, day: DayWindow) {
  const totalORCapacity = OTS * (day.endMinute - day.startMinute)
  const utilized = optimized.cases.reduce((a, c) => a + (c.endMinute - c.startMinute), 0)
  const utilizedBaseline = baseline.cases.reduce((a, c) => a + (c.endMinute - c.startMinute), 0)
  const utilizationRate = Math.round((utilized / totalORCapacity) * 1000) / 10
  const baselineUtilizationRate = Math.round((utilizedBaseline / totalORCapacity) * 1000) / 10
  return {
    utilizationRate,
    baselineUtilizationRate,
    totalProjectedOvertime: optimized.overtimeMinutes,
    baselineOvertime: baseline.overtimeMinutes,
  }
}
