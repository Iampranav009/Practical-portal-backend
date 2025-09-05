import { NextRequest, NextResponse } from 'next/server'

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000'

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ batch_id: string }> }
) {
  try {
    const authorization = request.headers.get('authorization')
    const { batch_id } = await params

    const response = await fetch(`${API_BASE_URL}/api/batches/${batch_id}`, {
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

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ batch_id: string }> }
) {
  try {
    const authorization = request.headers.get('authorization')
    const { batch_id } = await params
    const body = await request.json()

    const response = await fetch(`${API_BASE_URL}/api/batches/edit/${batch_id}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': authorization || ''
      },
      body: JSON.stringify(body)
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

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ batch_id: string }> }
) {
  try {
    const authorization = request.headers.get('authorization')
    const { batch_id } = await params

    const response = await fetch(`${API_BASE_URL}/api/batches/delete/${batch_id}`, {
      method: 'DELETE',
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
