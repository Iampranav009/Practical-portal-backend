import { NextRequest, NextResponse } from 'next/server'

/**
 * GET /api/submissions/explore
 * Proxy to backend explore submissions endpoint
 * Retrieves accepted submissions across all batches for public explore feed
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const batchName = searchParams.get('batchName')

    // Build query string
    const queryString = batchName ? `?batchName=${encodeURIComponent(batchName)}` : ''

    // Forward request to backend
    const backendUrl = process.env.BACKEND_URL || 'http://localhost:5000'
    const response = await fetch(`${backendUrl}/api/submissions/explore${queryString}`, {
      method: 'GET'
    })

    const data = await response.json()
    
    return NextResponse.json(data, { status: response.status })

  } catch (error) {
    console.error('Error proxying explore submissions:', error)
    return NextResponse.json(
      { success: false, message: 'Internal server error' },
      { status: 500 }
    )
  }
}
