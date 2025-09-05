import { NextRequest, NextResponse } from 'next/server'

/**
 * PUT /api/submissions/[submission_id]/status
 * Proxy to backend submission status update endpoint
 * Allows teachers to accept or reject submissions
 */
export async function PUT(
  request: NextRequest,
  context: { params: Promise<{ submission_id: string }> }
) {
  try {
    const { submission_id } = await context.params
    const body = await request.json()
    const authHeader = request.headers.get('authorization')

    if (!authHeader) {
      return NextResponse.json(
        { success: false, message: 'Authorization header required' },
        { status: 401 }
      )
    }

    // Forward request to backend
    const backendUrl = process.env.BACKEND_URL || 'http://localhost:5000'
    const response = await fetch(`${backendUrl}/api/submissions/${submission_id}/status`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': authHeader
      },
      body: JSON.stringify(body)
    })

    const data = await response.json()
    
    return NextResponse.json(data, { status: response.status })

  } catch (error) {
    console.error('Error proxying submission status update:', error)
    return NextResponse.json(
      { success: false, message: 'Internal server error' },
      { status: 500 }
    )
  }
}
