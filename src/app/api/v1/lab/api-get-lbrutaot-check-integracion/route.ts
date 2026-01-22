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
    const { searchParams } = new URL(request.url)
    const fk_lbrutas = searchParams.get('fk_lbrutas[]')

    // Por ahora devolvemos un array vacío
    // Este endpoint debería consultar OTs asociadas a visitas
    const resultados: any[] = []

    return NextResponse.json({ data: resultados }, { headers: corsHeaders() })
  } catch (error) {
    console.error('Error en api-get-lbrutaot-check-integracion:', error)
    return NextResponse.json({ error: 'Error al obtener datos' }, { status: 500, headers: corsHeaders() })
  }
}
