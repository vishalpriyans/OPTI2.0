// Procedure-Aware Doctor Filtering System
// Maps procedures to specializations and doctors to specializations

// Medical Specializations
export type Specialization = 
  | "Orthopedics"
  | "General Surgery"
  | "Cardiac Surgery"
  | "Neurosurgery"
  | "Ophthalmology"
  | "Emergency/Trauma"
  | "Gynecology"
  | "Urology"
  | "ENT"
  | "Plastic Surgery"

// Map procedures to specializations (multi-mapped procedures supported)
export const PROCEDURE_TO_SPECIALIZATIONS: Record<string, Specialization[]> = {
  // Orthopedic procedures
  "Hip Replacement": ["Orthopedics"],
  "Knee Replacement": ["Orthopedics"],
  "Knee Arthroscopy": ["Orthopedics"],
  "Hip Arthroscopy": ["Orthopedics"],
  "Shoulder Surgery": ["Orthopedics"],
  "Spine Fusion": ["Orthopedics", "Neurosurgery"], // Multi-specialty procedure
  
  // General Surgery procedures
  "Appendectomy": ["General Surgery", "Emergency/Trauma"],
  "Cholecystectomy": ["General Surgery"],
  "Gallbladder Surgery": ["General Surgery"],
  "Hernia Repair": ["General Surgery"],
  "Thyroidectomy": ["General Surgery", "ENT"],
  
  // Cardiac procedures
  "CABG": ["Cardiac Surgery"],
  "Cardiac Bypass": ["Cardiac Surgery"],
  
  // Neurosurgery procedures
  "Brain Surgery": ["Neurosurgery"],
  
  // Ophthalmology procedures
  "Cataract Surgery": ["Ophthalmology"],
  
  // Emergency/Trauma procedures
  "Emergency Appendectomy": ["Emergency/Trauma", "General Surgery"],
  "Emergency CABG": ["Emergency/Trauma", "Cardiac Surgery"],
  "Emergency Trauma": ["Emergency/Trauma"],
  "Emergency C-Section": ["Emergency/Trauma", "Gynecology"],
  
  // Lung procedures
  "Lung Surgery": ["General Surgery", "Cardiac Surgery"],
}

// Map doctors to specializations (multi-specialty doctors supported)
export const DOCTOR_TO_SPECIALIZATIONS: Record<string, Specialization[]> = {
  "Dr. Rajesh Kumar": ["Orthopedics"],
  "Dr. Priya Sharma": ["General Surgery"],
  "Dr. Anil Mehta": ["Orthopedics", "General Surgery"], // Multi-specialty doctor
  "Dr. Sunita Reddy": ["Cardiac Surgery"],
  "Dr. Vikram Singh": ["General Surgery"],
  "Dr. Meera Desai": ["Ophthalmology", "General Surgery"], // Multi-specialty doctor
  "Dr. Arun Gupta": ["General Surgery"],
  "Dr. Kavita Nair": ["Gynecology"],
  "Dr. Ramesh Iyer": ["Neurosurgery"],
  "Dr. Deepa Menon": ["ENT"],
  "Dr. Emergency": ["Emergency/Trauma", "General Surgery"], // Multi-specialty doctor
  "Dr. Trauma": ["Emergency/Trauma"],
  "Dr. Cardiac": ["Cardiac Surgery"],
}

/**
 * Get specializations for a given procedure
 */
export function getSpecializationsForProcedure(procedure: string): Specialization[] {
  return PROCEDURE_TO_SPECIALIZATIONS[procedure] || []
}

/**
 * Get specializations for a given doctor
 */
export function getSpecializationsForDoctor(doctor: string): Specialization[] {
  return DOCTOR_TO_SPECIALIZATIONS[doctor] || []
}

/**
 * Check if a doctor can perform a procedure based on specializations
 */
export function canDoctorPerformProcedure(doctor: string, procedure: string): boolean {
  const procedureSpecializations = getSpecializationsForProcedure(procedure)
  const doctorSpecializations = getSpecializationsForDoctor(doctor)
  
  // If procedure has no specializations mapped, allow all doctors (backward compatibility)
  if (procedureSpecializations.length === 0) {
    return true
  }
  
  // If doctor has no specializations mapped, don't allow (safety)
  if (doctorSpecializations.length === 0) {
    return false
  }
  
  // Check if there's any overlap between procedure and doctor specializations
  return procedureSpecializations.some(spec => doctorSpecializations.includes(spec))
}

/**
 * Filter doctors based on selected procedure
 * Returns only doctors who can perform the procedure
 */
export function filterDoctorsByProcedure(
  doctors: string[],
  procedure: string | null | undefined
): string[] {
  // If no procedure selected, return all doctors
  if (!procedure) {
    return doctors
  }
  
  // Filter doctors who can perform this procedure
  return doctors.filter(doctor => canDoctorPerformProcedure(doctor, procedure))
}

/**
 * Get all available specializations
 */
export function getAllSpecializations(): Specialization[] {
  return [
    "Orthopedics",
    "General Surgery",
    "Cardiac Surgery",
    "Neurosurgery",
    "Ophthalmology",
    "Emergency/Trauma",
    "Gynecology",
    "Urology",
    "ENT",
    "Plastic Surgery",
  ]
}

/**
 * Format doctor name with specializations
 * Example: "Dr. Rajesh Kumar (Orthopedics)" or "Dr. Anil Mehta (Orthopedics, General Surgery)"
 */
export function formatDoctorWithSpecializations(doctor: string): string {
  const specializations = getSpecializationsForDoctor(doctor)
  if (specializations.length === 0) {
    return doctor
  }
  const specsText = specializations.join(", ")
  return `${doctor} (${specsText})`
}

/**
 * Get short specialization label for display
 * Maps full names to shorter labels
 */
export function getSpecializationLabel(spec: Specialization): string {
  const labels: Record<Specialization, string> = {
    "Orthopedics": "Orthopedic",
    "General Surgery": "General Surgeon",
    "Cardiac Surgery": "Cardiologist",
    "Neurosurgery": "Neurosurgeon",
    "Ophthalmology": "Ophthalmologist",
    "Emergency/Trauma": "Emergency/Trauma",
    "Gynecology": "Gynecologist",
    "Urology": "Urologist",
    "ENT": "ENT Specialist",
    "Plastic Surgery": "Plastic Surgeon",
  }
  return labels[spec] || spec
}

/**
 * Format doctor name with short specialization labels
 * Example: "Dr. Rajesh Kumar (Orthopedic)" or "Dr. Anil Mehta (Orthopedic, General Surgeon)"
 */
export function formatDoctorWithSpecializationLabels(doctor: string): string {
  const specializations = getSpecializationsForDoctor(doctor)
  if (specializations.length === 0) {
    return doctor
  }
  const specsText = specializations.map(getSpecializationLabel).join(", ")
  return `${doctor} (${specsText})`
}

