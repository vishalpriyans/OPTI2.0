// Priority Engine - Automatically assigns priority based on procedure type
// Priority Scale: 1 = Emergency, 2 = High, 3 = Medium, 4 = Low, 5 = Elective

type PriorityLevel = 1 | 2 | 3 | 4 | 5

interface ProcedurePriority {
  priority: PriorityLevel
  reason: string
  urgencyFactors: string[]
}

// Comprehensive procedure-to-priority mapping
const PROCEDURE_PRIORITY_MAP: Record<string, ProcedurePriority> = {
  // EMERGENCY PROCEDURES (Priority 1)
  "Emergency Craniotomy": {
    priority: 1,
    reason: "Life-threatening brain injury requiring immediate intervention",
    urgencyFactors: ["Intracranial pressure", "Brain herniation risk", "Neurological deterioration"]
  },
  "Emergency Cardiac Surgery": {
    priority: 1,
    reason: "Critical cardiac condition requiring immediate surgical intervention",
    urgencyFactors: ["Cardiac arrest risk", "Hemodynamic instability", "Acute coronary syndrome"]
  },
  "Trauma Surgery": {
    priority: 1,
    reason: "Severe trauma requiring immediate surgical stabilization",
    urgencyFactors: ["Hemorrhage control", "Organ damage", "Life-threatening injuries"]
  },
  "Emergency Appendectomy": {
    priority: 1,
    reason: "Acute appendicitis with perforation risk",
    urgencyFactors: ["Peritonitis risk", "Sepsis prevention", "Organ rupture"]
  },
  "Emergency Bowel Surgery": {
    priority: 1,
    reason: "Bowel obstruction or perforation requiring immediate intervention",
    urgencyFactors: ["Bowel necrosis", "Perforation risk", "Septic shock prevention"]
  },

  // HIGH PRIORITY PROCEDURES (Priority 2)
  "Coronary Artery Bypass": {
    priority: 2,
    reason: "Critical cardiac procedure for severe coronary artery disease",
    urgencyFactors: ["Myocardial infarction risk", "Cardiac function preservation", "Quality of life"]
  },
  "Valve Replacement": {
    priority: 2,
    reason: "Critical valve dysfunction affecting cardiac output",
    urgencyFactors: ["Heart failure prevention", "Hemodynamic stability", "Symptom relief"]
  },
  "Cancer Surgery": {
    priority: 2,
    reason: "Oncological procedure requiring timely intervention",
    urgencyFactors: ["Tumor progression", "Metastasis prevention", "Staging requirements"]
  },
  "Neurosurgery": {
    priority: 2,
    reason: "Complex neurological procedure requiring specialized care",
    urgencyFactors: ["Neurological function", "Symptom progression", "Quality of life"]
  },
  "Organ Transplant": {
    priority: 2,
    reason: "Time-sensitive transplant procedure",
    urgencyFactors: ["Organ viability", "Recipient condition", "Donor coordination"]
  },

  // MEDIUM PRIORITY PROCEDURES (Priority 3)
  "Hip Replacement": {
    priority: 3,
    reason: "Orthopedic procedure for joint dysfunction",
    urgencyFactors: ["Pain management", "Mobility restoration", "Function improvement"]
  },
  "Knee Replacement": {
    priority: 3,
    reason: "Joint replacement for degenerative conditions",
    urgencyFactors: ["Pain relief", "Mobility improvement", "Quality of life"]
  },
  "Gallbladder Surgery": {
    priority: 3,
    reason: "Laparoscopic cholecystectomy for gallbladder disease",
    urgencyFactors: ["Symptom relief", "Complication prevention", "Pain management"]
  },
  "Hernia Repair": {
    priority: 3,
    reason: "Surgical repair of abdominal wall defect",
    urgencyFactors: ["Complication prevention", "Pain relief", "Function restoration"]
  },
  "Thyroid Surgery": {
    priority: 3,
    reason: "Endocrine surgery for thyroid disorders",
    urgencyFactors: ["Hormone regulation", "Symptom management", "Cosmetic concerns"]
  },

  // LOW PRIORITY PROCEDURES (Priority 4)
  "Cataract Surgery": {
    priority: 4,
    reason: "Outpatient procedure for vision improvement",
    urgencyFactors: ["Vision quality", "Daily activities", "Safety concerns"]
  },
  "Arthroscopy": {
    priority: 4,
    reason: "Minimally invasive joint procedure",
    urgencyFactors: ["Joint function", "Pain management", "Athletic performance"]
  },
  "Endoscopy": {
    priority: 4,
    reason: "Diagnostic or therapeutic endoscopic procedure",
    urgencyFactors: ["Diagnostic accuracy", "Symptom investigation", "Screening"]
  },
  "Minor Surgery": {
    priority: 4,
    reason: "Minor surgical procedure with low complexity",
    urgencyFactors: ["Symptom relief", "Cosmetic improvement", "Function enhancement"]
  },

  // ELECTIVE PROCEDURES (Priority 5)
  "Cosmetic Surgery": {
    priority: 5,
    reason: "Elective aesthetic procedure",
    urgencyFactors: ["Patient preference", "Cosmetic enhancement", "Self-esteem"]
  },
  "Elective Surgery": {
    priority: 5,
    reason: "Non-urgent elective procedure",
    urgencyFactors: ["Patient convenience", "Symptom improvement", "Quality of life"]
  },
  "Preventive Surgery": {
    priority: 5,
    reason: "Prophylactic surgical intervention",
    urgencyFactors: ["Risk reduction", "Prevention", "Long-term health"]
  }
}

// Keywords for automatic classification when exact match not found
const PRIORITY_KEYWORDS = {
  1: ["emergency", "trauma", "urgent", "critical", "acute", "life-threatening", "immediate"],
  2: ["cancer", "cardiac", "heart", "transplant", "oncology", "malignant", "tumor"],
  3: ["replacement", "repair", "reconstruction", "major", "complex"],
  4: ["arthroscopy", "endoscopy", "minor", "outpatient", "diagnostic"],
  5: ["cosmetic", "elective", "aesthetic", "preventive", "screening"]
}

/**
 * Automatically determines procedure priority based on surgery type
 */
export function determineProcedurePriority(procedureName: string): {
  priority: PriorityLevel
  reason: string
  urgencyFactors: string[]
  confidence: 'high' | 'medium' | 'low'
} {
  if (!procedureName || procedureName.trim() === '') {
    return {
      priority: 3,
      reason: "Default medium priority - no procedure specified",
      urgencyFactors: ["Procedure not specified"],
      confidence: 'low'
    }
  }

  const normalizedName = procedureName.trim()
  
  // First, try exact match
  if (PROCEDURE_PRIORITY_MAP[normalizedName]) {
    return {
      ...PROCEDURE_PRIORITY_MAP[normalizedName],
      confidence: 'high'
    }
  }

  // If no exact match, try keyword matching
  const lowerName = normalizedName.toLowerCase()
  
  for (const [priorityStr, keywords] of Object.entries(PRIORITY_KEYWORDS)) {
    const priority = Number(priorityStr) as PriorityLevel
    
    for (const keyword of keywords) {
      if (lowerName.includes(keyword)) {
        return {
          priority,
          reason: `Classified as ${getPriorityLabel(priority)} priority based on keyword: "${keyword}"`,
          urgencyFactors: [`Contains "${keyword}" indicating ${getPriorityLabel(priority)} urgency`],
          confidence: 'medium'
        }
      }
    }
  }

  // Default to medium priority if no classification found
  return {
    priority: 3,
    reason: "Default medium priority - procedure not in classification database",
    urgencyFactors: ["Unknown procedure type", "Requires manual review"],
    confidence: 'low'
  }
}

/**
 * Get priority label for display
 */
export function getPriorityLabel(priority: PriorityLevel): string {
  const labels = {
    1: "Emergency",
    2: "High",
    3: "Medium", 
    4: "Low",
    5: "Elective"
  }
  return labels[priority]
}

/**
 * Get priority color for UI display
 */
export function getPriorityColor(priority: PriorityLevel): string {
  const colors = {
    1: "#ef4444", // Red - Emergency
    2: "#f97316", // Orange - High
    3: "#eab308", // Yellow - Medium
    4: "#22c55e", // Green - Low
    5: "#6b7280"  // Gray - Elective
  }
  return colors[priority]
}

/**
 * Get all available procedures with their priorities
 */
export function getAllProcedurePriorities(): Array<{
  procedure: string
  priority: PriorityLevel
  label: string
  reason: string
}> {
  return Object.entries(PROCEDURE_PRIORITY_MAP).map(([procedure, data]) => ({
    procedure,
    priority: data.priority,
    label: getPriorityLabel(data.priority),
    reason: data.reason
  }))
}
