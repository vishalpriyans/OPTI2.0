// Sample notifications to demonstrate the notification system

import { notificationService } from './notification-service'

/**
 * Initialize sample notifications for demonstration
 */
export function initializeSampleNotifications() {
  // Clear any existing notifications first
  notificationService.clearAllNotifications()

  // 1. Critical Emergency Alert
  notificationService.sendQuickNotification(
    'CRITICAL: Code Blue Alert',
    'Emergency in OR 3 - Patient Rajesh Kumar Sharma requires immediate assistance. All available doctors please respond.',
    'critical',
    'all'
  )

  // 2. High Priority Surgery Delay
  notificationService.sendQuickNotification(
    'Surgery Delayed - Urgent',
    'Appendectomy for Sunita Devi Gupta delayed by 45 minutes due to equipment malfunction in OT-2. Patient stable.',
    'high',
    'doctor'
  )

  // 3. Medium Priority Schedule Change
  notificationService.sendQuickNotification(
    'Schedule Update',
    'Knee Arthroscopy for Vikram Anil Patil moved from 2:00 PM to 3:30 PM. All preparations completed.',
    'medium',
    'doctor'
  )

  // 4. Lab Results Available
  notificationService.sendQuickNotification(
    'Lab Results Ready',
    'Blood work results for Meera Lakshmi Iyer are now available. Hemoglobin: 12.5 g/dL, All values normal.',
    'medium',
    'doctor'
  )

  // 5. Equipment Status Update
  notificationService.sendQuickNotification(
    'Equipment Ready',
    'C-Arm machine in OT-1 calibration completed successfully. Ready for next procedure.',
    'low',
    'doctor'
  )

  // 6. Patient Pre-op Complete
  notificationService.sendQuickNotification(
    'Patient Ready',
    'Amit Prakash Joshi has completed pre-operative preparation for Cataract Surgery. Cleared for OT-4.',
    'medium',
    'doctor'
  )

  // 7. Surgery Completion
  notificationService.sendQuickNotification(
    'Surgery Completed',
    'Hip Replacement for patient completed successfully. Recovery room bed 12 assigned. Estimated recovery: 3 hours.',
    'low',
    'doctor'
  )

  // 8. Shift Change Reminder
  notificationService.sendQuickNotification(
    'Shift Change Alert',
    'Evening shift change at 6:00 PM. Please complete patient handovers and update all case documentation.',
    'medium',
    'all'
  )

  // 9. Infection Control Update
  notificationService.sendQuickNotification(
    'Safety Protocol Update',
    'Enhanced PPE protocols now in effect due to seasonal flu outbreak. Please follow updated sanitization guidelines.',
    'high',
    'all'
  )

  // 10. Daily Report
  notificationService.sendQuickNotification(
    'Daily Surgery Summary',
    'Today: 8 surgeries completed, 2 in progress, 3 scheduled. Average efficiency: 92%. No major complications reported.',
    'low',
    'all'
  )

  console.log('✅ 10 Sample notifications initialized with Indian patient data')
}

/**
 * Send test notifications for different scenarios
 */
export function sendTestNotifications() {
  // Test different urgency levels
  notificationService.sendQuickNotification(
    'Low Priority Test',
    'This is a low priority test notification that will auto-dismiss.',
    'low'
  )

  notificationService.sendQuickNotification(
    'Medium Priority Test',
    'This is a medium priority test notification with moderate urgency.',
    'medium'
  )

  notificationService.sendQuickNotification(
    'High Priority Test',
    'This is a high priority test notification that requires attention.',
    'high'
  )

  notificationService.sendQuickNotification(
    'Critical Priority Test',
    'This is a critical priority test notification that demands immediate action.',
    'critical'
  )

  console.log('🧪 Test notifications sent')
}

/**
 * Simulate real-time surgery updates
 */
export function simulateSurgeryUpdates() {
  setTimeout(() => {
    notificationService.sendNotification(
      'Dr. Rajesh Kumar',
      'P001',
      'Patient is ready for surgery. Please proceed to OR 1.',
      'medium',
      'system',
      'S-123'
    )
  }, 2000)

  setTimeout(() => {
    notificationService.notifyDoctor(
      'Dr. Sarah Johnson',
      'Equipment check completed for OR 2. All systems operational.',
      'low',
      'system',
      'S-124'
    )
  }, 5000)

  setTimeout(() => {
    notificationService.sendQuickNotification(
      'Surgery Completed',
      'Hip replacement surgery for patient P001 completed successfully. Recovery room prepared.',
      'low',
      'all'
    )
  }, 8000)

  console.log('🔄 Surgery update simulation started')
}
