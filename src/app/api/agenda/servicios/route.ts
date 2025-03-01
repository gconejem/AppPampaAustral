import { NextResponse } from 'next/server'

import { prisma } from '@/lib/prisma'

// GET - Obtener todos los servicios activos
export async function GET() {
  try {
    const servicios = await prisma.servicio.findMany({
      where: {
        estado: true
      },
      orderBy: {
        codigo: 'asc'
      }
    })

    return NextResponse.json(servicios)
  } catch (error) {
    console.error('Error al obtener servicios:', error)

    return NextResponse.json({ error: 'Error al obtener los servicios' }, { status: 500 })
  }
}

// POST - Crear un nuevo servicio
export async function POST(req: Request) {
  try {
    const data = await req.json()

    const servicio = await prisma.servicio.create({
      data: {
        codigo: data.codigo,
        nombre: data.nombre,
        descripcion: data.descripcion,
        estado: true
      }
    })

    return NextResponse.json(servicio)
  } catch (error) {
    console.error('Error al crear servicio:', error)

    return NextResponse.json({ error: 'Error al crear el servicio' }, { status: 500 })
  }
}
