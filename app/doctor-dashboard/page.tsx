"use client"

import { Suspense } from "react"
import { SessionProtection } from "@/components/auth/session-protection"
import { DoctorDashboard } from "@/components/optiqueue/doctor/doctor-dashboard"
import { useRouter } from "next/navigation"
import { useState, useEffect } from "react"

function DoctorDashboardContent() {
  const router = useRouter()
  const [user, setUser] = useState<any>(null)

  useEffect(() => {
    const fetchUser = async () => {
      const response = await fetch("/api/auth/check-session")
      const data = await response.json()
      if (data.authenticated) {
        setUser(data.user)
      }
    }
    fetchUser()
  }, [])

  const handleLogout = async () => {
    await fetch("/api/auth/logout", { method: "POST" })
    router.push("/doctor-login")
  }

  return (
    <div style={{ position: "relative" }}>
      {/* Header with Logout */}
      <header style={{
        position: "fixed",
        top: 0,
        left: 0,
        right: 0,
        zIndex: 1000,
        background: "white",
        padding: "1rem 2rem",
        borderBottom: "1px solid #e0e0e0",
        display: "flex",
        justifyContent: "space-between",
        alignItems: "center",
        boxShadow: "0 2px 4px rgba(0,0,0,0.1)"
      }}>
        <div style={{ display: "flex", alignItems: "center", gap: "1rem" }}>
          <div style={{
            width: "40px",
            height: "40px",
            background: "linear-gradient(135deg, #20B2AA 0%, #1a9b96 100%)",
            borderRadius: "8px",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            color: "white",
            fontSize: "1.5rem",
            fontWeight: "bold"
          }}>
            ⚕
          </div>
          <div>
            <h1 style={{ margin: 0, fontSize: "1.5rem", fontWeight: "bold", color: "#1a1a1a" }}>
              OptiQueue Doctor Dashboard
            </h1>
            <p style={{ margin: 0, fontSize: "0.85rem", color: "#666", fontStyle: "italic" }}>
              Efficiency that Saves Lives
            </p>
          </div>
        </div>
        <div style={{ display: "flex", gap: "1rem", alignItems: "center" }}>
          {user && (
            <span style={{ color: "#666", fontSize: "0.9rem" }}>
              {user.name || user.email}
            </span>
          )}
          <button
            onClick={handleLogout}
            style={{
              padding: "0.5rem 1rem",
              background: "#dc2626",
              color: "white",
              border: "none",
              borderRadius: "6px",
              cursor: "pointer",
              fontSize: "0.9rem",
              fontWeight: "500",
              transition: "opacity 0.2s"
            }}
            onMouseOver={(e) => e.currentTarget.style.opacity = "0.9"}
            onMouseOut={(e) => e.currentTarget.style.opacity = "1"}
          >
            Logout
          </button>
        </div>
      </header>

      {/* Main Content with padding for fixed header */}
      <div style={{ paddingTop: "80px" }}>
        <Suspense fallback={
          <div className="flex items-center justify-center min-h-screen">
            <div className="text-muted-foreground">Loading Doctor Dashboard...</div>
          </div>
        }>
          <DoctorDashboard />
        </Suspense>
      </div>
    </div>
  )
}

export default function DoctorDashboardPage() {
  return (
    <SessionProtection requiredRole="doctor" redirectTo="/doctor-login">
      <DoctorDashboardContent />
    </SessionProtection>
  )
}

