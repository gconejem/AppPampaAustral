import { NextResponse } from 'next/server'

import { LAB_FORMULARIOS } from '@/lib/lab-formularios'

export const dynamic = 'force-dynamic'
export const revalidate = 0

const ALLOWED_ORIGINS = new Set([
  'http://localhost:8080',
  'http://localhost:3000',
  'http://localhost:5173',
  'https://localhost'
])

function corsHeaders(origin?: string | null) {
  const allowedOrigin = origin && ALLOWED_ORIGINS.has(origin) ? origin : null
  return {
    ...(allowedOrigin ? { 'Access-Control-Allow-Origin': allowedOrigin } : {}),
    'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    'Access-Control-Allow-Credentials': 'true'
  }
}

export async function OPTIONS(request: Request) {
  return NextResponse.json({}, { headers: corsHeaders(request.headers.get('origin')) })
}

export async function GET(request: Request) {
  try {
    const origin = request.headers.get('origin')
    return NextResponse.json({ data: LAB_FORMULARIOS }, { headers: corsHeaders(origin) })
  } catch (error) {
    console.error('Error en api-get-lbdocver:', error)
    return NextResponse.json(
      { error: 'Error al obtener formularios' },
      { status: 500, headers: corsHeaders(request.headers.get('origin')) }
    )
  }
}
