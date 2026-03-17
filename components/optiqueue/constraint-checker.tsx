"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { useSchedule } from "./store"
import type { ScheduledCase } from "./types"

export function ConstraintChecker() {
  const { schedule } = useSchedule()
  const conflicts = findConflicts(schedule?.optimized.cases || [])

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">Constraint Checker</CardTitle>
      </CardHeader>
      <CardContent className="space-y-2">
        {conflicts.length === 0 ? (
          <p className="text-sm text-muted-foreground">No conflicts detected.</p>
        ) : (
          <ul className="text-sm list-disc pl-4 space-y-1">
            {conflicts.map((c, i) => (
              <li key={i}>{c}</li>
            ))}
          </ul>
        )}
        <p className="text-xs text-muted-foreground">Flags overlaps for surgeon/equipment across OTs.</p>
      </CardContent>
    </Card>
  )
}

function findConflicts(cases: ScheduledCase[]) {
  const issues: string[] = []
  const overlaps = (a: { s: number; e: number }, b: { s: number; e: number }) => a.s < b.e && b.s < a.e
  const surgeonMap: Record<string, { s: number; e: number; id: string }[]> = {}
  const equipMap: Record<string, { s: number; e: number; id: string }[]> = {}

  for (const c of cases) {
    surgeonMap[c.surgeon] ||= []
    equipMap[c.equipment] ||= []
    for (const prev of surgeonMap[c.surgeon]) {
      if (overlaps({ s: c.startMinute, e: c.endMinute }, { s: prev.s, e: prev.e })) {
        issues.push(`Surgeon ${c.surgeon} double-booked: ${prev.id} overlaps ${c.id}`)
      }
    }
    for (const prev of equipMap[c.equipment]) {
      if (overlaps({ s: c.startMinute, e: c.endMinute }, { s: prev.s, e: prev.e })) {
        issues.push(`Equipment ${c.equipment} double-booked: ${prev.id} overlaps ${c.id}`)
      }
    }
    surgeonMap[c.surgeon].push({ s: c.startMinute, e: c.endMinute, id: c.id })
    equipMap[c.equipment].push({ s: c.startMinute, e: c.endMinute, id: c.id })
  }
  return issues
}
