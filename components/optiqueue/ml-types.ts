// ML / AI types shared across the scheduling system

export type MLFactor = {
  feature: string   // e.g. "incomplete_checklist", "high_asa", "prev_case_overrun"
  contribution: number // 0–1, how much this factor added to the risk score
}

export type MLDelayRisk = {
  probability: number          // 0–1
  riskLevel: "low" | "medium" | "high"
  predictedDelayMinutes: number
  topFactors: MLFactor[]
}

export type InsightCard = {
  id: string
  severity: "info" | "warning" | "critical" | "ok"
  message: string
  detail?: string
}

export type ScheduleUpdate = {
  type: "insert_emergency" | "reschedule_case" | "ripple_simulation"
  updatedSchedule?: any         // WeeklyFullSchedule or FullSchedule
  affectedCaseIds?: string[]
  description: string
}
