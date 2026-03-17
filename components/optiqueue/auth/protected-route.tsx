"use client"

import { useEffect } from "react"
import { useRouter } from "next/navigation"
import { useAuth } from "./store"
import type { UserRole } from "../doctor/types"

export function ProtectedRoute({ 
  children, 
  allowedRoles 
}: { 
  children: React.ReactNode
  allowedRoles?: UserRole[]
}) {
  const { user, isAuthenticated, isLoading } = useAuth()
  const router = useRouter()

  useEffect(() => {
    if (!isLoading && isAuthenticated) {
      if (allowedRoles && user && !allowedRoles.includes(user.role)) {
        // Redirect to appropriate dashboard based on role
        if (user.role === "Doctor") {
          router.push("/doctor")
        } else {
          router.push("/")
        }
        return
      }
    }
  }, [isAuthenticated, isLoading, user, allowedRoles, router])

  if (isLoading || !isAuthenticated) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-muted-foreground">Loading...</div>
      </div>
    )
  }

  if (allowedRoles && user && !allowedRoles.includes(user.role)) {
    return null
  }

  return <>{children}</>
}

