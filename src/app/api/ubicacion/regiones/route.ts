import { NextResponse } from 'next/server'

import prisma from '@/libs/prisma'

export async function GET() {
  try {
    const regiones = await prisma.region.findMany({
      select: {
        id: true,
        codigo: true,
        nombre: true
      },
      orderBy: {
        nombre: 'asc'
      }
    })

    return NextResponse.json(regiones)
  } catch (error) {
    console.error('Error al obtener regiones:', error)

    return NextResponse.json({ error: 'Error al obtener regiones' }, { status: 500 })
  }
}
