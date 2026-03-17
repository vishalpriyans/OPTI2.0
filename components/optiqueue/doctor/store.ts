"use client"

import useSWR from "swr"
import { useState } from "react"
import type { DoctorDashboardCase, DoctorDayData, User, UserRole } from "./types"
import { generateDoctorDayData } from "./sample-data"
import { useAuth } from "../auth/store"

const DOCTOR_DAY_KEY = "optiqueue/doctor-day"

export function useCurrentUser() {
  const { user } = useAuth()
  
  // Return user from auth store, or null if not authenticated
  return {
    user: user || null,
    setUser: () => {}, // No-op, user is managed by auth store
  }
}

export function useDoctorDay(surgeonId: string, date: string) {
  const { data, mutate, isLoading: swrLoading } = useSWR<DoctorDayData>(
    // Always fetch, but use a default if surgeonId is empty
    surgeonId ? [DOCTOR_DAY_KEY, surgeonId, date] : null,
    async ([, sid, d]) => {
      // In real app, this would fetch from API: `/doctor/${sid}/day?date=${d}`
      return generateDoctorDayData(sid, d)
    },
    {
      revalidateOnFocus: false,
    }
  )
  
  return {
    data: data || { cases: [], summary: { totalCases: 0, totalPlannedORMin: 0, predictedORMin: 0, idleMinutes: 0, priorityMix: { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 } } },
    mutate,
    isLoading: swrLoading && !!surgeonId, // Only show loading if we have a surgeonId and SWR is loading
  }
}

// Action handlers (mock API calls)
export async function acknowledgeCase(caseId: string): Promise<void> {
  // POST /doctor/case/{caseId}/acknowledge
  console.log("Acknowledging case", caseId)
  // In real app: await fetch(`/api/doctor/case/${caseId}/acknowledge`, { method: 'POST' })
}

export async function markReady(caseId: string): Promise<void> {
  // POST /doctor/case/{caseId}/mark-ready
  console.log("Marking case ready", caseId)
  // In real app: await fetch(`/api/doctor/case/${caseId}/mark-ready`, { method: 'POST' })
}

export async function updateStatus(caseId: string, status: DoctorDashboardCase['status']): Promise<void> {
  // POST /doctor/case/{caseId}/status { status }
  console.log("Updating case status", caseId, status)
  // In real app: await fetch(`/api/doctor/case/${caseId}/status`, { 
  //   method: 'POST', 
  //   body: JSON.stringify({ status }) 
  // })
}

export async function requestEmergencySlot(params: {
  procedure: string
  estimateMin: number
  equipmentIds: string[]
  notes?: string
}): Promise<{
  suggested: { otId: string; startISO: string; endISO: string }
  conflicts: any[]
  message: string
}> {
  // POST /doctor/emergency/request
  console.log("Requesting emergency slot", params)
  // In real app: await fetch(`/api/doctor/emergency/request`, { 
  //   method: 'POST', 
  //   body: JSON.stringify(params) 
  // })
  
  // Mock response
  return {
    suggested: {
      otId: "OT-1",
      startISO: new Date().toISOString(),
      endISO: new Date(Date.now() + params.estimateMin * 60000).toISOString(),
    },
    conflicts: [],
    message: "Emergency slot available"
  }
}

// Audit log (in real app, this would be sent to backend)
export function logAction(userId: string, action: string, payload: any): void {
  const entry = {
    userId,
    action,
    payload,
    timestamp: new Date().toISOString(),
  }
  console.log("AUDIT:", entry)
  // In real app: await fetch('/api/audit', { method: 'POST', body: JSON.stringify(entry) })
}

