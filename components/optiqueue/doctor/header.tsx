"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { Calendar } from "@/components/ui/calendar"
import { format } from "date-fns"
import { CalendarIcon, Printer, Share2, User, LogOut } from "lucide-react"
import { SURGEONS } from "../sample-data"
import { useAuth } from "../auth/store"
import { NotificationPanel } from "../notifications/notification-panel"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import type { UserRole } from "./types"

export function DoctorHeader({
  defaultDate,
  onDateChange,
  surgeonId,
  onSurgeonChange,
  userRole,
  onPrint,
  onShare,
}: {
  defaultDate: Date
  onDateChange: (date: Date) => void
  surgeonId: string
  onSurgeonChange: (surgeonId: string) => void
  userRole: UserRole
  onPrint: () => void
  onShare: () => void
}) {
  const [date, setDate] = useState(defaultDate)
  const isAdministrator = userRole === 'Administrator'
  const { user, logout } = useAuth()
  
  const handleDateChange = (newDate: Date | undefined) => {
    if (newDate) {
      setDate(newDate)
      onDateChange(newDate)
    }
  }
  
  return (
    <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 p-4 bg-card border-b">
      <div className="flex items-center gap-4 flex-wrap">
        {/* Date Picker */}
        <Popover>
          <PopoverTrigger asChild>
            <Button variant="outline" className="w-[240px] justify-start text-left font-normal">
              <CalendarIcon className="mr-2 h-4 w-4" />
              {format(date, "PPP")}
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-auto p-0" align="start">
            <Calendar
              mode="single"
              selected={date}
              onSelect={handleDateChange}
              initialFocus
            />
          </PopoverContent>
        </Popover>
        
        {/* Surgeon Switcher (Administrators only) */}
        {isAdministrator && (
          <div className="flex items-center gap-2">
            <User className="h-6 w-6 text-muted-foreground" />
            <Select value={surgeonId} onValueChange={onSurgeonChange}>
              <SelectTrigger className="w-[200px]">
                <SelectValue placeholder="Select surgeon" />
              </SelectTrigger>
              <SelectContent>
                {SURGEONS.map((surgeon) => (
                  <SelectItem key={surgeon} value={surgeon}>
                    {surgeon}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        )}
        
        {/* Surgeon Display (Doctors only) */}
        {!isAdministrator && (
          <div className="flex items-center gap-2 text-sm">
            <User className="h-6 w-6 text-muted-foreground" />
            <span className="font-medium">{surgeonId}</span>
          </div>
        )}
      </div>
      
      {/* Actions */}
      <div className="flex items-center gap-2">
        <Button variant="outline" size="sm" onClick={onPrint}>
          <Printer className="h-4 w-4 mr-2" />
          Print
        </Button>
        <Button variant="outline" size="sm" onClick={onShare}>
          <Share2 className="h-4 w-4 mr-2" />
          Share
        </Button>
        
        {/* Notification Panel for Doctors */}
        <NotificationPanel doctorId={surgeonId} />
        
        {user && (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon" className="rounded-full">
                <User className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-56">
              <DropdownMenuLabel>
                <div className="flex flex-col space-y-1">
                  <p className="text-sm font-medium">{user.name}</p>
                  <p className="text-xs text-muted-foreground">{user.role}</p>
                </div>
              </DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={logout} className="text-destructive">
                <LogOut className="mr-2 h-4 w-4" />
                Logout
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        )}
      </div>
    </div>
  )
}

