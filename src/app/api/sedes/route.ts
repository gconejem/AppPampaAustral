import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export const dynamic = 'force-dynamic'
export const revalidate = 0

export async function GET() {
  try {
    const rows = await prisma.rCM.findMany({
      where: {
        sede: { not: null }
      },
      distinct: ['sede'],
      select: {
        sede: true
      }
    })

    const sedes = rows
      .map(r => String(r?.sede ?? '').trim())
      .filter(Boolean)
      .sort((a, b) => a.localeCompare(b, 'es', { sensitivity: 'base' }))

    return NextResponse.json(sedes)
  } catch (error) {
    console.error('Error al obtener sedes:', error)
    return NextResponse.json({ error: 'Error al obtener sedes' }, { status: 500 })
  }
}
