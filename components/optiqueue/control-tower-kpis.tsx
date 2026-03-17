"use client"

import { useSchedule, useWeeklySchedule } from "./store"
import { OvertimeIcon, EquipmentIcon, OptimizationIcon, SurgeryIcon } from "./3d-icons"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { cn } from "@/lib/utils"

export function ControlTowerKPIs() {
  const { schedule } = useSchedule()
  const { weeklySchedule } = useWeeklySchedule()
  
  // Calculate KPIs
  const currentSchedule = schedule || weeklySchedule
  const cases = currentSchedule?.optimized.cases || []
  const kpis = currentSchedule?.kpis
  
  // Calculate today's overtime
  const today = new Date().getDay() - 1 // Convert to 0-6 (Monday-Sunday)
  const todayCases = cases.filter(c => c.dayIndex === today || c.dayIndex === undefined)
  const totalDuration = todayCases.reduce((sum, c) => sum + c.durationMinutes, 0)
  const totalTurnover = todayCases.length * 30 // 30 min turnover per case
  const totalTime = totalDuration + totalTurnover
  const workingHours = 10 * 60 // 10 hours in minutes
  const overtime = Math.max(0, totalTime - workingHours)
  
  // Calculate utilization rate
  const utilizationRate = kpis?.utilizationRate || 0
  const utilizationPercentage = Math.round(utilizationRate * 100)
  
  // Calculate active OTs
  const activeOTs = new Set(todayCases.map(c => c.otIndex)).size
  
  // Calculate emergency cases
  const emergencyCases = todayCases.filter(c => c.priority === 1).length
  
  const kpiData = [
    {
      title: "Today's Estimated Overtime",
      value: `${overtime} min`,
      icon: OvertimeIcon,
      status: overtime > 0 ? "warning" : "success",
      description: overtime > 0 ? "Schedule exceeds working hours" : "On schedule",
      color: overtime > 0 ? "text-orange-600" : "text-green-600"
    },
    {
      title: "Utilization Rate",
      value: `${utilizationPercentage}%`,
      icon: OptimizationIcon,
      status: utilizationPercentage >= 80 ? "success" : utilizationPercentage >= 60 ? "warning" : "danger",
      description: utilizationPercentage >= 80 ? "Excellent utilization" : utilizationPercentage >= 60 ? "Good utilization" : "Low utilization",
      color: utilizationPercentage >= 80 ? "text-green-600" : utilizationPercentage >= 60 ? "text-orange-600" : "text-red-600"
    },
    {
      title: "Active Operating Theaters",
      value: `${activeOTs}/5`,
      icon: SurgeryIcon,
      status: activeOTs >= 4 ? "success" : activeOTs >= 2 ? "warning" : "danger",
      description: activeOTs >= 4 ? "High capacity utilization" : activeOTs >= 2 ? "Moderate utilization" : "Low utilization",
      color: activeOTs >= 4 ? "text-green-600" : activeOTs >= 2 ? "text-orange-600" : "text-red-600"
    },
    {
      title: "Emergency Cases",
      value: `${emergencyCases}`,
      icon: EquipmentIcon,
      status: emergencyCases > 0 ? "warning" : "success",
      description: emergencyCases > 0 ? "Emergency cases scheduled" : "No emergency cases",
      color: emergencyCases > 0 ? "text-orange-600" : "text-green-600"
    }
  ]

  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
      {kpiData.map((kpi, index) => {
        const IconComponent = kpi.icon
        return (
          <Card key={index} className="kpi-card group hover:shadow-md transition-all duration-300 border-gray-200 bg-white">
            <CardContent className="p-3">
              <div className="flex items-start justify-between mb-2">
                <div className="flex-1 min-w-0 pr-1">
                  <h3 className="text-xs font-semibold text-gray-700 mb-1 line-clamp-3 leading-tight">
                    {kpi.title}
                  </h3>
                </div>
                <div className="p-0.5 rounded bg-gray-100 flex-shrink-0 ml-1">
                  <IconComponent className="w-1.5 h-1.5 text-gray-600" />
                </div>
              </div>
              
              <div className="flex items-end justify-between">
                <div className="flex-1">
                  <div className="flex items-baseline gap-1 mb-1">
                    <span className={cn("text-lg font-bold leading-none", kpi.color)}>
                      {kpi.value}
                    </span>
                    <Badge 
                      variant={kpi.status === "success" ? "default" : kpi.status === "warning" ? "secondary" : "destructive"}
                      className="text-xs h-3 px-1 py-0"
                    >
                      {kpi.status === "success" ? "✓" : kpi.status === "warning" ? "⚠" : "!"}
                    </Badge>
                  </div>
                  <p className="text-xs text-gray-500 leading-tight line-clamp-2">
                    {kpi.description}
                  </p>
                </div>
              </div>
              
              {kpi.title === "Today's Estimated Overtime" && overtime > 0 && (
                <div className="mt-2 p-1 bg-orange-100 rounded text-center">
                  <p className="text-xs text-orange-600 font-medium">
                    ⚠️ Reschedule needed
                  </p>
                </div>
              )}
            </CardContent>
          </Card>
        )
      })}
    </div>
  )
}
