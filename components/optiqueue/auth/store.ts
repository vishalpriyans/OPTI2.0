"use client"

import useSWR from "swr"
import { useRouter } from "next/navigation"
import type { User, UserRole } from "../doctor/types"

const AUTH_KEY = "optiqueue/auth"
const AUTH_TOKEN_KEY = "optiqueue/auth-token"

// Sample users for demo (in production, this would come from a database)
export const SAMPLE_USERS: Array<{
  email: string
  password: string
  user: User
}> = [
  {
    email: "admin@optiqueue.com",
    password: "admin123",
    user: {
      id: "admin-1",
      name: "Administrator",
      role: "Administrator",
    },
  },
  {
    email: "rajesh@optiqueue.com",
    password: "doctor123",
    user: {
      id: "doctor-1",
      name: "Dr. Rajesh Kumar",
      role: "Doctor",
      surgeonId: "Dr. Rajesh Kumar",
    },
  },
  {
    email: "priya@optiqueue.com",
    password: "doctor123",
    user: {
      id: "doctor-2",
      name: "Dr. Priya Sharma",
      role: "Doctor",
      surgeonId: "Dr. Priya Sharma",
    },
  },
  {
    email: "anil@optiqueue.com",
    password: "doctor123",
    user: {
      id: "doctor-3",
      name: "Dr. Anil Mehta",
      role: "Doctor",
      surgeonId: "Dr. Anil Mehta",
    },
  },
  {
    email: "sunita@optiqueue.com",
    password: "doctor123",
    user: {
      id: "doctor-4",
      name: "Dr. Sunita Reddy",
      role: "Doctor",
      surgeonId: "Dr. Sunita Reddy",
    },
  },
]

export function useAuth() {
  const { data, mutate } = useSWR<{ user: User; token: string } | null>(
    AUTH_KEY,
    async () => {
      if (typeof window === "undefined") return null
      
      let token = localStorage.getItem(AUTH_TOKEN_KEY)
      
      // Auto-login with default Administrator user if no token exists
      if (!token) {
        const defaultUser = SAMPLE_USERS.find(u => u.user.role === "Administrator")
        if (defaultUser) {
          const authToken = btoa(JSON.stringify({ user: defaultUser.user, timestamp: Date.now() }))
          const tokenData = JSON.stringify({ user: defaultUser.user, token: authToken })
          localStorage.setItem(AUTH_TOKEN_KEY, tokenData)
          token = tokenData
        } else {
          return null
        }
      }
      
      if (!token) return null
      
      // In production, validate token with backend
      // For now, get user from token (stored as JSON)
      try {
        const userData = JSON.parse(token)
        return { user: userData.user, token: userData.token || token }
      } catch {
        return null
      }
    },
    {
      revalidateOnFocus: false,
    }
  )

  const router = useRouter()

  const login = async (email: string, password: string) => {
    // Find user by email and password
    const userData = SAMPLE_USERS.find(
      (u) => u.email === email && u.password === password
    )

    if (!userData) {
      throw new Error("Invalid email or password")
    }

    // Create token (in production, this would come from backend)
    const token = btoa(JSON.stringify({ user: userData.user, timestamp: Date.now() }))
    localStorage.setItem(AUTH_TOKEN_KEY, JSON.stringify({ user: userData.user, token }))
    
    await mutate({ user: userData.user, token })
    return userData.user
  }

  const logout = async () => {
    localStorage.removeItem(AUTH_TOKEN_KEY)
    await mutate(null)
    router.push("/")
  }

  return {
    user: data?.user || null,
    isAuthenticated: !!data?.user,
    login,
    logout,
    isLoading: !data && typeof window !== "undefined",
  }
}

