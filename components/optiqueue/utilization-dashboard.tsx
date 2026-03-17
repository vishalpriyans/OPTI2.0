"use client"

import { useMemo, useState, useCallback, memo } from "react"
import { format, startOfDay, startOfWeek, startOfMonth, addHours, addDays, getDaysInMonth } from "date-fns"
import { LineChart, Line, XAxis, YAxis, CartesianGrid } from "recharts"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Badge } from "@/components/ui/badge"
import { Switch } from "@/components/ui/switch"
import { Skeleton } from "@/components/ui/skeleton"
import { ChartContainer, ChartTooltip, ChartTooltipContent } from "@/components/ui/chart"
import { AlertTriangle, Activity, ChevronDown, ChevronUp } from "lucide-react"
import { SURGEONS, EQUIPMENT } from "./sample-data"
import { cn } from "@/lib/utils"
import { useToast } from "@/components/ui/use-toast"

const RANGE_OPTIONS = [
  { label: "Day", value: "day" },
  { label: "Week", value: "week" },
  { label: "Month", value: "month" },
] as const

const BUCKET_OPTIONS: Record<TimeRange, TimeBucket[]> = {
  day: ["hour", "day"],
  week: ["day"],
  month: ["day"],
}

const OT_OPTIONS = ["OT-1", "OT-2", "OT-3", "OT-4", "OT-5"] as const

const CHART_CONFIG = {
  utilization: { label: "Utilization %", color: "var(--chart-3)" },
  busyMinutes: { label: "Busy Minutes", color: "var(--chart-2)" },
  availableMinutes: { label: "Available Minutes", color: "var(--chart-5)" },
} as const

type TimeRange = (typeof RANGE_OPTIONS)[number]["value"]
type TimeBucket = "hour" | "day"
type Mode = "doctor" | "equipment"

type UtilizationPoint = {
  x: string
  utilization: number
  busyMinutes: number
  availableMinutes: number
  meta?: {
    bucketStartISO: string
    bucketEndISO: string
    drilldownLabel?: string
  }
}

type UtilizationSummary = {
  totalBusyMinutes: number
  totalAvailableMinutes: number
  averageUtilization: number
  peakUtilization: number
  overtimeMinutes: number
}

type UtilizationSeries = {
  points: UtilizationPoint[]
  summary: UtilizationSummary
}

type Filters = {
  surgeonId?: string
  equipmentId?: string
  otId?: string
  includeTurnover?: boolean
}

type FetchKey = {
  mode: Mode
  range: TimeRange
  bucket: TimeBucket
  filters: Filters
}

export function UtilizationDashboard() {
  const [isMinimized, setIsMinimized] = useState(true)

  return (
    <div className="control-tower-card space-y-6 p-6">
      <header className="flex items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-foreground">Utilization Analysis</h2>
          <p className="text-sm text-muted-foreground">
            Track doctor and equipment workload across selectable windows.
          </p>
        </div>
        <div className="flex items-center gap-3">
          <Badge variant="outline">Live analytics</Badge>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setIsMinimized(!isMinimized)}
            className="h-8 w-8 p-0"
          >
            {isMinimized ? (
              <ChevronDown className="h-4 w-4" />
            ) : (
              <ChevronUp className="h-4 w-4" />
            )}
          </Button>
        </div>
      </header>
      {!isMinimized && (
        <div className="grid gap-6 xl:grid-cols-2 w-full">
          <div className="min-w-0">
            <UtilizationSection mode="doctor" />
          </div>
          <div className="min-w-0">
            <UtilizationSection mode="equipment" />
          </div>
        </div>
      )}
    </div>
  )
}

function UtilizationSection({ mode }: { mode: Mode }) {
  const { toast } = useToast()
  const [range, setRange] = useState<TimeRange>("day")
  const [bucket, setBucket] = useState<TimeBucket>("hour")
  const [surgeonId, setSurgeonId] = useState<string>("all-surgeons")
  const [equipmentId, setEquipmentId] = useState<string>("all-equipment")
  const [otId, setOtId] = useState<string>("all-ots")
  const [includeTurnover, setIncludeTurnover] = useState<boolean>(mode === "doctor")
  const [showBusy, setShowBusy] = useState(true)
  const [showAvailable, setShowAvailable] = useState(false)

  const filters = useMemo<Filters>(() => ({
    surgeonId: surgeonId === "all-surgeons" ? undefined : surgeonId,
    equipmentId: equipmentId === "all-equipment" ? undefined : equipmentId,
    otId: otId === "all-ots" ? undefined : otId,
    includeTurnover: mode === "doctor" ? includeTurnover : undefined,
  }), [surgeonId, equipmentId, otId, includeTurnover, mode])

  const { data, isLoading, error } = useUtilizationData({ mode, range, bucket, filters })

  const chartData = data?.points ?? []
  const summary = data?.summary
  const handleDrilldown = useCallback((state: unknown) => {
    const meta = (state as { activePayload?: { payload?: UtilizationPoint }[] } | undefined)?.activePayload?.[0]?.payload?.meta
    if (!meta?.bucketStartISO || !meta.bucketEndISO) return
    const label = meta.drilldownLabel || (mode === "doctor" ? "Doctor" : "Equipment")
    toast({
      title: "Opening detailed view",
      description: `${label} • ${format(new Date(meta.bucketStartISO), "PPpp")} → ${format(new Date(meta.bucketEndISO), "PPpp")}`,
    })
  }, [mode, toast])

  return (
    <Card className="space-y-4 border-border/40">
      <CardHeader className="space-y-2">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <CardTitle>{mode === "doctor" ? "Doctor Utilization" : "Equipment Utilization"}</CardTitle>
            <p className="text-sm text-muted-foreground">
              {mode === "doctor"
                ? "Compare surgeon operating time versus availability."
                : "Spot equipment underuse, bottlenecks, and maintenance overlap."}
            </p>
          </div>
          {summary && (
            <div className="flex gap-3 text-sm text-muted-foreground">
              <span className="font-semibold text-foreground">Avg {summary.averageUtilization.toFixed(1)}%</span>
              <span>Peak {summary.peakUtilization.toFixed(1)}%</span>
              <span>Overtime {summary.overtimeMinutes} min</span>
            </div>
          )}
        </div>
        <div className="flex flex-wrap items-center gap-3">
          <RangeButtons value={range} onChange={(next) => {
            setRange(next)
            const allowed = BUCKET_OPTIONS[next]
            if (!allowed.includes(bucket)) {
              setBucket(allowed[0])
            }
          }} />
          <Select value={bucket} onValueChange={(value: TimeBucket) => setBucket(value)}>
            <SelectTrigger className="w-[140px]"><SelectValue placeholder="Bucket" /></SelectTrigger>
            <SelectContent>
              {BUCKET_OPTIONS[range].map((option) => (
                <SelectItem key={option} value={option}>
                  {option === "hour" ? "By Hour" : "By Day"}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          {mode === "doctor" ? (
            <Select value={surgeonId} onValueChange={setSurgeonId}>
              <SelectTrigger className="w-[170px]"><SelectValue placeholder="Surgeon" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all-surgeons">All Surgeons</SelectItem>
                {SURGEONS.map((name) => (
                  <SelectItem key={name} value={name}>{name}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          ) : (
            <>
              <Select value={equipmentId} onValueChange={setEquipmentId}>
                <SelectTrigger className="w-[170px]"><SelectValue placeholder="Equipment" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="all-equipment">All Equipment</SelectItem>
                  {EQUIPMENT.map((label) => (
                    <SelectItem key={label} value={label}>{label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Select value={otId} onValueChange={setOtId}>
                <SelectTrigger className="w-[130px]"><SelectValue placeholder="OT" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="all-ots">All OTs</SelectItem>
                  {OT_OPTIONS.map((ot) => (
                    <SelectItem key={ot} value={ot}>{ot}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </>
          )}
          {mode === "doctor" && (
            <div className="flex items-center gap-2 rounded-lg border border-border/40 px-3 py-2 text-xs text-muted-foreground">
              <span>Include turnover</span>
              <Switch checked={includeTurnover} onCheckedChange={setIncludeTurnover} />
            </div>
          )}
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        <LegendControls
          showBusy={showBusy}
          showAvailable={showAvailable}
          onToggleBusy={() => setShowBusy((prev) => !prev)}
          onToggleAvailable={() => setShowAvailable((prev) => !prev)}
        />
        <div className="rounded-xl border border-border/50 bg-card/80 p-4 overflow-hidden">
          {isLoading ? (
            <Skeleton className="h-64 w-full" />
          ) : error ? (
            <div className="flex items-center gap-2 text-sm text-destructive">
              <AlertTriangle className="h-4 w-4" />
              Failed to load utilization data.
            </div>
          ) : (
            <div className="w-full h-[280px]">
              <ChartContainer config={CHART_CONFIG} className="w-full h-full">
                <LineChart data={chartData} onClick={handleDrilldown}>
                  <CartesianGrid strokeDasharray="4 4" stroke="rgba(148,163,184,0.25)" />
                  <XAxis 
                    dataKey="x" 
                    tickLine={false} 
                    axisLine={false} 
                    dy={8}
                    tick={{ fontSize: 12 }}
                  />
                  <YAxis 
                    domain={[0, 110]} 
                    tickLine={false} 
                    axisLine={false}
                    tick={{ fontSize: 12 }}
                    width={40}
                  />
                  <ChartTooltip content={<ChartTooltipContent hideLabel />} cursor={{ strokeDasharray: "3 3" }} />
                  {showAvailable ? (
                    <Line type="monotone" dataKey="availableMinutes" stroke="var(--chart-5)" strokeDasharray="4 4" dot={false} />
                  ) : null}
                  {showBusy ? (
                    <Line type="monotone" dataKey="busyMinutes" stroke="var(--chart-2)" strokeWidth={2} dot={false} />
                  ) : null}
                  <Line type="monotone" dataKey="utilization" stroke="var(--chart-3)" strokeWidth={3} dot={{ r: 4 }} activeDot={{ r: 6 }} />
                </LineChart>
              </ChartContainer>
            </div>
          )}
        </div>
        <RemarksPanel mode={mode} series={data} />
      </CardContent>
    </Card>
  )
}

function RangeButtons({ value, onChange }: { value: TimeRange; onChange: (value: TimeRange) => void }) {
  return (
    <div className="flex gap-2">
      {RANGE_OPTIONS.map((option) => (
        <Button
          key={option.value}
          size="sm"
          variant={value === option.value ? "default" : "outline"}
          onClick={() => onChange(option.value)}
        >
          {option.label}
        </Button>
      ))}
    </div>
  )
}

function LegendControls({
  showBusy,
  showAvailable,
  onToggleBusy,
  onToggleAvailable,
}: {
  showBusy: boolean
  showAvailable: boolean
  onToggleBusy: () => void
  onToggleAvailable: () => void
}) {
  return (
    <div className="flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
      <span>Legend:</span>
      <LegendPill active color="var(--chart-3)" label="Utilization %" onClick={() => {}} />
      <LegendPill active={showBusy} color="var(--chart-2)" label="Busy Minutes" onClick={onToggleBusy} />
      <LegendPill active={showAvailable} color="var(--chart-5)" label="Available Minutes" onClick={onToggleAvailable} />
    </div>
  )
}

function LegendPill({ active, color, label, onClick }: { active: boolean; color: string; label: string; onClick: () => void }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        "flex items-center gap-2 rounded-full border px-3 py-1 transition-colors",
        active ? "border-transparent text-foreground" : "border-border text-muted-foreground",
      )}
      style={{ background: active ? color : "transparent", color: active ? "white" : undefined }}
    >
      <span className="h-2 w-2 rounded-full" style={{ background: active ? "white" : color }} />
      {label}
    </button>
  )
}

function RemarksPanel({ mode, series }: { mode: Mode; series?: UtilizationSeries }) {
  const remarks = useMemo(() => computeRemarks(mode, series), [mode, series])

  return (
    <div className="space-y-2 rounded-xl border border-border/40 bg-muted/30 p-4">
      <div className="flex items-center gap-2 font-semibold text-foreground">
        <Activity className="h-4 w-4 text-primary" />
        {mode === "doctor" ? "Doctor Insights" : "Equipment Insights"}
      </div>
      <div className="space-y-2 text-sm">
        {remarks.map((remark, idx) => (
          <div key={`${remark.title}-${idx}`} className={cn("rounded-lg border px-3 py-2", toneToBorder(remark.tone))}>
            <p className="font-semibold text-foreground">{remark.title}</p>
            <p className="text-muted-foreground text-sm">{remark.description}</p>
          </div>
        ))}
      </div>
    </div>
  )
}

type Remark = {
  title: string
  description: string
  tone: "info" | "warning" | "positive"
}

function toneToBorder(tone: Remark["tone"]) {
  switch (tone) {
    case "warning":
      return "border-orange-200 bg-orange-50"
    case "positive":
      return "border-emerald-200 bg-emerald-50"
    default:
      return "border-border/40"
  }
}

function computeRemarks(mode: Mode, series?: UtilizationSeries): Remark[] {
  if (!series || !series.points.length) {
    return [{ title: "Awaiting data", description: "Load a range to generate insights.", tone: "info" }]
  }

  const remarks: Remark[] = []
  const avg = series.summary.averageUtilization
  if (avg < 50) {
    remarks.push({ title: "Underuse detected", description: "Average utilization below 50% — consider reallocating slots.", tone: "warning" })
  } else if (avg > 85) {
    remarks.push({ title: "Overload risk", description: "Sustained high utilization — watch for burnout and delays.", tone: "warning" })
  } else {
    remarks.push({ title: "Healthy load", description: "Utilization within optimal band.", tone: "positive" })
  }

  const values = series.points.map((p) => p.utilization)
  const mean = values.reduce((sum, v) => sum + v, 0) / values.length
  const variance = values.reduce((sum, v) => sum + Math.pow(v - mean, 2), 0) / values.length
  const stdev = Math.sqrt(variance)
  if (stdev > 20) {
    remarks.push({ title: "High volatility", description: "Utilization swings exceed 20% — refine scheduling buffers.", tone: "warning" })
  }

  if (mode === "equipment" && series.summary.totalAvailableMinutes > 0 && series.summary.totalBusyMinutes === 0) {
    remarks.push({ title: "Idle equipment", description: "No usage recorded in this window — verify maintenance or scheduling gaps.", tone: "warning" })
  }

  if (!remarks.length) {
    remarks.push({ title: "All clear", description: "No anomalies detected for the selected window.", tone: "info" })
  }
  return remarks
}

function useUtilizationData(key: FetchKey) {
  // For instant loading, return sample data immediately without API calls
  // In production, you would implement proper caching and API optimization
  
  const sampleData = useMemo(() => {
    const baseData = key.mode === "doctor" ? SAMPLE_DOCTOR_DATA : SAMPLE_EQUIPMENT_DATA
    
    // Generate dynamic data based on filters for more realistic behavior
    if (key.filters.surgeonId && key.mode === "doctor") {
      // Simulate surgeon-specific data
      return {
        ...baseData,
        points: baseData.points.map(point => ({
          ...point,
          utilization: Math.max(20, point.utilization + (Math.random() - 0.5) * 20),
          busyMinutes: Math.floor(point.busyMinutes * (0.8 + Math.random() * 0.4))
        })),
        summary: {
          ...baseData.summary,
          averageUtilization: 60 + Math.random() * 25,
          peakUtilization: 75 + Math.random() * 20
        }
      }
    }
    
    if (key.filters.equipmentId && key.mode === "equipment") {
      // Simulate equipment-specific data
      return {
        ...baseData,
        points: baseData.points.map(point => ({
          ...point,
          utilization: Math.max(15, point.utilization + (Math.random() - 0.5) * 30),
          busyMinutes: Math.floor(point.busyMinutes * (0.7 + Math.random() * 0.6))
        })),
        summary: {
          ...baseData.summary,
          averageUtilization: 55 + Math.random() * 30,
          peakUtilization: 70 + Math.random() * 25
        }
      }
    }
    
    return baseData
  }, [key.mode, key.filters.surgeonId, key.filters.equipmentId])

  // Return data immediately for instant loading
  return { 
    data: sampleData, 
    error: null, 
    isLoading: false 
  }
}

const SAMPLE_DOCTOR_DATA: UtilizationSeries = {
  points: [
    { x: "07:00", utilization: 42, busyMinutes: 120, availableMinutes: 280 },
    { x: "09:00", utilization: 65, busyMinutes: 180, availableMinutes: 280 },
    { x: "11:00", utilization: 88, busyMinutes: 245, availableMinutes: 280 },
    { x: "13:00", utilization: 74, busyMinutes: 210, availableMinutes: 280 },
    { x: "15:00", utilization: 52, busyMinutes: 160, availableMinutes: 280 },
  ],
  summary: {
    totalBusyMinutes: 915,
    totalAvailableMinutes: 1400,
    averageUtilization: 64.2,
    peakUtilization: 88,
    overtimeMinutes: 45,
  },
}

const SAMPLE_EQUIPMENT_DATA: UtilizationSeries = {
  points: [
    { x: "Mon", utilization: 72, busyMinutes: 360, availableMinutes: 480 },
    { x: "Tue", utilization: 91, busyMinutes: 430, availableMinutes: 480 },
    { x: "Wed", utilization: 54, busyMinutes: 260, availableMinutes: 480 },
    { x: "Thu", utilization: 63, busyMinutes: 300, availableMinutes: 480 },
    { x: "Fri", utilization: 48, busyMinutes: 230, availableMinutes: 480 },
  ],
  summary: {
    totalBusyMinutes: 1580,
    totalAvailableMinutes: 2400,
    averageUtilization: 65.6,
    peakUtilization: 91,
    overtimeMinutes: 30,
  },
}
