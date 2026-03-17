"use client"

import { useState, useMemo, useEffect } from "react"
import { DoctorHeader } from "./header"
import { SurgeonTimeline } from "./surgeon-timeline"
import { CaseCard } from "./case-card"
import { QuickActionsBar } from "./quick-actions-bar"
import { useDoctorDay, useCurrentUser, acknowledgeCase, markReady, updateStatus, logAction } from "./store"
import { useToast } from "@/components/ui/use-toast"
import { initializeSampleNotifications } from "../notifications/sample-notifications"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { AlertCircle } from "lucide-react"
import type { DoctorDashboardCase } from "./types"
import { canTransitionStatus } from "./types"
import { PRIORITY_LABELS } from "../sample-data"

const PRIORITY_THEMES: Record<1 | 2 | 3 | 4 | 5, {
  accent: string
  surface: string
  border: string
  glow: string
  progressGlow: string
}> = {
  1: {
    accent: "var(--chart-4)",
    surface: "linear-gradient(135deg, color-mix(in srgb, var(--chart-4) 18%, var(--card) 82%), var(--card))",
    border: "color-mix(in srgb, var(--chart-4) 40%, var(--border) 60%)",
    glow: "0 16px 32px color-mix(in srgb, var(--chart-4) 16%, transparent)",
    progressGlow: "0 0 18px color-mix(in srgb, var(--chart-4) 45%, transparent)",
  },
  2: {
    accent: "var(--chart-2)",
    surface: "linear-gradient(135deg, color-mix(in srgb, var(--chart-2) 16%, var(--card) 84%), var(--card))",
    border: "color-mix(in srgb, var(--chart-2) 40%, var(--border) 60%)",
    glow: "0 16px 32px color-mix(in srgb, var(--chart-2) 14%, transparent)",
    progressGlow: "0 0 18px color-mix(in srgb, var(--chart-2) 45%, transparent)",
  },
  3: {
    accent: "var(--chart-3)",
    surface: "linear-gradient(135deg, color-mix(in srgb, var(--chart-3) 18%, var(--card) 82%), var(--card))",
    border: "color-mix(in srgb, var(--chart-3) 40%, var(--border) 60%)",
    glow: "0 16px 32px color-mix(in srgb, var(--chart-3) 15%, transparent)",
    progressGlow: "0 0 18px color-mix(in srgb, var(--chart-3) 45%, transparent)",
  },
  4: {
    accent: "var(--chart-5)",
    surface: "linear-gradient(135deg, color-mix(in srgb, var(--chart-5) 16%, var(--card) 84%), var(--card))",
    border: "color-mix(in srgb, var(--chart-5) 40%, var(--border) 60%)",
    glow: "0 16px 32px color-mix(in srgb, var(--chart-5) 14%, transparent)",
    progressGlow: "0 0 18px color-mix(in srgb, var(--chart-5) 45%, transparent)",
  },
  5: {
    accent: "var(--chart-1)",
    surface: "linear-gradient(135deg, color-mix(in srgb, var(--chart-1) 16%, var(--card) 84%), var(--card))",
    border: "color-mix(in srgb, var(--chart-1) 40%, var(--border) 60%)",
    glow: "0 16px 32px color-mix(in srgb, var(--chart-1) 14%, transparent)",
    progressGlow: "0 0 18px color-mix(in srgb, var(--chart-1) 45%, transparent)",
  },
}

export function DoctorDashboard() {
  const { user } = useCurrentUser()
  const [selectedDate, setSelectedDate] = useState(new Date())
  // Use authenticated user's surgeon ID, or allow admin to switch
  const defaultSurgeonId = user?.surgeonId || user?.name || ""
  const [selectedSurgeonId, setSelectedSurgeonId] = useState(defaultSurgeonId)
  const [selectedCaseId, setSelectedCaseId] = useState<string | null>(null)
  const [viewMode, setViewMode] = useState<'day' | 'week'>('day')
  const { toast } = useToast()
  
  // Update selected surgeon when user changes
  useEffect(() => {
    if (user?.surgeonId || user?.name) {
      setSelectedSurgeonId(user.surgeonId || user.name)
    }
  }, [user])

  // Initialize sample notifications when component mounts
  useEffect(() => {
    // Initialize notifications immediately
    initializeSampleNotifications()
    
    // Also add a small delay to ensure they're processed
    setTimeout(() => {
      initializeSampleNotifications()
    }, 500)
    
    console.log('Doctor dashboard: Initializing sample notifications')
  }, [])
  
  const dateString = selectedDate.toISOString().split('T')[0]
  // Use a default surgeon ID if none is selected yet
  const effectiveSurgeonId = selectedSurgeonId || (user?.surgeonId || user?.name) || "Dr. Rajesh Kumar"
  const { data, isLoading } = useDoctorDay(effectiveSurgeonId, dateString)
  
  // ALL HOOKS MUST BE CALLED BEFORE ANY EARLY RETURNS
  const selectedCase = useMemo(() => {
    if (!selectedCaseId || !data?.cases) return null
    return data.cases.find(c => c.caseId === selectedCaseId) || null
  }, [selectedCaseId, data?.cases])
  
  // Detect scheduling conflicts/overlaps - ALWAYS call this hook
  const hasConflicts = useMemo(() => {
    if (!data?.cases) return false
    const cases = data.cases
    for (let i = 0; i < cases.length; i++) {
      for (let j = i + 1; j < cases.length; j++) {
        const case1 = cases[i]
        const case2 = cases[j]
        const start1 = new Date(case1.scheduledStartISO).getTime()
        const end1 = new Date(case1.expectedEndISO).getTime()
        const start2 = new Date(case2.scheduledStartISO).getTime()
        const end2 = new Date(case2.expectedEndISO).getTime()
        
        // Check if cases overlap (with 30 min turnover buffer)
        const turnoverBuffer = 30 * 60000 // 30 minutes in milliseconds
        if (start1 < end2 + turnoverBuffer && end1 + turnoverBuffer > start2) {
          return true
        }
      }
    }
    return false
  }, [data?.cases])

  // Calculate total priority cases - ALWAYS call this hook
  const totalPriorityCases = useMemo(() => {
    if (!data?.summary?.priorityMix) return 0
    return Object.values(data.summary.priorityMix).reduce((sum, count) => sum + count, 0)
  }, [data?.summary?.priorityMix])
  
  // EARLY RETURNS ONLY AFTER ALL HOOKS ARE CALLED
  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-muted-foreground">Loading dashboard...</div>
      </div>
    )
  }

  // Safety check for data
  if (!data) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-muted-foreground">No data available</div>
      </div>
    )
  }
  
  const handleAcknowledge = async (caseId: string) => {
    try {
      await acknowledgeCase(caseId)
      if (user) {
        logAction(user.id, 'acknowledge', { caseId })
      }
      toast({
        title: "Case acknowledged",
        description: `Case ${caseId} has been acknowledged`,
      })
      // In real app, refetch data here
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to acknowledge case",
        variant: "destructive",
      })
    }
  }
  
  const handleMarkReady = async (caseId: string) => {
    try {
      const caseData = data.cases.find(c => c.caseId === caseId)
      if (!caseData) return
      
      if (!caseData.checklist.consent || !caseData.checklist.labsOk) {
        toast({
          title: "Cannot mark ready",
          description: "Consent and lab results must be verified",
          variant: "destructive",
        })
        return
      }
      
      await markReady(caseId)
      if (user) {
        logAction(user.id, 'mark-ready', { caseId })
      }
      toast({
        title: "Case marked ready",
        description: `Case ${caseId} is ready to start`,
      })
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to mark case ready",
        variant: "destructive",
      })
    }
  }
  
  const handleStatusChange = async (caseId: string, newStatus: DoctorDashboardCase['status']) => {
    try {
      const caseData = data.cases.find(c => c.caseId === caseId)
      if (!caseData) return
      
      if (!canTransitionStatus(caseData.status, newStatus)) {
        toast({
          title: "Invalid status transition",
          description: `Cannot transition from ${caseData.status} to ${newStatus}`,
          variant: "destructive",
        })
        return
      }
      
      await updateStatus(caseId, newStatus)
      if (user) {
        logAction(user.id, 'status-change', { caseId, from: caseData.status, to: newStatus })
      }
      toast({
        title: "Status updated",
        description: `Case ${caseId} status changed to ${newStatus}`,
      })
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to update status",
        variant: "destructive",
      })
    }
  }
  
  const handlePrint = () => {
    window.print()
  }
  
  const handleShare = () => {
    const summary = `OptiQueue Daily Summary - ${dateString}\n` +
      `Surgeon: ${effectiveSurgeonId}\n` +
      `Total Cases: ${data.summary.totalCases}\n` +
      `Total OT Time: ${data.summary.totalPlannedORMin} min\n` +
      `Cases:\n${data.cases.map(c => `- ${c.caseId}: ${c.procedure} at ${new Date(c.scheduledStartISO).toLocaleTimeString()}`).join('\n')}`
    
    if (navigator.share) {
      navigator.share({
        title: `OptiQueue Summary - ${dateString}`,
        text: summary,
      })
    } else {
      navigator.clipboard.writeText(summary)
      toast({
        title: "Summary copied",
        description: "Daily summary copied to clipboard",
      })
    }
  }
  
  return (
    <div className="min-h-screen bg-gradient-to-br from-background to-muted/20 pb-20 md:pb-4">
      <div className="container mx-auto p-4 space-y-6">
        {/* Main Dashboard Title */}
        <div className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-blue-100 via-indigo-100 to-purple-100 p-8 text-center shadow-xl border border-blue-200">
          {/* Background Pattern */}
          <div className="absolute inset-0 bg-gradient-to-br from-white/30 to-blue-50/50"></div>
          <div className="absolute -top-4 -right-4 h-24 w-24 rounded-full bg-blue-200/30"></div>
          <div className="absolute -bottom-4 -left-4 h-32 w-32 rounded-full bg-purple-200/20"></div>
          
          {/* Medical Icons */}
          <div className="absolute top-4 left-6 text-blue-300/40 text-2xl">🏥</div>
          <div className="absolute top-6 right-8 text-indigo-300/40 text-xl">⚕️</div>
          <div className="absolute bottom-4 left-8 text-purple-300/40 text-lg">🩺</div>
          <div className="absolute bottom-6 right-6 text-blue-300/40 text-xl">📋</div>
          
          {/* Content */}
          <div className="relative z-10">            
            <h1 className="mb-4 text-5xl font-bold text-gray-800 drop-shadow-sm">
              Doctor's Dashboard
            </h1>
            
            <div className="mx-auto mb-4 h-1 w-24 bg-gradient-to-r from-blue-400 to-purple-400 rounded-full"></div>
            
            <p className="text-xl text-gray-700 font-medium max-w-2xl mx-auto leading-relaxed mb-6">
              Comprehensive surgical schedule management and patient care coordination
            </p>
            
            <div className="flex justify-center gap-8 text-gray-600">
              <div className="flex items-center gap-2 text-sm font-medium">
                <span className="text-green-500 text-lg">●</span>
                <span>Real-time Updates</span>
              </div>
              <div className="flex items-center gap-2 text-sm font-medium">
                <span className="text-blue-500 text-lg">●</span>
                <span>Smart Scheduling</span>
              </div>
              <div className="flex items-center gap-2 text-sm font-medium">
                <span className="text-purple-500 text-lg">●</span>
                <span>Patient Safety</span>
              </div>
            </div>
          </div>
          
          {/* Subtle Glow Effect */}
          <div className="absolute inset-0 rounded-2xl bg-gradient-to-r from-blue-50/30 to-purple-50/30"></div>
        </div>

        {/* Header Controls */}
        <DoctorHeader
          defaultDate={selectedDate}
          onDateChange={setSelectedDate}
          surgeonId={effectiveSurgeonId}
          onSurgeonChange={setSelectedSurgeonId}
          userRole={user?.role || "Doctor"}
          onPrint={handlePrint}
          onShare={handleShare}
        />

        {/* Doctor Greeting */}
        <div className="bg-gradient-to-r from-green-50 to-emerald-50 border border-green-200 rounded-xl p-4 mb-4">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-full bg-green-100">
              <span className="text-2xl">👋</span>
            </div>
            <div>
              <h2 className="text-2xl font-bold text-green-800">
                Hello, {effectiveSurgeonId}!
              </h2>
              <p className="text-green-600 text-sm">
                Welcome to your personalized surgical dashboard
              </p>
            </div>
          </div>
        </div>

        {/* 1. DASHBOARD HEADER - View Controls & Critical Alerts */}
        <div className="flex flex-col lg:flex-row gap-4 items-start lg:items-center justify-between">
          <div className="flex items-center gap-4">
            <Tabs value={viewMode} onValueChange={(v) => setViewMode(v as 'day' | 'week')}>
              <TabsList className="bg-white shadow-sm">
                <TabsTrigger value="day" className="px-6">📅 Day View</TabsTrigger>
                <TabsTrigger value="week" className="px-6">📆 Week View</TabsTrigger>
              </TabsList>
            </Tabs>
          </div>
          
          {/* Critical Alert Banner */}
          {hasConflicts && (
            <Card className="border-destructive border-2 bg-destructive/10 flex-1 lg:max-w-md">
              <CardContent className="pt-4 pb-4">
                <div className="flex items-center gap-3 text-destructive">
                  <AlertCircle className="h-5 w-5 animate-pulse" />
                  <div>
                    <div className="font-semibold">⚠️ Scheduling Conflict</div>
                    <div className="text-xs text-destructive/80">
                      Overlapping surgeries detected - Review timeline
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}
        </div>

        {/* 2. EXECUTIVE SUMMARY - Key Metrics Dashboard */}
        <Card className="bg-gradient-to-r from-blue-50 to-indigo-50 border-2 border-blue-200">
          <CardHeader className="pb-4">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-blue-100">
                <span className="text-2xl">📊</span>
              </div>
              <div>
                <CardTitle className="text-xl text-blue-800">Today's Performance Overview</CardTitle>
                <p className="text-sm text-blue-600">Real-time surgical metrics and efficiency indicators</p>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
              <div className="bg-white/80 backdrop-blur-sm rounded-lg p-4 border border-white/50">
                <div className="text-sm font-medium text-gray-600 mb-1">Total Cases</div>
                <div className="text-2xl font-bold text-green-600">{data.summary.totalCases}</div>
                <div className="text-xs text-gray-500">Scheduled today</div>
              </div>
              <div className="bg-white/80 backdrop-blur-sm rounded-lg p-4 border border-white/50">
                <div className="text-sm font-medium text-gray-600 mb-1">Planned Time</div>
                <div className="text-2xl font-bold text-blue-600">{data.summary.totalPlannedORMin} min</div>
                <div className="text-xs text-gray-500">Operating time</div>
              </div>
              <div className="bg-white/80 backdrop-blur-sm rounded-lg p-4 border border-white/50">
                <div className="text-sm font-medium text-gray-600 mb-1">Predicted Time</div>
                <div className="text-2xl font-bold text-purple-600">{data.summary.predictedORMin} min</div>
                <div className="text-xs text-gray-500">AI prediction</div>
              </div>
              <div className="bg-white/80 backdrop-blur-sm rounded-lg p-4 border border-white/50">
                <div className="text-sm font-medium text-gray-600 mb-1">Efficiency</div>
                <div className="text-2xl font-bold text-orange-600">{data.summary.idleMinutes} min</div>
                <div className="text-xs text-gray-500">Idle time</div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* 3. SURGICAL TIMELINE - Visual Schedule */}
        <Card className="border-2 border-primary/20">
          <CardHeader className="pb-4">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-primary/10">
                <span className="text-2xl">⏰</span>
              </div>
              <div>
                <CardTitle className="text-xl">
                  {viewMode === 'week' ? 'Weekly Surgical Timeline' : 'Today\'s Surgical Timeline'}
                </CardTitle>
                <p className="text-sm text-muted-foreground">
                  {viewMode === 'week' ? 'Complete week overview with all scheduled procedures' : 'Real-time view of today\'s surgical schedule'}
                </p>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <div className="bg-gradient-to-r from-muted/30 to-muted/10 rounded-xl p-4 border border-primary/10">
              <SurgeonTimeline cases={data.cases || []} isWeekly={viewMode === 'week'} />
            </div>
          </CardContent>
        </Card>

        {/* 4. PRIORITY ANALYTICS - Case Distribution */}
        <Card className="bg-gradient-to-r from-purple-50 to-pink-50 border-2 border-purple-200">
          <CardHeader className="pb-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-purple-100">
                  <span className="text-2xl">🎯</span>
                </div>
                <div>
                  <CardTitle className="text-xl text-purple-800">Priority Distribution Analysis</CardTitle>
                  <p className="text-sm text-purple-600">Case prioritization and resource allocation overview</p>
                </div>
              </div>
              <span className="text-sm font-semibold text-purple-700 bg-purple-100 px-3 py-1 rounded-full">
                {totalPriorityCases} total cases
              </span>
            </div>
          </CardHeader>
          <CardContent>
            {totalPriorityCases === 0 ? (
              <div className="rounded-2xl border border-dashed border-purple-300 bg-white/50 py-12 text-center text-purple-600">
                <span className="text-4xl mb-4 block">📋</span>
                <div className="font-medium">No priority data available</div>
                <div className="text-sm text-purple-500 mt-1">Cases will appear here once scheduled</div>
              </div>
            ) : (
              <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
                {Object.entries(data.summary.priorityMix).map(([priority, count]) => {
                  const priorityNumber = Number(priority) as 1 | 2 | 3 | 4 | 5
                  const theme = PRIORITY_THEMES[priorityNumber]
                  const percentage = totalPriorityCases > 0 ? Math.round((count / totalPriorityCases) * 100) : 0

                  return (
                    <div
                      key={priority}
                      className="group relative overflow-hidden rounded-2xl border shadow-lg backdrop-blur hover:shadow-xl transition-all duration-300"
                      style={{
                        background: theme.surface,
                        borderColor: theme.border,
                        boxShadow: theme.glow,
                      }}
                    >
                      <div className="flex items-center justify-between gap-4 p-5">
                        <div className="space-y-2 text-left">
                          <div className="flex items-center gap-2">
                            <span className="text-xs font-semibold uppercase tracking-widest" style={{ color: theme.accent }}>
                              Priority {priority}
                            </span>
                            <span
                              className="rounded-full px-2 py-0.5 text-xs font-medium text-white shadow-sm"
                              style={{ background: theme.accent }}
                            >
                              {PRIORITY_LABELS[priorityNumber]}
                            </span>
                          </div>
                          <div className="text-3xl font-semibold text-foreground">{count}</div>
                          <div className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                            cases scheduled
                          </div>
                        </div>
                        <div
                          className="flex h-14 w-14 items-center justify-center rounded-full text-base font-semibold text-white shadow-lg transition-transform duration-300 group-hover:scale-110"
                          style={{ background: theme.accent }}
                        >
                          {percentage}%
                        </div>
                      </div>
                      <div className="px-5 pb-5">
                        <div className="h-2.5 w-full overflow-hidden rounded-full bg-background/70">
                          <div
                            className="h-full rounded-full transition-all duration-700 ease-out"
                            style={{
                              width: `${percentage}%`,
                              background: theme.accent,
                              boxShadow: theme.progressGlow,
                            }}
                          />
                        </div>
                      </div>
                    </div>
                  )
                })}
              </div>
            )}
          </CardContent>
        </Card>
        
        {/* 5. DETAILED CASE MANAGEMENT - Interactive Case List */}
        <Card className="bg-gradient-to-r from-green-50 to-emerald-50 border-2 border-green-200">
          <CardHeader className="pb-4">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-green-100">
                <span className="text-2xl">📋</span>
              </div>
              <div>
                <CardTitle className="text-xl text-green-800">Scheduled Cases Management</CardTitle>
                <p className="text-sm text-green-600">Interactive case tracking with real-time status updates</p>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {data.cases.length === 0 ? (
                <div className="rounded-2xl border border-dashed border-green-300 bg-white/50 py-12 text-center text-green-600">
                  <span className="text-4xl mb-4 block">🏥</span>
                  <div className="font-medium">No cases scheduled for this day</div>
                  <div className="text-sm text-green-500 mt-1">Your schedule is currently clear</div>
                </div>
              ) : (
                data.cases.map((caseData) => (
                  <CaseCard
                    key={caseData.caseId}
                    caseData={caseData}
                    onAcknowledge={() => handleAcknowledge(caseData.caseId)}
                    onMarkReady={() => handleMarkReady(caseData.caseId)}
                    onStatusChange={(status) => handleStatusChange(caseData.caseId, status)}
                    onSelect={() => setSelectedCaseId(caseData.caseId)}
                    isSelected={selectedCaseId === caseData.caseId}
                  />
                ))
              )}
            </div>
          </CardContent>
        </Card>
      </div>
      
      {/* Mobile Quick Actions Bar */}
      <QuickActionsBar
        selectedCase={selectedCase}
        onAcknowledge={() => selectedCase && handleAcknowledge(selectedCase.caseId)}
        onMarkReady={() => selectedCase && handleMarkReady(selectedCase.caseId)}
        onStart={() => selectedCase && handleStatusChange(selectedCase.caseId, 'Patient_In')}
        onPause={() => selectedCase && handleStatusChange(selectedCase.caseId, 'Delayed')}
        onComplete={() => selectedCase && handleStatusChange(selectedCase.caseId, 'Completed')}
        onEscalate={() => {
          toast({
            title: "Escalation",
            description: "Case escalation requested",
          })
        }}
      />
    </div>
  )
}

