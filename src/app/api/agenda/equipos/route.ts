import { NextResponse } from 'next/server'

import { prisma } from '@/lib/prisma'

export async function GET() {
  try {
    const equipos = await prisma.equipo.findMany({
      where: {
        estado: true
      },
      orderBy: {
        codigo: 'asc'
      }
    })

    return NextResponse.json(equipos)
  } catch (error) {
    console.error('Error al obtener equipos:', error)

    return NextResponse.json({ error: 'Error al obtener los equipos' }, { status: 500 })
  }
}
