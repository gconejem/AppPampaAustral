import { NextResponse } from 'next/server'

import prisma from '@/libs/prisma'

export async function GET(req: Request, { params }: { params: { id: string } }) {
  try {
    const comunas = await prisma.comuna.findMany({
      where: {
        regionId: parseInt(params.id)
      },
      orderBy: {
        nombre: 'asc'
      }
    })

    return NextResponse.json(comunas)
  } catch (error) {
    console.error('Error al obtener comunas:', error)

    return NextResponse.json({ error: 'Error al obtener comunas' }, { status: 500 })
  }
}
