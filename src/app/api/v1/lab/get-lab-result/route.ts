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
    const obra = searchParams.get('obra[]')
    const sortColumn = searchParams.get('sortColumn') || 'FECHA'
    const sortDirection = searchParams.get('sortDirection') || 'DESC'

    // Por ahora devolvemos un array vacío hasta que se defina la estructura de datos
    // Este endpoint debería consultar resultados de laboratorio previos
    const resultados: any[] = []

    return NextResponse.json({ data: resultados }, { headers: corsHeaders() })
  } catch (error) {
    console.error('Error en get-lab-result:', error)
    return NextResponse.json({ error: 'Error al obtener resultados' }, { status: 500, headers: corsHeaders() })
  }
}
