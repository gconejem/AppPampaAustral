import { NextResponse } from 'next/server'

import { prisma } from '@/lib/prisma'

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
    const { searchParams } = new URL(request.url)
    const obra = searchParams.get('obra[]')
    const sortColumn = searchParams.get('sortColumn') || 'FECHA'
    const sortDirection = searchParams.get('sortDirection') || 'DESC'
    const requestedRows = Number(searchParams.get('rowsPerPage'))
    const take = Number.isInteger(requestedRows) && requestedRows > 0 ? Math.min(requestedRows, 999) : 100

    process.stdout.write('\n====================================================\n')
    process.stdout.write('=== GET LAB RESULTS - ENDPOINT CALLED ===\n')
    process.stdout.write(`obra: ${obra}\n`)
    process.stdout.write(`sortColumn: ${sortColumn}\n`)
    process.stdout.write(`sortDirection: ${sortDirection}\n`)
    process.stdout.write('====================================================\n')

    if (!obra) {
      process.stdout.write('⚠️ No obra parameter, returning empty array\n')

      return NextResponse.json({ data: [] }, { headers: corsHeaders(origin) })
    }

    // Buscar referencias históricas de densidad asociadas directamente a la obra
    process.stdout.write(`🔍 Buscando referencias de densidad para obra: ${obra}\n`)

    const obraRegistro = await prisma.obra.findFirst({
      where: {
        numeroObra: obra
      },
      select: { obraId: true }
    })

    if (!obraRegistro) {
      return NextResponse.json({ data: [] }, { headers: corsHeaders(origin) })
    }

    const referenciasAnuladas = await prisma.referenciaLbotmae.findMany({
      where: {
        obraId: obraRegistro.obraId,
        estado: 'F'
      },
      select: { codigo: true }
    })

    const referencias = await prisma.referenciaDensidad.findMany({
      where: {
        obraId: obraRegistro.obraId,
        ...(referenciasAnuladas.length > 0 ? { codigo: { notIn: referenciasAnuladas.map(referencia => referencia.codigo) } } : {})
      },
      orderBy: [{ fecha: sortDirection === 'DESC' ? 'desc' : 'asc' }, { codigo: 'asc' }],
      take
    })

    process.stdout.write(`✅ Found ${referencias.length} referencias de densidad para obra ${obra}\n`)

    const resultados = referencias.map(referencia => ({
      CODIGO: referencia.codigo,
      FECHA: referencia.fecha,
      FECHATXT: '', // Se formatea en el frontend con moment
      ITEMM: referencia.item || '',
      PROCEDE: referencia.procedencia || '',
      UBICA: referencia.ubicacion || '',
      PROCTOR: referencia.proctor ?? 0,
      HUMEDAD1: referencia.humedad ?? 0,
      DEN_MIN: referencia.densidadMin ?? 0,
      DEN_MAX: referencia.densidadMax ?? 0
    }))

    process.stdout.write(`📊 Returning ${resultados.length} results\n`)

    return NextResponse.json({ data: resultados }, { headers: corsHeaders(origin) })
  } catch (error) {
    process.stdout.write('❌ Error en get-lab-result:\n')
    process.stdout.write(String(error) + '\n')
    console.error('❌ Error en get-lab-result:', error)

    return NextResponse.json({ error: 'Error al obtener resultados' }, { status: 500, headers: corsHeaders(request.headers.get('origin')) })
  }
}
