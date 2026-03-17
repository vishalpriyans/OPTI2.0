import { NextRequest, NextResponse } from 'next/server'

export async function POST(request: NextRequest) {
  const response = NextResponse.json({ success: true, message: 'Logged out successfully' })
  
  // Clear both session cookies
  response.cookies.delete('admin_session')
  response.cookies.delete('doctor_session')
  
  return response
}

