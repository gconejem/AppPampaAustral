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
    const codigo = searchParams.get('codigo[]')

    process.stdout.write('\n====================================================\n')
    process.stdout.write('=== GET LAB LBOTMAE - ENDPOINT CALLED ===\n')
    process.stdout.write(`codigo: ${codigo}\n`)
    process.stdout.write('====================================================\n')

    // Si no hay código o está vacío, devolver array vacío
    if (!codigo || codigo.trim() === '') {
      process.stdout.write('⚠️ No codigo parameter or empty, returning empty array\n')
      return NextResponse.json({ data: [] }, { headers: corsHeaders(origin) })
    }

    // Buscar órdenes de trabajo por código
    const codigos = codigo.split(',').map(c => c.trim()).filter(c => c.length > 0)
    process.stdout.write(`🔍 Buscando órdenes por códigos (clave): ${codigos.join(', ')}\n`)
    
    const ordenesTrabajo = await prisma.ordenTrabajo.findMany({
      where: {
        clave: {
          in: codigos
        }
      },
      include: {
        tipoOT: true,
        estadoOT: true
      }
    })

    process.stdout.write(`✅ Found ${ordenesTrabajo.length} ordenes for codigos: ${codigos.join(', ')}\n`)

    if (ordenesTrabajo.length > 0) {
      process.stdout.write('\n📦 ÓRDENES ENCONTRADAS:\n')
      ordenesTrabajo.forEach((ot, idx) => {
        process.stdout.write(`  [${idx + 1}] clave: ${ot.clave}, tipo: ${ot.tipoOT?.nombre || 'N/A'}, estado: ${ot.estadoOT?.nombre || 'N/A'}\n`)
      })
    }

    // Si no hay datos, devolver mockup
    if (ordenesTrabajo.length === 0) {
      process.stdout.write('⚠️ No ordenes found, returning mockup\n')
      const mockupData = codigos.map((cod, idx) => ({
        CODIGO: cod,
        NUMERO_OT: cod,
        ESTADO: 'Pendiente',
        TIPO: 'Laboratorio',
        FECHA_CREACION: new Date(),
        OBSERVACION: 'Orden de trabajo mockup'
      }))
      return NextResponse.json({ data: mockupData }, { headers: corsHeaders(origin) })
    }

    // Transformar datos reales
    const resultados = ordenesTrabajo.map(ot => ({
      CODIGO: ot.clave,
      NUMERO_OT: ot.clave,
      ESTADO: ot.estadoOT?.nombre || 'Pendiente',
      TIPO: ot.tipoOT?.nombre || '',
      FECHA_CREACION: ot.createdAt,
      OBSERVACION: ''
    }))

    process.stdout.write(`\n📊 Returning ${resultados.length} resultados\n`)
    if (resultados.length > 0) {
      process.stdout.write('📄 First resultado sample:\n')
      process.stdout.write(JSON.stringify(resultados[0], null, 2) + '\n')
    }

    return NextResponse.json({ data: resultados }, { headers: corsHeaders(origin) })
  } catch (error) {
    process.stdout.write('❌ Error en api-get-lab-lbotmae:\n')
    process.stdout.write(String(error) + '\n')
    console.error('❌ Error en api-get-lab-lbotmae:', error)
    return NextResponse.json({ error: 'Error al obtener datos' }, { status: 500, headers: corsHeaders(request.headers.get('origin')) })
  }
}
