import type { DoctorDashboardCase, DoctorDayData, DoctorDaySummary } from "./types"
import { SURGEONS, PROCEDURE_NAMES, EQUIPMENT, SAMPLE_AGGREGATES } from "../sample-data"
import { predictDuration, slotOfDayFrom } from "../predictor"
import { maskPatientId } from "./types"
import { canDoctorPerformProcedure, getSpecializationsForDoctor } from "../specializations"
import { TURNOVER_MINUTES } from "../types"
import { scoreDelayRisk } from "../delay-risk-scorer"

const PATIENT_NAMES = [
  "Aarav Sharma",
  "Diya Patel",
  "Vivaan Iyer",
  "Ananya Singh",
  "Ishaan Mehta",
  "Kavya Nair",
  "Advait Reddy",
  "Myra Kapoor",
  "Reyansh Desai",
  "Saanvi Joshi",
  "Arjun Malhotra",
  "Zara Banerjee",
  "Hridaan Chauhan",
  "Pari Agarwal",
  "Neel Gupta",
  "Riya Menon",
  "Kabir Prasad",
  "Aadhya Pillai",
  "Vihaan Bose",
  "Navya Kulkarni"
]

function createISOString(date: string, hours: number, minutes: number): string {
  return `${date}T${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:00`
}

function generatePatientId(index: number): string {
  return `P-${String(index).padStart(3, '0')}`
}

function pickPatientName(index: number): string {
  return PATIENT_NAMES[Math.floor(Math.random() * PATIENT_NAMES.length)] ?? PATIENT_NAMES[0]
}

export function generateDoctorDayData(surgeonId: string, date: string): DoctorDayData {
  // Filter procedures that this surgeon can perform based on specializations
  const availableProcedures = PROCEDURE_NAMES.filter(procedure => 
    canDoctorPerformProcedure(surgeonId, procedure)
  )
  
  // If no procedures available for this surgeon, return empty data
  if (availableProcedures.length === 0) {
    return {
      cases: [],
      summary: {
        totalCases: 0,
        totalPlannedORMin: 0,
        predictedORMin: 0,
        idleMinutes: 600,
        priorityMix: { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 },
      }
    }
  }
  
  // Filter cases for this surgeon from sample data
  const surgeonCases: DoctorDashboardCase[] = []
  
  // Generate 3-6 cases for the surgeon (but ensure we don't exceed available procedures)
  const numCases = Math.min(3 + Math.floor(Math.random() * 4), availableProcedures.length)
  
  // Track scheduled times to prevent overlaps
  const scheduledBlocks: Array<{ start: number; end: number }> = []
  
  // Helper function to check if a time slot is available
  const isTimeSlotAvailable = (startMinutes: number, endMinutes: number): boolean => {
    // Check if within day bounds (7:00 AM to 5:00 PM = 0 to 600 minutes)
    if (startMinutes < 0 || endMinutes > 600) {
      return false
    }
    
    // Check for overlaps with existing scheduled blocks
    for (const block of scheduledBlocks) {
      // Check if new block overlaps with existing block
      // Overlap occurs if: newStart < existingEnd AND newEnd > existingStart
      if (startMinutes < block.end && endMinutes > block.start) {
        return false
      }
    }
    return true
  }
  
  // Helper function to find next available time slot
  const findNextAvailableSlot = (preferredStartMinutes: number, durationMinutes: number): number | null => {
    // Try preferred time first
    const preferredEnd = preferredStartMinutes + durationMinutes
    if (isTimeSlotAvailable(preferredStartMinutes, preferredEnd)) {
      return preferredStartMinutes
    }
    
    // If preferred time not available, find next available slot
    // Start from beginning of day and find first available slot
    for (let start = 0; start <= 600 - durationMinutes; start += 15) {
      const end = start + durationMinutes
      if (isTimeSlotAvailable(start, end)) {
        return start
      }
    }
    
    return null // No available slot found
  }
  
  // Shuffle available procedures to get variety
  const shuffledProcedures = [...availableProcedures].sort(() => Math.random() - 0.5)
  
  for (let i = 0; i < numCases; i++) {
    const procedure = shuffledProcedures[i % shuffledProcedures.length]
    
    // Generate realistic duration based on procedure type
    let estimateMin = 60 // default
    if (procedure.includes("Replacement")) estimateMin = 120 + Math.floor(Math.random() * 60) // 120-180
    else if (procedure.includes("Arthroscopy")) estimateMin = 60 + Math.floor(Math.random() * 60) // 60-120
    else if (procedure.includes("CABG") || procedure.includes("Bypass")) estimateMin = 180 + Math.floor(Math.random() * 60) // 180-240
    else if (procedure.includes("Emergency")) estimateMin = 45 + Math.floor(Math.random() * 45) // 45-90
    else if (procedure.includes("Cataract")) estimateMin = 30 + Math.floor(Math.random() * 30) // 30-60
    else estimateMin = 60 + Math.floor(Math.random() * 90) // 60-150
    
    // Select appropriate equipment based on procedure
    let equipment = EQUIPMENT[0]
    if (procedure.includes("CABG") || procedure.includes("Cardiac")) equipment = "Heart-Lung"
    else if (procedure.includes("Arthroscopy")) equipment = "Scope"
    else if (procedure.includes("Cataract")) equipment = "Microscope"
    else if (procedure.includes("Emergency") || procedure.includes("Appendectomy") || procedure.includes("Cholecystectomy")) equipment = "Lap Tower"
    else if (procedure.includes("Replacement") || procedure.includes("Fusion")) equipment = "C-Arm"
    else equipment = EQUIPMENT[Math.floor(Math.random() * EQUIPMENT.length)]
    
    // Priority: Emergency procedures get priority 1, others get 2-5
    const priority = procedure.includes("Emergency") 
      ? 1 
      : (2 + Math.floor(Math.random() * 4)) as 2 | 3 | 4 | 5
    
    // Generate prediction
    const prediction = predictDuration(
      {
        procedureCode: procedure,
        estMin: estimateMin,
        surgeonId,
        equipmentIds: [equipment],
        patientReady: "07:30",
      },
      SAMPLE_AGGREGATES,
    )
    
    const predictedDuration = prediction.predMin
    
    // Find available time slot (prefer morning slots, but allow any available)
    const preferredStartHour = 7 + Math.floor(Math.random() * 8) // 7 AM to 3 PM
    const preferredStartMinute = Math.floor(Math.random() * 4) * 15 // 0, 15, 30, 45
    const preferredStartMinutes = (preferredStartHour - 7) * 60 + preferredStartMinute
    
    const startMinutes = findNextAvailableSlot(preferredStartMinutes, predictedDuration + TURNOVER_MINUTES)
    
    if (startMinutes === null) {
      // No available slot, skip this case
      continue
    }
    
    // Calculate actual start and end times
    const startHour = Math.floor(startMinutes / 60) + 7
    const startMin = startMinutes % 60
    const endMinutes = startMinutes + predictedDuration
    const endHour = Math.floor(endMinutes / 60) + 7
    const endMin = endMinutes % 60
    
    // Record this scheduled block (including turnover time)
    scheduledBlocks.push({
      start: startMinutes,
      end: endMinutes + TURNOVER_MINUTES, // Include turnover time
    })
    
    // Sort scheduled blocks for easier checking
    scheduledBlocks.sort((a, b) => a.start - b.start)
    
    const scheduledStartISO = createISOString(date, startHour, startMin)
    const expectedEndISO = createISOString(date, endHour, endMin)
    
    // Determine status (mix of Planned, Patient_In, In Progress, etc.)
    // Earlier cases are more likely to be in progress
    const progressRatio = i / numCases
    let status: DoctorDashboardCase['status']
    if (progressRatio < 0.3) {
      // First cases: more likely to be in progress
      const statusOptions: DoctorDashboardCase['status'][] = ['Patient_In', 'Anesthesia_Start', 'Incision', 'Closing']
      status = statusOptions[Math.floor(Math.random() * statusOptions.length)]
    } else if (progressRatio < 0.6) {
      // Middle cases: mix of planned and starting
      const statusOptions: DoctorDashboardCase['status'][] = ['Planned', 'Patient_In', 'Anesthesia_Start']
      status = statusOptions[Math.floor(Math.random() * statusOptions.length)]
    } else {
      // Later cases: mostly planned
      status = Math.random() > 0.3 ? 'Planned' : 'Patient_In'
    }
    
    // Generate timestamps based on status
    const timestamps: DoctorDashboardCase['timestamps'] = {}
    if (status !== 'Planned') {
      const startTime = new Date(scheduledStartISO)
      if (status === 'Patient_In' || status === 'Anesthesia_Start' || status === 'Incision') {
        timestamps.Patient_In = new Date(startTime.getTime() - 15 * 60000).toISOString()
      }
      if (status === 'Anesthesia_Start' || status === 'Incision') {
        timestamps.Anesthesia_Start = new Date(startTime.getTime() - 5 * 60000).toISOString()
      }
      if (status === 'Incision') {
        timestamps.Incision = startTime.toISOString()
      }
    }
    
    // Generate readiness checklist
    const checklist: DoctorDashboardCase['checklist'] = {
      consent: Math.random() > 0.2,
      labsOk: Math.random() > 0.15,
      imagingOk: Math.random() > 0.3,
      npoOk: Math.random() > 0.25,
      equipmentReady: Math.random() > 0.1,
    }
    
    // Generate staff assignments
    const staff = {
      anesthetist: `Dr. Anesth-${Math.floor(Math.random() * 5) + 1}`,
      scrub: `Nurse Scrub-${Math.floor(Math.random() * 5) + 1}`,
      circulating: `Nurse Circ-${Math.floor(Math.random() * 5) + 1}`,
    }
    
    // Generate equipment list
    const equipmentList = [
      { id: equipment, label: equipment, ready: checklist.equipmentReady || false },
      ...(Math.random() > 0.5 ? [{ id: "Basic Set", label: "Basic Set", ready: true }] : []),
    ]
    
    // Extract patient risk fields early so scorer and UI use the same values
    const patientAsa = `ASA ${Math.floor(Math.random() * 4) + 1}`
    const patientAllergyFlag = Math.random() > 0.8

    // Generate alerts — deterministic risk scorer (no coin flip)
    const riskResult = scoreDelayRisk(
      { checklist, patient: { asa: patientAsa, allergyFlag: patientAllergyFlag }, scheduledStartISO },
      i + 1,
      i > 0 ? Math.floor(Math.random() * 25) : 0
    )
    const delayRisk = riskResult.riskLevel !== "low" ? riskResult : undefined

    const missingPrerequisite = !checklist.consent ? "Consent missing" :
      !checklist.labsOk ? "Lab results pending" : undefined

    const caseData: DoctorDashboardCase = {
      caseId: `CASE-${date}-${i + 1}`,
      date,
      surgeonId,
      patient: {
        name: pickPatientName(i + 1),
        idMasked: maskPatientId(generatePatientId(i + 1)),
        age: 30 + Math.floor(Math.random() * 50),
        sex: Math.random() > 0.5 ? "Male" : "Female",
        asa: patientAsa,
        allergyFlag: patientAllergyFlag,
      },
      procedure,
      priority,
      estimateMin,
      predictedMin: predictedDuration,
      predictionExplain: prediction.explain,
      predictionConfidence: prediction.conf === "low" ? "Low" : prediction.conf === "med" ? "Medium" : "High",
      otId: `OT-${Math.floor(Math.random() * 5) + 1}`,
      staff,
      equipment: equipmentList,
      scheduledStartISO,
      expectedEndISO,
      status,
      timestamps,
      checklist,
      delayRisk,
      missingPrerequisite,
      acknowledged: Math.random() > 0.3,
      markedReady: status !== 'Planned' && Math.random() > 0.4,
    }
    
    surgeonCases.push(caseData)
  }
  
  // Sort cases by scheduled start time
  surgeonCases.sort((a, b) => 
    new Date(a.scheduledStartISO).getTime() - new Date(b.scheduledStartISO).getTime()
  )
  
  // Calculate summary
  const summary: DoctorDaySummary = {
    totalCases: surgeonCases.length,
    totalPlannedORMin: surgeonCases.reduce((sum, c) => sum + c.estimateMin, 0),
    predictedORMin: surgeonCases.reduce((sum, c) => sum + c.predictedMin, 0),
    idleMinutes: 600 - surgeonCases.reduce((sum, c) => sum + c.predictedMin, 0), // 10 hours = 600 minutes
    priorityMix: {
      1: surgeonCases.filter(c => c.priority === 1).length,
      2: surgeonCases.filter(c => c.priority === 2).length,
      3: surgeonCases.filter(c => c.priority === 3).length,
      4: surgeonCases.filter(c => c.priority === 4).length,
      5: surgeonCases.filter(c => c.priority === 5).length,
    },
  }
  
  // Calculate next available time
  if (surgeonCases.length > 0) {
    const lastCase = surgeonCases[surgeonCases.length - 1]
    const lastEnd = new Date(lastCase.expectedEndISO)
    const nextAvailable = new Date(lastEnd.getTime() + 30 * 60000) // 30 min turnover
    summary.nextAvailableTime = nextAvailable.toISOString()
  }
  
  return {
    cases: surgeonCases,
    summary,
  }
}

