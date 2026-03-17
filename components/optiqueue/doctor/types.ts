// Doctor Dashboard Type Definitions
import type { MLDelayRisk } from "../ml-types"

export type DoctorDashboardCase = {
  caseId: string
  date: string // "YYYY-MM-DD"
  surgeonId: string
  
  // Patient Information (Masked)
  patient: {
    name: string
    idMasked: string // e.g., "P-73••"
    age?: number
    sex?: "Male" | "Female" | "Other"
    asa?: string // American Society of Anesthesiologists physical status
    allergyFlag?: boolean
  }
  
  // Clinical / Procedure
  procedure: string
  priority: 1 | 2 | 3 | 4 | 5
  estimateMin: number // Estimated Duration (minutes)
  predictedMin: number // Predicted Duration (minutes)
  predictionExplain: string // e.g., "base 128, Surgeon +6, Equipment +2, Time-of-Day +4; clamp [96,150]"
  predictionConfidence: "Low" | "Medium" | "High"
  
  // Logistics
  otId: string // Operation Theatre Identifier
  staff: {
    anesthetist?: string
    scrub?: string
    circulating?: string
  }
  equipment: { id: string; label?: string; ready: boolean }[]
  
  // Timing
  scheduledStartISO: string // "YYYY-MM-DDTHH:MM"
  expectedEndISO: string // "YYYY-MM-DDTHH:MM"
  
  // Status and Timestamps
  status: 'Planned' | 'Patient_In' | 'Anesthesia_Start' | 'Incision' | 'Closing' | 'Cleanup' | 'Completed' | 'Delayed'
  timestamps: Partial<Record<'Patient_In' | 'Anesthesia_Start' | 'Incision' | 'Closing' | 'Cleanup' | 'Completed', string>> // ISO
  
  // Readiness Checklist
  checklist: {
    consent: boolean
    labsOk: boolean
    imagingOk?: boolean
    npoOk?: boolean // NIL Per Os (nothing by mouth) confirmed
    equipmentReady?: boolean
  }
  
  // Alerts
  delayRisk?: MLDelayRisk
  missingPrerequisite?: string
  equipmentConflict?: string
  
  // Acknowledgment
  acknowledged?: boolean
  markedReady?: boolean
}

export type DoctorDaySummary = {
  totalCases: number
  totalPlannedORMin: number
  predictedORMin: number
  idleMinutes: number
  priorityMix: Record<1 | 2 | 3 | 4 | 5, number>
  nextAvailableTime?: string // ISO
}

export type DoctorDayData = {
  cases: DoctorDashboardCase[]
  summary: DoctorDaySummary
}

export type UserRole = 'Doctor' | 'Administrator'
export type User = {
  id: string
  name: string
  role: UserRole
  surgeonId?: string // Only for Doctors
}

// Status transition validation
export const STATUS_FLOW: Record<string, string[]> = {
  'Planned': ['Patient_In', 'Delayed'],
  'Patient_In': ['Anesthesia_Start', 'Delayed'],
  'Anesthesia_Start': ['Incision', 'Delayed'],
  'Incision': ['Closing', 'Delayed'],
  'Closing': ['Cleanup', 'Delayed'],
  'Cleanup': ['Completed', 'Delayed'],
  'Completed': [],
  'Delayed': ['Patient_In', 'Anesthesia_Start', 'Incision', 'Closing', 'Cleanup']
}

export function canTransitionStatus(from: DoctorDashboardCase['status'], to: DoctorDashboardCase['status']): boolean {
  const allowed = STATUS_FLOW[from] || []
  return allowed.includes(to)
}

// PHI Masking utility
export function maskPatientId(patientId: string): string {
  if (patientId.length <= 4) return patientId
  const visible = patientId.slice(0, 4)
  return `${visible}${'•'.repeat(Math.min(patientId.length - 4, 4))}`
}

