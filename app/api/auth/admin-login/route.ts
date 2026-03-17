import { NextRequest, NextResponse } from 'next/server'

// Mock admin credentials (in production, this would check a database)
const ADMIN_CREDENTIALS = {
  email: 'admin@optiqueue.com',
  username: 'admin',
  password: 'admin123'
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { email, username, password } = body

    // PROTOTYPE MODE: Accept any credentials for hackathon demo
    // Just check that fields are not empty
    if (email || username) {
      const userEmail = email || username || 'admin@optiqueue.com'
      
      // Create session token (in production, use JWT or session management)
      const sessionToken = Buffer.from(JSON.stringify({
        role: 'admin',
        email: userEmail,
        timestamp: Date.now()
      })).toString('base64')

      const response = NextResponse.json({
        success: true,
        message: 'Admin login successful',
        user: {
          role: 'admin',
          email: userEmail
        }
      })

      // Set session cookie and clear any existing doctor session
      response.cookies.set('admin_session', sessionToken, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'lax',
        path: '/',
        maxAge: 60 * 60 * 24 // 24 hours
      })
      response.cookies.delete('doctor_session')

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

