"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { useSchedule } from "./store"

function KPIItem({ label, value, sub }: { label: string; value: string; sub?: string }) {
  return (
    <Card>
      <CardHeader className="py-3">
        <CardTitle className="text-sm">{label}</CardTitle>
      </CardHeader>
      <CardContent className="pt-0">
        <div className="text-2xl font-semibold">{value}</div>
        {sub && <div className="text-xs text-muted-foreground mt-1">{sub}</div>}
      </CardContent>
    </Card>
  )
}

export function KPIScorecard() {
  const { schedule } = useSchedule()
  const k = schedule?.kpis
  const util = k ? `${k.utilizationRate}%` : "—"
  const utilSub = k ? `Baseline ${k.baselineUtilizationRate}% (Target >85%)` : "Target >85%"
  const ot = k ? `${k.totalProjectedOvertime} min` : "—"
  const otSub = k ? `Baseline ${k.baselineOvertime} min (Target <10 min)` : "Target <10 min"
  return (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
      <KPIItem label="OT Utilization" value={util} sub={utilSub} />
      <KPIItem label="Projected Overtime" value={ot} sub={otSub} />
      <KPIItem label="Total Idle (Optimized)" value={schedule ? `${schedule.optimized.idleMinutes} min` : "—"} />
      <KPIItem label="Priority-weighted Wait" value={schedule ? `${schedule.optimized.waitCost} min` : "—"} />
    </div>
  )
}
