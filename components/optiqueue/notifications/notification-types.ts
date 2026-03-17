// Notification System Types and Configuration

export type UrgencyLevel = 'low' | 'medium' | 'high' | 'critical'
export type NotificationChannel = 'portal' | 'email' | 'sms' | 'all'
export type NotificationStatus = 'unread' | 'read' | 'dismissed'

export interface Notification {
  id: string
  title: string
  message: string
  urgency: UrgencyLevel
  timestamp: Date
  status: NotificationStatus
  doctorId?: string
  patientId?: string
  caseId?: string
  type: 'schedule_change' | 'delay' | 'cancellation' | 'emergency' | 'reminder' | 'system'
  autoDismiss?: boolean
  dismissAfter?: number // milliseconds
}

export interface PatientNotificationPreferences {
  patientId: string
  preferredChannel: NotificationChannel
  email?: string
  phone?: string
  portalEnabled: boolean
  emailEnabled: boolean
  smsEnabled: boolean
}

export interface NotificationConfig {
  urgencyLevels: Record<UrgencyLevel, {
    color: string
    bgColor: string
    borderColor: string
    icon: string
    autoDismiss: boolean
    dismissAfter: number
    sound?: boolean
  }>
  maxNotifications: number
  defaultChannel: NotificationChannel
}

export const NOTIFICATION_CONFIG: NotificationConfig = {
  urgencyLevels: {
    low: {
      color: '#22c55e',
      bgColor: '#f0fdf4',
      borderColor: '#bbf7d0',
      icon: '💚',
      autoDismiss: true,
      dismissAfter: 5000,
      sound: false
    },
    medium: {
      color: '#f59e0b',
      bgColor: '#fffbeb',
      borderColor: '#fde68a',
      icon: '⚠️',
      autoDismiss: true,
      dismissAfter: 8000,
      sound: false
    },
    high: {
      color: '#ef4444',
      bgColor: '#fef2f2',
      borderColor: '#fecaca',
      icon: '🚨',
      autoDismiss: false,
      dismissAfter: 0,
      sound: true
    },
    critical: {
      color: '#dc2626',
      bgColor: '#fef2f2',
      borderColor: '#f87171',
      icon: '🔴',
      autoDismiss: false,
      dismissAfter: 0,
      sound: true
    }
  },
  maxNotifications: 10,
  defaultChannel: 'portal'
}

export const NOTIFICATION_TEMPLATES = {
  schedule_change: {
    title: 'Surgery Rescheduled',
    message: 'Your surgery for {procedure} has been rescheduled from {oldTime} to {newTime}.',
    urgency: 'medium' as UrgencyLevel
  },
  delay: {
    title: 'Surgery Delayed',
    message: 'Your surgery for {procedure} scheduled at {time} has been delayed by {duration} minutes.',
    urgency: 'medium' as UrgencyLevel
  },
  cancellation: {
    title: 'Surgery Cancelled',
    message: 'Your surgery for {procedure} scheduled at {time} has been cancelled. Please contact your doctor.',
    urgency: 'high' as UrgencyLevel
  },
  emergency: {
    title: 'Emergency Alert',
    message: 'Emergency situation in OR {otNumber}. Immediate attention required.',
    urgency: 'critical' as UrgencyLevel
  },
  reminder: {
    title: 'Surgery Reminder',
    message: 'Reminder: Your surgery for {procedure} is scheduled for {time} tomorrow.',
    urgency: 'low' as UrgencyLevel
  },
  system: {
    title: 'System Update',
    message: 'OptiQueue system will undergo maintenance from {startTime} to {endTime}.',
    urgency: 'low' as UrgencyLevel
  }
}
