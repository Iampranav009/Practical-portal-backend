import { NextRequest, NextResponse } from 'next/server'

/**
 * GET /api/submissions/my-submissions
 * Proxy to backend student submissions history endpoint
 * Retrieves all submissions for the authenticated student
 */
export async function GET(request: NextRequest) {
  try {
    const authHeader = request.headers.get('authorization')

    if (!authHeader) {
      return NextResponse.json(
        { success: false, message: 'Authorization header required' },
        { status: 401 }
      )
    }

    // Forward request to backend
    const backendUrl = process.env.BACKEND_URL || 'http://localhost:5000'
    const response = await fetch(`${backendUrl}/api/submissions/my-submissions`, {
      method: 'GET',
      headers: {
        'Authorization': authHeader
      }
    })

    const data = await response.json()
    
    return NextResponse.json(data, { status: response.status })

  } catch (error) {
    console.error('Error proxying student submissions:', error)
    return NextResponse.json(
      { success: false, message: 'Internal server error' },
      { status: 500 }
    )
  }
}
