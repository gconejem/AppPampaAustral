import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export const dynamic = 'force-dynamic'
export const revalidate = 0

function corsHeaders() {
  return {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization'
  }
}

export async function OPTIONS() {
  return NextResponse.json({}, { headers: corsHeaders() })
}

export async function GET(request: Request) {
  try {
    // Return empty data structure expected by mobile app
    // This is a placeholder for document versioning endpoint
    return NextResponse.json(
      { data: [] },
      { headers: corsHeaders(), status: 200 }
    )
  } catch (error: any) {
    console.error('Error en api-get-lbdocver:', error)
    return NextResponse.json(
      { error: error?.message ?? 'unknown' },
      { status: 500, headers: corsHeaders() }
    )
  }
}
