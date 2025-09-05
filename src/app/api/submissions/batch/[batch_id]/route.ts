import { NextRequest, NextResponse } from 'next/server'

/**
 * GET /api/submissions/batch/[batch_id]
 * Proxy to backend batch submissions endpoint
 * Retrieves all submissions for a specific batch
 */
export async function GET(
  request: NextRequest,
  context: { params: Promise<{ batch_id: string }> }
) {
  try {
    const { batch_id } = await context.params
    const authHeader = request.headers.get('authorization')

    if (!authHeader) {
      return NextResponse.json(
        { success: false, message: 'Authorization header required' },
        { status: 401 }
      )
    }

    // Forward request to backend
    const backendUrl = process.env.BACKEND_URL || 'http://localhost:5000'
    const response = await fetch(`${backendUrl}/api/submissions/batch/${batch_id}`, {
      method: 'GET',
      headers: {
        'Authorization': authHeader
      }
    })

    const data = await response.json()
    
    return NextResponse.json(data, { status: response.status })

  } catch (error) {
    console.error('Error proxying batch submissions:', error)
    return NextResponse.json(
      { success: false, message: 'Internal server error' },
      { status: 500 }
    )
  }
}
