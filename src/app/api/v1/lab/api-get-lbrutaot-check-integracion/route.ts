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
    const fk_lbrutas = searchParams.get('fk_lbrutas[]')

    console.log('=== GET LBRUTAOT CHECK INTEGRACION ===')
    console.log('fk_lbrutas:', fk_lbrutas)

    if (!fk_lbrutas) {
      return NextResponse.json({ data: [] }, { headers: corsHeaders(origin) })
    }

    const agendaId = parseInt(fk_lbrutas)

    // Buscar órdenes de trabajo asociadas a la agenda
    const ordenesTrabajo = await prisma.ordenTrabajo.findMany({
      where: {
        agendaId: agendaId
      },
      include: {
        tipoOT: true,
        estadoOT: true,
        user: true
      }
    })

    console.log(`Found ${ordenesTrabajo.length} OTs for agenda ${agendaId}`)

    // Si no hay datos, devolver mockup
    if (ordenesTrabajo.length === 0) {
      console.log('No data found, returning mockup')
      const mockupData = [
        {
          CLAVE: '1',
          NUMERO_OT: 'OT-2024-001',
          ESTADO: 'En Proceso',
          TIPO_OT: 'Densidad',
          FECHA_CREACION: new Date(),
          LABORATORISTA: 'App Pruebas',
          FK_LBRUTAS: agendaId
        }
      ]
      return NextResponse.json({ data: mockupData }, { headers: corsHeaders(origin) })
    }

    // Transformar datos reales
    const resultados = ordenesTrabajo.map(ot => ({
      CLAVE: ot.id,
      NUMERO_OT: ot.numeroOT,
      ESTADO: ot.estadoOT?.nombre || 'Pendiente',
      TIPO_OT: ot.tipoOT?.nombre || '',
      FECHA_CREACION: ot.createdAt,
      LABORATORISTA: ot.user?.name || '',
      FK_LBRUTAS: ot.agendaId
    }))

    return NextResponse.json({ data: resultados }, { headers: corsHeaders(origin) })
  } catch (error) {
    console.error('Error en api-get-lbrutaot-check-integracion:', error)
    return NextResponse.json({ error: 'Error al obtener datos' }, { status: 500, headers: corsHeaders(request.headers.get('origin')) })
  }
}
