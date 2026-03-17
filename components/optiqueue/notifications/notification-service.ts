// Notification Service - Core logic for sending and managing notifications

import { 
  Notification, 
  UrgencyLevel, 
  NotificationChannel, 
  PatientNotificationPreferences,
  NOTIFICATION_TEMPLATES,
  NOTIFICATION_CONFIG
} from './notification-types'

class NotificationService {
  private notifications: Notification[] = []
  private listeners: ((notifications: Notification[]) => void)[] = []
  private patientPreferences: Map<string, PatientNotificationPreferences> = new Map()

  constructor() {
    // Initialize with sample patient preferences
    this.initializeSamplePreferences()
  }

  private initializeSamplePreferences() {
    const samplePreferences: PatientNotificationPreferences[] = [
      {
        patientId: 'P001',
        preferredChannel: 'all',
        email: 'patient1@example.com',
        phone: '+1234567890',
        portalEnabled: true,
        emailEnabled: true,
        smsEnabled: true
      },
      {
        patientId: 'P002',
        preferredChannel: 'email',
        email: 'patient2@example.com',
        phone: '+1234567891',
        portalEnabled: true,
        emailEnabled: true,
        smsEnabled: false
      }
    ]

    samplePreferences.forEach(pref => {
      this.patientPreferences.set(pref.patientId, pref)
    })
  }

  /**
   * Send notification to doctor and patient
   */
  sendNotification(
    doctorId: string,
    patientId: string,
    message: string,
    urgency: UrgencyLevel,
    type: Notification['type'] = 'system',
    caseId?: string
  ): string {
    const notificationId = this.generateId()

    // Notify doctor
    this.notifyDoctor(doctorId, message, urgency, type, caseId, notificationId)

    // Notify patient
    this.notifyPatient(patientId, message, urgency, type, caseId, notificationId)

    return notificationId
  }

  /**
   * Send notification to doctor portal
   */
  notifyDoctor(
    doctorId: string,
    message: string,
    urgency: UrgencyLevel,
    type: Notification['type'] = 'system',
    caseId?: string,
    notificationId?: string
  ): string {
    const id = notificationId || this.generateId()
    const config = NOTIFICATION_CONFIG.urgencyLevels[urgency]

    const notification: Notification = {
      id,
      title: this.getNotificationTitle(type),
      message,
      urgency,
      timestamp: new Date(),
      status: 'unread',
      doctorId,
      caseId,
      type,
      autoDismiss: config.autoDismiss,
      dismissAfter: config.dismissAfter
    }

    this.addNotification(notification)
    return id
  }

  /**
   * Send notification to patient via preferred channel
   */
  notifyPatient(
    patientId: string,
    message: string,
    urgency: UrgencyLevel,
    type: Notification['type'] = 'system',
    caseId?: string,
    notificationId?: string
  ): string {
    const id = notificationId || this.generateId()
    const preferences = this.patientPreferences.get(patientId)
    const config = NOTIFICATION_CONFIG.urgencyLevels[urgency]

    const notification: Notification = {
      id,
      title: this.getNotificationTitle(type),
      message,
      urgency,
      timestamp: new Date(),
      status: 'unread',
      patientId,
      caseId,
      type,
      autoDismiss: config.autoDismiss,
      dismissAfter: config.dismissAfter
    }

    // Send via preferred channels
    if (preferences) {
      if (preferences.portalEnabled) {
        this.sendPortalNotification(notification)
      }
      if (preferences.emailEnabled && preferences.email) {
        this.sendEmailNotification(notification, preferences.email)
      }
      if (preferences.smsEnabled && preferences.phone) {
        this.sendSMSNotification(notification, preferences.phone)
      }
    } else {
      // Default to portal if no preferences found
      this.sendPortalNotification(notification)
    }

    return id
  }

  /**
   * Send quick notification (admin triggered)
   */
  sendQuickNotification(
    title: string,
    message: string,
    urgency: UrgencyLevel,
    targetType: 'doctor' | 'patient' | 'all' = 'all',
    targetId?: string
  ): string {
    const id = this.generateId()
    const config = NOTIFICATION_CONFIG.urgencyLevels[urgency]

    const notification: Notification = {
      id,
      title,
      message,
      urgency,
      timestamp: new Date(),
      status: 'unread',
      type: 'system',
      autoDismiss: config.autoDismiss,
      dismissAfter: config.dismissAfter
    }

    if (targetType === 'doctor' && targetId) {
      notification.doctorId = targetId
    } else if (targetType === 'patient' && targetId) {
      notification.patientId = targetId
    }

    this.addNotification(notification)
    return id
  }

  /**
   * Send emergency alert
   */
  sendEmergencyAlert(
    message: string,
    otNumber?: string,
    affectedDoctors?: string[]
  ): string {
    const id = this.generateId()
    const emergencyMessage = otNumber 
      ? `Emergency in OR ${otNumber}: ${message}`
      : `Emergency Alert: ${message}`

    const notification: Notification = {
      id,
      title: 'EMERGENCY ALERT',
      message: emergencyMessage,
      urgency: 'critical',
      timestamp: new Date(),
      status: 'unread',
      type: 'emergency',
      autoDismiss: false,
      dismissAfter: 0
    }

    this.addNotification(notification)

    // Also send to specific doctors if provided
    if (affectedDoctors) {
      affectedDoctors.forEach(doctorId => {
        this.notifyDoctor(doctorId, emergencyMessage, 'critical', 'emergency')
      })
    }

    return id
  }

  private sendPortalNotification(notification: Notification) {
    this.addNotification(notification)
  }

  private sendEmailNotification(notification: Notification, email: string) {
    // Simulate email sending
    console.log(`📧 Email sent to ${email}:`, notification.title, notification.message)
  }

  private sendSMSNotification(notification: Notification, phone: string) {
    // Simulate SMS sending
    console.log(`📱 SMS sent to ${phone}:`, notification.message)
  }

  private addNotification(notification: Notification) {
    this.notifications.unshift(notification)
    
    // Keep only the latest notifications
    if (this.notifications.length > NOTIFICATION_CONFIG.maxNotifications) {
      this.notifications = this.notifications.slice(0, NOTIFICATION_CONFIG.maxNotifications)
    }

    this.notifyListeners()

    // Auto-dismiss if configured
    if (notification.autoDismiss && notification.dismissAfter) {
      setTimeout(() => {
        this.dismissNotification(notification.id)
      }, notification.dismissAfter)
    }
  }

  private getNotificationTitle(type: Notification['type']): string {
    return NOTIFICATION_TEMPLATES[type]?.title || 'Notification'
  }

  private generateId(): string {
    return `notif_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
  }

  /**
   * Get all notifications
   */
  getNotifications(): Notification[] {
    return [...this.notifications]
  }

  /**
   * Get notifications for specific doctor
   */
  getDoctorNotifications(doctorId: string): Notification[] {
    return this.notifications.filter(n => 
      n.doctorId === doctorId || (!n.doctorId && !n.patientId)
    )
  }

  /**
   * Get unread notifications count
   */
  getUnreadCount(doctorId?: string): number {
    const notifications = doctorId 
      ? this.getDoctorNotifications(doctorId)
      : this.notifications
    
    return notifications.filter(n => n.status === 'unread').length
  }

  /**
   * Mark notification as read
   */
  markAsRead(notificationId: string): void {
    const notification = this.notifications.find(n => n.id === notificationId)
    if (notification) {
      notification.status = 'read'
      this.notifyListeners()
    }
  }

  /**
   * Dismiss notification
   */
  dismissNotification(notificationId: string): void {
    this.notifications = this.notifications.filter(n => n.id !== notificationId)
    this.notifyListeners()
  }

  /**
   * Clear all notifications
   */
  clearAllNotifications(): void {
    this.notifications = []
    this.notifyListeners()
  }

  /**
   * Subscribe to notification updates
   */
  subscribe(listener: (notifications: Notification[]) => void): () => void {
    this.listeners.push(listener)
    
    // Return unsubscribe function
    return () => {
      this.listeners = this.listeners.filter(l => l !== listener)
    }
  }

  private notifyListeners(): void {
    this.listeners.forEach(listener => listener([...this.notifications]))
  }

  /**
   * Set patient notification preferences
   */
  setPatientPreferences(patientId: string, preferences: PatientNotificationPreferences): void {
    this.patientPreferences.set(patientId, preferences)
  }

  /**
   * Get patient notification preferences
   */
  getPatientPreferences(patientId: string): PatientNotificationPreferences | undefined {
    return this.patientPreferences.get(patientId)
  }
}

// Export singleton instance
export const notificationService = new NotificationService()
export default NotificationService
