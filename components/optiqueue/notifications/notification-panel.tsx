"use client"

import { useState, useEffect } from "react"
import { Bell, X, Clock, AlertTriangle, CheckCircle, XCircle } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Separator } from "@/components/ui/separator"
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"
import { notificationService } from "./notification-service"
import { Notification, NOTIFICATION_CONFIG } from "./notification-types"
import { formatDistanceToNow } from "date-fns"

interface NotificationPanelProps {
  doctorId?: string
  className?: string
}

export function NotificationPanel({ doctorId, className = "" }: NotificationPanelProps) {
  const [notifications, setNotifications] = useState<Notification[]>([])
  const [isOpen, setIsOpen] = useState(false)
  const [unreadCount, setUnreadCount] = useState(0)

  useEffect(() => {
    // Subscribe to notification updates
    const unsubscribe = notificationService.subscribe((allNotifications) => {
      const filteredNotifications = doctorId 
        ? notificationService.getDoctorNotifications(doctorId)
        : allNotifications
      
      setNotifications(filteredNotifications)
      setUnreadCount(notificationService.getUnreadCount(doctorId))
    })

    // Initial load
    const initialNotifications = doctorId 
      ? notificationService.getDoctorNotifications(doctorId)
      : notificationService.getNotifications()
    
    setNotifications(initialNotifications)
    setUnreadCount(notificationService.getUnreadCount(doctorId))

    return unsubscribe
  }, [doctorId])

  const handleNotificationClick = (notification: Notification) => {
    if (notification.status === 'unread') {
      notificationService.markAsRead(notification.id)
    }
  }

  const handleDismiss = (notificationId: string, event: React.MouseEvent) => {
    event.stopPropagation()
    notificationService.dismissNotification(notificationId)
  }

  const handleClearAll = () => {
    notificationService.clearAllNotifications()
    setIsOpen(false)
  }

  const getNotificationIcon = (notification: Notification) => {
    const config = NOTIFICATION_CONFIG.urgencyLevels[notification.urgency]
    
    switch (notification.type) {
      case 'emergency':
        return <AlertTriangle className="w-4 h-4" style={{ color: config.color }} />
      case 'schedule_change':
        return <Clock className="w-4 h-4" style={{ color: config.color }} />
      case 'cancellation':
        return <XCircle className="w-4 h-4" style={{ color: config.color }} />
      case 'reminder':
        return <CheckCircle className="w-4 h-4" style={{ color: config.color }} />
      default:
        return <Bell className="w-4 h-4" style={{ color: config.color }} />
    }
  }

  const getUrgencyBadge = (urgency: Notification['urgency']) => {
    const config = NOTIFICATION_CONFIG.urgencyLevels[urgency]
    return (
      <Badge 
        variant="outline" 
        className="text-xs"
        style={{ 
          color: config.color,
          borderColor: config.color,
          backgroundColor: config.bgColor
        }}
      >
        {urgency.toUpperCase()}
      </Badge>
    )
  }

  return (
    <div className={className}>
      <Popover open={isOpen} onOpenChange={setIsOpen}>
        <PopoverTrigger asChild>
          <Button
            variant="ghost"
            size="sm"
            className="relative p-2 hover:bg-accent/50"
          >
            <Bell className="w-5 h-5" />
            {unreadCount > 0 && (
              <Badge 
                variant="destructive" 
                className="absolute -top-1 -right-1 h-5 w-5 flex items-center justify-center p-0 text-xs animate-pulse"
              >
                {unreadCount > 99 ? '99+' : unreadCount}
              </Badge>
            )}
          </Button>
        </PopoverTrigger>
        <PopoverContent 
          className="w-96 max-w-[90vw] p-0 mr-4 max-h-[80vh] flex flex-col" 
          align="end"
          side="bottom"
        >
          <div className="flex items-center justify-between p-4 border-b">
            <div className="flex items-center gap-2">
              <Bell className="w-4 h-4" />
              <h3 className="font-semibold">Notifications</h3>
              {unreadCount > 0 && (
                <Badge variant="secondary" className="text-xs">
                  {unreadCount} new
                </Badge>
              )}
              {notifications.length > 5 && (
                <Badge variant="outline" className="text-xs text-muted-foreground">
                  {notifications.length} total
                </Badge>
              )}
            </div>
            {notifications.length > 0 && (
              <Button
                variant="ghost"
                size="sm"
                onClick={handleClearAll}
                className="text-xs text-muted-foreground hover:text-foreground"
              >
                Clear all
              </Button>
            )}
          </div>

          <ScrollArea className="h-96 max-h-[70vh] overflow-y-auto">
            {notifications.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-8 text-center">
                <Bell className="w-8 h-8 text-muted-foreground mb-2" />
                <p className="text-sm text-muted-foreground">No notifications</p>
                <p className="text-xs text-muted-foreground">You're all caught up!</p>
              </div>
            ) : (
              <div className="divide-y">
                {notifications.map((notification, index) => {
                  const config = NOTIFICATION_CONFIG.urgencyLevels[notification.urgency]
                  
                  return (
                    <div
                      key={notification.id}
                      className={`p-4 cursor-pointer transition-colors hover:bg-accent/50 ${
                        notification.status === 'unread' ? 'bg-accent/20' : ''
                      }`}
                      onClick={() => handleNotificationClick(notification)}
                      style={{
                        borderLeft: `3px solid ${config.color}`,
                      }}
                    >
                      <div className="flex items-start justify-between gap-2">
                        <div className="flex items-start gap-3 flex-1 min-w-0">
                          <div className="flex-shrink-0 mt-0.5">
                            {getNotificationIcon(notification)}
                          </div>
                          
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 mb-1">
                              <h4 className="text-sm font-medium truncate">
                                {notification.title}
                              </h4>
                              {getUrgencyBadge(notification.urgency)}
                            </div>
                            
                            <p className="text-xs text-muted-foreground mb-2 line-clamp-2">
                              {notification.message}
                            </p>
                            
                            <div className="flex items-center justify-between">
                              <span className="text-xs text-muted-foreground">
                                {formatDistanceToNow(notification.timestamp, { addSuffix: true })}
                              </span>
                              
                              {notification.caseId && (
                                <Badge variant="outline" className="text-xs">
                                  {notification.caseId}
                                </Badge>
                              )}
                            </div>
                          </div>
                        </div>
                        
                        <TooltipProvider>
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <Button
                                variant="ghost"
                                size="sm"
                                className="flex-shrink-0 h-6 w-6 p-0 hover:bg-destructive/10"
                                onClick={(e) => handleDismiss(notification.id, e)}
                              >
                                <X className="w-3 h-3" />
                              </Button>
                            </TooltipTrigger>
                            <TooltipContent>
                              <p>Dismiss</p>
                            </TooltipContent>
                          </Tooltip>
                        </TooltipProvider>
                      </div>
                    </div>
                  )
                })}
              </div>
            )}
          </ScrollArea>

          {notifications.length > 0 && (
            <>
              <Separator />
              <div className="p-2">
                <Button
                  variant="ghost"
                  size="sm"
                  className="w-full text-xs text-muted-foreground"
                  onClick={() => setIsOpen(false)}
                >
                  View All Notifications
                </Button>
              </div>
            </>
          )}
        </PopoverContent>
      </Popover>
    </div>
  )
}
