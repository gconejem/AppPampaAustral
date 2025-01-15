import { NextResponse } from 'next/server'

import prisma from '@/lib/prisma'

export async function GET(request: Request, { params }: { params: { id: string } }) {
  try {
    const comunas = await prisma.comuna.findMany({
      where: {
        codigo: {
          startsWith: params.id
        }
      },
      orderBy: {
        nombre: 'asc'
      }
    })

    console.log(`Comunas encontradas para región ${params.id}: ${comunas.length}`)

    return NextResponse.json(comunas)
  } catch (error) {
    console.error('Error al obtener comunas:', error)

    return NextResponse.json({ error: 'Error al obtener comunas' }, { status: 500 })
  }
}
