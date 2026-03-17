"use client"

import { useMemo } from "react"
import type { DoctorDashboardCase } from "./types"
import { cn } from "@/lib/utils"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"

const DAY_START_HOUR = 7
const DAY_END_HOUR = 17
const TOTAL_MINUTES = (DAY_END_HOUR - DAY_START_HOUR) * 60
const TURNOVER_MINUTES = 30

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
    default:
      return "priority-elective"
  }
}

function minutesToPosition(minutes: number): number {
  // Convert time (e.g., 8:30 = 90 minutes after 7:00) to percentage
  return (minutes / TOTAL_MINUTES) * 100
}

function timeToMinutes(hour: number, minute: number): number {
  return (hour - DAY_START_HOUR) * 60 + minute
}

function formatTime(isoString: string): string {
  const date = new Date(isoString)
  const hours = date.getHours()
  const minutes = date.getMinutes()
  const h12 = ((hours + 11) % 12) + 1
  const ampm = hours >= 12 ? "PM" : "AM"
  return `${h12}:${minutes.toString().padStart(2, "0")} ${ampm}`
}

function getNowLinePosition(): number | null {
  const now = new Date()
  const currentHour = now.getHours()
  const currentMinute = now.getMinutes()
  
  if (currentHour < DAY_START_HOUR || currentHour >= DAY_END_HOUR) {
    return null
  }
  
  const minutes = timeToMinutes(currentHour, currentMinute)
  return minutesToPosition(minutes)
}

export function SurgeonTimeline({ 
  cases, 
  isWeekly = false 
}: { 
  cases: DoctorDashboardCase[]
  isWeekly?: boolean 
}) {
  // CRITICAL: ALL HOOKS MUST BE CALLED BEFORE ANY CONDITIONAL LOGIC
  const nowLinePosition = useMemo(() => getNowLinePosition(), [])
  
  // Sort cases by scheduled start time - ALWAYS call this hook
  const sortedCases = useMemo(() => {
    if (!cases || !Array.isArray(cases)) return []
    return [...cases].sort((a, b) => 
      new Date(a.scheduledStartISO).getTime() - new Date(b.scheduledStartISO).getTime()
    )
  }, [cases])

  // Detect overlaps between cases - ALWAYS call this hook
  const overlaps = useMemo(() => {
    const overlapSet = new Set<string>()
    if (!sortedCases || sortedCases.length === 0) return overlapSet
    
    for (let i = 0; i < sortedCases.length; i++) {
      for (let j = i + 1; j < sortedCases.length; j++) {
        const case1 = sortedCases[i]
        const case2 = sortedCases[j]
        const start1 = new Date(case1.scheduledStartISO).getTime()
        const end1 = new Date(case1.expectedEndISO).getTime()
        const start2 = new Date(case2.scheduledStartISO).getTime()
        const end2 = new Date(case2.expectedEndISO).getTime()
        
        // Check if cases overlap (with 30 min turnover buffer)
        const turnoverBuffer = 30 * 60000 // 30 minutes in milliseconds
        if (start1 < end2 + turnoverBuffer && end1 + turnoverBuffer > start2) {
          overlapSet.add(case1.caseId)
          overlapSet.add(case2.caseId)
        }
      }
    }
    return overlapSet
  }, [sortedCases])

  // Calculate positions for each case - ALWAYS call this hook
  const caseBlocks = useMemo(() => {
    if (!sortedCases || sortedCases.length === 0) return []
    
    return sortedCases.map((c) => {
      const startDate = new Date(c.scheduledStartISO)
      const endDate = new Date(c.expectedEndISO)
      
      const startHour = startDate.getHours()
      const startMinute = startDate.getMinutes()
      const endHour = endDate.getHours()
      const endMinute = endDate.getMinutes()
      
      const startMinutes = timeToMinutes(startHour, startMinute)
      const endMinutes = timeToMinutes(endHour, endMinute)
      
      const left = minutesToPosition(Math.max(0, startMinutes))
      const width = minutesToPosition(Math.max(0, endMinutes - startMinutes))
      
      return {
        case: c,
        left,
        width: Math.min(width, 100 - left),
        hasOverlap: overlaps.has(c.caseId),
      }
    })
  }, [sortedCases, overlaps])

  // Generate time markers - ALWAYS call this hook
  const timeMarkers = useMemo(() => {
    const markers = []
    for (let hour = DAY_START_HOUR; hour <= DAY_END_HOUR; hour++) {
      const minutes = timeToMinutes(hour, 0)
      const position = minutesToPosition(minutes)
      markers.push({ hour, position })
    }
    return markers
  }, [])

  // Generate weekly data - ALWAYS call this hook (but return null if not weekly)
  const weeklyData = useMemo(() => {
    if (!isWeekly) return null
    
    // Use deterministic data generation to prevent hydration issues
    const today = new Date()
    const startOfWeek = new Date(today)
    startOfWeek.setDate(today.getDate() - today.getDay()) // Start from Sunday
    
    const procedures = ['Appendectomy', 'Cholecystectomy', 'Hernia Repair', 'Knee Arthroscopy', 'Cataract Surgery', 'Hip Replacement', 'CABG', 'Thyroidectomy']
    const statuses = ['Scheduled', 'In Progress', 'Completed', 'Delayed']
    const indianSurgeons = ['Dr. Rajesh Kumar', 'Dr. Priya Sharma', 'Dr. Anil Mehta', 'Dr. Sunita Reddy', 'Dr. Vikram Singh', 'Dr. Meera Desai', 'Dr. Arjun Patel', 'Dr. Kavita Nair']
    
    const weekDays = []
    for (let i = 0; i < 7; i++) {
      const day = new Date(startOfWeek)
      day.setDate(startOfWeek.getDate() + i)
      
      // Generate deterministic sample cases for each day
      const dayCases = []
      const casesPerDay = (i % 3) + 2 // 2-4 cases per day, deterministic
      
      for (let j = 0; j < casesPerDay; j++) {
        const startHour = 7 + (j * 2) + (i % 2) // Deterministic scheduling
        const duration = 60 + (j * 30) // Deterministic durations
        
        const startTime = new Date(day)
        startTime.setHours(Math.min(startHour, 15), j * 15, 0, 0)
        
        const endTime = new Date(startTime)
        endTime.setMinutes(endTime.getMinutes() + duration)
        
        dayCases.push({
          id: `W${i}-${j}`,
          procedure: procedures[j % procedures.length],
          startTime: startTime.toISOString(),
          endTime: endTime.toISOString(),
          priority: ((i + j) % 5) + 1,
          status: statuses[j % statuses.length]
        })
      }
      
      weekDays.push({
        date: day,
        dayName: day.toLocaleDateString('en-US', { weekday: 'short' }),
        dayNumber: day.getDate(),
        cases: dayCases.sort((a, b) => new Date(a.startTime).getTime() - new Date(b.startTime).getTime())
      })
    }
    
    return weekDays
  }, [isWeekly])

  if (isWeekly && weeklyData) {
    return (
      <div className="space-y-4">
        {/* Weekly Header */}
        <div className="flex items-center justify-between p-4 bg-gradient-to-r from-blue-50 to-indigo-50 rounded-xl border border-blue-200">
          <div>
            <h3 className="font-semibold text-blue-800">Weekly Schedule Overview</h3>
            <p className="text-sm text-blue-600">7-day surgical schedule with daily breakdowns</p>
          </div>
          <div className="text-sm text-blue-700 bg-blue-100 px-3 py-1 rounded-full">
            {weeklyData.reduce((total, day) => total + day.cases.length, 0)} total cases
          </div>
        </div>

        {/* Weekly Grid */}
        <div className="grid grid-cols-7 gap-2">
          {weeklyData.map((day, dayIndex) => (
            <div key={dayIndex} className="space-y-2">
              {/* Day Header */}
              <div className="text-center p-2 bg-gradient-to-b from-muted/50 to-muted/30 rounded-lg border">
                <div className="font-semibold text-sm">{day.dayName}</div>
                <div className="text-xs text-muted-foreground">{day.dayNumber}</div>
                <div className="text-xs font-medium text-primary">{day.cases.length} cases</div>
              </div>
              
              {/* Day Timeline */}
              <div className="space-y-1">
                {day.cases.length === 0 ? (
                  <div className="h-16 rounded-lg border border-dashed border-muted/50 flex items-center justify-center">
                    <span className="text-xs text-muted-foreground">No cases</span>
                  </div>
                ) : (
                  day.cases.map((caseItem, caseIndex) => {
                    const startTime = new Date(caseItem.startTime)
                    const endTime = new Date(caseItem.endTime)
                    const duration = (endTime.getTime() - startTime.getTime()) / (1000 * 60) // minutes
                    
                    const priorityColors = {
                      1: 'bg-red-500 border-red-600',
                      2: 'bg-orange-500 border-orange-600', 
                      3: 'bg-yellow-500 border-yellow-600',
                      4: 'bg-blue-500 border-blue-600',
                      5: 'bg-green-500 border-green-600'
                    }
                    
                    const statusColors = {
                      'Scheduled': 'ring-1 ring-blue-300',
                      'In Progress': 'ring-2 ring-green-400 animate-pulse',
                      'Completed': 'ring-1 ring-gray-300 opacity-75',
                      'Delayed': 'ring-2 ring-red-400'
                    }
                    
                    return (
                      <TooltipProvider key={caseItem.id}>
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <div 
                              className={cn(
                                "p-2 rounded-lg border text-white text-xs cursor-pointer transition-all hover:scale-105 hover:shadow-lg",
                                priorityColors[caseItem.priority as keyof typeof priorityColors],
                                statusColors[caseItem.status as keyof typeof statusColors]
                              )}
                              style={{ minHeight: `${Math.max(40, duration / 3)}px` }}
                            >
                              <div className="font-medium truncate">{caseItem.procedure}</div>
                              <div className="text-[10px] opacity-90 mt-1">
                                {startTime.toLocaleTimeString('en-US', { 
                                  hour: 'numeric', 
                                  minute: '2-digit',
                                  hour12: true 
                                })}
                              </div>
                              <div className="text-[10px] opacity-75">
                                {Math.round(duration)}min
                              </div>
                            </div>
                          </TooltipTrigger>
                          <TooltipContent>
                            <div className="space-y-1">
                              <div className="font-semibold">{caseItem.procedure}</div>
                              <div className="text-sm">
                                {startTime.toLocaleTimeString()} - {endTime.toLocaleTimeString()}
                              </div>
                              <div className="grid grid-cols-2 gap-1 text-xs">
                                <span className="text-muted-foreground">Priority:</span>
                                <span>P{caseItem.priority}</span>
                                <span className="text-muted-foreground">Status:</span>
                                <span>{caseItem.status}</span>
                                <span className="text-muted-foreground">Duration:</span>
                                <span>{Math.round(duration)} min</span>
                              </div>
                            </div>
                          </TooltipContent>
                        </Tooltip>
                      </TooltipProvider>
                    )
                  })
                )}
              </div>
            </div>
          ))}
        </div>

        {/* Weekly Summary */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 p-4 bg-gradient-to-r from-green-50 to-emerald-50 rounded-xl border border-green-200">
          <div className="text-center">
            <div className="text-2xl font-bold text-green-600">
              {weeklyData.reduce((total, day) => total + day.cases.length, 0)}
            </div>
            <div className="text-sm text-green-700">Total Cases</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-blue-600">
              {weeklyData.filter(day => day.cases.length > 0).length}
            </div>
            <div className="text-sm text-blue-700">Active Days</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-purple-600">
              {Math.round(weeklyData.reduce((total, day) => {
                return total + day.cases.reduce((dayTotal, c) => {
                  const duration = (new Date(c.endTime).getTime() - new Date(c.startTime).getTime()) / (1000 * 60)
                  return dayTotal + duration
                }, 0)
              }, 0))}
            </div>
            <div className="text-sm text-purple-700">Total Minutes</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-orange-600">
              {Math.round(weeklyData.reduce((total, day) => total + day.cases.length, 0) / 7 * 10) / 10}
            </div>
            <div className="text-sm text-orange-700">Avg/Day</div>
          </div>
        </div>
      </div>
    )
  }
  
  // Daily view (original timeline) - using hooks defined above
  return (
    <div className="space-y-4">
      {/* Time axis */}
      <div className="relative h-12 rounded-xl border border-border/40 overflow-hidden gantt-timeline">
        <div className="absolute inset-0 bg-gradient-to-b from-background/40 to-background/10" />
        {timeMarkers.map((marker) => (
          <div
            key={marker.hour}
            className="absolute top-0 flex flex-col items-center"
            style={{ left: `${marker.position}%` }}
          >
            <div className="h-6 w-px bg-border/70" />
            <span className="mt-1 rounded-full bg-card/80 px-2 py-0.5 text-xs font-medium text-foreground shadow-sm">
              {marker.hour > 12 ? marker.hour - 12 : marker.hour}:00 {marker.hour >= 12 ? "PM" : "AM"}
            </span>
          </div>
        ))}
      </div>
      
      {/* Timeline strip */}
      <div className="relative h-24 rounded-2xl border border-border/50 shadow-lg overflow-hidden ot-row">
        <div className="absolute inset-0 bg-gradient-to-r from-muted/50 via-background/40 to-muted/30" />
        {/* Now line */}
        {nowLinePosition !== null && (
          <div
            className="absolute top-0 bottom-0 w-0.5 bg-primary z-20"
            style={{ left: `${nowLinePosition}%` }}
          >
            <div className="absolute -top-1.5 -left-1.5 h-4 w-4 rounded-full bg-primary border-2 border-background shadow-lg" />
          </div>
        )}
        
        {/* Case blocks */}
        {caseBlocks.map((block, idx) => {
          const priorityClass = getPriorityClass(block.case.priority)
          const isDelayed = block.case.status === 'Delayed' || !!block.case.delayRisk
          const hasConflict = block.hasOverlap
          
          return (
            <TooltipProvider key={block.case.caseId}>
              <Tooltip>
                <TooltipTrigger asChild>
                  <div
                    className={cn(
                      "absolute top-3 bottom-3 rounded-xl border border-white/20 text-white shadow-xl backdrop-blur-sm transition-all hover:z-30 hover:shadow-2xl hover:scale-[1.02]",
                      priorityClass,
                      isDelayed && "ring-2 ring-destructive/70 animate-pulse",
                      hasConflict && "ring-2 ring-warning border-warning/70"
                    )}
                    style={{
                      left: `${block.left}%`,
                      width: `${block.width}%`,
                    }}
                  >
                    <div className="flex h-full flex-col justify-between px-3 py-2 text-xs font-medium">
                      <div className="truncate text-sm font-semibold text-white/95">{block.case.procedure}</div>
                      <div className="flex items-center justify-between text-[10px] text-white/85">
                        <span>{formatTime(block.case.scheduledStartISO)}</span>
                        <span className="opacity-70">•</span>
                        <span>{formatTime(block.case.expectedEndISO)}</span>
                      </div>
                    </div>
                  </div>
                </TooltipTrigger>
                <TooltipContent className="max-w-xs">
                  <div className="space-y-1">
                    <div className="font-semibold">{block.case.caseId}</div>
                    <div>{block.case.procedure}</div>
                    <div className="grid grid-cols-2 gap-1 text-sm">
                      <span className="text-muted-foreground">OT:</span>
                      <span>{block.case.otId}</span>
                      <span className="text-muted-foreground">Priority:</span>
                      <span>P{block.case.priority}</span>
                      <span className="text-muted-foreground">Status:</span>
                      <span>{block.case.status.replace('_', ' ')}</span>
                    </div>
                    {hasConflict && (
                      <div className="text-destructive font-semibold">Scheduling conflict detected</div>
                    )}
                    {block.case.delayRisk && (
                      <div className="text-destructive">
                        Delay risk: {block.case.delayRisk.riskLevel}
                        {block.case.delayRisk.predictedDelayMinutes > 0 && ` +${block.case.delayRisk.predictedDelayMinutes} min`}
                      </div>
                    )}
                  </div>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
          )
        })}

        {/* Turnover indicators */}
        {caseBlocks.map((block, idx) => {
          const endMinutes = new Date(block.case.expectedEndISO)
          const minutesAfterStart = timeToMinutes(endMinutes.getHours(), endMinutes.getMinutes())
          const left = minutesToPosition(Math.max(0, minutesAfterStart))
          const width = minutesToPosition(TURNOVER_MINUTES)
          return (
            <div
              key={`turnover-${block.case.caseId}-${idx}`}
              className="absolute bottom-1 h-1.5 rounded-full bg-white/40"
              style={{ left: `${left}%`, width: `${width}%` }}
            />
          )
        })}
      </div>
      
      {/* Summary metrics */}
      <div className="flex flex-wrap items-center gap-4 rounded-xl border border-border/40 bg-card/80 px-4 py-3 text-sm text-muted-foreground shadow-sm">
        <div className="font-semibold text-foreground">Cases: {cases.length}</div>
        <div>Total OT Time: {cases.reduce((sum, c) => sum + c.predictedMin, 0)} min</div>
        {cases.length > 0 && (
          <div>Next Available: {formatTime(cases[cases.length - 1].expectedEndISO)}</div>
        )}
      </div>
    </div>
  )
}

