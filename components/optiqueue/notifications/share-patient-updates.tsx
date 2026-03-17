"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Share2, Send, Clock, MapPin, User, Calendar } from "lucide-react"
import { useToast } from "@/components/ui/use-toast"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"

interface SharePatientUpdatesProps {
  className?: string
}

export function SharePatientUpdates({ className = "" }: SharePatientUpdatesProps) {
  const [isOpen, setIsOpen] = useState(false)
  const [selectedPatients, setSelectedPatients] = useState<string[]>([])
  const [customMessage, setCustomMessage] = useState("")
  const [isSharing, setIsSharing] = useState(false)
  const { toast } = useToast()

  // Sample patient data with surgery details - Indian names
  const patients = [
    {
      id: "P001",
      name: "Rajesh Kumar Sharma",
      surgery: "Appendectomy",
      originalTime: "10:00 AM",
      newTime: "11:30 AM",
      theater: "OT-2",
      surgeon: "Dr. Priya Mehta",
      date: "Nov 9, 2025",
      status: "Rescheduled"
    },
    {
      id: "P002", 
      name: "Sunita Devi Gupta",
      surgery: "Cholecystectomy",
      originalTime: "2:00 PM",
      newTime: "2:00 PM",
      theater: "OT-1",
      surgeon: "Dr. Arjun Singh",
      date: "Nov 9, 2025",
      status: "Confirmed"
    },
    {
      id: "P003",
      name: "Vikram Anil Patil",
      surgery: "Knee Arthroscopy", 
      originalTime: "9:00 AM",
      newTime: "1:00 PM",
      theater: "OT-3",
      surgeon: "Dr. Kavya Reddy",
      date: "Nov 9, 2025",
      status: "Rescheduled"
    },
    {
      id: "P004",
      name: "Meera Lakshmi Iyer",
      surgery: "Hernia Repair",
      originalTime: "3:30 PM",
      newTime: "3:30 PM",
      theater: "OT-4",
      surgeon: "Dr. Rohit Agarwal",
      date: "Nov 9, 2025",
      status: "Confirmed"
    },
    {
      id: "P005",
      name: "Amit Prakash Joshi",
      surgery: "Cataract Surgery",
      originalTime: "11:00 AM",
      newTime: "2:30 PM",
      theater: "OT-5",
      surgeon: "Dr. Deepika Nair",
      date: "Nov 9, 2025",
      status: "Rescheduled"
    }
  ]

  const handlePatientToggle = (patientId: string) => {
    setSelectedPatients(prev => 
      prev.includes(patientId) 
        ? prev.filter(id => id !== patientId)
        : [...prev, patientId]
    )
  }

  const handleShareUpdates = async () => {
    if (selectedPatients.length === 0) {
      toast({
        title: "No patients selected",
        description: "Please select at least one patient to share updates with.",
        variant: "destructive"
      })
      return
    }

    setIsSharing(true)
    
    try {
      // Simulate sharing process
      await new Promise(resolve => setTimeout(resolve, 2000))
      
      const selectedPatientData = patients.filter(p => selectedPatients.includes(p.id))
      
      // Generate update messages for each patient
      for (const patient of selectedPatientData) {
        const updateMessage = `
🏥 Surgery Update - ${patient.name}

📋 Procedure: ${patient.surgery}
👨‍⚕️ Surgeon: ${patient.surgeon}
📅 Date: ${patient.date}
⏰ Time: ${patient.newTime}
🏢 Theater: ${patient.theater}
📊 Status: ${patient.status}

${customMessage ? `\n📝 Additional Notes:\n${customMessage}` : ''}

Thank you for choosing OptiQueue Healthcare.
        `.trim()

        // In a real app, this would send via SMS, email, or patient portal
        console.log(`Sharing update with ${patient.name}:`, updateMessage)
      }

      toast({
        title: "Updates Shared Successfully! 📤",
        description: `Surgery updates sent to ${selectedPatients.length} patient(s) via SMS and patient portal.`,
      })

      // Reset form
      setSelectedPatients([])
      setCustomMessage("")
      setIsOpen(false)
      
    } catch (error) {
      toast({
        title: "Sharing Failed",
        description: "Failed to share patient updates. Please try again.",
        variant: "destructive"
      })
    } finally {
      setIsSharing(false)
    }
  }

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button 
          variant="outline" 
          size="sm"
          className={`gap-2 ${className}`}
        >
          <Share2 className="w-4 h-4" />
          Share Updates
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-2xl max-h-[90vh] overflow-hidden flex flex-col">
        <DialogHeader className="flex-shrink-0">
          <DialogTitle className="flex items-center gap-2">
            <Share2 className="w-5 h-5" />
            Share Patient Surgery Updates
          </DialogTitle>
          <DialogDescription>
            Send personalized surgery timing and details to patients via SMS and patient portal.
          </DialogDescription>
        </DialogHeader>
        
        <div className="flex-1 overflow-y-auto space-y-6 pr-2">
          {/* Patient Selection */}
          <div>
            <Label className="text-base font-semibold mb-3 block">Select Patients to Notify</Label>
            <div className="space-y-3">
              {patients.map((patient) => (
                <div 
                  key={patient.id}
                  className={`p-4 rounded-lg border-2 cursor-pointer transition-all ${
                    selectedPatients.includes(patient.id)
                      ? 'border-blue-500 bg-blue-50'
                      : 'border-gray-200 hover:border-gray-300'
                  }`}
                  onClick={() => handlePatientToggle(patient.id)}
                >
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        <User className="w-4 h-4 text-blue-600" />
                        <span className="font-semibold">{patient.name}</span>
                        <Badge variant={patient.status === 'Rescheduled' ? 'destructive' : 'default'}>
                          {patient.status}
                        </Badge>
                      </div>
                      
                      <div className="grid grid-cols-2 gap-3 text-sm text-gray-600">
                        <div className="flex items-center gap-2">
                          <Calendar className="w-3 h-3" />
                          <span>{patient.surgery}</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <Clock className="w-3 h-3" />
                          <span>{patient.newTime}</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <MapPin className="w-3 h-3" />
                          <span>{patient.theater}</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <User className="w-3 h-3" />
                          <span>{patient.surgeon}</span>
                        </div>
                      </div>
                      
                      {patient.status === 'Rescheduled' && (
                        <div className="mt-2 text-xs text-orange-600 bg-orange-50 px-2 py-1 rounded">
                          ⚠️ Time changed from {patient.originalTime} to {patient.newTime}
                        </div>
                      )}
                    </div>
                    
                    <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center ${
                      selectedPatients.includes(patient.id)
                        ? 'border-blue-500 bg-blue-500'
                        : 'border-gray-300'
                    }`}>
                      {selectedPatients.includes(patient.id) && (
                        <div className="w-2 h-2 bg-white rounded-full" />
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <Separator />

          {/* Custom Message */}
          <div>
            <Label htmlFor="customMessage" className="text-base font-semibold">
              Additional Message (Optional)
            </Label>
            <Textarea
              id="customMessage"
              placeholder="Add any additional notes or instructions for patients..."
              value={customMessage}
              onChange={(e) => setCustomMessage(e.target.value)}
              className="mt-2 min-h-[80px]"
            />
          </div>

          {/* Preview */}
          {selectedPatients.length > 0 && (
            <div className="bg-gray-50 p-4 rounded-lg">
              <Label className="text-sm font-semibold text-gray-700 mb-2 block">
                📱 Message Preview
              </Label>
              <div className="text-sm text-gray-600 bg-white p-3 rounded border">
                🏥 Surgery Update - [Patient Name]<br />
                📋 Procedure: [Surgery Type]<br />
                👨‍⚕️ Surgeon: [Doctor Name]<br />
                📅 Date: Nov 9, 2025<br />
                ⏰ Time: [Surgery Time]<br />
                🏢 Theater: [OT Number]<br />
                {customMessage && (
                  <>
                    <br />
                    📝 Additional Notes:<br />
                    {customMessage}
                  </>
                )}
              </div>
            </div>
          )}
        </div>

        {/* Footer Actions */}
        <div className="flex-shrink-0 flex justify-between items-center pt-4 border-t">
          <div className="text-sm text-gray-500">
            {selectedPatients.length} patient(s) selected
          </div>
          <div className="flex gap-2">
            <Button variant="outline" onClick={() => setIsOpen(false)}>
              Cancel
            </Button>
            <Button 
              onClick={handleShareUpdates}
              disabled={isSharing || selectedPatients.length === 0}
              className="gap-2"
            >
              {isSharing ? (
                <>
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  Sharing...
                </>
              ) : (
                <>
                  <Send className="w-4 h-4" />
                  Share Updates ({selectedPatients.length})
                </>
              )}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
