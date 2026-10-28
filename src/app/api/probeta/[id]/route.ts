import type { NextRequest } from 'next/server';
import { NextResponse } from 'next/server'

import { prisma } from '@/lib/prisma'

export const dynamic = 'force-dynamic'
export const revalidate = 0

const parseDate = (raw: unknown): Date | null => {
  if (!raw) return null

  const value = String(raw).trim()
  const dateOnly = value.match(/^(\d{4})-(\d{2})-(\d{2})$/)

  const date = dateOnly
    ? new Date(Date.UTC(Number(dateOnly[1]), Number(dateOnly[2]) - 1, Number(dateOnly[3]), 12))
    : new Date(value)

  return Number.isNaN(date.getTime()) ? null : date
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const probetaId = Number(params.id)

    if (!Number.isFinite(probetaId)) {
      return NextResponse.json({ error: 'ID inválido' }, { status: 400 })
    }

    const body = await request.json()
    const estado = body?.estado ? String(body.estado).trim().toUpperCase() : null
    const fechaInicioEnsayo = parseDate(body?.fechaInicioEnsayo)
    const fechaFinEnsayo = parseDate(body?.fechaFinEnsayo)

    if (!estado && !body?.fechaInicioEnsayo && !body?.fechaFinEnsayo) {
      return NextResponse.json({ error: 'Estado o fecha requerida' }, { status: 400 })
    }

    const probeta = await prisma.probeta.update({
      where: { id: probetaId },
      data: {
        ...(estado ? { estado } : {}),
        ...(fechaInicioEnsayo ? { fechaInicioEnsayo } : {}),
        ...(fechaFinEnsayo ? { fechaFinEnsayo } : {})
      },
      select: {
        id: true,
        estado: true,
        fechaInicioEnsayo: true,
        fechaFinEnsayo: true,
        updatedAt: true
      }
    })

    return NextResponse.json(probeta)
  } catch (error) {
    console.error('Error actualizando probeta:', error)

    return NextResponse.json(
      {
        error: 'Error al actualizar probeta',
        details: error instanceof Error ? error.message : String(error)
      },
      { status: 500 }
    )
  }
}
