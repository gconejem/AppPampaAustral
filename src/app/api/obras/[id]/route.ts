import { NextResponse } from 'next/server'

import prisma from '@/lib/prisma'

// GET - Obtener una obra específica
export async function GET(request: Request, { params }: { params: { id: string } }) {
  try {
    const obraId = parseInt(params.id)

    console.log('Buscando obra:', obraId)

    const obra = await prisma.obra.findUnique({
      where: { obraId },
      include: {
        contactos: true
      }
    })

    console.log('Obra encontrada:', obra)

    if (!obra) {
      return NextResponse.json({ error: 'Obra no encontrada' }, { status: 404 })
    }

    return NextResponse.json(obra)
  } catch (error) {
    console.error('Error fetching obra:', error)

    return NextResponse.json({ error: 'Error al obtener la obra' }, { status: 500 })
  }
}

// PUT - Actualizar una obra
export async function PUT(request: Request, { params }: { params: { id: string } }) {
  try {
    const body = await request.json()
    const obraId = parseInt(params.id)

    const obra = await prisma.obra.update({
      where: { obraId },
      data: {
        // ... mismos campos que en el POST ...
      }
    })

    return NextResponse.json(obra)
  } catch (error) {
    console.error('Error updating obra:', error)

    return NextResponse.json({ error: 'Error al actualizar la obra', details: error }, { status: 500 })
  }
}
