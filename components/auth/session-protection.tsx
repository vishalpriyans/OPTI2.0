"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"

interface SessionProtectionProps {
  children: React.ReactNode
  requiredRole: "admin" | "doctor"
  redirectTo: string
}

export function SessionProtection({ children, requiredRole, redirectTo }: SessionProtectionProps) {
  const [isAuthenticated, setIsAuthenticated] = useState(false)
  const [isLoading, setIsLoading] = useState(true)
  const router = useRouter()

  useEffect(() => {
    const checkSession = async () => {
      try {
        const response = await fetch("/api/auth/check-session")
        const data = await response.json()

        if (data.authenticated && data.role === requiredRole) {
          setIsAuthenticated(true)
        } else {
          router.push(redirectTo)
        }
      } catch (error) {
        router.push(redirectTo)
      } finally {
        setIsLoading(false)
      }
    }

    checkSession()
  }, [requiredRole, redirectTo, router])

  if (isLoading) {
    return (
      <div style={{
        minHeight: "100vh",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        background: "linear-gradient(135deg, #20B2AA 0%, #1a9b96 100%)",
        color: "white",
        fontSize: "1.2rem"
      }}>
        Loading...
      </div>
    )
  }

  if (!isAuthenticated) {
    return null
  }

  return <>{children}</>
}

