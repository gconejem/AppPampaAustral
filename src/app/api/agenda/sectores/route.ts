import { NextResponse } from 'next/server'

import { prisma } from '@/lib/prisma'

export const dynamic = 'force-dynamic'
export const revalidate = 0

export async function GET() {
  try {
    // Obtener sectores comerciales únicos de los eventos
    const sectores = await prisma.agenda.findMany({
      select: {
        sectorComercial: true
      },
      where: {
        sectorComercial: {
          not: null
        }
      },
      distinct: ['sectorComercial']
    })

    // Extraer los sectores y filtrar los valores nulos
    const sectoresUnicos = sectores
      .map(s => s.sectorComercial)
      .filter((sector): sector is string => sector !== null)
      .sort()

    return NextResponse.json(sectoresUnicos)
  } catch (error) {
    console.error('Error al obtener sectores comerciales:', error)

    return NextResponse.json({ error: 'Error al obtener sectores comerciales' }, { status: 500 })
  }
}
