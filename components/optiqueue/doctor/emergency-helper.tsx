"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { requestEmergencySlot, logAction } from "./store"
import { useCurrentUser } from "./store"
import { useToast } from "@/components/ui/use-toast"
import { PROCEDURE_NAMES, EQUIPMENT, SURGEONS } from "../sample-data"
import { filterDoctorsByProcedure } from "../specializations"
import { useMemo } from "react"
import { AlertTriangle } from "lucide-react"

export function EmergencyRequestDialog({ surgeonId, date }: { surgeonId: string; date: string }) {
  const [open, setOpen] = useState(false)
  const [procedure, setProcedure] = useState("")
  const [estimateMin, setEstimateMin] = useState(60)
  const [equipmentIds, setEquipmentIds] = useState<string[]>([])
  const [notes, setNotes] = useState("")
  const { user } = useCurrentUser()
  const { toast } = useToast()
  
  // Filter doctors based on selected procedure (for emergency, include emergency/trauma doctors)
  const availableDoctors = useMemo(() => {
    const procedureFiltered = filterDoctorsByProcedure(SURGEONS, procedure)
    const emergencyDoctors = SURGEONS.filter(s => 
      s.toLowerCase().includes('emergency') || s.toLowerCase().includes('trauma')
    )
    // Combine and deduplicate
    return [...new Set([...procedureFiltered, ...emergencyDoctors])]
  }, [procedure])
  
  const handleRequest = async () => {
    if (!procedure || equipmentIds.length === 0) {
      toast({
        title: "Missing information",
        description: "Please provide procedure and at least one equipment",
        variant: "destructive",
      })
      return
    }
    
    try {
      const result = await requestEmergencySlot({
        procedure,
        estimateMin,
        equipmentIds,
        notes: notes || undefined,
      })
      
      logAction(user.id, 'emergency-request', { procedure, estimateMin, equipmentIds })
      
      toast({
        title: "Emergency slot requested",
        description: result.message,
      })
      
      if (result.suggested) {
        toast({
          title: "Suggested Slot",
          description: `OT: ${result.suggested.otId}, Start: ${new Date(result.suggested.startISO).toLocaleString()}`,
        })
      }
      
      if (result.conflicts.length > 0) {
        toast({
          title: "Conflicts detected",
          description: `${result.conflicts.length} conflict(s) found. Please review.`,
          variant: "destructive",
        })
      }
      
      setOpen(false)
      // Reset form
      setProcedure("")
      setEstimateMin(60)
      setEquipmentIds([])
      setNotes("")
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to request emergency slot",
        variant: "destructive",
      })
    }
  }
  
  const toggleEquipment = (equipmentId: string) => {
    if (equipmentIds.includes(equipmentId)) {
      setEquipmentIds(equipmentIds.filter(id => id !== equipmentId))
    } else {
      setEquipmentIds([...equipmentIds, equipmentId])
    }
  }
  
  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="destructive" className="w-full">
          <AlertTriangle className="h-4 w-4 mr-2" />
          Request Emergency Slot
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Request Emergency Slot (Priority 1: Urgent)</DialogTitle>
          <DialogDescription>
            Request an urgent emergency slot. The system will find the earliest feasible time and Operation Theatre.
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-4 py-4">
          <div>
            <Label htmlFor="procedure">Procedure *</Label>
            <Select value={procedure} onValueChange={setProcedure}>
              <SelectTrigger id="procedure">
                <SelectValue placeholder="Select procedure" />
              </SelectTrigger>
              <SelectContent>
                {PROCEDURE_NAMES.map((proc) => (
                  <SelectItem key={proc} value={proc}>
                    {proc}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          
          <div>
            <Label htmlFor="estimate">Estimated Duration (minutes) *</Label>
            <Input
              id="estimate"
              type="number"
              min={15}
              step={5}
              value={estimateMin}
              onChange={(e) => setEstimateMin(Number(e.target.value))}
            />
          </div>
          
          <div>
            <Label>Required Equipment *</Label>
            <div className="grid grid-cols-2 gap-2 mt-2 max-h-48 overflow-y-auto">
              {EQUIPMENT.map((eq) => (
                <Button
                  key={eq}
                  type="button"
                  variant={equipmentIds.includes(eq) ? "default" : "outline"}
                  size="sm"
                  onClick={() => toggleEquipment(eq)}
                >
                  {eq} {equipmentIds.includes(eq) && "✓"}
                </Button>
              ))}
            </div>
          </div>
          
          <div>
            <Label htmlFor="notes">Notes (optional)</Label>
            <Textarea
              id="notes"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Additional information..."
              rows={3}
            />
          </div>
          
          <div className="flex gap-2">
            <Button variant="outline" onClick={() => setOpen(false)} className="flex-1">
              Cancel
            </Button>
            <Button onClick={handleRequest} className="flex-1" variant="destructive">
              Request Slot
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}

