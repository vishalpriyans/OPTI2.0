"use client"

import { useEffect, useState } from "react"
import { useSchedule, useWeeklySchedule } from "./store"
import { detectConflicts } from "./conflict-detector"
import { TURNOVER_MINUTES } from "./types"
import { scoreDelayRisk } from "./delay-risk-scorer"
import type { InsightCard } from "./ml-types"
import { AlertTriangle, Info, CheckCircle2, XCircle, X, Loader2, Sparkles } from "lucide-react"
import { cn } from "@/lib/utils"

function generateLocalInsights(cases: any[]): InsightCard[] {
  const insights: InsightCard[] = []

  if (!cases.length) return insights

  // 1. Conflict check
  const { conflicts } = detectConflicts(cases)
  const critical = conflicts.filter((c: any) => c.severity === "critical")
  if (critical.length > 0) {
    insights.push({
      id: "conflicts",
      severity: "critical",
      message: `${critical.length} critical conflict${critical.length > 1 ? "s" : ""} detected`,
      detail: (critical[0] as any).description,
    })
  } else if (conflicts.length > 0) {
    insights.push({
      id: "conflicts-minor",
      severity: "warning",
      message: `${conflicts.length} scheduling conflict${conflicts.length > 1 ? "s" : ""} need attention`,
      detail: (conflicts[0] as any).description,
    })
  }

  // 2. OT utilization
  const otMinutes: Record<number, number> = {}
  cases.forEach((c) => {
    otMinutes[c.otIndex] = (otMinutes[c.otIndex] ?? 0) + (c.endMinute - c.startMinute)
  })
  const overloaded = Object.entries(otMinutes).filter(([, m]) => (m as number) > 570)
  if (overloaded.length > 0) {
    insights.push({
      id: "overloaded",
      severity: "warning",
      message: `OT ${parseInt(overloaded[0][0]) + 1} at ${Math.round(((overloaded[0][1] as number) / 600) * 100)}% utilization — no buffer for delays`,
      detail: "Consider moving the last elective case to another OT or next day.",
    })
  }

  // 3. Surgeon overtime
  const surgeonEnd: Record<string, number> = {}
  cases.forEach((c) => {
    if (!surgeonEnd[c.surgeon] || c.endMinute > surgeonEnd[c.surgeon]) {
      surgeonEnd[c.surgeon] = c.endMinute
    }
  })
  const overtimedSurgeons = Object.entries(surgeonEnd).filter(([, end]) => (end as number) > 600)
  if (overtimedSurgeons.length > 0) {
    const [surgeon, endMin] = overtimedSurgeons[0]
    const ot = Math.round((endMin as number) - 600)
    insights.push({
      id: "surgeon-ot",
      severity: "warning",
      message: `${surgeon} projected ${ot} min overtime`,
      detail: "Consider rescheduling the last case to reduce fatigue risk.",
    })
  }

  // 4. High-risk cases via scorer
  const otPositions: Record<number, number> = {}
  const highRisk = cases
    .filter((c) => (c.dayIndex ?? 0) === 0)
    .sort((a, b) => a.startMinute - b.startMinute)
    .filter((c) => {
      otPositions[c.otIndex] = (otPositions[c.otIndex] ?? 0) + 1
      const startHour = 7 + Math.floor(c.startMinute / 60)
      const iso = new Date()
      iso.setHours(startHour, c.startMinute % 60, 0, 0)
      const risk = scoreDelayRisk(
        { checklist: { consent: true, labsOk: true }, patient: { asa: "ASA 2" }, scheduledStartISO: iso.toISOString() },
        otPositions[c.otIndex],
        0
      )
      return risk.riskLevel === "high"
    })

  if (highRisk.length > 0) {
    insights.push({
      id: "high-risk",
      severity: "warning",
      message: `${highRisk.length} case${highRisk.length > 1 ? "s" : ""} flagged as high delay risk`,
      detail: `Includes ${highRisk[0].name} (${highRisk[0].surgeon})`,
    })
  }

  // 5. All good
  if (insights.length === 0) {
    insights.push({
      id: "all-ok",
      severity: "ok",
      message: "Schedule looks clean — no critical issues detected",
      detail: `${cases.length} cases across ${Object.keys(otMinutes).length} OTs.`,
    })
  }

  return insights
}

const SEVERITY_STYLES: Record<InsightCard["severity"], string> = {
  critical: "border-destructive/50 bg-destructive/5",
  warning: "border-amber-300/60 bg-amber-50/60 dark:bg-amber-950/20",
  info: "border-blue-300/60 bg-blue-50/60 dark:bg-blue-950/20",
  ok: "border-green-300/60 bg-green-50/60 dark:bg-green-950/20",
}

function SeverityIcon({ s }: { s: InsightCard["severity"] }) {
  if (s === "critical") return <XCircle className="w-4 h-4 text-destructive shrink-0" />
  if (s === "warning") return <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0" />
  if (s === "ok") return <CheckCircle2 className="w-4 h-4 text-green-600 shrink-0" />
  return <Info className="w-4 h-4 text-blue-600 shrink-0" />
}

export function AIInsightsPanel() {
  const { schedule } = useSchedule()
  const { weeklySchedule } = useWeeklySchedule()
  const [insights, setInsights] = useState<InsightCard[]>([])
  const [dismissed, setDismissed] = useState<Set<string>>(new Set())
  const [loading, setLoading] = useState(false)

  const cases =
    schedule?.optimized?.cases ??
    weeklySchedule?.optimized?.cases ??
    []

  useEffect(() => {
    if (!cases.length) {
      setInsights([])
      return
    }
    setLoading(true)
    // Run locally — no API call needed for basic insights
    const local = generateLocalInsights(cases)
    setInsights(local)
    setDismissed(new Set())
    setLoading(false)
  }, [schedule, weeklySchedule])

  const visible = insights.filter((i) => !dismissed.has(i.id))

  if (!cases.length) return null

  return (
    <div className="rounded-xl border bg-card shadow-sm overflow-hidden">
      <div className="flex items-center gap-2 px-4 py-2.5 border-b bg-gradient-to-r from-primary/10 to-primary/5">
        <Sparkles className="w-4 h-4 text-primary" />
        <span className="font-semibold text-sm">AI Insights</span>
        {loading && <Loader2 className="w-3 h-3 animate-spin text-muted-foreground ml-auto" />}
        {!loading && visible.length > 0 && (
          <span className="ml-auto text-[10px] text-muted-foreground">{visible.length} active</span>
        )}
      </div>

      <div className="p-3 space-y-2">
        {loading && (
          <div className="flex items-center gap-2 text-sm text-muted-foreground py-2">
            <Loader2 className="w-3 h-3 animate-spin" />
            Scanning schedule…
          </div>
        )}

        {!loading && visible.length === 0 && (
          <p className="text-xs text-muted-foreground py-2 text-center">
            All insights dismissed. Generate a new schedule to refresh.
          </p>
        )}

        {visible.map((insight) => (
          <div
            key={insight.id}
            className={cn("rounded-lg border px-3 py-2 flex gap-2 items-start", SEVERITY_STYLES[insight.severity])}
          >
            <SeverityIcon s={insight.severity} />
            <div className="flex-1 min-w-0">
              <p className="text-xs font-medium leading-snug">{insight.message}</p>
              {insight.detail && (
                <p className="text-[11px] text-muted-foreground mt-0.5 leading-snug">{insight.detail}</p>
              )}
            </div>
            <button
              onClick={() => setDismissed((d) => new Set([...d, insight.id]))}
              className="text-muted-foreground hover:text-foreground transition-colors shrink-0"
            >
              <X className="w-3 h-3" />
            </button>
          </div>
        ))}
      </div>
    </div>
  )
}
