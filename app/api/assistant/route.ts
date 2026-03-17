import { type NextRequest, NextResponse } from "next/server"
import { streamText, tool, stepCountIs, convertToModelMessages, type LanguageModel } from "ai"
import { createGroq } from "@ai-sdk/groq"
import { z } from "zod"
import { scheduleEmergencyCase } from "@/components/optiqueue/emergency-scheduler"
import { detectConflicts } from "@/components/optiqueue/conflict-detector"
import { scoreDelayRisk } from "@/components/optiqueue/delay-risk-scorer"
import { TURNOVER_MINUTES } from "@/components/optiqueue/types"

const groq = createGroq({ apiKey: process.env.GROQ_API_KEY ?? "" })

const SYSTEM_PROMPT = `You are OptiQueue's AI copilot for an Operating Theatre scheduling control tower.
You help hospital administrators and surgeons manage the OR schedule intelligently.

You have access to tools that can:
- Analyze the current schedule for risks and conflicts
- Insert emergency surgical cases into the optimal slot
- Reschedule non-urgent cases to different days
- Simulate what happens if a case overruns
- Score delay risk for all cases

When the user asks you to do something that requires modifying the schedule, USE THE TOOLS — don't just describe what you would do.
Always explain your reasoning in plain clinical language. Be concise but thorough.
Times are in minutes since 07:00. Convert to human-readable times (e.g., 120 min = 9:00 AM).
OT indices are 0-based internally but display as OT 1–5.`

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const { messages, schedule, weeklySchedule, surgeries, nowMinute } = body

    // Snapshot of the schedule passed by the client — tools operate on this
    let currentSchedule = schedule ?? weeklySchedule

    // Convert UI messages to model messages (v5 API)
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const modelMessages = Array.isArray(messages) ? await convertToModelMessages(messages as any) : []

    const result = streamText({
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      model: groq("llama-3.3-70b-versatile") as unknown as LanguageModel,
      system: SYSTEM_PROMPT,
      messages: modelMessages,
      stopWhen: stepCountIs(5),
      tools: {
        analyzeSchedule: tool({
          description:
            "Analyze the current OR schedule to identify risks, conflicts, utilization, and bottlenecks. Call this before answering questions about the schedule.",
          inputSchema: z.object({}),
          execute: async () => {
            if (!currentSchedule) return { error: "No schedule loaded yet." }
            const cases = currentSchedule.optimized?.cases ?? currentSchedule.cases ?? []
            const analysis = detectConflicts(cases)
            const conflicts = analysis.conflicts

            // Count checklist issues
            const checklistIssues: string[] = []
            // Count OT utilization
            const otUtil: Record<number, number> = {}
            cases.forEach((c: any) => {
              otUtil[c.otIndex] = (otUtil[c.otIndex] ?? 0) + (c.endMinute - c.startMinute)
            })
            const maxMinutes = 600
            const utilizationPct = Object.entries(otUtil).map(([ot, mins]) => ({
              ot: `OT ${parseInt(ot) + 1}`,
              pct: Math.round(((mins as number) / maxMinutes) * 100),
            }))

            // Surgeon overtime
            const surgeonEndTimes: Record<string, number> = {}
            cases.forEach((c: any) => {
              const prev = surgeonEndTimes[c.surgeon] ?? 0
              if (c.endMinute > prev) surgeonEndTimes[c.surgeon] = c.endMinute
            })
            const overtimeSurgeons = Object.entries(surgeonEndTimes)
              .filter(([, end]) => (end as number) > 600)
              .map(([s, end]) => ({ surgeon: s, overtimeMin: (end as number) - 600 }))

            return {
              totalCases: cases.length,
              conflicts: conflicts.map((c) => ({
                type: c.type,
                severity: c.severity,
                description: c.description,
              })),
              utilizationByOT: utilizationPct,
              overtimeSurgeons,
              checklistIssues,
              summary: `${cases.length} cases scheduled across ${Object.keys(otUtil).length} OTs. ${conflicts.length} conflicts detected. ${overtimeSurgeons.length} surgeons projected into overtime.`,
            }
          },
        }),

        insertEmergencyCase: tool({
          description:
            "Insert an emergency surgical case into the best available OR slot. Automatically displaces lower-priority cases if needed.",
          inputSchema: z.object({
            procedure: z.string().describe("Emergency procedure name, e.g. 'Emergency CABG'"),
            surgeon: z.string().describe("Surgeon's full name"),
            durationMinutes: z.number().describe("Estimated duration in minutes"),
            reason: z.string().describe("Clinical reason for emergency insertion"),
          }),
          execute: async ({ procedure, surgeon, durationMinutes, reason }: { procedure: string; surgeon: string; durationMinutes: number; reason: string }) => {
            if (!currentSchedule) return { error: "No schedule loaded. Ask the user to load sample data first." }

            const emergencyCase = {
              id: `EM-${Date.now().toString().slice(-4)}`,
              name: procedure,
              durationMinutes,
              surgeon,
              equipment: "Emergency Kit",
              priority: 1 as const,
            }

            const dayIndex = 0 // insert into current day
            const result = scheduleEmergencyCase(emergencyCase, currentSchedule, dayIndex)

            if (result.updatedSchedule) {
              currentSchedule = result.updatedSchedule
            }

            return {
              success: true,
              reason,
              caseId: emergencyCase.id,
              displacedCases: result.displacedCases.map((c) => c.id),
              conflicts: result.conflicts,
              updatedSchedule: result.updatedSchedule,
              message: `Inserted ${procedure} (${durationMinutes} min) for ${surgeon}. ${result.displacedCases.length} case(s) displaced.`,
            }
          },
        }),

        rescheduleCase: tool({
          description: "Move a specific case to a different day in the weekly schedule.",
          inputSchema: z.object({
            caseId: z.string().describe("The case ID to move, e.g. S-101"),
            targetDay: z
              .number()
              .min(0)
              .max(6)
              .describe("Target day index: 0=Monday, 1=Tuesday, ..., 6=Sunday"),
            reason: z.string().describe("Clinical or operational reason for rescheduling"),
          }),
          execute: async ({ caseId, targetDay, reason }: { caseId: string; targetDay: number; reason: string }) => {
            if (!currentSchedule) return { error: "No schedule loaded." }
            const cases: any[] = [
              ...(currentSchedule.optimized?.cases ?? currentSchedule.cases ?? []),
            ]
            const idx = cases.findIndex((c: any) => c.id === caseId)
            if (idx === -1) return { error: `Case ${caseId} not found in schedule.` }

            const oldDay = cases[idx].dayIndex ?? 0
            const otIdx = cases[idx].otIndex ?? 0

            // Find the latest end time in the target OT on target day
            const dayOTCases = cases.filter(
              (c: any) => c.dayIndex === targetDay && c.otIndex === otIdx && c.id !== caseId
            )
            const lastEnd = dayOTCases.reduce(
              (max: number, c: any) => Math.max(max, c.endMinute + TURNOVER_MINUTES),
              0
            )
            const newStart = lastEnd
            const newEnd = newStart + cases[idx].durationMinutes

            cases[idx] = { ...cases[idx], dayIndex: targetDay, startMinute: newStart, endMinute: newEnd }

            const updatedSchedule = currentSchedule.optimized
              ? { ...currentSchedule, optimized: { ...currentSchedule.optimized, cases } }
              : { ...currentSchedule, cases }
            currentSchedule = updatedSchedule

            const DAYS = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"]
            return {
              success: true,
              caseId,
              reason,
              movedFrom: DAYS[oldDay] ?? `Day ${oldDay + 1}`,
              movedTo: DAYS[targetDay] ?? `Day ${targetDay + 1}`,
              newStartTime: `${7 + Math.floor(newStart / 60)}:${String(newStart % 60).padStart(2, "0")}`,
              updatedSchedule,
            }
          },
        }),

        simulateRippleEffect: tool({
          description:
            "Simulate what happens to subsequent cases if a specific case overruns by N minutes. Does NOT modify the real schedule — analysis only.",
          inputSchema: z.object({
            caseId: z.string().describe("The case that overruns, e.g. S-101"),
            extraMinutes: z.number().describe("How many minutes over schedule this case runs"),
          }),
          execute: async ({ caseId, extraMinutes }: { caseId: string; extraMinutes: number }) => {
            if (!currentSchedule) return { error: "No schedule loaded." }
            const cases: any[] = currentSchedule.optimized?.cases ?? currentSchedule.cases ?? []
            const source = cases.find((c: any) => c.id === caseId)
            if (!source) return { error: `Case ${caseId} not found.` }

            // All cases in the same OT and day that start after the overrunning case
            const affected = cases
              .filter(
                (c: any) =>
                  c.otIndex === source.otIndex &&
                  (c.dayIndex ?? 0) === (source.dayIndex ?? 0) &&
                  c.startMinute >= source.endMinute &&
                  c.id !== caseId
              )
              .sort((a: any, b: any) => a.startMinute - b.startMinute)
              .map((c: any) => ({
                caseId: c.id,
                procedure: c.name,
                surgeon: c.surgeon,
                originalStart: `${7 + Math.floor(c.startMinute / 60)}:${String(c.startMinute % 60).padStart(2, "0")}`,
                newStart: `${7 + Math.floor((c.startMinute + extraMinutes) / 60)}:${String((c.startMinute + extraMinutes) % 60).padStart(2, "0")}`,
                delayMinutes: extraMinutes,
              }))

            const lastCase = cases
              .filter(
                (c: any) =>
                  c.otIndex === source.otIndex && (c.dayIndex ?? 0) === (source.dayIndex ?? 0)
              )
              .reduce((max: any, c: any) => (!max || c.endMinute > max.endMinute ? c : max), null)

            const newEndMinute = lastCase ? lastCase.endMinute + extraMinutes : 600
            const overtimeMinutes = Math.max(0, newEndMinute - 600)

            return {
              sourceCase: caseId,
              extraMinutes,
              affectedCases: affected,
              totalOvertimeMinutes: overtimeMinutes,
              summary: `${affected.length} subsequent case(s) in OT ${source.otIndex + 1} shift by ${extraMinutes} min. Projected overtime: ${overtimeMinutes} min.`,
            }
          },
        }),

        getDelayRiskReport: tool({
          description:
            "Score delay risk for all scheduled cases today based on patient complexity, checklist completeness, time of day, and OT position.",
          inputSchema: z.object({}),
          execute: async () => {
            if (!currentSchedule) return { error: "No schedule loaded." }
            const cases: any[] = currentSchedule.optimized?.cases ?? currentSchedule.cases ?? []

            // Score each case — use position in OT as otPosition
            const otPositions: Record<number, number> = {}
            const report = cases
              .filter((c: any) => (c.dayIndex ?? 0) === 0)
              .sort((a: any, b: any) => a.startMinute - b.startMinute)
              .map((c: any) => {
                otPositions[c.otIndex] = (otPositions[c.otIndex] ?? 0) + 1
                const risk = scoreDelayRisk(
                  {
                    checklist: { consent: true, labsOk: true },
                    patient: { asa: "ASA 2" },
                    scheduledStartISO: new Date(
                      Date.now() - 7 * 3600000 + c.startMinute * 60000
                    ).toISOString(),
                  },
                  otPositions[c.otIndex],
                  0
                )
                return {
                  caseId: c.id,
                  procedure: c.name,
                  surgeon: c.surgeon,
                  riskLevel: risk.riskLevel,
                  probability: Math.round(risk.probability * 100),
                  topFactor: risk.topFactors[0]?.feature ?? "none",
                }
              })

            const high = report.filter((r) => r.riskLevel === "high").length
            const medium = report.filter((r) => r.riskLevel === "medium").length

            return {
              cases: report,
              summary: `${high} high-risk, ${medium} medium-risk, ${report.length - high - medium} low-risk cases today.`,
            }
          },
        }),
      },
    })

    return result.toUIMessageStreamResponse()
  } catch (err: any) {
    return NextResponse.json({ error: err.message ?? "Unknown error" }, { status: 500 })
  }
}
