// Deterministic delay risk scorer — no Python, no training data needed.
// Computes a clinically-grounded risk score from patient + operational context.

import type { MLDelayRisk, MLFactor } from "./ml-types"

export type RiskInput = {
  checklist: {
    consent: boolean
    labsOk: boolean
    imagingOk?: boolean
    npoOk?: boolean
    equipmentReady?: boolean
  }
  patient: {
    asa?: string        // e.g. "ASA 2"
    allergyFlag?: boolean
  }
  scheduledStartISO: string
  priority?: number
}

export function scoreDelayRisk(
  c: RiskInput,
  otPosition: number,         // 1-based position in OT sequence for the day
  prevCaseOverrunMin: number   // how many minutes the prior case ran over (0 if first)
): MLDelayRisk {
  let score = 0
  const factors: MLFactor[] = []

  // 1. Checklist incompleteness (each missing item = +5%)
  const items = [
    c.checklist.consent,
    c.checklist.labsOk,
    c.checklist.imagingOk,
    c.checklist.npoOk,
    c.checklist.equipmentReady,
  ]
  const missing = items.filter((x) => x === false).length
  if (missing > 0) {
    const contrib = missing * 0.05
    score += contrib
    factors.push({ feature: "incomplete_checklist", contribution: contrib })
  }

  // 2. Patient complexity: ASA score
  const asaNum = parseInt(c.patient.asa?.replace("ASA ", "").trim() ?? "1", 10) || 1
  if (asaNum >= 3) {
    const contrib = (asaNum - 1) * 0.07
    score += contrib
    factors.push({ feature: "high_asa_score", contribution: contrib })
  }
  if (c.patient.allergyFlag) {
    score += 0.05
    factors.push({ feature: "allergy_flag", contribution: 0.05 })
  }

  // 3. Ripple effect from prior case overrunning
  if (prevCaseOverrunMin > 0) {
    const ripple = Math.min(prevCaseOverrunMin / 80, 0.30)
    score += ripple
    factors.push({ feature: "prev_case_overrun", contribution: ripple })
  }

  // 4. Time of day — afternoon/evening slots have historically higher delay rates
  const hour = new Date(c.scheduledStartISO).getHours()
  if (hour >= 15) {
    score += 0.15
    factors.push({ feature: "late_slot", contribution: 0.15 })
  } else if (hour >= 13) {
    score += 0.08
    factors.push({ feature: "midday_slot", contribution: 0.08 })
  }

  // 5. OT position — each subsequent case compounds accumulated delays
  const posRisk = Math.min((otPosition - 1) * 0.025, 0.10)
  if (posRisk > 0) {
    score += posRisk
    factors.push({ feature: "ot_position", contribution: posRisk })
  }

  // Clamp to [0.05, 0.97] so we never show 0% or 100%
  const probability = Math.min(Math.max(score, 0.05), 0.97)
  const riskLevel: "low" | "medium" | "high" =
    probability < 0.35 ? "low" : probability < 0.60 ? "medium" : "high"
  const predictedDelayMinutes =
    riskLevel === "low" ? 0 : Math.round(probability * 45)

  return {
    probability,
    riskLevel,
    predictedDelayMinutes,
    topFactors: factors
      .sort((a, b) => b.contribution - a.contribution)
      .slice(0, 3),
  }
}

/** Score all cases in a schedule, returning a map from caseId → MLDelayRisk */
export function scoreAllCases(
  cases: Array<{ id: string } & RiskInput>
): Record<string, MLDelayRisk> {
  const result: Record<string, MLDelayRisk> = {}
  // Group by OT (using a simple sequential position per unique otId)
  const otPositions: Record<string, number> = {}
  cases.forEach((c, _i) => {
    const otKey = (c as any).otId ?? "OT-1"
    otPositions[otKey] = (otPositions[otKey] ?? 0) + 1
    result[c.id] = scoreDelayRisk(c, otPositions[otKey], 0)
  })
  return result
}
