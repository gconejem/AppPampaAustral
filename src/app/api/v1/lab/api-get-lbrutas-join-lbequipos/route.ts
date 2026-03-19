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

function parseAgendaIds(searchParams: URLSearchParams): number[] {
  const out: number[] = []

  const pushParsed = (value: string | null) => {
    if (!value) return
    value
      .split(',')
      .map(v => v.trim())
      .filter(v => v.length > 0)
      .forEach(v => {
        const n = Number(v)

        if (!Number.isNaN(n)) out.push(n)
      })
  }

  // Compatibilidad con otros endpoints
  searchParams.getAll('fk_lbrutas[]').forEach(v => pushParsed(v))
  pushParsed(searchParams.get('fk_lbrutas[]'))

  // Compatibilidad AppLab (usa clave[])
  searchParams.getAll('clave[]').forEach(v => pushParsed(v))
  pushParsed(searchParams.get('clave[]'))

  // Aliases comunes
  searchParams.getAll('lbrutas_clave').forEach(v => pushParsed(v))
  searchParams.getAll('CLAVE').forEach(v => pushParsed(v))
  pushParsed(searchParams.get('lbrutas_clave'))
  pushParsed(searchParams.get('CLAVE'))
  pushParsed(searchParams.get('clave'))

  // Unique
  return Array.from(new Set(out))
}

export async function GET(request: Request) {
  try {
    const origin = request.headers.get('origin')
    const { searchParams } = new URL(request.url)

    const agendaIds = parseAgendaIds(searchParams)
    const codigo = (searchParams.get('codigo') || searchParams.get('CODIGO') || '').trim()
    const limit = Math.min(Number(searchParams.get('limit') ?? 500), 2000)

    const where: any = {}

    if (agendaIds.length > 0) {
      where.agendaId = { in: agendaIds }
    }

    if (codigo) {
      where.equipo = {
        codigo: {
          contains: codigo,
          mode: 'insensitive'
        }
      }
    }

    const rows = await prisma.agendaEquipo.findMany({
      where,
      include: {
        equipo: true
      },
      take: limit,
      orderBy: [{ agendaId: 'asc' }, { equipoId: 'asc' }]
    })

    const mapped = rows.map(r => ({
      // En el mundo AppLab, LBRUTAS.CLAVE es la "clave" de la visita.
      // En nuestra homologación, corresponde al Agenda.id.
      lbrutas_clave: r.agendaId,
      CODIGO: r.equipo?.codigo ?? null,
      NOMBRE: r.equipo?.nombre ?? null,
      SERIE: r.equipo?.serie ?? null,
      MARCA: r.equipo?.marca ?? null,
      MODELO: r.equipo?.modelo ?? null
    }))

    return NextResponse.json({ data: mapped }, { headers: corsHeaders(origin) })
  } catch (error: any) {
    console.error('Error en api-get-lbrutas-join-lbequipos:', error)

    return NextResponse.json(
      { error: error?.message ?? 'unknown' },
      { status: 500, headers: corsHeaders(request.headers.get('origin')) }
    )
  }
}


