"use client"

import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { useSchedule, useSurgeries, useWeeklySchedule, setScheduleGlobal, setWeeklyScheduleGlobal, setDelayedGlobal } from "./store"
import { optimizeSchedule, baselineSchedule, computeKPIs } from "./scheduler"
import { scheduleEmergencyCase } from "./emergency-scheduler"
import { type CaseInput, DEFAULT_DAY, TURNOVER_MINUTES } from "./types"
import { PROCEDURE_NAMES, SURGEONS, EQUIPMENT } from "./sample-data"
import { DropdownInput } from "./dropdown-input"
import { filterDoctorsByProcedure, formatDoctorWithSpecializationLabels } from "./specializations"
import { useState, useMemo, useEffect } from "react"
import { useToast } from "@/components/ui/use-toast"

export function EmergencyInserter() {
  const { surgeries, setSurgeries } = useSurgeries()
  const { schedule } = useSchedule()
  const { weeklySchedule, setWeeklySchedule } = useWeeklySchedule()
  const [isWeeklyView, setIsWeeklyView] = useState(false)
  const [formData, setFormData] = useState({
    caseId: "",
    name: "",
    duration: 60,
    surgeon: "",
    equipment: ""
  })
  const [conflicts, setConflicts] = useState<string[]>([])
  const { toast } = useToast()
  
  // Filter doctors based on selected procedure
  const availableDoctors = useMemo(() => {
    // For emergency cases, also include emergency/trauma doctors even if procedure doesn't match
    const procedureFiltered = filterDoctorsByProcedure(SURGEONS, formData.name)
    const emergencyDoctors = SURGEONS.filter(s => 
      s.toLowerCase().includes('emergency') || s.toLowerCase().includes('trauma')
    )
    // Combine and deduplicate
    const combined = [...new Set([...procedureFiltered, ...emergencyDoctors])]
    return combined.length > 0 ? combined : SURGEONS // Fallback to all if empty
  }, [formData.name])
  
  // Create labels for doctor dropdown (with specializations)
  const doctorLabels = useMemo(() => {
    const labels: Record<string, string> = {}
    availableDoctors.forEach(doctor => {
      labels[doctor] = formatDoctorWithSpecializationLabels(doctor)
    })
    return labels
  }, [availableDoctors])
  
  // Clear surgeon selection if current surgeon is not available for new procedure
  useEffect(() => {
    if (formData.name && formData.surgeon && !availableDoctors.includes(formData.surgeon)) {
      setFormData(prev => ({ ...prev, surgeon: "" }))
    }
  }, [formData.name, formData.surgeon, availableDoctors])

  const handleEmergency = (e: React.FormEvent) => {
    e.preventDefault()
    const id = formData.caseId.trim() || `EM-${Math.floor(Math.random() * 900 + 100)}`
    const name = formData.name.trim() || "Emergency Case"
    const duration = Math.max(15, formData.duration)
    const surgeon = formData.surgeon.trim() || "Dr. Emergency"
    const equipment = formData.equipment.trim() || "Emergency Kit"

    const emergency: CaseInput = {
      id,
      name,
      durationMinutes: duration,
      surgeon,
      equipment,
      priority: 1,
    }

    if (isWeeklyView && weeklySchedule) {
      // Handle weekly emergency scheduling
      const currentDayIndex = new Date().getDay() - 1 // Convert to 0-6 (Monday-Sunday)
      const result = scheduleEmergencyCase(emergency, weeklySchedule, Math.max(0, currentDayIndex))
      
      if (result.updatedSchedule) {
        setWeeklySchedule(result.updatedSchedule)
        setConflicts(result.conflicts)
      }
    } else {
      // Handle daily emergency scheduling (original logic)
      const before = schedule?.optimized.cases || []
      const nextCases = [emergency, ...surgeries]
      setSurgeries(nextCases)
      const optimized = optimizeSchedule(nextCases, DEFAULT_DAY, TURNOVER_MINUTES)
      const baseline = baselineSchedule(nextCases, DEFAULT_DAY, TURNOVER_MINUTES)
      const kpis = computeKPIs(optimized, baseline, DEFAULT_DAY)

      // detect delayed elective cases (start time increased vs prior schedule by >= 5 min)
      const prevStarts = new Map(before.map((c) => [c.id, c.startMinute]))
      const delayed = new Set<string>()
      optimized.cases.forEach((c) => {
        const prevStart = prevStarts.get(c.id)
        if (prevStart != null && c.startMinute - prevStart >= 5 && c.priority > 1) {
          delayed.add(c.id)
        }
      })
      setDelayedGlobal(delayed)
      setScheduleGlobal({ optimized, baseline, kpis })
    }

    // Reset form
    setFormData({
      caseId: "",
      name: "",
      duration: 60,
      surgeon: "",
      equipment: ""
    })
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">Emergency Case Insertion</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="mb-4">
          <div className="flex gap-2 mb-2">
            <Button
              variant={!isWeeklyView ? "default" : "outline"}
              size="sm"
              onClick={() => setIsWeeklyView(false)}
            >
              Daily
            </Button>
            <Button
              variant={isWeeklyView ? "default" : "outline"}
              size="sm"
              onClick={() => setIsWeeklyView(true)}
            >
              Weekly
            </Button>
          </div>
          <p className="text-xs text-muted-foreground">
            {isWeeklyView 
              ? "Emergency cases will be scheduled for today only. Conflicting cases will be rescheduled."
              : "Emergency cases will be inserted and schedule re-optimized."
            }
          </p>
        </div>
        
        <form onSubmit={handleEmergency} className="grid grid-cols-2 gap-2">
          <Input 
            name="caseId" 
            placeholder="Emergency ID (optional)" 
            className="col-span-2"
            value={formData.caseId}
            onChange={(e) => setFormData(prev => ({ ...prev, caseId: e.target.value }))}
          />
          <DropdownInput
            name="name"
            placeholder="Procedure name"
            options={PROCEDURE_NAMES.filter(name => name.toLowerCase().includes('emergency'))}
            value={formData.name}
            onChange={(value) => setFormData(prev => ({ ...prev, name: value }))}
            className="col-span-2"
          />
          <Input 
            name="duration" 
            type="number" 
            min={15} 
            step={5} 
            value={formData.duration}
            onChange={(e) => setFormData(prev => ({ ...prev, duration: Number(e.target.value) }))}
            placeholder="Duration (min)" 
          />
          <DropdownInput
            name="surgeon"
            placeholder={formData.name ? "Select Surgeon" : "Select Procedure first"}
            options={availableDoctors}
            value={formData.surgeon}
            onChange={(value) => setFormData(prev => ({ ...prev, surgeon: value }))}
            disabled={!formData.name || availableDoctors.length === 0}
            optionLabels={doctorLabels}
          />
          <DropdownInput
            name="equipment"
            placeholder="Required Equipment"
            options={EQUIPMENT.filter(equipment => equipment.toLowerCase().includes('emergency') || equipment.toLowerCase().includes('trauma'))}
            value={formData.equipment}
            onChange={(value) => setFormData(prev => ({ ...prev, equipment: value }))}
            className="col-span-2"
          />
          <Button type="submit" className="col-span-2">
            {isWeeklyView ? "Insert Emergency (Today Only)" : "Insert and Re-Optimize"}
          </Button>
        </form>
        
        {conflicts.length > 0 && (
          <div className="mt-4 p-3 bg-yellow-50 border border-yellow-200 rounded-md">
            <h4 className="text-sm font-medium text-yellow-800 mb-2">Scheduling Conflicts Resolved:</h4>
            <ul className="text-xs text-yellow-700 space-y-1">
              {conflicts.map((conflict, index) => (
                <li key={index}>• {conflict}</li>
              ))}
            </ul>
          </div>
        )}
        
        <p className="text-xs text-muted-foreground mt-2">
          Emergency cases (Priority 1) are scheduled immediately and take precedence over all other cases.
        </p>
      </CardContent>
    </Card>
  )
}
