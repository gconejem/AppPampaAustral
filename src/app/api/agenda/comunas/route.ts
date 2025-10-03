import { NextResponse } from 'next/server'

import { prisma } from '@/lib/prisma'

export const dynamic = 'force-dynamic'
export const revalidate = 0

export async function GET() {
  try {
    // Obtener comunas únicas de los eventos
    const comunas = await prisma.agenda.findMany({
      select: {
        comuna: true
      },
      where: {
        comuna: {
          not: null
        }
      },
      distinct: ['comuna']
    })

    // Extraer las comunas y filtrar los valores nulos
    const comunasUnicas = comunas
      .map(c => c.comuna)
      .filter((comuna): comuna is string => comuna !== null)
      .sort()

    return NextResponse.json(comunasUnicas)
  } catch (error) {
    console.error('Error al obtener comunas:', error)

    return NextResponse.json({ error: 'Error al obtener comunas' }, { status: 500 })
  }
}
