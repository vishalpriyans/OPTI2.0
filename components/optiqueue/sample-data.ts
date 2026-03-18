import type { CaseInput, ScheduledCase, WeeklyFullSchedule, FullSchedule } from "./types"
import type { CompletedCase, Aggregates } from "./predictor"
import { buildAggregates } from "./predictor"
import { DEFAULT_WEEK } from "./types"

// Master data for dropdowns
export const PROCEDURE_NAMES = [
  "Hip Replacement", "Knee Replacement", "Appendectomy", "Cholecystectomy", 
  "CABG", "Spine Fusion", "Knee Arthroscopy", "Hip Arthroscopy", 
  "Hernia Repair", "Thyroidectomy", "Gallbladder Surgery", "Cataract Surgery",
  "Shoulder Surgery", "Cardiac Bypass", "Lung Surgery", "Brain Surgery",
  "Emergency Appendectomy", "Emergency CABG", "Emergency Trauma", "Emergency C-Section"
]

export const SURGEONS = [
  "Dr. Rajesh Kumar", "Dr. Priya Sharma", "Dr. Anil Mehta", "Dr. Sunita Reddy", "Dr. Vikram Singh", 
  "Dr. Meera Desai", "Dr. Arun Gupta", "Dr. Kavita Nair", "Dr. Ramesh Iyer", "Dr. Deepa Menon",
  "Dr. Arjun Patel", "Dr. Ravi Krishnan", "Dr. Sanjay Agarwal", "Dr. Neha Joshi", "Dr. Rohit Malhotra",
  "Dr. Anjali Verma", "Dr. Suresh Rao", "Dr. Pooja Bansal", "Dr. Manoj Tiwari", "Dr. Shreya Kapoor",
  "Dr. Emergency", "Dr. Trauma", "Dr. Cardiac"
]

export const EQUIPMENT = [
  "C-Arm", "Lap Tower", "Scope", "Heart-Lung", "Basic Set", 
  "Neuro Monitor", "Microscope", "Ultrasound", "X-Ray", "CT Scanner",
  "Emergency Kit", "Trauma Set", "Cardiac Monitor"
]

// Priority colors mapping
export const PRIORITY_COLORS = {
  1: "bg-red-500", // Emergency - Red
  2: "bg-orange-500", // High Priority - Orange  
  3: "bg-yellow-500", // Medium Priority - Yellow
  4: "bg-blue-500", // Low Priority - Blue
  5: "bg-green-500" // Elective - Green
} as const

export const PRIORITY_LABELS = {
  1: "Emergency",
  2: "High Priority", 
  3: "Medium Priority",
  4: "Low Priority",
  5: "Elective"
} as const

export const SAMPLE_SURGERIES: CaseInput[] = [
  { id: "S-101", name: "Hip Replacement", durationMinutes: 120, surgeon: "Dr. Rajesh Kumar", equipment: "C-Arm", priority: 2 },
  { id: "S-102", name: "Appendectomy", durationMinutes: 60, surgeon: "Dr. Priya Sharma", equipment: "Lap Tower", priority: 3 },
  { id: "S-103", name: "Knee Arthroscopy", durationMinutes: 90, surgeon: "Dr. Anil Mehta", equipment: "Scope", priority: 4 },
  { id: "S-104", name: "CABG", durationMinutes: 180, surgeon: "Dr. Sunita Reddy", equipment: "Heart-Lung", priority: 1 },
  { id: "S-105", name: "Spine Fusion", durationMinutes: 150, surgeon: "Dr. Rajesh Kumar", equipment: "C-Arm", priority: 3 },
  {
    id: "S-106",
    name: "Cholecystectomy",
    durationMinutes: 75,
    surgeon: "Dr. Priya Sharma",
    equipment: "Lap Tower",
    priority: 3,
  },
  {
    id: "S-107",
    name: "Hernia Repair",
    durationMinutes: 45,
    surgeon: "Dr. Vikram Singh",
    equipment: "Basic Set",
    priority: 5,
  },
  {
    id: "S-108",
    name: "Thyroidectomy",
    durationMinutes: 110,
    surgeon: "Dr. Anil Mehta",
    equipment: "Neuro Monitor",
    priority: 4,
  },
]

// Comprehensive historical completed cases to seed predictor aggregates
// Each combination will have unique statistics for varied predictions
function createISOString(hours: number, minutes: number): string {
  const date = new Date()
  date.setHours(hours, minutes, 0, 0)
  return date.toISOString()
}

export const SAMPLE_COMPLETED_CASES: CompletedCase[] = [
  // Hip Replacement - Dr. Rajesh Kumar (10+ cases for HIGH confidence)
  { id: "H1", procedureCode: "Hip Replacement", surgeonId: "Dr. Rajesh Kumar", equipmentIds: ["C-Arm"], actualStart: createISOString(8, 0), actualEnd: createISOString(10, 15), baseEstimateMin: 120 }, // +15
  { id: "H2", procedureCode: "Hip Replacement", surgeonId: "Dr. Rajesh Kumar", equipmentIds: ["C-Arm"], actualStart: createISOString(8, 30), actualEnd: createISOString(10, 35), baseEstimateMin: 120 }, // +5
  { id: "H3", procedureCode: "Hip Replacement", surgeonId: "Dr. Rajesh Kumar", equipmentIds: ["C-Arm"], actualStart: createISOString(9, 0), actualEnd: createISOString(11, 10), baseEstimateMin: 120 }, // +10
  { id: "H4", procedureCode: "Hip Replacement", surgeonId: "Dr. Rajesh Kumar", equipmentIds: ["C-Arm"], actualStart: createISOString(7, 30), actualEnd: createISOString(9, 45), baseEstimateMin: 120 }, // +15
  { id: "H5", procedureCode: "Hip Replacement", surgeonId: "Dr. Rajesh Kumar", equipmentIds: ["C-Arm"], actualStart: createISOString(8, 15), actualEnd: createISOString(10, 20), baseEstimateMin: 120 }, // +5
  { id: "H6", procedureCode: "Hip Replacement", surgeonId: "Dr. Rajesh Kumar", equipmentIds: ["C-Arm"], actualStart: createISOString(10, 0), actualEnd: createISOString(12, 8), baseEstimateMin: 120 }, // +8
  { id: "H7", procedureCode: "Hip Replacement", surgeonId: "Dr. Rajesh Kumar", equipmentIds: ["C-Arm"], actualStart: createISOString(9, 30), actualEnd: createISOString(11, 42), baseEstimateMin: 120 }, // +12
  { id: "H8", procedureCode: "Hip Replacement", surgeonId: "Dr. Rajesh Kumar", equipmentIds: ["C-Arm"], actualStart: createISOString(8, 45), actualEnd: createISOString(10, 55), baseEstimateMin: 120 }, // +10
  { id: "H9", procedureCode: "Hip Replacement", surgeonId: "Dr. Rajesh Kumar", equipmentIds: ["C-Arm"], actualStart: createISOString(11, 0), actualEnd: createISOString(13, 18), baseEstimateMin: 120 }, // +18
  { id: "H10", procedureCode: "Hip Replacement", surgeonId: "Dr. Rajesh Kumar", equipmentIds: ["C-Arm"], actualStart: createISOString(7, 45), actualEnd: createISOString(10, 0), baseEstimateMin: 120 }, // +15
  { id: "H11", procedureCode: "Hip Replacement", surgeonId: "Dr. Rajesh Kumar", equipmentIds: ["C-Arm"], actualStart: createISOString(14, 0), actualEnd: createISOString(16, 25), baseEstimateMin: 120 }, // +25 (late slot)
  { id: "H12", procedureCode: "Hip Replacement", surgeonId: "Dr. Rajesh Kumar", equipmentIds: ["C-Arm"], actualStart: createISOString(15, 30), actualEnd: createISOString(17, 50), baseEstimateMin: 120 }, // +20 (late slot)

  // Hip Replacement - Dr. Anil Mehta (7 cases for MED confidence, different pattern)
  { id: "HP1", procedureCode: "Hip Replacement", surgeonId: "Dr. Anil Mehta", equipmentIds: ["C-Arm"], actualStart: createISOString(8, 0), actualEnd: createISOString(10, 30), baseEstimateMin: 120 }, // +30
  { id: "HP2", procedureCode: "Hip Replacement", surgeonId: "Dr. Anil Mehta", equipmentIds: ["C-Arm"], actualStart: createISOString(9, 0), actualEnd: createISOString(11, 35), baseEstimateMin: 120 }, // +35
  { id: "HP3", procedureCode: "Hip Replacement", surgeonId: "Dr. Anil Mehta", equipmentIds: ["C-Arm"], actualStart: createISOString(8, 30), actualEnd: createISOString(11, 5), baseEstimateMin: 120 }, // +35
  { id: "HP4", procedureCode: "Hip Replacement", surgeonId: "Dr. Anil Mehta", equipmentIds: ["C-Arm"], actualStart: createISOString(10, 0), actualEnd: createISOString(12, 40), baseEstimateMin: 120 }, // +40
  { id: "HP5", procedureCode: "Hip Replacement", surgeonId: "Dr. Anil Mehta", equipmentIds: ["C-Arm"], actualStart: createISOString(11, 0), actualEnd: createISOString(13, 28), baseEstimateMin: 120 }, // +28
  { id: "HP6", procedureCode: "Hip Replacement", surgeonId: "Dr. Anil Mehta", equipmentIds: ["C-Arm"], actualStart: createISOString(7, 30), actualEnd: createISOString(10, 10), baseEstimateMin: 120 }, // +40
  { id: "HP7", procedureCode: "Hip Replacement", surgeonId: "Dr. Anil Mehta", equipmentIds: ["C-Arm"], actualStart: createISOString(14, 0), actualEnd: createISOString(16, 45), baseEstimateMin: 120 }, // +45 (late)

  // Appendectomy - Dr. Priya Sharma (12 cases for HIGH confidence, fast surgeon)
  { id: "A1", procedureCode: "Appendectomy", surgeonId: "Dr. Priya Sharma", equipmentIds: ["Lap Tower"], actualStart: createISOString(8, 0), actualEnd: createISOString(8, 52), baseEstimateMin: 60 }, // -8
  { id: "A2", procedureCode: "Appendectomy", surgeonId: "Dr. Priya Sharma", equipmentIds: ["Lap Tower"], actualStart: createISOString(9, 0), actualEnd: createISOString(9, 55), baseEstimateMin: 60 }, // -5
  { id: "A3", procedureCode: "Appendectomy", surgeonId: "Dr. Priya Sharma", equipmentIds: ["Lap Tower"], actualStart: createISOString(8, 30), actualEnd: createISOString(9, 28), baseEstimateMin: 60 }, // -2
  { id: "A4", procedureCode: "Appendectomy", surgeonId: "Dr. Priya Sharma", equipmentIds: ["Lap Tower"], actualStart: createISOString(10, 0), actualEnd: createISOString(10, 58), baseEstimateMin: 60 }, // -2
  { id: "A5", procedureCode: "Appendectomy", surgeonId: "Dr. Priya Sharma", equipmentIds: ["Lap Tower"], actualStart: createISOString(7, 45), actualEnd: createISOString(8, 42), baseEstimateMin: 60 }, // -3
  { id: "A6", procedureCode: "Appendectomy", surgeonId: "Dr. Priya Sharma", equipmentIds: ["Lap Tower"], actualStart: createISOString(11, 0), actualEnd: createISOString(11, 56), baseEstimateMin: 60 }, // -4
  { id: "A7", procedureCode: "Appendectomy", surgeonId: "Dr. Priya Sharma", equipmentIds: ["Lap Tower"], actualStart: createISOString(9, 30), actualEnd: createISOString(10, 25), baseEstimateMin: 60 }, // -5
  { id: "A8", procedureCode: "Appendectomy", surgeonId: "Dr. Priya Sharma", equipmentIds: ["Lap Tower"], actualStart: createISOString(8, 15), actualEnd: createISOString(9, 10), baseEstimateMin: 60 }, // -5
  { id: "A9", procedureCode: "Appendectomy", surgeonId: "Dr. Priya Sharma", equipmentIds: ["Lap Tower"], actualStart: createISOString(10, 30), actualEnd: createISOString(11, 27), baseEstimateMin: 60 }, // -3
  { id: "A10", procedureCode: "Appendectomy", surgeonId: "Dr. Priya Sharma", equipmentIds: ["Lap Tower"], actualStart: createISOString(12, 0), actualEnd: createISOString(12, 54), baseEstimateMin: 60 }, // -6
  { id: "A11", procedureCode: "Appendectomy", surgeonId: "Dr. Priya Sharma", equipmentIds: ["Lap Tower"], actualStart: createISOString(15, 0), actualEnd: createISOString(16, 2), baseEstimateMin: 60 }, // +2 (late)
  { id: "A12", procedureCode: "Appendectomy", surgeonId: "Dr. Priya Sharma", equipmentIds: ["Lap Tower"], actualStart: createISOString(16, 0), actualEnd: createISOString(17, 8), baseEstimateMin: 60 }, // +8 (late)

  // Appendectomy - Dr. Vikram Singh (5 cases for MED confidence, slower)
  { id: "AG1", procedureCode: "Appendectomy", surgeonId: "Dr. Vikram Singh", equipmentIds: ["Lap Tower"], actualStart: createISOString(8, 0), actualEnd: createISOString(9, 10), baseEstimateMin: 60 }, // +10
  { id: "AG2", procedureCode: "Appendectomy", surgeonId: "Dr. Vikram Singh", equipmentIds: ["Lap Tower"], actualStart: createISOString(9, 0), actualEnd: createISOString(10, 15), baseEstimateMin: 60 }, // +15
  { id: "AG3", procedureCode: "Appendectomy", surgeonId: "Dr. Vikram Singh", equipmentIds: ["Lap Tower"], actualStart: createISOString(10, 0), actualEnd: createISOString(11, 12), baseEstimateMin: 60 }, // +12
  { id: "AG4", procedureCode: "Appendectomy", surgeonId: "Dr. Vikram Singh", equipmentIds: ["Lap Tower"], actualStart: createISOString(11, 0), actualEnd: createISOString(12, 18), baseEstimateMin: 60 }, // +18
  { id: "AG5", procedureCode: "Appendectomy", surgeonId: "Dr. Vikram Singh", equipmentIds: ["Lap Tower"], actualStart: createISOString(14, 0), actualEnd: createISOString(15, 25), baseEstimateMin: 60 }, // +25 (late)

  // CABG - Dr. Sunita Reddy (15 cases for HIGH confidence)
  { id: "C1", procedureCode: "CABG", surgeonId: "Dr. Sunita Reddy", equipmentIds: ["Heart-Lung"], actualStart: createISOString(7, 0), actualEnd: createISOString(10, 15), baseEstimateMin: 180 }, // +15
  { id: "C2", procedureCode: "CABG", surgeonId: "Dr. Sunita Reddy", equipmentIds: ["Heart-Lung"], actualStart: createISOString(8, 0), actualEnd: createISOString(11, 20), baseEstimateMin: 180 }, // +20
  { id: "C3", procedureCode: "CABG", surgeonId: "Dr. Sunita Reddy", equipmentIds: ["Heart-Lung"], actualStart: createISOString(7, 30), actualEnd: createISOString(10, 45), baseEstimateMin: 180 }, // +15
  { id: "C4", procedureCode: "CABG", surgeonId: "Dr. Sunita Reddy", equipmentIds: ["Heart-Lung"], actualStart: createISOString(9, 0), actualEnd: createISOString(12, 25), baseEstimateMin: 180 }, // +25
  { id: "C5", procedureCode: "CABG", surgeonId: "Dr. Sunita Reddy", equipmentIds: ["Heart-Lung"], actualStart: createISOString(8, 30), actualEnd: createISOString(11, 50), baseEstimateMin: 180 }, // +20
  { id: "C6", procedureCode: "CABG", surgeonId: "Dr. Sunita Reddy", equipmentIds: ["Heart-Lung"], actualStart: createISOString(10, 0), actualEnd: createISOString(13, 18), baseEstimateMin: 180 }, // +18
  { id: "C7", procedureCode: "CABG", surgeonId: "Dr. Sunita Reddy", equipmentIds: ["Heart-Lung"], actualStart: createISOString(7, 45), actualEnd: createISOString(11, 5), baseEstimateMin: 180 }, // +20
  { id: "C8", procedureCode: "CABG", surgeonId: "Dr. Sunita Reddy", equipmentIds: ["Heart-Lung"], actualStart: createISOString(9, 30), actualEnd: createISOString(12, 55), baseEstimateMin: 180 }, // +25
  { id: "C9", procedureCode: "CABG", surgeonId: "Dr. Sunita Reddy", equipmentIds: ["Heart-Lung"], actualStart: createISOString(8, 15), actualEnd: createISOString(11, 35), baseEstimateMin: 180 }, // +20
  { id: "C10", procedureCode: "CABG", surgeonId: "Dr. Sunita Reddy", equipmentIds: ["Heart-Lung"], actualStart: createISOString(10, 30), actualEnd: createISOString(13, 52), baseEstimateMin: 180 }, // +22
  { id: "C11", procedureCode: "CABG", surgeonId: "Dr. Sunita Reddy", equipmentIds: ["Heart-Lung"], actualStart: createISOString(11, 0), actualEnd: createISOString(14, 28), baseEstimateMin: 180 }, // +28
  { id: "C12", procedureCode: "CABG", surgeonId: "Dr. Sunita Reddy", equipmentIds: ["Heart-Lung"], actualStart: createISOString(14, 0), actualEnd: createISOString(17, 35), baseEstimateMin: 180 }, // +35 (late)
  { id: "C13", procedureCode: "CABG", surgeonId: "Dr. Sunita Reddy", equipmentIds: ["Heart-Lung"], actualStart: createISOString(15, 0), actualEnd: createISOString(18, 42), baseEstimateMin: 180 }, // +42 (late)
  { id: "C14", procedureCode: "CABG", surgeonId: "Dr. Sunita Reddy", equipmentIds: ["Heart-Lung"], actualStart: createISOString(16, 0), actualEnd: createISOString(19, 25), baseEstimateMin: 180 }, // +25 (late)
  { id: "C15", procedureCode: "CABG", surgeonId: "Dr. Sunita Reddy", equipmentIds: ["Heart-Lung"], actualStart: createISOString(11, 30), actualEnd: createISOString(14, 55), baseEstimateMin: 180 }, // +25

  // CABG - Dr. Meera Desai (4 cases for MED confidence, different pattern)
  { id: "CW1", procedureCode: "CABG", surgeonId: "Dr. Meera Desai", equipmentIds: ["Heart-Lung"], actualStart: createISOString(8, 0), actualEnd: createISOString(11, 45), baseEstimateMin: 180 }, // +45
  { id: "CW2", procedureCode: "CABG", surgeonId: "Dr. Meera Desai", equipmentIds: ["Heart-Lung"], actualStart: createISOString(9, 0), actualEnd: createISOString(12, 50), baseEstimateMin: 180 }, // +50
  { id: "CW3", procedureCode: "CABG", surgeonId: "Dr. Meera Desai", equipmentIds: ["Heart-Lung"], actualStart: createISOString(10, 0), actualEnd: createISOString(13, 48), baseEstimateMin: 180 }, // +48
  { id: "CW4", procedureCode: "CABG", surgeonId: "Dr. Meera Desai", equipmentIds: ["Heart-Lung"], actualStart: createISOString(14, 0), actualEnd: createISOString(17, 55), baseEstimateMin: 180 }, // +55 (late)

  // Knee Arthroscopy - Dr. Anil Mehta (8 cases for MED confidence)
  { id: "K1", procedureCode: "Knee Arthroscopy", surgeonId: "Dr. Anil Mehta", equipmentIds: ["Scope"], actualStart: createISOString(8, 0), actualEnd: createISOString(9, 35), baseEstimateMin: 90 }, // +5
  { id: "K2", procedureCode: "Knee Arthroscopy", surgeonId: "Dr. Anil Mehta", equipmentIds: ["Scope"], actualStart: createISOString(9, 0), actualEnd: createISOString(10, 40), baseEstimateMin: 90 }, // +10
  { id: "K3", procedureCode: "Knee Arthroscopy", surgeonId: "Dr. Anil Mehta", equipmentIds: ["Scope"], actualStart: createISOString(10, 0), actualEnd: createISOString(11, 38), baseEstimateMin: 90 }, // +8
  { id: "K4", procedureCode: "Knee Arthroscopy", surgeonId: "Dr. Anil Mehta", equipmentIds: ["Scope"], actualStart: createISOString(11, 0), actualEnd: createISOString(12, 45), baseEstimateMin: 90 }, // +15
  { id: "K5", procedureCode: "Knee Arthroscopy", surgeonId: "Dr. Anil Mehta", equipmentIds: ["Scope"], actualStart: createISOString(8, 30), actualEnd: createISOString(10, 8), baseEstimateMin: 90 }, // +8
  { id: "K6", procedureCode: "Knee Arthroscopy", surgeonId: "Dr. Anil Mehta", equipmentIds: ["Scope"], actualStart: createISOString(9, 30), actualEnd: createISOString(11, 12), baseEstimateMin: 90 }, // +12
  { id: "K7", procedureCode: "Knee Arthroscopy", surgeonId: "Dr. Anil Mehta", equipmentIds: ["Scope"], actualStart: createISOString(14, 0), actualEnd: createISOString(15, 50), baseEstimateMin: 90 }, // +20 (late)
  { id: "K8", procedureCode: "Knee Arthroscopy", surgeonId: "Dr. Anil Mehta", equipmentIds: ["Scope"], actualStart: createISOString(15, 30), actualEnd: createISOString(17, 22), baseEstimateMin: 90 }, // +22 (late)

  // Cholecystectomy - Dr. Priya Sharma (6 cases for MED confidence)
  { id: "CH1", procedureCode: "Cholecystectomy", surgeonId: "Dr. Priya Sharma", equipmentIds: ["Lap Tower"], actualStart: createISOString(8, 0), actualEnd: createISOString(9, 12), baseEstimateMin: 75 }, // -3
  { id: "CH2", procedureCode: "Cholecystectomy", surgeonId: "Dr. Priya Sharma", equipmentIds: ["Lap Tower"], actualStart: createISOString(9, 0), actualEnd: createISOString(10, 15), baseEstimateMin: 75 }, // 0
  { id: "CH3", procedureCode: "Cholecystectomy", surgeonId: "Dr. Priya Sharma", equipmentIds: ["Lap Tower"], actualStart: createISOString(10, 0), actualEnd: createISOString(11, 20), baseEstimateMin: 75 }, // +5
  { id: "CH4", procedureCode: "Cholecystectomy", surgeonId: "Dr. Priya Sharma", equipmentIds: ["Lap Tower"], actualStart: createISOString(11, 0), actualEnd: createISOString(12, 18), baseEstimateMin: 75 }, // +3
  { id: "CH5", procedureCode: "Cholecystectomy", surgeonId: "Dr. Priya Sharma", equipmentIds: ["Lap Tower"], actualStart: createISOString(14, 0), actualEnd: createISOString(15, 28), baseEstimateMin: 75 }, // +13 (late)
  { id: "CH6", procedureCode: "Cholecystectomy", surgeonId: "Dr. Priya Sharma", equipmentIds: ["Lap Tower"], actualStart: createISOString(15, 30), actualEnd: createISOString(16, 45), baseEstimateMin: 75 }, // +15 (late)

  // Spine Fusion - Dr. Rajesh Kumar (5 cases for MED confidence)
  { id: "SF1", procedureCode: "Spine Fusion", surgeonId: "Dr. Rajesh Kumar", equipmentIds: ["C-Arm"], actualStart: createISOString(8, 0), actualEnd: createISOString(10, 38), baseEstimateMin: 150 }, // -12
  { id: "SF2", procedureCode: "Spine Fusion", surgeonId: "Dr. Rajesh Kumar", equipmentIds: ["C-Arm"], actualStart: createISOString(9, 0), actualEnd: createISOString(11, 42), baseEstimateMin: 150 }, // -8
  { id: "SF3", procedureCode: "Spine Fusion", surgeonId: "Dr. Rajesh Kumar", equipmentIds: ["C-Arm"], actualStart: createISOString(10, 0), actualEnd: createISOString(12, 45), baseEstimateMin: 150 }, // -5
  { id: "SF4", procedureCode: "Spine Fusion", surgeonId: "Dr. Rajesh Kumar", equipmentIds: ["C-Arm"], actualStart: createISOString(14, 0), actualEnd: createISOString(16, 55), baseEstimateMin: 150 }, // +5 (late)
  { id: "SF5", procedureCode: "Spine Fusion", surgeonId: "Dr. Rajesh Kumar", equipmentIds: ["C-Arm"], actualStart: createISOString(15, 30), actualEnd: createISOString(18, 38), baseEstimateMin: 150 }, // +8 (late)
]

export const SAMPLE_AGGREGATES: Aggregates = buildAggregates(SAMPLE_COMPLETED_CASES)

// Sample weekly scheduled cases with intentional conflicts for demonstration
export const SAMPLE_WEEKLY_CASES: ScheduledCase[] = [
  // Monday cases - WITH CONFLICTS
  { id: "S-101", name: "Hip Replacement", durationMinutes: 120, surgeon: "Dr. Rajesh Kumar", equipment: "C-Arm", priority: 2, otIndex: 0, startMinute: 0, endMinute: 120, dayIndex: 0 },
  { id: "S-102", name: "Appendectomy", durationMinutes: 60, surgeon: "Dr. Priya Sharma", equipment: "Lap Tower", priority: 3, otIndex: 1, startMinute: 0, endMinute: 60, dayIndex: 0 },
  { id: "S-103", name: "Knee Arthroscopy", durationMinutes: 90, surgeon: "Dr. Anil Mehta", equipment: "Scope", priority: 4, otIndex: 2, startMinute: 120, endMinute: 210, dayIndex: 0 },
  
  // CONFLICT 1: Dr. Rajesh Kumar has overlapping surgeries (S-101 and S-105)
  { id: "S-105", name: "Spine Fusion", durationMinutes: 150, surgeon: "Dr. Rajesh Kumar", equipment: "C-Arm", priority: 3, otIndex: 0, startMinute: 60, endMinute: 210, dayIndex: 0 },
  
  // Tuesday cases - WITH CONFLICTS
  { id: "S-104", name: "CABG", durationMinutes: 180, surgeon: "Dr. Sunita Reddy", equipment: "Heart-Lung", priority: 1, otIndex: 0, startMinute: 0, endMinute: 180, dayIndex: 1 },
  { id: "S-106", name: "Cholecystectomy", durationMinutes: 75, surgeon: "Dr. Priya Sharma", equipment: "Lap Tower", priority: 3, otIndex: 2, startMinute: 0, endMinute: 75, dayIndex: 1 },
  
  // CONFLICT 2: Equipment conflict - C-Arm needed by both S-101 and S-104
  { id: "S-107", name: "Emergency Trauma", durationMinutes: 90, surgeon: "Dr. Emergency", equipment: "C-Arm", priority: 1, otIndex: 1, startMinute: 0, endMinute: 90, dayIndex: 1 },
  
  // Wednesday cases - WITH CONFLICTS
  { id: "S-108", name: "Hernia Repair", durationMinutes: 45, surgeon: "Dr. Vikram Singh", equipment: "Basic Set", priority: 5, otIndex: 0, startMinute: 0, endMinute: 45, dayIndex: 2 },
  
  // CONFLICT 3: Time conflict in same OT
  { id: "S-109", name: "Thyroidectomy", durationMinutes: 110, surgeon: "Dr. Anil Mehta", equipment: "Neuro Monitor", priority: 4, otIndex: 0, startMinute: 30, endMinute: 140, dayIndex: 2 },
  
  // Thursday cases - WITH CONFLICTS
  { id: "S-110", name: "Gallbladder Surgery", durationMinutes: 80, surgeon: "Dr. Priya Sharma", equipment: "Lap Tower", priority: 3, otIndex: 0, startMinute: 0, endMinute: 80, dayIndex: 3 },
  { id: "S-111", name: "Cataract Surgery", durationMinutes: 30, surgeon: "Dr. Meera Desai", equipment: "Microscope", priority: 4, otIndex: 1, startMinute: 0, endMinute: 30, dayIndex: 3 },
  
  // CONFLICT 4: Priority conflict - Emergency scheduled after elective
  { id: "S-112", name: "Emergency Appendectomy", durationMinutes: 60, surgeon: "Dr. Emergency", equipment: "Lap Tower", priority: 1, otIndex: 2, startMinute: 120, endMinute: 180, dayIndex: 3 },
  { id: "S-113", name: "Elective Hernia", durationMinutes: 45, surgeon: "Dr. Vikram Singh", equipment: "Basic Set", priority: 5, otIndex: 2, startMinute: 0, endMinute: 45, dayIndex: 3 },
  
  // Friday cases - Clean schedule
  { id: "S-114", name: "Knee Replacement", durationMinutes: 140, surgeon: "Dr. Anil Mehta", equipment: "C-Arm", priority: 2, otIndex: 0, startMinute: 0, endMinute: 140, dayIndex: 4 },
  { id: "S-115", name: "Shoulder Surgery", durationMinutes: 90, surgeon: "Dr. Vikram Singh", equipment: "Basic Set", priority: 3, otIndex: 1, startMinute: 0, endMinute: 90, dayIndex: 4 },
]

// Sample daily cases with conflicts for demonstration
export const SAMPLE_DAILY_CASES_WITH_CONFLICTS: ScheduledCase[] = [
  // CONFLICT 1: Dr. Rajesh Kumar double-booked
  { id: "S-101", name: "Hip Replacement", durationMinutes: 120, surgeon: "Dr. Rajesh Kumar", equipment: "C-Arm", priority: 2, otIndex: 0, startMinute: 0, endMinute: 120, dayIndex: 0 },
  { id: "S-102", name: "Spine Fusion", durationMinutes: 150, surgeon: "Dr. Rajesh Kumar", equipment: "C-Arm", priority: 3, otIndex: 0, startMinute: 60, endMinute: 210, dayIndex: 0 },
  
  // CONFLICT 2: Equipment conflict
  { id: "S-103", name: "Knee Surgery", durationMinutes: 90, surgeon: "Dr. Priya Sharma", equipment: "C-Arm", priority: 4, otIndex: 1, startMinute: 0, endMinute: 90, dayIndex: 0 },
  { id: "S-104", name: "Emergency Trauma", durationMinutes: 60, surgeon: "Dr. Emergency", equipment: "C-Arm", priority: 1, otIndex: 1, startMinute: 30, endMinute: 90, dayIndex: 0 },
  
  // CONFLICT 3: Time conflict in same OT
  { id: "S-105", name: "Appendectomy", durationMinutes: 60, surgeon: "Dr. Anil Mehta", equipment: "Lap Tower", priority: 3, otIndex: 2, startMinute: 0, endMinute: 60, dayIndex: 0 },
  { id: "S-106", name: "Gallbladder", durationMinutes: 80, surgeon: "Dr. Vikram Singh", equipment: "Lap Tower", priority: 4, otIndex: 2, startMinute: 30, endMinute: 110, dayIndex: 0 },
  
  // Clean cases
  { id: "S-107", name: "Cataract", durationMinutes: 30, surgeon: "Dr. Meera Desai", equipment: "Microscope", priority: 5, otIndex: 3, startMinute: 0, endMinute: 30, dayIndex: 0 },
  { id: "S-108", name: "Hernia Repair", durationMinutes: 45, surgeon: "Dr. Arun Gupta", equipment: "Basic Set", priority: 5, otIndex: 4, startMinute: 0, endMinute: 45, dayIndex: 0 },
]

export const SAMPLE_WEEKLY_SCHEDULE: WeeklyFullSchedule = {
  optimized: {
    cases: SAMPLE_WEEKLY_CASES,
    idleMinutes: 1200,
    overtimeMinutes: 0,
    waitCost: 5000,
    dailyStats: {
      0: { idleMinutes: 200, overtimeMinutes: 0, utilizationRate: 0.85 },
      1: { idleMinutes: 150, overtimeMinutes: 0, utilizationRate: 0.90 },
      2: { idleMinutes: 300, overtimeMinutes: 0, utilizationRate: 0.70 },
      3: { idleMinutes: 250, overtimeMinutes: 0, utilizationRate: 0.75 },
      4: { idleMinutes: 200, overtimeMinutes: 0, utilizationRate: 0.80 },
      5: { idleMinutes: 600, overtimeMinutes: 0, utilizationRate: 0.0 },
      6: { idleMinutes: 600, overtimeMinutes: 0, utilizationRate: 0.0 },
    }
  },
  baseline: {
    cases: SAMPLE_WEEKLY_CASES,
    idleMinutes: 1500,
    overtimeMinutes: 0,
    waitCost: 6000,
    dailyStats: {
      0: { idleMinutes: 250, overtimeMinutes: 0, utilizationRate: 0.80 },
      1: { idleMinutes: 200, overtimeMinutes: 0, utilizationRate: 0.85 },
      2: { idleMinutes: 350, overtimeMinutes: 0, utilizationRate: 0.65 },
      3: { idleMinutes: 300, overtimeMinutes: 0, utilizationRate: 0.70 },
      4: { idleMinutes: 250, overtimeMinutes: 0, utilizationRate: 0.75 },
      5: { idleMinutes: 600, overtimeMinutes: 0, utilizationRate: 0.0 },
      6: { idleMinutes: 600, overtimeMinutes: 0, utilizationRate: 0.0 },
    }
  },
  kpis: {
    utilizationRate: 0.80,
    totalProjectedOvertime: 0,
    baselineUtilizationRate: 0.75,
    baselineOvertime: 0
  },
  weekWindow: DEFAULT_WEEK
}

// ── Real Dataset Integration ──────────────────────────────────────────────────
// Loads from /optiqueue_data.json (650 real surgical records)

type RawDatasetRecord = {
  surgeons: string
  procedure: string
  duration_minutes: string // e.g. "46 M"
  equipment_used: string
  case_type: "Emergency" | "Planned"
  patient_complexity: "Low" | "Medium" | "High"
  track_record: string
  turnover_time_min: number
  day_of_week: string
  time_block: string
}

function parseDuration(raw: string): number {
  return parseInt(raw) || 60
}

function mapEquipment(raw: string): string {
  switch (raw) {
    case "Cardiac Monitor": return "Cardiac Monitor"
    case "Robotic System": return "C-Arm"
    case "Advanced Imaging": return "Scope"
    default: return "Basic Set"
  }
}

function mapPriority(caseType: string, complexity: string): 1 | 2 | 3 | 4 | 5 {
  if (caseType === "Emergency") return 1
  if (complexity === "High") return 2
  if (complexity === "Medium") return 3
  return 4
}

export function convertDatasetRecord(r: RawDatasetRecord, idx: number): CaseInput {
  return {
    id: `R-${String(idx + 1).padStart(3, "0")}`,
    name: r.procedure,
    durationMinutes: parseDuration(r.duration_minutes),
    surgeon: r.surgeons,
    equipment: mapEquipment(r.equipment_used),
    priority: mapPriority(r.case_type, r.patient_complexity),
  }
}

/** Fetch and parse the real dataset, return maxCases truly random records each call */
export async function loadRealDataset(maxCases = 10): Promise<CaseInput[]> {
  const res = await fetch("/optiqueue_data.json")
  if (!res.ok) throw new Error("Failed to load dataset")
  const raw: RawDatasetRecord[] = await res.json()
  // Fisher-Yates shuffle for true randomness each call
  const shuffled = [...raw]
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1))
    ;[shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]]
  }
  return shuffled.slice(0, maxCases).map((r, idx) => convertDatasetRecord(r, idx))
}

// ── Demo Conflict Dataset ─────────────────────────────────────────────────────
// A hand-crafted schedule with 5 deliberate conflicts across all 4 types.
// Used by the "Demo Conflicts" button so reviewers can see the conflict panel
// without needing to manufacture overlaps manually.
//
// All times are minutes from 07:00 (DAY_START=0, DAY_END=600).
//
// Conflicts baked in:
//   1. SURGEON HIGH     – Dr. Rajesh Kumar in OT-0 (0→120) AND OT-1 (60→150)  → overlap 60–120
//   2. EQUIPMENT MEDIUM – C-Arm needed by OT-0 DC-001 (0→120) AND OT-2 DC-003 (80→200) → overlap 80–120
//   3. TIME HIGH        – OT-3: DC-004 (120→240) and DC-005 (180→300) overlap 180–240
//   4. OT HIGH          – same OT-3 pair, also caught by the OT detector
//   5. PRIORITY CRITICAL– Emergency DC-007 (start=150) delayed behind elective DC-006 (start=0) in OT-4

export const DEMO_CONFLICT_CASES: CaseInput[] = [
  { id: "DC-001", name: "Hip Replacement",    durationMinutes: 120, surgeon: "Dr. Rajesh Kumar", equipment: "C-Arm",         priority: 3 },
  { id: "DC-002", name: "Knee Replacement",   durationMinutes: 90,  surgeon: "Dr. Rajesh Kumar", equipment: "Scope",          priority: 3 },
  { id: "DC-003", name: "Spine Fusion",       durationMinutes: 120, surgeon: "Dr. Priya Sharma",  equipment: "C-Arm",         priority: 2 },
  { id: "DC-004", name: "Appendectomy",       durationMinutes: 120, surgeon: "Dr. Anil Mehta",    equipment: "Lap Tower",     priority: 4 },
  { id: "DC-005", name: "Hernia Repair",      durationMinutes: 120, surgeon: "Dr. Vikram Singh",  equipment: "Basic Set",     priority: 3 },
  { id: "DC-006", name: "Cholecystectomy",    durationMinutes: 90,  surgeon: "Dr. Meera Desai",   equipment: "Basic Set",     priority: 5 },
  { id: "DC-007", name: "Emergency Trauma",   durationMinutes: 90,  surgeon: "Dr. Emergency",     equipment: "Emergency Kit", priority: 1 },
  { id: "DC-008", name: "CABG",               durationMinutes: 180, surgeon: "Dr. Sunita Reddy",  equipment: "Heart-Lung",    priority: 2 },
  { id: "DC-009", name: "Knee Arthroscopy",   durationMinutes: 75,  surgeon: "Dr. Arjun Patel",   equipment: "Scope",         priority: 4 },
  { id: "DC-010", name: "Gallbladder Surgery",durationMinutes: 90,  surgeon: "Dr. Kavita Nair",   equipment: "Lap Tower",     priority: 3 },
]

const _DEMO_SCHEDULED: ScheduledCase[] = [
  // OT-0 ── DC-001 (anchor for surgeon + equipment conflicts) + DC-009
  { id: "DC-001", name: "Hip Replacement",    durationMinutes: 120, surgeon: "Dr. Rajesh Kumar", equipment: "C-Arm",         priority: 3, otIndex: 0, startMinute: 0,   endMinute: 120, dayIndex: 0 },
  { id: "DC-009", name: "Knee Arthroscopy",   durationMinutes: 75,  surgeon: "Dr. Arjun Patel",  equipment: "Scope",         priority: 4, otIndex: 0, startMinute: 150, endMinute: 225, dayIndex: 0 },
  // OT-1 ── DC-002 starts at 60 → overlaps DC-001's surgeon window 60–120 (SURGEON CONFLICT)
  { id: "DC-002", name: "Knee Replacement",   durationMinutes: 90,  surgeon: "Dr. Rajesh Kumar", equipment: "Scope",         priority: 3, otIndex: 1, startMinute: 60,  endMinute: 150, dayIndex: 0 },
  { id: "DC-008", name: "CABG",               durationMinutes: 180, surgeon: "Dr. Sunita Reddy", equipment: "Heart-Lung",    priority: 2, otIndex: 1, startMinute: 200, endMinute: 380, dayIndex: 0 },
  // OT-2 ── DC-003 needs C-Arm starting at 80 → overlaps DC-001 (C-Arm 0→120) (EQUIPMENT CONFLICT)
  { id: "DC-003", name: "Spine Fusion",       durationMinutes: 120, surgeon: "Dr. Priya Sharma", equipment: "C-Arm",         priority: 2, otIndex: 2, startMinute: 80,  endMinute: 200, dayIndex: 0 },
  { id: "DC-010", name: "Gallbladder Surgery",durationMinutes: 90,  surgeon: "Dr. Kavita Nair",  equipment: "Lap Tower",     priority: 3, otIndex: 2, startMinute: 240, endMinute: 330, dayIndex: 0 },
  // OT-3 ── DC-004 and DC-005 overlap 180–240 (TIME + OT CONFLICT)
  { id: "DC-004", name: "Appendectomy",       durationMinutes: 120, surgeon: "Dr. Anil Mehta",   equipment: "Lap Tower",     priority: 4, otIndex: 3, startMinute: 120, endMinute: 240, dayIndex: 0 },
  { id: "DC-005", name: "Hernia Repair",      durationMinutes: 120, surgeon: "Dr. Vikram Singh", equipment: "Basic Set",     priority: 3, otIndex: 3, startMinute: 180, endMinute: 300, dayIndex: 0 },
  // OT-4 ── DC-006 elective at start; DC-007 emergency arrives late (PRIORITY CONFLICT)
  { id: "DC-006", name: "Cholecystectomy",    durationMinutes: 90,  surgeon: "Dr. Meera Desai",  equipment: "Basic Set",     priority: 5, otIndex: 4, startMinute: 0,   endMinute: 90,  dayIndex: 0 },
  { id: "DC-007", name: "Emergency Trauma",   durationMinutes: 90,  surgeon: "Dr. Emergency",    equipment: "Emergency Kit", priority: 1, otIndex: 4, startMinute: 150, endMinute: 240, dayIndex: 0 },
]

export const DEMO_CONFLICT_SCHEDULE: FullSchedule = {
  optimized: { cases: _DEMO_SCHEDULED, idleMinutes: 1560, overtimeMinutes: 0, waitCost: 480 },
  baseline:  { cases: _DEMO_SCHEDULED, idleMinutes: 1980, overtimeMinutes: 0, waitCost: 720 },
  kpis: { utilizationRate: 48, totalProjectedOvertime: 0, baselineUtilizationRate: 34, baselineOvertime: 0 },
}
