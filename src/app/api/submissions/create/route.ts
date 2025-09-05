import { NextRequest, NextResponse } from 'next/server'

/**
 * POST /api/submissions/create
 * Proxy to backend submission creation endpoint
 * Handles student submission posting with content and optional file
 */
export async function POST(request: NextRequest) {
  try {
    const authHeader = request.headers.get('authorization')

    if (!authHeader) {
      return NextResponse.json(
        { success: false, message: 'Authorization header required' },
        { status: 401 }
      )
    }

    // Get the content type to determine how to handle the request
    const contentType = request.headers.get('content-type') || ''
    
    let body: FormData | Record<string, unknown>
    const headers: Record<string, string> = {
      'Authorization': authHeader
    }

    if (contentType.includes('multipart/form-data')) {
      // Handle FormData (file upload)
      body = await request.formData()
      // Don't set Content-Type for FormData - let fetch set it with boundary
    } else {
      // Handle JSON data
      body = await request.json()
      headers['Content-Type'] = 'application/json'
    }

    // Forward request to backend
    const backendUrl = process.env.BACKEND_URL || 'http://localhost:5000'
    const response = await fetch(`${backendUrl}/api/submissions/create`, {
      method: 'POST',
      headers,
      body: contentType.includes('multipart/form-data') ? body as FormData : JSON.stringify(body as Record<string, unknown>)
    })

    const data = await response.json()
    
    return NextResponse.json(data, { status: response.status })

  } catch (error) {
    console.error('Error proxying submission creation:', error)
    return NextResponse.json(
      { success: false, message: 'Internal server error' },
      { status: 500 }
    )
  }
}
