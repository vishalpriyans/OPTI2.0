import type { ScheduledCase, CaseInput } from "./types"

export interface ConflictConstraint {
  id: string
  type: 'surgeon' | 'equipment' | 'time' | 'ot' | 'priority'
  severity: 'low' | 'medium' | 'high' | 'critical'
  description: string
  affectedCases: string[]
  resolution: string
  autoResolvable: boolean
}

export interface ConflictAnalysis {
  conflicts: ConflictConstraint[]
  totalConflicts: number
  criticalConflicts: number
  autoResolvableConflicts: number
  requiresManualIntervention: boolean
}

export function detectConflicts(cases: ScheduledCase[]): ConflictAnalysis {
  const conflicts: ConflictConstraint[] = []
  
  // Sort cases by start time for easier analysis
  const sortedCases = [...cases].sort((a, b) => a.startMinute - b.startMinute)
  
  // Check for surgeon conflicts
  const surgeonConflicts = detectSurgeonConflicts(sortedCases)
  conflicts.push(...surgeonConflicts)
  
  // Check for equipment conflicts
  const equipmentConflicts = detectEquipmentConflicts(sortedCases)
  conflicts.push(...equipmentConflicts)
  
  // Check for time conflicts (overlapping surgeries)
  const timeConflicts = detectTimeConflicts(sortedCases)
  conflicts.push(...timeConflicts)
  
  // Check for OT conflicts (same OT, overlapping time)
  const otConflicts = detectOTConflicts(sortedCases)
  conflicts.push(...otConflicts)
  
  // Check for priority conflicts (emergency cases delayed)
  const priorityConflicts = detectPriorityConflicts(sortedCases)
  conflicts.push(...priorityConflicts)
  
  const criticalConflicts = conflicts.filter(c => c.severity === 'critical').length
  const autoResolvableConflicts = conflicts.filter(c => c.autoResolvable).length
  
  return {
    conflicts,
    totalConflicts: conflicts.length,
    criticalConflicts,
    autoResolvableConflicts,
    requiresManualIntervention: criticalConflicts > 0
  }
}

// Helper to ensure we don't double-prefix 'Dr.' when surgeon names already include it.
function formatSurgeonName(surgeon: string): string {
  const s = (surgeon || '').trim()
  // if it already starts with Dr or Dr. (case-insensitive), return as-is
  if (/^dr\.?\s+/i.test(s)) return s
  return `Dr. ${s}`
}

function detectSurgeonConflicts(cases: ScheduledCase[]): ConflictConstraint[] {
  const conflicts: ConflictConstraint[] = []
  const surgeonSchedule = new Map<string, ScheduledCase[]>()
  
  // Group cases by surgeon
  cases.forEach(case_ => {
    if (!surgeonSchedule.has(case_.surgeon)) {
      surgeonSchedule.set(case_.surgeon, [])
    }
    surgeonSchedule.get(case_.surgeon)!.push(case_)
  })
  
  // Check for overlapping times for each surgeon
  surgeonSchedule.forEach((surgeonCases, surgeon) => {
    for (let i = 0; i < surgeonCases.length; i++) {
      for (let j = i + 1; j < surgeonCases.length; j++) {
        const case1 = surgeonCases[i]
        const case2 = surgeonCases[j]
        
        if (isTimeOverlap(case1, case2)) {
          const severity = case1.priority === 1 || case2.priority === 1 ? 'critical' : 'high'
          conflicts.push({
            id: `surgeon-${case1.id}-${case2.id}`,
            type: 'surgeon',
            severity,
            description: `${formatSurgeonName(surgeon)} has overlapping surgeries: ${case1.id} and ${case2.id}`,
            affectedCases: [case1.id, case2.id],
            resolution: severity === 'critical' 
              ? 'Emergency case takes priority, other case will be rescheduled'
              : 'One case will be moved to next available slot',
            autoResolvable: true
          })
        }
      }
    }
  })
  
  return conflicts
}

function detectEquipmentConflicts(cases: ScheduledCase[]): ConflictConstraint[] {
  const conflicts: ConflictConstraint[] = []
  const equipmentSchedule = new Map<string, ScheduledCase[]>()
  
  // Group cases by equipment
  cases.forEach(case_ => {
    if (!equipmentSchedule.has(case_.equipment)) {
      equipmentSchedule.set(case_.equipment, [])
    }
    equipmentSchedule.get(case_.equipment)!.push(case_)
  })
  
  // Check for overlapping times for each equipment
  equipmentSchedule.forEach((equipmentCases, equipment) => {
    for (let i = 0; i < equipmentCases.length; i++) {
      for (let j = i + 1; j < equipmentCases.length; j++) {
        const case1 = equipmentCases[i]
        const case2 = equipmentCases[j]
        
        if (isTimeOverlap(case1, case2)) {
          const severity = case1.priority === 1 || case2.priority === 1 ? 'critical' : 'medium'
          conflicts.push({
            id: `equipment-${case1.id}-${case2.id}`,
            type: 'equipment',
            severity,
            description: `${equipment} is needed by both ${case1.id} and ${case2.id} simultaneously`,
            affectedCases: [case1.id, case2.id],
            resolution: 'Equipment will be shared or one case will be rescheduled',
            autoResolvable: true
          })
        }
      }
    }
  })
  
  return conflicts
}

function detectTimeConflicts(cases: ScheduledCase[]): ConflictConstraint[] {
  const conflicts: ConflictConstraint[] = []
  
  // Check all pairs of cases for time overlap
  for (let i = 0; i < cases.length; i++) {
    for (let j = i + 1; j < cases.length; j++) {
      const case1 = cases[i]
      const case2 = cases[j]
      
      if (case1.otIndex === case2.otIndex && isTimeOverlap(case1, case2)) {
        const severity = case1.priority === 1 || case2.priority === 1 ? 'critical' : 'high'
        conflicts.push({
          id: `time-${case1.id}-${case2.id}`,
          type: 'time',
          severity,
          description: `Time conflict in OT ${case1.otIndex + 1}: ${case1.id} and ${case2.id} overlap`,
          affectedCases: [case1.id, case2.id],
          resolution: 'One case will be moved to different time slot or OT',
          autoResolvable: true
        })
      }
    }
  }
  
  return conflicts
}

function detectOTConflicts(cases: ScheduledCase[]): ConflictConstraint[] {
  const conflicts: ConflictConstraint[] = []
  const otSchedule = new Map<number, ScheduledCase[]>()
  
  // Group cases by OT
  cases.forEach(case_ => {
    if (!otSchedule.has(case_.otIndex)) {
      otSchedule.set(case_.otIndex, [])
    }
    otSchedule.get(case_.otIndex)!.push(case_)
  })
  
  // Check for overlapping times in each OT
  otSchedule.forEach((otCases, otIndex) => {
    for (let i = 0; i < otCases.length; i++) {
      for (let j = i + 1; j < otCases.length; j++) {
        const case1 = otCases[i]
        const case2 = otCases[j]
        
        if (isTimeOverlap(case1, case2)) {
          const severity = case1.priority === 1 || case2.priority === 1 ? 'critical' : 'high'
          conflicts.push({
            id: `ot-${case1.id}-${case2.id}`,
            type: 'ot',
            severity,
            description: `OT ${otIndex + 1} has overlapping surgeries: ${case1.id} and ${case2.id}`,
            affectedCases: [case1.id, case2.id],
            resolution: 'One case will be moved to different OT or time slot',
            autoResolvable: true
          })
        }
      }
    }
  })
  
  return conflicts
}

function detectPriorityConflicts(cases: ScheduledCase[]): ConflictConstraint[] {
  const conflicts: ConflictConstraint[] = []
  
  // Check if emergency cases are scheduled after non-emergency cases
  const emergencyCases = cases.filter(c => c.priority === 1)
  const nonEmergencyCases = cases.filter(c => c.priority > 1)
  
  emergencyCases.forEach(emergencyCase => {
    nonEmergencyCases.forEach(nonEmergencyCase => {
      if (emergencyCase.otIndex === nonEmergencyCase.otIndex && 
          emergencyCase.startMinute > nonEmergencyCase.startMinute) {
        conflicts.push({
          id: `priority-${emergencyCase.id}-${nonEmergencyCase.id}`,
          type: 'priority',
          severity: 'critical',
          description: `Emergency case ${emergencyCase.id} is scheduled after non-emergency case ${nonEmergencyCase.id}`,
          affectedCases: [emergencyCase.id, nonEmergencyCase.id],
          resolution: 'Emergency case will be moved to earliest available slot',
          autoResolvable: true
        })
      }
    })
  })
  
  return conflicts
}

function isTimeOverlap(case1: ScheduledCase, case2: ScheduledCase): boolean {
  return case1.startMinute < case2.endMinute && case2.startMinute < case1.endMinute
}

export function generateSampleConflicts(): ConflictConstraint[] {
  return [
    {
      id: 'sample-surgeon-1',
      type: 'surgeon',
      severity: 'high',
      description: 'Dr. Rajesh Kumar has overlapping surgeries: S-101 and S-105',
      affectedCases: ['S-101', 'S-105'],
      resolution: 'S-105 will be moved to next available slot',
      autoResolvable: true
    },
    {
      id: 'sample-equipment-1',
      type: 'equipment',
      severity: 'medium',
      description: 'C-Arm is needed by both S-101 and S-104 simultaneously',
      affectedCases: ['S-101', 'S-104'],
      resolution: 'S-104 will be rescheduled to use C-Arm after S-101',
      autoResolvable: true
    },
    {
      id: 'sample-time-1',
      type: 'time',
      severity: 'critical',
      description: 'Time conflict in OT 1: EM-001 and S-102 overlap',
      affectedCases: ['EM-001', 'S-102'],
      resolution: 'Emergency case takes priority, S-102 moved to OT 2',
      autoResolvable: true
    },
    {
      id: 'sample-priority-1',
      type: 'priority',
      severity: 'critical',
      description: 'Emergency case EM-002 is scheduled after elective case S-103',
      affectedCases: ['EM-002', 'S-103'],
      resolution: 'Emergency case moved to earliest available slot',
      autoResolvable: true
    }
  ]
}
