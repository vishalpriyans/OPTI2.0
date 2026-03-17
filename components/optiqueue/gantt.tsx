"use client"
import { useEffect, useState } from "react"
import { useSchedule, useWeeklySchedule } from "./store"
import { DEFAULT_DAY, DEFAULT_WEEK, minutesToTime, OTS, type ScheduledCase, TURNOVER_MINUTES, DAYS_OF_WEEK, type WeeklyFullSchedule } from "./types"
import { scoreDelayRisk } from "./delay-risk-scorer"
import type { MLDelayRisk } from "./ml-types"
import { cn } from "@/lib/utils"
import type { JSX } from "react" // Declare JSX variable

const TOTAL_MINUTES = DEFAULT_DAY.endMinute - DEFAULT_DAY.startMinute

/** Build a delayRiskMap from scheduled cases using the TypeScript heuristic scorer */
function buildRiskMap(cases: ScheduledCase[]): Record<string, MLDelayRisk> {
  const map: Record<string, MLDelayRisk> = {}
  const otPositions: Record<number, number> = {}
  const sorted = [...cases].sort((a, b) => a.startMinute - b.startMinute)
  sorted.forEach((c: ScheduledCase) => {
    otPositions[c.otIndex] = (otPositions[c.otIndex] ?? 0) + 1
    const startHour = 7 + Math.floor(c.startMinute / 60)
    const iso = new Date()
    iso.setHours(startHour, c.startMinute % 60, 0, 0)
    map[c.id] = scoreDelayRisk(
      { checklist: { consent: true, labsOk: true }, patient: { asa: "ASA 2" }, scheduledStartISO: iso.toISOString() },
      otPositions[c.otIndex],
      0
    )
  })
  return map
}

function RiskDot({ riskLevel }: { riskLevel: "low" | "medium" | "high" }) {
  if (riskLevel === "low") return null
  return (
    <span
      className={cn(
        "absolute top-1 right-1 w-2 h-2 rounded-full",
        riskLevel === "high" ? "bg-red-400 animate-pulse" : "bg-amber-400"
      )}
      title={`${riskLevel === "high" ? "High" : "Medium"} delay risk`}
    />
  )
}

function getPriorityClass(priority: number): string {
  switch (priority) {
    case 1:
      return "priority-emergency"
    case 2:
      return "priority-high"
    case 3:
      return "priority-medium"
    case 4:
      return "priority-low"
    case 5:
      return "priority-elective"
    default:
      return "priority-elective"
  }
}

export function Gantt({
  delayedIds,
  isWeekly = false,
  aiChangedIds,
}: {
  delayedIds: Set<string>
  isWeekly?: boolean
  aiChangedIds?: Set<string>
}) {
  const { schedule } = useSchedule()
  const [flashIds, setFlashIds] = useState<Set<string>>(new Set())

  // Flash AI-changed cases gold for 2s then fade
  useEffect(() => {
    if (!aiChangedIds?.size) return
    setFlashIds(aiChangedIds)
    const t = setTimeout(() => setFlashIds(new Set()), 2000)
    return () => clearTimeout(t)
  }, [aiChangedIds])

  if (isWeekly) {
    return <WeeklyGantt delayedIds={delayedIds} aiChangedIds={aiChangedIds} />
  }

  const cases = schedule?.optimized.cases || []
  const riskMap = buildRiskMap(cases)
  const perOT: Array<ScheduledCase[]> = Array.from({ length: OTS }, () => [])
  cases.forEach((c) => perOT[c.otIndex].push(c))
  perOT.forEach((row) => row.sort((a, b) => a.startMinute - b.startMinute))

  return (
    <div className="space-y-3">
      <TimeAxis />
      <div className="space-y-3">
        {perOT.map((row, idx) => {
          const rowRender = renderRow(row, delayedIds, riskMap, flashIds)
          const laneCount = Math.max(1, rowRender.laneCount)
          return (
            <div key={idx} className="flex items-center gap-3">
              <div className="w-20 text-sm font-semibold text-foreground bg-gradient-to-r from-primary/10 to-primary/5 px-3 py-2 rounded-lg border">
                OT {idx + 1}
              </div>
              <div
                className="relative flex-1 rounded-xl ot-row overflow-hidden shadow-sm"
                style={{ height: `${laneCount * 3}rem` }}
              >
                {rowRender.blocks}
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}

function WeeklyGantt({ delayedIds, aiChangedIds }: { delayedIds: Set<string>; aiChangedIds?: Set<string> }) {
  const { weeklySchedule } = useWeeklySchedule()
  const cases = weeklySchedule?.optimized?.cases ?? (weeklySchedule as any)?.cases ?? []
  const riskMap = buildRiskMap(cases)
  const [flashIds, setFlashIds] = useState<Set<string>>(new Set())

  useEffect(() => {
    if (!aiChangedIds?.size) return
    setFlashIds(aiChangedIds)
    const t = setTimeout(() => setFlashIds(new Set()), 2000)
    return () => clearTimeout(t)
  }, [aiChangedIds])
  
  // Group cases by OT and day
  const perOTPerDay: Array<Array<ScheduledCase[]>> = Array.from({ length: OTS }, () => 
    Array.from({ length: 7 }, () => [])
  )
  
  cases.forEach((c: ScheduledCase) => {
    perOTPerDay[c.otIndex][c.dayIndex].push(c)
  })
  
  // Sort cases within each day
  perOTPerDay.forEach(ot => 
    ot.forEach(day => day.sort((a, b) => a.startMinute - b.startMinute))
  )

  return (
    <div className="space-y-3">
      <WeeklyTimeAxis />
      <div className="space-y-3">
        {perOTPerDay.map((otData, otIdx) => (
          <div key={otIdx} className="flex items-center gap-3">
            <div className="w-20 text-sm font-semibold text-foreground bg-gradient-to-r from-primary/10 to-primary/5 px-3 py-2 rounded-lg border">
              OT {otIdx + 1}
            </div>
            <div className="flex-1 grid grid-cols-7 gap-2">
              {otData.map((dayCases, dayIdx) => {
                const rowRender = renderWeeklyRow(dayCases, delayedIds, dayIdx, riskMap, flashIds)
                const laneCount = Math.max(1, rowRender.laneCount)
                return (
                  <div
                    key={dayIdx}
                    className="relative rounded-xl ot-row overflow-hidden shadow-sm"
                    style={{ height: `${laneCount * 2.6}rem` }}
                  >
                    {rowRender.blocks}
                  </div>
                )
              })}
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}

function TimeAxis() {
  const ticks = [0, 120, 240, 360, 480, 600]
  return (
    <div className="flex items-center gap-3">
      <div className="w-20" />
      <div className="relative flex-1 h-8 gantt-timeline rounded-lg p-2">
        {ticks.map((t, i) => (
          <div key={i} className="absolute top-0" style={{ left: `${(t / TOTAL_MINUTES) * 100}%` }}>
            <div className="w-px h-8 bg-primary/30" />
            <div className="absolute -translate-x-1/2 top-8 text-[11px] font-medium text-foreground">
              {minutesToTime(7, t)}
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}

function WeeklyTimeAxis() {
  const ticks = [0, 120, 240, 360, 480, 600]
  return (
    <div className="flex items-center gap-3">
      <div className="w-20" />
      <div className="flex-1 grid grid-cols-7 gap-2">
        {DAYS_OF_WEEK.map((day, dayIdx) => (
          <div key={dayIdx} className="relative h-8 gantt-timeline rounded-lg p-2">
            <div className="text-center text-xs font-semibold text-foreground mb-1">{day}</div>
            <div className="relative h-4">
              {ticks.map((t, i) => (
                <div key={i} className="absolute top-0" style={{ left: `${(t / TOTAL_MINUTES) * 100}%` }}>
                  <div className="w-px h-4 bg-primary/30" />
                  <div className="absolute -translate-x-1/2 top-4 text-[8px] font-medium text-foreground">
                    {minutesToTime(7, t)}
                  </div>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}

function renderRow(
  row: ScheduledCase[],
  delayedIds: Set<string>,
  riskMap: Record<string, MLDelayRisk> = {},
  flashIds: Set<string> = new Set()
) {
  // Interval partitioning to assign lanes for overlapping cases
  const blocks: JSX.Element[] = []
  if (!row || row.length === 0) {
    return { blocks, laneCount: 1 }
  }

  // Sort by start time
  const sorted = [...row].sort((a, b) => a.startMinute - b.startMinute)

  // lanes: array of end times (including turnover) for each lane
  const lanesEnd: number[] = []
  const assignments: number[] = [] // index -> laneIndex

  sorted.forEach((c) => {
    let placed = false
    for (let i = 0; i < lanesEnd.length; i++) {
      if (c.startMinute >= lanesEnd[i]) {
        // place in lane i
        assignments.push(i)
        lanesEnd[i] = c.endMinute + TURNOVER_MINUTES
        placed = true
        break
      }
    }
    if (!placed) {
      assignments.push(lanesEnd.length)
      lanesEnd.push(c.endMinute + TURNOVER_MINUTES)
    }
  })

  const laneCount = Math.max(1, lanesEnd.length)

  // Create blocks using assignments; use spacing of 3rem per lane
  sorted.forEach((c, i) => {
    const laneIdx = assignments[i]
    const left = ((c.startMinute - DEFAULT_DAY.startMinute) / TOTAL_MINUTES) * 100
    const width = ((c.endMinute - c.startMinute) / TOTAL_MINUTES) * 100
    const delayed = delayedIds.has(c.id)
    const priorityClass = getPriorityClass(c.priority)

    // idle gaps are optional per lane; to keep visual spacing we don't draw per-lane idle fills

    const risk = riskMap[c.id]
    const isFlash = flashIds.has(c.id)
    const riskBorder =
      risk?.riskLevel === "high"
        ? "ring-2 ring-red-400"
        : risk?.riskLevel === "medium"
        ? "ring-1 ring-amber-400"
        : ""

    // case block
    blocks.push(
      <div
        key={c.id}
        className={cn(
          "absolute left-0 h-10 rounded-lg border text-white shadow-lg transition-all",
          delayed ? "bg-destructive/20 border-destructive" : priorityClass,
          riskBorder,
          isFlash && "ring-2 ring-yellow-400 brightness-125"
        )}
        style={{ left: `${left}%`, width: `${width}%`, top: `${laneIdx * 3}rem` }}
        title={`${c.id} ${c.name} (${c.durationMinutes} min) • ${c.surgeon} • ${c.equipment}${risk ? ` • ${risk.riskLevel} delay risk` : ""}`}
      >
        <div className="px-2 py-1 text-[11px] leading-4 relative">
          <div className="font-medium">{c.id} • P{c.priority}</div>
          <div className="text-xs text-white/90">{`${minutesToTime(7, c.startMinute)} - ${minutesToTime(7, c.endMinute)}`}</div>
          {risk && <RiskDot riskLevel={risk.riskLevel} />}
        </div>
      </div>,
    )

    // turnover block (aligned with same lane)
    const turnLeft = ((c.endMinute - DEFAULT_DAY.startMinute) / TOTAL_MINUTES) * 100
    const turnWidth = (TURNOVER_MINUTES / TOTAL_MINUTES) * 100
    blocks.push(
      <div
        key={`turn-${i}`}
        className="absolute bg-accent rounded-sm"
        style={{ left: `${turnLeft}%`, width: `${turnWidth}%`, top: `${laneIdx * 3 + 1.4}rem`, height: '0.75rem' }}
        title={`Turnover ${TURNOVER_MINUTES} min`}
      />,
    )
  })

  return { blocks, laneCount }
}

function renderWeeklyRow(
  row: ScheduledCase[],
  delayedIds: Set<string>,
  dayIndex: number,
  riskMap: Record<string, MLDelayRisk> = {},
  flashIds: Set<string> = new Set()
) {
  // Similar lane assignment as daily view but with slightly smaller lane spacing
  const blocks: JSX.Element[] = []
  if (!row || row.length === 0) {
    return { blocks, laneCount: 1 }
  }

  const sorted = [...row].sort((a, b) => a.startMinute - b.startMinute)
  const lanesEnd: number[] = []
  const assignments: number[] = []

  sorted.forEach((c) => {
    let placed = false
    for (let i = 0; i < lanesEnd.length; i++) {
      if (c.startMinute >= lanesEnd[i]) {
        assignments.push(i)
        lanesEnd[i] = c.endMinute + TURNOVER_MINUTES
        placed = true
        break
      }
    }
    if (!placed) {
      assignments.push(lanesEnd.length)
      lanesEnd.push(c.endMinute + TURNOVER_MINUTES)
    }
  })

  const laneCount = Math.max(1, lanesEnd.length)

  sorted.forEach((c, i) => {
    const laneIdx = assignments[i]
    const left = ((c.startMinute - DEFAULT_DAY.startMinute) / TOTAL_MINUTES) * 100
    const width = ((c.endMinute - c.startMinute) / TOTAL_MINUTES) * 100
    const delayed = delayedIds.has(c.id)
    const priorityClass = getPriorityClass(c.priority)

    const risk = riskMap[c.id]
    const isFlash = flashIds.has(c.id)
    const riskBorder =
      risk?.riskLevel === "high" ? "ring-1 ring-red-400" : risk?.riskLevel === "medium" ? "ring-1 ring-amber-300" : ""

    blocks.push(
      <div
        key={c.id}
        className={cn(
          "absolute left-0 h-8 rounded-lg border text-white shadow-lg transition-all",
          delayed ? "bg-destructive/20 border-destructive" : priorityClass,
          riskBorder,
          isFlash && "ring-2 ring-yellow-400 brightness-125"
        )}
        style={{ left: `${left}%`, width: `${width}%`, top: `${laneIdx * 2.6}rem` }}
        title={`${c.id} ${c.name} (${c.durationMinutes} min) • ${c.surgeon} • ${c.equipment}${risk ? ` • ${risk.riskLevel} delay risk` : ""}`}
      >
        <div className="px-1 py-1 text-[9px] leading-3 relative">
          <div className="font-medium">{c.id} • P{c.priority}</div>
          <div className="text-xs text-white/90">{`${minutesToTime(7, c.startMinute)} - ${minutesToTime(7, c.endMinute)}`}</div>
        </div>
      </div>,
    )

    const turnLeft = ((c.endMinute - DEFAULT_DAY.startMinute) / TOTAL_MINUTES) * 100
    const turnWidth = (TURNOVER_MINUTES / TOTAL_MINUTES) * 100
    blocks.push(
      <div
        key={`turn-${dayIndex}-${i}`}
        className="absolute bg-accent rounded-sm"
        style={{ left: `${turnLeft}%`, width: `${turnWidth}%`, top: `${laneIdx * 2.6 + 1.2}rem`, height: '0.6rem' }}
        title={`Turnover ${TURNOVER_MINUTES} min`}
      />,
    )
  })

  return { blocks, laneCount }
}
