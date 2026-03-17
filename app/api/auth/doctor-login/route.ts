import { NextRequest, NextResponse } from 'next/server'

// Mock doctor credentials (in production, this would check a database)
const DOCTOR_CREDENTIALS = [
  {
    email: 'doctor1@optiqueue.com',
    username: 'doctor1',
    password: 'doctor123',
    name: 'Dr. Rajesh Kumar'
  },
  {
    email: 'doctor2@optiqueue.com',
    username: 'doctor2',
    password: 'doctor123',
    name: 'Dr. Priya Sharma'
  }
]

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { email, username, password } = body

    // PROTOTYPE MODE: Accept any credentials for hackathon demo
    // Just check that fields are not empty
    if (email || username) {
      const userEmail = email || username || 'doctor@optiqueue.com'
      const userName = email || username || 'Dr. Demo Doctor'
      
      // Create session token (in production, use JWT or session management)
      const sessionToken = Buffer.from(JSON.stringify({
        role: 'doctor',
        email: userEmail,
        name: userName,
        timestamp: Date.now()
      })).toString('base64')

      const response = NextResponse.json({
        success: true,
        message: 'Doctor login successful',
        user: {
          role: 'doctor',
          email: userEmail,
          name: userName
        }
      })

      // Set session cookie and clear any existing admin session
      response.cookies.set('doctor_session', sessionToken, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'lax',
        path: '/',
        maxAge: 60 * 60 * 24 // 24 hours
      })
      response.cookies.delete('admin_session')

      return response
    } else {
      return NextResponse.json(
        { success: false, message: 'Please enter email or username' },
        { status: 401 }
      )
    }
  } catch (error) {
    return NextResponse.json(
      { success: false, message: 'Login failed' },
      { status: 500 }
    )
  }
}

