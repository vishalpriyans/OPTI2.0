import { NextRequest, NextResponse } from 'next/server'

export async function GET(request: NextRequest) {
  const adminSession = request.cookies.get('admin_session')
  const doctorSession = request.cookies.get('doctor_session')

  if (adminSession) {
    try {
      const sessionData = JSON.parse(Buffer.from(adminSession.value, 'base64').toString())
      return NextResponse.json({
        authenticated: true,
        role: 'admin',
        user: sessionData
      })
    } catch {
      return NextResponse.json({ authenticated: false })
    }
  }

  if (doctorSession) {
    try {
      const sessionData = JSON.parse(Buffer.from(doctorSession.value, 'base64').toString())
      return NextResponse.json({
        authenticated: true,
        role: 'doctor',
        user: sessionData
      })
    } catch {
      return NextResponse.json({ authenticated: false })
    }
  }

  return NextResponse.json({ authenticated: false })
}

