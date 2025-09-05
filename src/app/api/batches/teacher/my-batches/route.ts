import { NextRequest, NextResponse } from 'next/server'

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000'

export async function GET(request: NextRequest) {
  try {
    const authorization = request.headers.get('authorization')

    const response = await fetch(`${API_BASE_URL}/api/batches/teacher/my-batches`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': authorization || ''
      }
    })

    const data = await response.json()
    
    return NextResponse.json(data, { status: response.status })
  } catch (error) {
    console.error('API Error:', error)
    return NextResponse.json(
      { success: false, message: 'Internal server error' },
      { status: 500 }
    )
  }
}
