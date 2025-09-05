import { NextRequest, NextResponse } from 'next/server'

/**
 * GET /api/submissions/[submission_id]
 * Proxy to backend individual submission endpoint
 * Retrieves a specific submission by ID for editing
 */
export async function GET(
  request: NextRequest,
  context: { params: Promise<{ submission_id: string }> }
) {
  try {
    const { submission_id } = await context.params
    const authHeader = request.headers.get('authorization')

    if (!authHeader) {
      return NextResponse.json(
        { success: false, message: 'Authorization header required' },
        { status: 401 }
      )
    }

    // Forward request to backend
    const backendUrl = process.env.BACKEND_URL || 'http://localhost:5000'
    const response = await fetch(`${backendUrl}/api/submissions/${submission_id}`, {
      method: 'GET',
      headers: {
        'Authorization': authHeader
      }
    })

    const data = await response.json()
    
    return NextResponse.json(data, { status: response.status })

  } catch (error) {
    console.error('Error proxying individual submission:', error)
    return NextResponse.json(
      { success: false, message: 'Internal server error' },
      { status: 500 }
    )
  }
}

/**
 * PUT /api/submissions/[submission_id]
 * Proxy to backend submission update endpoint
 * Allows students to update their submissions
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
    const response = await fetch(`${backendUrl}/api/submissions/${submission_id}/edit`, {
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
    console.error('Error proxying submission update:', error)
    return NextResponse.json(
      { success: false, message: 'Internal server error' },
      { status: 500 }
    )
  }
}

/**
 * DELETE /api/submissions/[submission_id]
 * Proxy to backend submission deletion endpoint
 * Allows students to delete their submissions
 */
export async function DELETE(
  request: NextRequest,
  context: { params: Promise<{ submission_id: string }> }
) {
  try {
    const { submission_id } = await context.params
    const authHeader = request.headers.get('authorization')

    if (!authHeader) {
      return NextResponse.json(
        { success: false, message: 'Authorization header required' },
        { status: 401 }
      )
    }

    // Forward request to backend
    const backendUrl = process.env.BACKEND_URL || 'http://localhost:5000'
    const response = await fetch(`${backendUrl}/api/submissions/${submission_id}`, {
      method: 'DELETE',
      headers: {
        'Authorization': authHeader
      }
    })

    const data = await response.json()
    
    return NextResponse.json(data, { status: response.status })

  } catch (error) {
    console.error('Error proxying submission deletion:', error)
    return NextResponse.json(
      { success: false, message: 'Internal server error' },
      { status: 500 }
    )
  }
}
