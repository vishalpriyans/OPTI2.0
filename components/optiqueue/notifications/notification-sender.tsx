"use client"

import { useState } from "react"
import { Send, AlertTriangle, Users, User, Stethoscope } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Badge } from "@/components/ui/badge"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Label } from "@/components/ui/label"
import { useToast } from "@/components/ui/use-toast"
import { notificationService } from "./notification-service"
import { UrgencyLevel, NOTIFICATION_CONFIG } from "./notification-types"

interface NotificationSenderProps {
  className?: string
}

export function NotificationSender({ className = "" }: NotificationSenderProps) {
  const [isOpen, setIsOpen] = useState(false)
  const [title, setTitle] = useState("")
  const [message, setMessage] = useState("")
  const [urgency, setUrgency] = useState<UrgencyLevel>('medium')
  const [targetType, setTargetType] = useState<'all' | 'doctor' | 'patient'>('all')
  const [targetId, setTargetId] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const { toast } = useToast()

  const handleSend = async () => {
    if (!title.trim() || !message.trim()) {
      toast({
        title: "Validation Error",
        description: "Please fill in both title and message fields.",
        variant: "destructive",
      })
      return
    }

    setIsLoading(true)

    try {
      // Send notification
      const notificationId = notificationService.sendQuickNotification(
        title.trim(),
        message.trim(),
        urgency,
        targetType,
        targetId.trim() || undefined
      )

      // Reset form
      setTitle("")
      setMessage("")
      setUrgency('medium')
      setTargetType('all')
      setTargetId("")
      setIsOpen(false)

      // Show success toast
      toast({
        title: "Notification Sent",
        description: `${getTargetDescription()} will receive the ${urgency} priority notification.`,
        variant: "default",
      })

      console.log(`📢 Notification sent with ID: ${notificationId}`)
    } catch (error) {
      toast({
        title: "Send Failed",
        description: "Failed to send notification. Please try again.",
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
  }

  const handleEmergencyAlert = () => {
    const emergencyId = notificationService.sendEmergencyAlert(
      "Emergency situation requires immediate attention",
      undefined,
      ["DR001", "DR002", "DR003"] // Sample doctor IDs
    )

    toast({
      title: "Emergency Alert Sent",
      description: "All medical staff have been notified of the emergency situation.",
      variant: "default",
    })

    setIsOpen(false)
  }

  const getTargetDescription = () => {
    switch (targetType) {
      case 'doctor':
        return targetId ? `Doctor ${targetId}` : 'All doctors'
      case 'patient':
        return targetId ? `Patient ${targetId}` : 'All patients'
      default:
        return 'All users'
    }
  }

  const getUrgencyColor = (level: UrgencyLevel) => {
    return NOTIFICATION_CONFIG.urgencyLevels[level].color
  }

  const getUrgencyIcon = (level: UrgencyLevel) => {
    switch (level) {
      case 'critical':
        return '🔴'
      case 'high':
        return '🚨'
      case 'medium':
        return '⚠️'
      case 'low':
        return '💚'
    }
  }

  return (
    <div className={className}>
      <Dialog open={isOpen} onOpenChange={setIsOpen}>
        <DialogTrigger asChild>
          <Button
            variant="outline"
            size="sm"
            className="gap-2"
          >
            <Send className="w-4 h-4" />
            Send Notification
          </Button>
        </DialogTrigger>
        <DialogContent className="sm:max-w-md max-h-[90vh] overflow-hidden flex flex-col">
          <DialogHeader className="flex-shrink-0">
            <DialogTitle className="flex items-center gap-2">
              <Send className="w-5 h-5" />
              Send Notification
            </DialogTitle>
            <DialogDescription>
              Send real-time notifications to doctors and patients about schedule changes or important updates.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 overflow-y-auto flex-1 pr-2">
            {/* Title */}
            <div className="space-y-2">
              <Label htmlFor="title">Title</Label>
              <Input
                id="title"
                placeholder="e.g., Surgery Rescheduled"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
              />
            </div>

            {/* Message */}
            <div className="space-y-2">
              <Label htmlFor="message">Message</Label>
              <Textarea
                id="message"
                placeholder="Enter the notification message..."
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                rows={3}
              />
            </div>

            {/* Urgency Level */}
            <div className="space-y-2">
              <Label htmlFor="urgency">Urgency Level</Label>
              <Select value={urgency} onValueChange={(value: UrgencyLevel) => setUrgency(value)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {Object.entries(NOTIFICATION_CONFIG.urgencyLevels).map(([level, config]) => (
                    <SelectItem key={level} value={level}>
                      <div className="flex items-center gap-2">
                        <span>{getUrgencyIcon(level as UrgencyLevel)}</span>
                        <span className="capitalize">{level}</span>
                        <Badge 
                          variant="outline" 
                          className="text-xs"
                          style={{ 
                            color: config.color,
                            borderColor: config.color 
                          }}
                        >
                          {config.autoDismiss ? 'Auto-dismiss' : 'Manual'}
                        </Badge>
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Target Audience */}
            <div className="space-y-2">
              <Label htmlFor="target">Target Audience</Label>
              <Select value={targetType} onValueChange={(value: 'all' | 'doctor' | 'patient') => setTargetType(value)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">
                    <div className="flex items-center gap-2">
                      <Users className="w-4 h-4" />
                      All Users
                    </div>
                  </SelectItem>
                  <SelectItem value="doctor">
                    <div className="flex items-center gap-2">
                      <Stethoscope className="w-4 h-4" />
                      Doctors Only
                    </div>
                  </SelectItem>
                  <SelectItem value="patient">
                    <div className="flex items-center gap-2">
                      <User className="w-4 h-4" />
                      Patients Only
                    </div>
                  </SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Specific Target ID */}
            {targetType !== 'all' && (
              <div className="space-y-2">
                <Label htmlFor="targetId">
                  Specific {targetType === 'doctor' ? 'Doctor' : 'Patient'} ID (Optional)
                </Label>
                <Input
                  id="targetId"
                  placeholder={`e.g., ${targetType === 'doctor' ? 'DR001' : 'P001'}`}
                  value={targetId}
                  onChange={(e) => setTargetId(e.target.value)}
                />
              </div>
            )}

            {/* Preview */}
            <div className="p-3 bg-muted/50 rounded-lg border">
              <div className="text-xs text-muted-foreground mb-1">Preview:</div>
              <div className="flex items-center gap-2 mb-1">
                <div 
                  className="w-2 h-2 rounded-full" 
                  style={{ backgroundColor: getUrgencyColor(urgency) }}
                />
                <span className="font-medium text-sm">{title || 'Notification Title'}</span>
                <Badge 
                  variant="outline" 
                  className="text-xs"
                  style={{ 
                    color: getUrgencyColor(urgency),
                    borderColor: getUrgencyColor(urgency)
                  }}
                >
                  {urgency.toUpperCase()}
                </Badge>
              </div>
              <p className="text-xs text-muted-foreground">
                {message || 'Notification message will appear here...'}
              </p>
              <div className="text-xs text-muted-foreground mt-1">
                Target: {getTargetDescription()}
              </div>
            </div>
          </div>

          <DialogFooter className="flex-col sm:flex-row gap-2 flex-shrink-0 border-t pt-4 mt-4">
            {/* Emergency Alert Button */}
            <Button
              variant="destructive"
              size="sm"
              onClick={handleEmergencyAlert}
              className="gap-2"
            >
              <AlertTriangle className="w-4 h-4" />
              Emergency Alert
            </Button>

            <div className="flex gap-2">
              <Button
                variant="outline"
                onClick={() => setIsOpen(false)}
                disabled={isLoading}
              >
                Cancel
              </Button>
              <Button
                onClick={handleSend}
                disabled={isLoading}
                className="gap-2"
              >
                {isLoading ? (
                  <>
                    <div className="w-4 h-4 animate-spin rounded-full border-2 border-background border-t-transparent" />
                    Sending...
                  </>
                ) : (
                  <>
                    <Send className="w-4 h-4" />
                    Send Notification
                  </>
                )}
              </Button>
            </div>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
