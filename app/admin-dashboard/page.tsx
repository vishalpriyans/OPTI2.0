"use client"

import { Suspense, useEffect, useMemo, useRef, useState, useCallback } from "react"
import { useRouter } from "next/navigation"
import { SessionProtection } from "@/components/auth/session-protection"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"
import { Input } from "@/components/ui/input"
import { Gantt } from "@/components/optiqueue/gantt"
import { ControlTowerKPIs } from "@/components/optiqueue/control-tower-kpis"
import { EmergencyInserter } from "@/components/optiqueue/emergency-inserter"
import { OptiQueueLogo } from "@/components/optiqueue/optiqueue-logo"
import { ConflictAnalysisDashboard } from "@/components/optiqueue/conflict-analysis-dashboard"
import { UtilizationDashboard } from "@/components/optiqueue/utilization-dashboard"
import { detectConflicts } from "@/components/optiqueue/conflict-detector"
import { useSchedule, useSurgeries, useWeeklySchedule } from "@/components/optiqueue/store"
import { optimizeSchedule, computeKPIs, baselineSchedule } from "@/components/optiqueue/scheduler"
import { DEFAULT_DAY, TURNOVER_MINUTES } from "@/components/optiqueue/types"
import {
  SAMPLE_WEEKLY_SCHEDULE,
  PROCEDURE_NAMES, SURGEONS, EQUIPMENT, PRIORITY_LABELS, SAMPLE_AGGREGATES, loadRealDataset
} from "@/components/optiqueue/sample-data"
import { predictDuration, slotOfDayFrom } from "@/components/optiqueue/predictor"
import { DropdownInput } from "@/components/optiqueue/dropdown-input"
import { filterDoctorsByProcedure, formatDoctorWithSpecializationLabels } from "@/components/optiqueue/specializations"
import { determineProcedurePriority, getPriorityLabel, getPriorityColor } from "@/components/optiqueue/priority-engine"
import { NotificationPanel } from "@/components/optiqueue/notifications/notification-panel"
import { SharePatientUpdates } from "@/components/optiqueue/notifications/share-patient-updates"
import { initializeSampleNotifications } from "@/components/optiqueue/notifications/sample-notifications"
import { AICommandCenter } from "@/components/optiqueue/ai-command-center"
import { AIInsightsPanel } from "@/components/optiqueue/ai-insights-panel"
import { useToast } from "@/components/ui/use-toast"
import { LogOut, User, Stethoscope, Zap, BarChart2, Trash2 } from "lucide-react"
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem,
  DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"

function getPriorityClass(priority: number): string {
  switch (priority) {
    case 1: return "priority-emergency"
    case 2: return "priority-high"
    case 3: return "priority-medium"
    case 4: return "priority-low"
    case 5: return "priority-elective"
    default: return "priority-elective"
  }
}

function getPriorityDot(priority: number): string {
  switch (priority) {
    case 1: return "bg-red-500"
    case 2: return "bg-orange-500"
    case 3: return "bg-yellow-500"
    case 4: return "bg-blue-500"
    default: return "bg-green-500"
  }
}

// ── Quick Actions Header Buttons ─────────────────────────────────────────────

function QuickActionsMenu() {
  const { setSurgeries } = useSurgeries()
  const { setSchedule, setDelayedIds } = useSchedule()
  const { setWeeklySchedule } = useWeeklySchedule()
  const { toast } = useToast()
  const [loadingReal, setLoadingReal] = useState(false)

  const onLoadRealDataset = useCallback(async () => {
    setLoadingReal(true)
    try {
      const cases = await loadRealDataset(10)
      setSurgeries(cases)
      setWeeklySchedule(undefined)
      setDelayedIds(new Set())
      const optimized = optimizeSchedule(cases, DEFAULT_DAY, TURNOVER_MINUTES)
      const baseline  = baselineSchedule(cases, DEFAULT_DAY, TURNOVER_MINUTES)
      setSchedule({ optimized, baseline, kpis: computeKPIs(optimized, baseline, DEFAULT_DAY) })
      const emergencyCount = cases.filter(c => c.priority === 1).length
      toast({
        title: "Dataset loaded & scheduled",
        description: `${cases.length} random cases · ${emergencyCount} emergency · conflicts auto-detected`,
      })
    } catch {
      toast({ title: "Failed to load dataset", variant: "destructive" })
    } finally {
      setLoadingReal(false)
    }
  }, [setSurgeries, setWeeklySchedule, setDelayedIds, setSchedule, toast])

  const onClear = useCallback(() => {
    setSurgeries([])
    setSchedule(undefined)
    setWeeklySchedule(undefined)
    setDelayedIds(new Set())
    toast({ title: "All data cleared" })
  }, [setSurgeries, setSchedule, setWeeklySchedule, setDelayedIds, toast])

  return (
    <div className="flex items-center gap-1">
      <Button
        variant="ghost"
        size="icon"
        className="relative h-8 w-8 rounded-full"
        title="Load 10 Random Cases"
        onClick={onLoadRealDataset}
        disabled={loadingReal}
      >
        {loadingReal ? (
          <span className="relative flex h-4 w-4">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-blue-400 opacity-75" />
            <span className="relative inline-flex rounded-full h-4 w-4 bg-blue-500" />
          </span>
        ) : (
          <Zap className="h-4 w-4" />
        )}
      </Button>
      <Button
        variant="ghost"
        size="icon"
        className="h-8 w-8 rounded-full text-muted-foreground hover:text-destructive"
        title="Clear All Data"
        onClick={onClear}
      >
        <Trash2 className="h-4 w-4" />
      </Button>
    </div>
  )
}

// ── Utilization Header Dropdown ───────────────────────────────────────────────

function UtilizationMenu() {
  const [open, setOpen] = useState(false)
  return (
    <DropdownMenu open={open} onOpenChange={setOpen}>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" className="h-8 px-3 rounded-full flex items-center gap-1.5" title="Utilization Analysis">
          <BarChart2 className="h-4 w-4" />
          <span className="text-sm font-medium">Utilization Analysis</span>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent
        align="end"
        className="w-[680px] max-h-[80vh] overflow-y-auto p-3"
        onCloseAutoFocus={e => e.preventDefault()}
      >
        <DropdownMenuLabel className="flex items-center gap-2 pb-2">
          <BarChart2 className="h-4 w-4 text-indigo-600" />
          <div>
            <p className="text-sm font-bold text-indigo-800">Utilization Analysis</p>
            <p className="text-xs text-indigo-500">OT usage trends and resource metrics</p>
          </div>
        </DropdownMenuLabel>
        <DropdownMenuSeparator className="mb-2" />
        <UtilizationDashboard />
      </DropdownMenuContent>
    </DropdownMenu>
  )
}

// ── Main wrapper ─────────────────────────────────────────────────────────────

function AdminDashboardContent() {
  const router = useRouter()
  const [user, setUser] = useState<any>(null)

  useEffect(() => {
    fetch("/api/auth/check-session")
      .then((r) => r.json())
      .then((d) => { if (d.authenticated) setUser(d.user) })
  }, [])

  const handleLogout = async () => {
    await fetch("/api/auth/logout", { method: "POST" })
    router.push("/login")
  }

  return (
    <main className="min-h-screen bg-gradient-to-br from-background to-muted/20">
      {/* ── Header ── */}
      <header className="bg-white border-b shadow-sm px-6 py-3 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <OptiQueueLogo className="w-10 h-10" />
          <div>
            <h1 className="text-lg font-bold text-foreground">OptiQueue</h1>
            <p className="text-xs text-muted-foreground italic">Efficiency that Saves Lives</p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <NotificationPanel />
          <QuickActionsMenu />
          <UtilizationMenu />
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" className="h-8 w-8 rounded-full">
                <User className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-52">
              <DropdownMenuLabel className="font-normal">
                <p className="text-sm font-medium">Admin User</p>
                <p className="text-xs text-muted-foreground">{user?.email ?? "admin@hospital.com"}</p>
              </DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={() => router.push("/doctor-login")}>
                <Stethoscope className="mr-2 h-4 w-4" />
                Doctor Login
              </DropdownMenuItem>
              <DropdownMenuItem onClick={handleLogout} className="text-destructive">
                <LogOut className="mr-2 h-4 w-4" />
                Log out
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </header>

      {/* ── Two-column layout ── */}
      <div className="control-tower-grid">
        <div className="control-tower-sidebar">
          <Suspense fallback={<div className="text-muted-foreground p-4">Loading...</div>}>
            <AdminSidebar />
          </Suspense>
        </div>
        <div className="control-tower-main">
          <Suspense fallback={<div className="text-muted-foreground p-4">Loading...</div>}>
            <AdminMain />
          </Suspense>
        </div>
      </div>

      {/* ── Floating AI Command Center ── */}
      <div className="fixed bottom-5 right-5 z-50">
        <AICommandCenter />
      </div>
    </main>
  )
}

// ── Sidebar ───────────────────────────────────────────────────────────────────

function AdminSidebar() {
  const { surgeries } = useSurgeries()
  const { setSchedule, delayedIds, setDelayedIds } = useSchedule()
  const { toast } = useToast()

  useEffect(() => { initializeSampleNotifications() }, [])

  const onGenerate = () => {
    if (!surgeries.length) {
      toast({ title: "No surgeries", description: "Please add cases first", variant: "destructive" })
      return
    }
    const optimized = optimizeSchedule(surgeries, DEFAULT_DAY, TURNOVER_MINUTES)
    const baseline  = baselineSchedule(surgeries, DEFAULT_DAY, TURNOVER_MINUTES)
    setSchedule({ optimized, baseline, kpis: computeKPIs(optimized, baseline, DEFAULT_DAY) })
    setDelayedIds(new Set())
    toast({ title: "Schedule generated" })
  }

  return (
    <div className="space-y-5">
      {/* 1. Emergency Case Insertion */}
      <div className="control-tower-card p-5 border-2 border-red-200 bg-gradient-to-r from-red-50 to-pink-50">
        <div className="flex items-center gap-2 mb-3">
          <div>
            <h3 className="text-base font-bold text-red-700">Emergency Insertion</h3>
            <p className="text-sm text-red-600">Add urgent cases with priority override</p>
          </div>
        </div>
        <EmergencyInserter />
      </div>

      {/* 3. Smart Duration Predictor */}
      <div className="control-tower-card p-0 border-2 border-purple-200 overflow-hidden">
        <TimePredictionSection />
      </div>

      {/* 4. Case Management + Add Form */}
      <div className="control-tower-card p-5 bg-gradient-to-r from-green-50 to-emerald-50 border-2 border-green-200">
        <div className="flex items-center gap-2 mb-3">
          <span className="text-xl">📝</span>
          <div>
            <h3 className="text-sm font-bold text-green-800">Case Management</h3>
            <p className="text-xs text-green-600">Add and manage surgical procedures</p>
          </div>
        </div>
        <AddCaseForm />
        <p className="text-xs text-green-700 mt-2">
          ⏱️ Turnover: <strong>{TURNOVER_MINUTES} min</strong>
        </p>
        <Button className="w-full mt-3 bg-green-600 hover:bg-green-700" onClick={onGenerate}>
          🎯 Generate Optimized Schedule
        </Button>
      </div>
    </div>
  )
}

// ── Main Content ──────────────────────────────────────────────────────────────

function AdminMain() {
  const { schedule, delayedIds } = useSchedule()
  const { weeklySchedule } = useWeeklySchedule()
  const [isWeeklyView, setIsWeeklyView] = useState(false)

  const currentCases = schedule?.optimized?.cases ?? weeklySchedule?.optimized?.cases ?? (weeklySchedule as any)?.cases ?? []
  const conflictAnalysis = detectConflicts(currentCases)

  return (
    <div className="space-y-6">
      {/* 1. KPIs */}
      <div className="control-tower-card p-4 bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-200">
        <div className="flex items-center gap-2 mb-3">
          <span className="text-lg">📊</span>
          <div>
            <h2 className="text-lg font-bold text-blue-800">Executive Dashboard</h2>
            <p className="text-xs text-blue-600">Real-time performance metrics</p>
          </div>
        </div>
        <ControlTowerKPIs />
      </div>

      {/* 2. Conflict Analysis */}
      <ConflictAnalysisDashboard
        conflicts={conflictAnalysis}
        onResolveConflicts={() => {}}
      />

      {/* 4. AI Insights */}
      <AIInsightsPanel />

      {/* 5. Gantt Timeline */}
      <div className="control-tower-card p-6 border-2 border-primary/20">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-3">
            <span className="text-2xl">🗓️</span>
            <div>
              <h2 className="text-xl font-bold">
                {isWeeklyView ? "Weekly Surgical Timeline" : "Live Surgical Timeline"}
              </h2>
              <p className="text-xs text-muted-foreground">
                {isWeeklyView ? "07:00–17:00 across 7 days" : "Real-time view across 5 Operating Theaters"}
              </p>
            </div>
          </div>
          <div className="flex flex-col items-end gap-2">
            <SharePatientUpdates />
            <div className="flex gap-2">
              <Button variant={!isWeeklyView ? "default" : "outline"} size="sm" onClick={() => setIsWeeklyView(false)}>
                📅 Daily
              </Button>
              <Button variant={isWeeklyView ? "default" : "outline"} size="sm" onClick={() => setIsWeeklyView(true)}>
                📆 Weekly
              </Button>
            </div>
          </div>
        </div>
        <div className="bg-gradient-to-r from-muted/30 to-muted/10 rounded-xl p-4 border border-primary/10">
          {schedule || weeklySchedule ? (
            <Gantt delayedIds={delayedIds} isWeekly={isWeeklyView} />
          ) : (
            <p className="text-muted-foreground text-center py-8">
              Load sample data or generate a schedule to view the Gantt chart
            </p>
          )}
        </div>
      </div>

      {/* 6. Cases Table */}
      <CasesTable />

    </div>
  )
}

// ── Cases Table ───────────────────────────────────────────────────────────────

function CasesTable() {
  const { surgeries, removeCase } = useSurgeries()
  return (
    <Card>
      <CardHeader>
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-lg bg-blue-100"><span className="text-xl">📋</span></div>
          <div>
            <CardTitle>Scheduled Cases Overview</CardTitle>
            <p className="text-sm text-muted-foreground">Detailed case information and status tracking</p>
          </div>
        </div>
      </CardHeader>
      <CardContent className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead className="text-muted-foreground">
            <tr className="text-left">
              <th className="py-2 pr-2">Case</th>
              <th className="py-2 pr-2">Priority</th>
              <th className="py-2 pr-2">Duration</th>
              <th className="py-2 pr-2">Surgeon</th>
              <th className="py-2 pr-2">Equipment</th>
              <th className="py-2 pr-2"></th>
            </tr>
          </thead>
          <tbody>
            {surgeries.map((s) => (
              <tr key={s.id} className="border-t border-border hover:bg-muted/50 transition-colors">
                <td className="py-3 pr-2">
                  <div className="font-medium">{s.id}</div>
                  <div className="text-xs text-muted-foreground">{s.name}</div>
                </td>
                <td className="py-3 pr-2">
                  <div className="flex items-center gap-2">
                    <div className={`w-3 h-3 rounded-full ${getPriorityDot(s.priority)}`} />
                    <span>{s.priority} – {PRIORITY_LABELS[s.priority as keyof typeof PRIORITY_LABELS]}</span>
                  </div>
                </td>
                <td className="py-3 pr-2 font-medium">{s.durationMinutes} min</td>
                <td className="py-3 pr-2">{s.surgeon}</td>
                <td className="py-3 pr-2">{s.equipment}</td>
                <td className="py-3 pr-2 text-right">
                  <Button variant="ghost" size="sm" onClick={() => removeCase(s.id)} className="text-destructive hover:text-destructive">
                    Remove
                  </Button>
                </td>
              </tr>
            ))}
            {!surgeries.length && (
              <tr>
                <td colSpan={6} className="text-muted-foreground py-6 text-center">
                  No cases yet. Load sample data or add cases using the form.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </CardContent>
    </Card>
  )
}

// ── Time Prediction Section ───────────────────────────────────────────────────

function TimePredictionSection() {
  const [doctor, setDoctor] = useState("")
  const [surgeryType, setSurgeryType] = useState("")
  const [estMin, setEstMin] = useState(60)
  const [patientReady, setPatientReady] = useState("07:30")
  const [equipment, setEquipment] = useState("C-Arm")
  const [prediction, setPrediction] = useState<{ predMin: number; explain: string; conf: "low" | "med" | "high"; factors: Record<string, number>; deltaVsEstimate: number } | null>(null)
  const [exampleCollapsed, setExampleCollapsed] = useState(false)
  const [sectionCollapsed, setSectionCollapsed] = useState(true)
  const { toast } = useToast()

  const availableDoctors = useMemo(() => filterDoctorsByProcedure(SURGEONS, surgeryType), [surgeryType])
  const doctorLabels = useMemo(() => {
    const labels: Record<string, string> = {}
    availableDoctors.forEach(doc => { labels[doc] = formatDoctorWithSpecializationLabels(doc) })
    return labels
  }, [availableDoctors])

  useEffect(() => {
    if (surgeryType && doctor && !availableDoctors.includes(doctor)) setDoctor("")
  }, [surgeryType, doctor, availableDoctors])

  const handlePredict = () => {
    if (!doctor || !surgeryType) {
      toast({ title: "Missing information", description: "Please select both doctor and surgery type", variant: "destructive" })
      return
    }
    const out = predictDuration({ procedureCode: surgeryType, estMin, surgeonId: doctor, equipmentIds: [equipment], patientReady: patientReady as any }, SAMPLE_AGGREGATES)
    setPrediction({ ...out, deltaVsEstimate: out.predMin - estMin })
    setExampleCollapsed(false)
    toast({ title: "Prediction generated", description: `${out.predMin} min (${out.conf.toUpperCase()} confidence)` })
  }

  const getDetails = () => {
    if (!prediction || !surgeryType || !doctor) return null
    const ps   = SAMPLE_AGGREGATES.proc[surgeryType]
    const sStats = SAMPLE_AGGREGATES.procSurgeon[surgeryType]?.[doctor]
    const eStats = SAMPLE_AGGREGATES.procEquip[surgeryType]?.[equipment]
    const slot  = slotOfDayFrom(patientReady)
    const tStats = SAMPLE_AGGREGATES.procTOD[surgeryType]?.[slot]
    return { procMed: ps?.med ?? 0, procN: ps?.n ?? 0, sDelta: sStats?.med ?? 0, sN: sStats?.n ?? 0, eDelta: eStats?.med ?? 0, eN: eStats?.n ?? 0, tDelta: tStats?.med ?? 0, tN: tStats?.n ?? 0, slot }
  }

  const details = getDetails()
  const confColor = prediction?.conf === "high" ? "bg-emerald-600" : prediction?.conf === "med" ? "bg-amber-500" : "bg-slate-500"

  return (
    <div className="p-5">
      <button
        type="button"
        onClick={() => setSectionCollapsed(c => !c)}
        className="w-full bg-gradient-to-r from-blue-600 to-purple-600 px-4 py-3 rounded-xl mb-4 flex items-center justify-between gap-3 hover:brightness-110 transition-all"
      >
        <div className="flex items-center gap-3">
          <span className="text-2xl">🧠</span>
          <div className="text-left">
            <h4 className="text-base font-bold text-white">Smart Duration Predictor</h4>
            <p className="text-blue-100 text-xs">AI-powered surgical time estimation</p>
          </div>
        </div>
        <span className="text-white text-lg">{sectionCollapsed ? "▾" : "▴"}</span>
      </button>
      {!sectionCollapsed && <div className="space-y-3">
        <div className="grid grid-cols-2 gap-2">
          <div>
            <label className="text-xs text-muted-foreground mb-1 block">Surgery Type</label>
            <DropdownInput name="surgeryType" placeholder="Select type" options={PROCEDURE_NAMES} value={surgeryType} onChange={setSurgeryType} />
          </div>
          <div>
            <label className="text-xs text-muted-foreground mb-1 block">Doctor</label>
            <DropdownInput name="doctor" placeholder={surgeryType ? "Select doctor" : "Pick surgery first"} options={availableDoctors} value={doctor} onChange={setDoctor} disabled={!surgeryType} optionLabels={doctorLabels} />
          </div>
        </div>
        <div className="grid grid-cols-2 gap-2">
          <div>
            <label className="text-xs text-muted-foreground mb-1 block">Base Estimate (min)</label>
            <Input type="number" min={15} step={5} value={estMin} onChange={(e) => setEstMin(Number(e.target.value))} />
          </div>
          <div>
            <label className="text-xs text-muted-foreground mb-1 block">Patient Ready (HH:MM)</label>
            <Input type="text" value={patientReady} onChange={(e) => setPatientReady(e.target.value)} placeholder="07:30" />
          </div>
        </div>
        <div>
          <label className="text-xs text-muted-foreground mb-1 block">Equipment</label>
          <DropdownInput name="equipment" placeholder="Select equipment" options={EQUIPMENT} value={equipment} onChange={setEquipment} />
        </div>
        <Button onClick={handlePredict} className="w-full">Predict Duration</Button>

        {prediction && details && (
          <div className="rounded-xl border bg-white shadow-sm overflow-hidden">
            <div className="px-4 py-3 bg-gray-50 border-b flex items-center justify-between">
              <div>
                <h5 className="font-bold text-sm">Predicted: {prediction.predMin} min</h5>
                <p className="text-xs text-muted-foreground">{prediction.deltaVsEstimate >= 0 ? "+" : ""}{prediction.deltaVsEstimate} min vs estimate</p>
              </div>
              <div className="flex items-center gap-2">
                <span className={`px-3 py-1 rounded-full text-xs font-bold text-white ${confColor}`}>
                  {prediction.conf.toUpperCase()}
                </span>
                <Button type="button" variant="ghost" size="sm" onClick={() => setExampleCollapsed(p => !p)} className="text-xs">
                  {exampleCollapsed ? "Show analysis" : "Hide analysis"}
                </Button>
              </div>
            </div>
            {!exampleCollapsed && (
              <div className="p-4 space-y-2 text-xs">
                <div className="bg-blue-50 rounded-lg p-3 border border-blue-200">
                  <span className="font-semibold text-blue-800">📊 Historical Base:</span> {Math.round(prediction.factors.base)} min
                  <span className="text-blue-600 ml-1">({details.procN} {surgeryType} cases, median {Math.round(details.procMed)} min)</span>
                </div>
                {details.sN > 0 && (
                  <div className="bg-green-50 rounded-lg p-3 border border-green-200">
                    <span className="font-semibold text-green-800">👨‍⚕️ Surgeon Performance:</span> {prediction.factors.S >= 0 ? "+" : ""}{Math.round(prediction.factors.S)} min
                    <span className="text-green-600 ml-1">({details.sN} previous surgeries)</span>
                  </div>
                )}
                {details.eN > 0 && (
                  <div className="bg-purple-50 rounded-lg p-3 border border-purple-200">
                    <span className="font-semibold text-purple-800">🔧 Equipment Impact:</span> {prediction.factors.E >= 0 ? "+" : ""}{Math.round(prediction.factors.E)} min
                  </div>
                )}
                {details.tN > 0 && (
                  <div className="bg-orange-50 rounded-lg p-3 border border-orange-200">
                    <span className="font-semibold text-orange-800">⏰ Time Slot ({details.slot}):</span> {prediction.factors.T >= 0 ? "+" : ""}{Math.round(prediction.factors.T)} min
                  </div>
                )}
                <div className="bg-gray-100 rounded-lg p-3 border border-gray-300 font-semibold">
                  🎯 Final: {prediction.predMin} min (L={Math.round(prediction.factors.L)}, U={Math.round(prediction.factors.U)})
                </div>
              </div>
            )}
          </div>
        )}
      </div>}
    </div>
  )
}

// ── Add Case Form ─────────────────────────────────────────────────────────────

function AddCaseForm() {
  const { addCase } = useSurgeries()
  const [formData, setFormData] = useState({ caseId: "", name: "", duration: 60, surgeon: "", equipment: "", priority: 3 })
  const [priorityInfo, setPriorityInfo] = useState<{ priority: number; reason: string; urgencyFactors: string[]; confidence: "high" | "medium" | "low" } | null>(null)
  const [predInfo, setPredInfo] = useState<{ value: number; explain: string; conf: string } | null>(null)
  const { toast } = useToast()
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  const availableDoctors = useMemo(() => filterDoctorsByProcedure(SURGEONS, formData.name), [formData.name])
  const doctorLabels = useMemo(() => {
    const labels: Record<string, string> = {}
    availableDoctors.forEach(doc => { labels[doc] = formatDoctorWithSpecializationLabels(doc) })
    return labels
  }, [availableDoctors])

  useEffect(() => {
    if (formData.name) {
      const p = determineProcedurePriority(formData.name)
      setPriorityInfo(p)
      setFormData(prev => ({ ...prev, priority: p.priority }))
      toast({ title: `Priority: ${getPriorityLabel(p.priority as 1|2|3|4|5)}`, description: p.reason })
    } else {
      setPriorityInfo(null)
      setFormData(prev => ({ ...prev, priority: 3 }))
    }
  }, [formData.name, toast])

  useEffect(() => {
    if (formData.name && formData.surgeon && !availableDoctors.includes(formData.surgeon)) {
      setFormData(prev => ({ ...prev, surgeon: "" }))
    }
  }, [formData.name, formData.surgeon, availableDoctors])

  const confTone = useMemo(() => {
    if (!predInfo) return { className: "bg-muted text-foreground", label: "" }
    if (predInfo.conf === "high") return { className: "bg-emerald-600 text-white", label: "High" }
    if (predInfo.conf === "med") return { className: "bg-amber-500 text-white", label: "Med" }
    return { className: "bg-slate-500 text-white", label: "Low" }
  }, [predInfo])

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    addCase({
      id: formData.caseId.trim() || `S-${Math.floor(Math.random() * 900 + 100)}`,
      name: formData.name.trim() || "Elective Case",
      durationMinutes: Math.max(15, formData.duration),
      surgeon: formData.surgeon.trim() || "Dr. Rajesh Kumar",
      equipment: formData.equipment.trim() || "C-Arm",
      priority: Math.min(5, Math.max(1, formData.priority)) as 1|2|3|4|5,
    })
    setFormData({ caseId: "", name: "", duration: 60, surgeon: "", equipment: "", priority: 3 })
    setPredInfo(null)
    setPriorityInfo(null)
  }

  const onPredict = () => {
    const out = predictDuration({ procedureCode: formData.name || "Hip Replacement", estMin: Math.max(15, formData.duration), surgeonId: formData.surgeon || "Dr. Rajesh Kumar", equipmentIds: formData.equipment ? [formData.equipment] : ["C-Arm"], patientReady: "07:30" }, SAMPLE_AGGREGATES)
    setFormData(prev => ({ ...prev, duration: out.predMin }))
    setPredInfo({ value: out.predMin, explain: out.explain, conf: out.conf })
    toast({ title: `Applied prediction: ${out.predMin} min (${out.conf.toUpperCase()})` })
  }

  useEffect(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current)
    debounceRef.current = setTimeout(() => {
      const out = predictDuration({ procedureCode: formData.name || "Hip Replacement", estMin: Math.max(15, formData.duration), surgeonId: formData.surgeon || "Dr. Rajesh Kumar", equipmentIds: formData.equipment ? [formData.equipment] : ["C-Arm"], patientReady: "07:30" }, SAMPLE_AGGREGATES)
      setPredInfo({ value: out.predMin, explain: out.explain, conf: out.conf })
    }, 350)
    return () => { if (debounceRef.current) clearTimeout(debounceRef.current) }
  }, [formData.name, formData.surgeon, formData.equipment, formData.duration])

  return (
    <form onSubmit={handleSubmit} className="grid grid-cols-2 gap-2">
      <Input name="caseId" placeholder="Case ID (optional)" className="col-span-2" value={formData.caseId} onChange={(e) => setFormData(p => ({ ...p, caseId: e.target.value }))} />
      <DropdownInput name="name" placeholder="Procedure name" options={PROCEDURE_NAMES} value={formData.name} onChange={(v) => setFormData(p => ({ ...p, name: v }))} className="col-span-2" />
      <div className="flex items-center gap-2">
        <Input name="duration" type="number" min={15} step={5} value={formData.duration} onChange={(e) => setFormData(p => ({ ...p, duration: Number(e.target.value) }))} placeholder="Duration (min)" />
        {predInfo && (
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <Badge className={`${confTone.className} whitespace-nowrap text-xs`}>{predInfo.value}m • {confTone.label}</Badge>
              </TooltipTrigger>
              <TooltipContent className="max-w-xs text-xs">{predInfo.explain}</TooltipContent>
            </Tooltip>
          </TooltipProvider>
        )}
      </div>
      <DropdownInput name="surgeon" placeholder={formData.name ? "Select Surgeon" : "Pick procedure first"} options={availableDoctors} value={formData.surgeon} onChange={(v) => setFormData(p => ({ ...p, surgeon: v }))} disabled={!formData.name || !availableDoctors.length} optionLabels={doctorLabels} />
      <DropdownInput name="equipment" placeholder="Equipment" options={EQUIPMENT} value={formData.equipment} onChange={(v) => setFormData(p => ({ ...p, equipment: v }))} className="col-span-2" />
      <div className="col-span-2">
        {priorityInfo ? (
          <div className="p-2 rounded-lg border text-xs" style={{ backgroundColor: `${getPriorityColor(priorityInfo.priority as 1|2|3|4|5)}15`, borderColor: getPriorityColor(priorityInfo.priority as 1|2|3|4|5) }}>
            <div className="flex items-center gap-2 mb-1">
              <div className="w-2 h-2 rounded-full" style={{ backgroundColor: getPriorityColor(priorityInfo.priority as 1|2|3|4|5) }} />
              <span className="font-semibold">P{priorityInfo.priority} – {getPriorityLabel(priorityInfo.priority as 1|2|3|4|5)}</span>
              <Badge variant="outline" className="text-[10px] py-0">{priorityInfo.confidence}</Badge>
            </div>
            <p className="text-muted-foreground">{priorityInfo.reason}</p>
          </div>
        ) : (
          <div className="p-2 rounded-lg border border-dashed border-muted-foreground/30 text-center text-xs text-muted-foreground">
            Priority assigned automatically based on procedure
          </div>
        )}
      </div>
      <div className="col-span-2 flex gap-2">
        <Button type="button" variant="outline" onClick={onPredict} className="text-sm">Apply prediction</Button>
        <Button type="submit" className="flex-1 text-sm">Add Case</Button>
      </div>
    </form>
  )
}

// ── Default Export ────────────────────────────────────────────────────────────

export default function AdminDashboard() {
  return (
    <SessionProtection requiredRole="admin" redirectTo="/admin-login">
      <AdminDashboardContent />
    </SessionProtection>
  )
}
