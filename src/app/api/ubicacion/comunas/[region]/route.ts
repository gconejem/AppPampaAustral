import { NextResponse } from 'next/server'

import prisma from '@/lib/prisma'

export async function GET(request: Request, { params }: { params: { region: string } }) {
  try {
    // Primero obtenemos el código de la región
    const regionData = await prisma.region.findFirst({
      where: {
        nombre: params.region
      },
      select: {
        codigo: true
      }
    })

    if (!regionData) {
      return NextResponse.json({ error: 'Región no encontrada' }, { status: 404 })
    }

    // Luego obtenemos las comunas usando el código
    const comunas = await prisma.comuna.findMany({
      where: {
        codigo: {
          startsWith: regionData.codigo
        }
      },
      orderBy: {
        nombre: 'asc'
      }
    })

    console.log(`Comunas encontradas para región ${regionData.codigo}: ${comunas.length}`)

    return NextResponse.json(comunas)
  } catch (error) {
    console.error('Error al obtener comunas:', error)

    return NextResponse.json({ error: 'Error al obtener comunas' }, { status: 500 })
  }
}
