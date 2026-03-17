"use client"

import { useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible"
import type { DoctorDashboardCase } from "./types"
import { PRIORITY_COLORS, PRIORITY_LABELS } from "../sample-data"
import { cn } from "@/lib/utils"
import { 
  CheckCircle2, 
  XCircle, 
  Clock, 
  AlertTriangle, 
  ChevronDown, 
  ChevronUp,
  User,
  Stethoscope,
  Calendar,
  Activity
} from "lucide-react"

function formatTime(isoString: string): string {
  const date = new Date(isoString)
  const hours = date.getHours()
  const minutes = date.getMinutes()
  const h12 = ((hours + 11) % 12) + 1
  const ampm = hours >= 12 ? "AM" : "PM"
  return `${h12}:${minutes.toString().padStart(2, "0")} ${ampm}`
}

function formatDate(isoString: string): string {
  return new Date(isoString).toLocaleDateString('en-US', { 
    weekday: 'short', 
    month: 'short', 
    day: 'numeric' 
  })
}

function getStatusColor(status: DoctorDashboardCase['status']): string {
  switch (status) {
    case 'Planned': return 'bg-blue-100 text-blue-800 border-blue-300'
    case 'Patient_In': return 'bg-purple-100 text-purple-800 border-purple-300'
    case 'Anesthesia_Start': return 'bg-indigo-100 text-indigo-800 border-indigo-300'
    case 'Incision': return 'bg-orange-100 text-orange-800 border-orange-300'
    case 'Closing': return 'bg-yellow-100 text-yellow-800 border-yellow-300'
    case 'Cleanup': return 'bg-green-100 text-green-800 border-green-300'
    case 'Completed': return 'bg-gray-100 text-gray-800 border-gray-300'
    case 'Delayed': return 'bg-red-100 text-red-800 border-red-300'
    default: return 'bg-gray-100 text-gray-800 border-gray-300'
  }
}

function getConfidenceColor(conf: DoctorDashboardCase['predictionConfidence']): string {
  switch (conf) {
    case 'High': return 'bg-emerald-600 text-white'
    case 'Medium': return 'bg-amber-500 text-white'
    case 'Low': return 'bg-slate-500 text-white'
    default: return 'bg-gray-500 text-white'
  }
}

export function CaseCard({ 
  caseData, 
  onAcknowledge, 
  onMarkReady, 
  onStatusChange,
  onSelect,
  isSelected = false
}: { 
  caseData: DoctorDashboardCase
  onAcknowledge: () => void
  onMarkReady: () => void
  onStatusChange: (status: DoctorDashboardCase['status']) => void
  onSelect?: () => void
  isSelected?: boolean
}) {
  const [isExpanded, setIsExpanded] = useState(false)
  
  const delta = caseData.predictedMin - caseData.estimateMin
  const priorityColor = PRIORITY_COLORS[caseData.priority] || "bg-gray-500"
  const statusColor = getStatusColor(caseData.status)
  const confidenceColor = getConfidenceColor(caseData.predictionConfidence)
  
  const canStart = caseData.markedReady && caseData.checklist.consent && caseData.checklist.labsOk
  const isOngoing = ['Patient_In', 'Anesthesia_Start', 'Incision', 'Closing', 'Cleanup'].includes(caseData.status)
  
  return (
    <Card 
      className={cn(
        "transition-all cursor-pointer",
        caseData.delayRisk && "border-destructive border-2",
        !caseData.acknowledged && "border-primary border-2",
        isSelected && "ring-2 ring-primary"
      )}
      onClick={onSelect}
    >
      <CardHeader>
        <div className="flex items-start justify-between gap-4">
          <div className="flex-1 space-y-2">
            <div className="flex items-center gap-2 flex-wrap">
              <CardTitle className="flex items-center gap-2 text-lg">
                <User className="w-4 h-4 text-muted-foreground" />
                <span>{caseData.patient.name}</span>
                <span className="text-xs font-normal text-muted-foreground">({caseData.patient.idMasked})</span>
              </CardTitle>
              {caseData.patient.age !== undefined && (
                <Badge variant="outline" className="text-xs">
                  {caseData.patient.age} yrs
                </Badge>
              )}
              {caseData.patient.sex && (
                <Badge variant="outline" className="text-xs capitalize">
                  {caseData.patient.sex.toLowerCase()}
                </Badge>
              )}
              {caseData.patient.asa && (
                <Badge variant="outline" className="text-xs">
                  ASA {caseData.patient.asa}
                </Badge>
              )}
              {caseData.patient.allergyFlag && (
                <Badge variant="destructive" className="text-xs">
                  Allergy Alert
                </Badge>
              )}
            </div>
            <div className="flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
              <span className="inline-flex items-center gap-1 font-medium text-foreground">
                <span>Case</span>
                {caseData.caseId}
              </span>
              <span className="inline-flex items-center gap-1">
                <Calendar className="w-3 h-3" />
                {formatDate(caseData.scheduledStartISO)}
              </span>
              <span className="inline-flex items-center gap-1">
                <Clock className="w-3 h-3" />
                {caseData.predictedMin} min predicted
              </span>
              <span className="inline-flex items-center gap-1">
                <Stethoscope className="w-3 h-3" />
                OT {caseData.otId}
              </span>
            </div>
            <div className="flex items-center gap-2 flex-wrap">
              <Badge className={cn("border", priorityColor, "text-white")}>
                Priority {caseData.priority} - {PRIORITY_LABELS[caseData.priority]}
              </Badge>
              <Badge className={cn("border", statusColor)}>
                {caseData.status.replace('_', ' ')}
              </Badge>
              {caseData.delayRisk && (
                <Badge
                  variant={caseData.delayRisk.riskLevel === "high" ? "destructive" : "outline"}
                  className={cn(
                    "gap-1",
                    caseData.delayRisk.riskLevel === "high" && "animate-pulse",
                    caseData.delayRisk.riskLevel === "medium" && "border-amber-400 text-amber-700 bg-amber-50"
                  )}
                >
                  <AlertTriangle className="w-3 h-3" />
                  {caseData.delayRisk.riskLevel === "high" ? "High" : "Med"} delay risk
                  {caseData.delayRisk.predictedDelayMinutes > 0 && ` +${caseData.delayRisk.predictedDelayMinutes}m`}
                </Badge>
              )}
            </div>
            <div className="text-sm font-semibold text-foreground">{caseData.procedure}</div>
          </div>
          <Button
            variant="ghost"
            size="icon"
            onClick={(e) => {
              e.stopPropagation()
              setIsExpanded(!isExpanded)
            }}
          >
            {isExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
          </Button>
        </div>
      </CardHeader>
      
      <CardContent className="space-y-4">
        {/* Quick Info Row */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          <div>
            <div className="text-xs text-muted-foreground">Patient</div>
            <div className="font-medium">{caseData.patient.name}</div>
            <div className="text-xs text-muted-foreground">ID: {caseData.patient.idMasked}</div>
            {caseData.patient.age && (
              <div className="text-xs text-muted-foreground">
                {caseData.patient.age} {caseData.patient.sex}
              </div>
            )}
          </div>
          <div>
            <div className="text-xs text-muted-foreground">Duration</div>
            <div className="font-medium">
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <span className="cursor-help underline decoration-dotted">
                      {caseData.predictedMin} min
                    </span>
                  </TooltipTrigger>
                  <TooltipContent className="max-w-xs">
                    <div className="space-y-1">
                      <div>Predicted: {caseData.predictedMin} min</div>
                      <div>Estimated: {caseData.estimateMin} min</div>
                      <div>Delta: {delta >= 0 ? '+' : ''}{delta} min</div>
                      <div className="text-xs mt-2">{caseData.predictionExplain}</div>
                    </div>
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
            </div>
            <Badge className={cn("mt-1 text-xs", confidenceColor)}>
              {caseData.predictionConfidence} Confidence
            </Badge>
          </div>
          <div>
            <div className="text-xs text-muted-foreground">Surgeon</div>
            <div className="font-medium">{caseData.surgeonId}</div>
          </div>
          <div>
            <div className="text-xs text-muted-foreground">Expected End</div>
            <div className="font-medium">{formatTime(caseData.expectedEndISO)}</div>
          </div>
        </div>
        
        {/* Readiness Checklist */}
        <div>
          <div className="text-xs font-semibold text-muted-foreground mb-2">Readiness Checklist</div>
          <div className="grid grid-cols-2 md:grid-cols-5 gap-2">
            <div className="flex items-center gap-2">
              {caseData.checklist.consent ? (
                <CheckCircle2 className="w-4 h-4 text-green-600" />
              ) : (
                <XCircle className="w-4 h-4 text-red-600" />
              )}
              <span className="text-xs">Consent</span>
            </div>
            <div className="flex items-center gap-2">
              {caseData.checklist.labsOk ? (
                <CheckCircle2 className="w-4 h-4 text-green-600" />
              ) : (
                <XCircle className="w-4 h-4 text-red-600" />
              )}
              <span className="text-xs">Labs</span>
            </div>
            {caseData.checklist.imagingOk !== undefined && (
              <div className="flex items-center gap-2">
                {caseData.checklist.imagingOk ? (
                  <CheckCircle2 className="w-4 h-4 text-green-600" />
                ) : (
                  <XCircle className="w-4 h-4 text-red-600" />
                )}
                <span className="text-xs">Imaging</span>
              </div>
            )}
            {caseData.checklist.npoOk !== undefined && (
              <div className="flex items-center gap-2">
                {caseData.checklist.npoOk ? (
                  <CheckCircle2 className="w-4 h-4 text-green-600" />
                ) : (
                  <XCircle className="w-4 h-4 text-red-600" />
                )}
                <span className="text-xs">NPO</span>
              </div>
            )}
            {caseData.checklist.equipmentReady !== undefined && (
              <div className="flex items-center gap-2">
                {caseData.checklist.equipmentReady ? (
                  <CheckCircle2 className="w-4 h-4 text-green-600" />
                ) : (
                  <XCircle className="w-4 h-4 text-red-600" />
                )}
                <span className="text-xs">Equipment</span>
              </div>
            )}
          </div>
        </div>
        
        {/* Alerts */}
        {(caseData.delayRisk || caseData.missingPrerequisite || caseData.equipmentConflict) && (
          <div className="p-3 bg-destructive/10 border border-destructive/20 rounded-lg space-y-2">
            {caseData.delayRisk && (
              <div className="space-y-1.5">
                {/* Risk probability bar */}
                <div className="flex items-center gap-2">
                  <AlertTriangle className="w-4 h-4 text-destructive shrink-0" />
                  <span className="text-sm text-destructive font-medium">
                    Delay Risk: {Math.round(caseData.delayRisk.probability * 100)}%
                    {caseData.delayRisk.predictedDelayMinutes > 0 && ` — ~${caseData.delayRisk.predictedDelayMinutes} min late`}
                  </span>
                </div>
                <div className="w-full h-1.5 rounded-full bg-muted overflow-hidden">
                  <div
                    className={cn(
                      "h-full rounded-full transition-all",
                      caseData.delayRisk.riskLevel === "high" ? "bg-destructive" : "bg-amber-400"
                    )}
                    style={{ width: `${Math.round(caseData.delayRisk.probability * 100)}%` }}
                  />
                </div>
                {/* Factor chips */}
                {caseData.delayRisk.topFactors.length > 0 && (
                  <div className="flex flex-wrap gap-1">
                    {caseData.delayRisk.topFactors.map((f) => (
                      <span
                        key={f.feature}
                        className="text-[10px] px-1.5 py-0.5 rounded bg-destructive/10 text-destructive border border-destructive/20"
                      >
                        {f.feature.replace(/_/g, " ")}
                      </span>
                    ))}
                  </div>
                )}
              </div>
            )}
            {caseData.missingPrerequisite && (
              <div className="flex items-center gap-2 text-sm text-destructive">
                <AlertTriangle className="w-4 h-4" />
                <span>Missing: {caseData.missingPrerequisite}</span>
              </div>
            )}
            {caseData.equipmentConflict && (
              <div className="flex items-center gap-2 text-sm text-destructive">
                <AlertTriangle className="w-4 h-4" />
                <span>Equipment Conflict: {caseData.equipmentConflict}</span>
              </div>
            )}
          </div>
        )}
        
        {/* Expanded Details */}
        <Collapsible open={isExpanded} onOpenChange={setIsExpanded}>
          <CollapsibleContent className="space-y-4">
            {/* Patient Details */}
            <div>
              <div className="text-xs font-semibold text-muted-foreground mb-2">Patient Information</div>
              <div className="grid grid-cols-2 gap-2 text-sm">
                <div>ID: {caseData.patient.idMasked}</div>
                {caseData.patient.age && <div>Age: {caseData.patient.age}</div>}
                {caseData.patient.sex && <div>Sex: {caseData.patient.sex}</div>}
                {caseData.patient.asa && <div>ASA: {caseData.patient.asa}</div>}
                {caseData.patient.allergyFlag && (
                  <div className="text-destructive">⚠️ Allergies</div>
                )}
              </div>
            </div>
            
            {/* Staff */}
            <div>
              <div className="text-xs font-semibold text-muted-foreground mb-2">Assigned Staff</div>
              <div className="space-y-1 text-sm">
                {caseData.staff.anesthetist && <div>Anesthetist: {caseData.staff.anesthetist}</div>}
                {caseData.staff.scrub && <div>Scrub Nurse: {caseData.staff.scrub}</div>}
                {caseData.staff.circulating && <div>Circulating: {caseData.staff.circulating}</div>}
              </div>
            </div>
            
            {/* Equipment */}
            <div>
              <div className="text-xs font-semibold text-muted-foreground mb-2">Required Equipment</div>
              <div className="flex flex-wrap gap-2">
                {caseData.equipment.map((eq, idx) => (
                  <Badge
                    key={idx}
                    variant={eq.ready ? "default" : "destructive"}
                    className="text-xs"
                  >
                    {eq.label || eq.id} {eq.ready ? "✓" : "✗"}
                  </Badge>
                ))}
              </div>
            </div>
            
            {/* Timestamps */}
            {Object.keys(caseData.timestamps).length > 0 && (
              <div>
                <div className="text-xs font-semibold text-muted-foreground mb-2">Status Timestamps</div>
                <div className="space-y-1 text-sm">
                  {Object.entries(caseData.timestamps).map(([status, timestamp]) => (
                    <div key={status}>
                      {status.replace('_', ' ')}: {formatTime(timestamp)}
                    </div>
                  ))}
                </div>
              </div>
            )}
          </CollapsibleContent>
        </Collapsible>
        
        {/* Quick Actions */}
        <div className="flex flex-wrap gap-2 pt-2 border-t" onClick={(e) => e.stopPropagation()}>
          {!caseData.acknowledged && (
            <Button size="sm" variant="outline" onClick={onAcknowledge}>
              Acknowledge
            </Button>
          )}
          {!caseData.markedReady && caseData.acknowledged && (
            <Button 
              size="sm" 
              variant="outline" 
              onClick={onMarkReady}
              disabled={!caseData.checklist.consent || !caseData.checklist.labsOk}
            >
              Mark Ready
            </Button>
          )}
          {canStart && caseData.status === 'Planned' && (
            <Button 
              size="sm" 
              onClick={() => onStatusChange('Patient_In')}
            >
              Start
            </Button>
          )}
          {isOngoing && (
            <>
              <Button 
                size="sm" 
                variant="outline"
                onClick={() => onStatusChange('Delayed')}
              >
                Pause
              </Button>
              {caseData.status === 'Cleanup' && (
                <Button 
                  size="sm" 
                  onClick={() => onStatusChange('Completed')}
                >
                  Complete
                </Button>
              )}
            </>
          )}
          <Button size="sm" variant="ghost" onClick={() => {/* Escalate */}}>
            Escalate
          </Button>
        </div>
      </CardContent>
    </Card>
  )
}

