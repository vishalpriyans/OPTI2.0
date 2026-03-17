"use client"

import { Button } from "@/components/ui/button"
import { CheckCircle2, Play, Pause, Check, AlertCircle } from "lucide-react"
import { cn } from "@/lib/utils"
import type { DoctorDashboardCase } from "./types"

export function QuickActionsBar({
  selectedCase,
  onAcknowledge,
  onMarkReady,
  onStart,
  onPause,
  onComplete,
  onEscalate,
}: {
  selectedCase: DoctorDashboardCase | null
  onAcknowledge: () => void
  onMarkReady: () => void
  onStart: () => void
  onPause: () => void
  onComplete: () => void
  onEscalate: () => void
}) {
  if (!selectedCase) {
    return (
      <div className="fixed bottom-0 left-0 right-0 bg-background border-t p-4 md:hidden z-50">
        <div className="text-sm text-muted-foreground text-center">
          Select a case to view actions
        </div>
      </div>
    )
  }
  
  const canStart = selectedCase.markedReady && 
    selectedCase.checklist.consent && 
    selectedCase.checklist.labsOk &&
    selectedCase.status === 'Planned'
  
  const isOngoing = ['Patient_In', 'Anesthesia_Start', 'Incision', 'Closing', 'Cleanup'].includes(selectedCase.status)
  const canComplete = selectedCase.status === 'Cleanup'
  
  return (
    <div className="fixed bottom-0 left-0 right-0 bg-background border-t shadow-lg p-4 md:hidden z-50">
      <div className="max-w-md mx-auto">
        <div className="text-xs font-semibold text-muted-foreground mb-2">
          {selectedCase.caseId} - {selectedCase.procedure}
        </div>
        <div className="flex gap-2 flex-wrap">
          {!selectedCase.acknowledged && (
            <Button
              size="sm"
              variant="outline"
              onClick={onAcknowledge}
              className="flex-1 min-w-[100px]"
            >
              <CheckCircle2 className="h-4 w-4 mr-1" />
              Acknowledge
            </Button>
          )}
          {!selectedCase.markedReady && selectedCase.acknowledged && (
            <Button
              size="sm"
              variant="outline"
              onClick={onMarkReady}
              disabled={!selectedCase.checklist.consent || !selectedCase.checklist.labsOk}
              className="flex-1 min-w-[100px]"
            >
              <CheckCircle2 className="h-4 w-4 mr-1" />
              Mark Ready
            </Button>
          )}
          {canStart && (
            <Button
              size="sm"
              onClick={onStart}
              className="flex-1 min-w-[100px]"
            >
              <Play className="h-4 w-4 mr-1" />
              Start
            </Button>
          )}
          {isOngoing && (
            <Button
              size="sm"
              variant="outline"
              onClick={onPause}
              className="flex-1 min-w-[100px]"
            >
              <Pause className="h-4 w-4 mr-1" />
              Pause
            </Button>
          )}
          {canComplete && (
            <Button
              size="sm"
              onClick={onComplete}
              className="flex-1 min-w-[100px]"
            >
              <Check className="h-4 w-4 mr-1" />
              Complete
            </Button>
          )}
          <Button
            size="sm"
            variant="ghost"
            onClick={onEscalate}
            className="flex-1 min-w-[100px]"
          >
            <AlertCircle className="h-4 w-4 mr-1" />
            Escalate
          </Button>
        </div>
      </div>
    </div>
  )
}

