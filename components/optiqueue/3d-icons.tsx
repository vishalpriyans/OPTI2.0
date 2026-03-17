"use client"

import { cn } from "@/lib/utils"

interface Icon3DProps {
  className?: string
}

export function OvertimeIcon({ className }: Icon3DProps) {
  return (
    <div className={cn("icon-3d", className)}>
      <svg width="48" height="48" viewBox="0 0 48 48" fill="none" xmlns="http://www.w3.org/2000/svg">
        <defs>
          <linearGradient id="overtimeGradient" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="oklch(0.7 0.2 45)" />
            <stop offset="100%" stopColor="oklch(0.8 0.25 45)" />
          </linearGradient>
          <filter id="overtimeShadow" x="-50%" y="-50%" width="200%" height="200%">
            <feDropShadow dx="2" dy="4" stdDeviation="4" floodColor="oklch(0.7 0.2 45 / 0.3)"/>
          </filter>
        </defs>
        <circle cx="24" cy="24" r="20" fill="url(#overtimeGradient)" filter="url(#overtimeShadow)" />
        <circle cx="24" cy="24" r="16" fill="none" stroke="white" strokeWidth="2" opacity="0.8" />
        <path d="M24 8 L24 24 L32 24" stroke="white" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" />
        <circle cx="24" cy="24" r="2" fill="white" />
      </svg>
    </div>
  )
}

export function EquipmentIcon({ className }: Icon3DProps) {
  return (
    <div className={cn("icon-3d", className)}>
      <svg width="48" height="48" viewBox="0 0 48 48" fill="none" xmlns="http://www.w3.org/2000/svg">
        <defs>
          <linearGradient id="equipmentGradient" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="oklch(0.45 0.08 180)" />
            <stop offset="100%" stopColor="oklch(0.5 0.1 180)" />
          </linearGradient>
          <filter id="equipmentShadow" x="-50%" y="-50%" width="200%" height="200%">
            <feDropShadow dx="2" dy="4" stdDeviation="4" floodColor="oklch(0.45 0.08 180 / 0.3)"/>
          </filter>
        </defs>
        <rect x="8" y="16" width="32" height="24" rx="4" fill="url(#equipmentGradient)" filter="url(#equipmentShadow)" />
        <rect x="12" y="20" width="24" height="16" rx="2" fill="white" opacity="0.9" />
        <circle cx="20" cy="28" r="3" fill="oklch(0.45 0.08 180)" />
        <circle cx="28" cy="28" r="3" fill="oklch(0.45 0.08 180)" />
        <rect x="22" y="12" width="4" height="8" fill="url(#equipmentGradient)" />
        <rect x="20" y="10" width="8" height="2" fill="url(#equipmentGradient)" />
      </svg>
    </div>
  )
}

export function OptimizationIcon({ className }: Icon3DProps) {
  return (
    <div className={cn("icon-3d", className)}>
      <svg width="48" height="48" viewBox="0 0 48 48" fill="none" xmlns="http://www.w3.org/2000/svg">
        <defs>
          <linearGradient id="optimizationGradient" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="oklch(0.6 0.15 120)" />
            <stop offset="100%" stopColor="oklch(0.65 0.2 120)" />
          </linearGradient>
          <filter id="optimizationShadow" x="-50%" y="-50%" width="200%" height="200%">
            <feDropShadow dx="2" dy="4" stdDeviation="4" floodColor="oklch(0.6 0.15 120 / 0.3)"/>
          </filter>
        </defs>
        <circle cx="24" cy="24" r="20" fill="url(#optimizationGradient)" filter="url(#optimizationShadow)" />
        <path d="M16 24 L20 20 L24 24 L28 20 L32 24" stroke="white" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" />
        <circle cx="16" cy="24" r="2" fill="white" />
        <circle cx="20" cy="20" r="2" fill="white" />
        <circle cx="24" cy="24" r="2" fill="white" />
        <circle cx="28" cy="20" r="2" fill="white" />
        <circle cx="32" cy="24" r="2" fill="white" />
        <path d="M12 32 Q24 28 36 32" stroke="white" strokeWidth="2" strokeLinecap="round" opacity="0.8" />
      </svg>
    </div>
  )
}

export function EmergencyIcon({ className }: Icon3DProps) {
  return (
    <div className={cn("icon-3d", className)}>
      <svg width="48" height="48" viewBox="0 0 48 48" fill="none" xmlns="http://www.w3.org/2000/svg">
        <defs>
          <linearGradient id="emergencyGradient" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="oklch(0.55 0.2 15)" />
            <stop offset="100%" stopColor="oklch(0.6 0.25 15)" />
          </linearGradient>
          <filter id="emergencyShadow" x="-50%" y="-50%" width="200%" height="200%">
            <feDropShadow dx="2" dy="4" stdDeviation="4" floodColor="oklch(0.55 0.2 15 / 0.4)"/>
          </filter>
        </defs>
        <polygon points="24,8 32,20 20,20" fill="url(#emergencyGradient)" filter="url(#emergencyShadow)" />
        <rect x="20" y="20" width="8" height="20" fill="url(#emergencyGradient)" />
        <rect x="18" y="32" width="12" height="4" fill="url(#emergencyGradient)" />
        <rect x="18" y="38" width="12" height="4" fill="url(#emergencyGradient)" />
        <text x="24" y="30" textAnchor="middle" fill="white" fontSize="12" fontWeight="bold">!</text>
      </svg>
    </div>
  )
}

export function SurgeryIcon({ className }: Icon3DProps) {
  return (
    <div className={cn("icon-3d", className)}>
      <svg width="48" height="48" viewBox="0 0 48 48" fill="none" xmlns="http://www.w3.org/2000/svg">
        <defs>
          <linearGradient id="surgeryGradient" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="oklch(0.3 0.05 240)" />
            <stop offset="100%" stopColor="oklch(0.4 0.08 240)" />
          </linearGradient>
          <filter id="surgeryShadow" x="-50%" y="-50%" width="200%" height="200%">
            <feDropShadow dx="2" dy="4" stdDeviation="4" floodColor="oklch(0.3 0.05 240 / 0.3)"/>
          </filter>
        </defs>
        <rect x="12" y="16" width="24" height="20" rx="4" fill="url(#surgeryGradient)" filter="url(#surgeryShadow)" />
        <rect x="16" y="20" width="16" height="12" rx="2" fill="white" opacity="0.9" />
        <circle cx="20" cy="26" r="2" fill="oklch(0.3 0.05 240)" />
        <circle cx="28" cy="26" r="2" fill="oklch(0.3 0.05 240)" />
        <path d="M20 30 L28 30" stroke="oklch(0.3 0.05 240)" strokeWidth="2" strokeLinecap="round" />
        <rect x="22" y="8" width="4" height="12" fill="url(#surgeryGradient)" />
        <rect x="20" y="6" width="8" height="2" fill="url(#surgeryGradient)" />
      </svg>
    </div>
  )
}
