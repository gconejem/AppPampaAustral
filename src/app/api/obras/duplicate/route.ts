import { NextResponse } from 'next/server'

import { prisma } from '@/lib/prisma'

export async function POST(request: Request) {
  try {
    const body = await request.json()
    const { obraId } = body

    if (!obraId) {
      return NextResponse.json({ error: 'ID de obra no proporcionado' }, { status: 400 })
    }

    // Obtener la obra original con sus contactos
    const originalObra = await prisma.obra.findUnique({
      where: { obraId },
      include: { ContactoObra: true }
    })

    if (!originalObra) {
      return NextResponse.json({ error: 'Obra no encontrada' }, { status: 404 })
    }

    // Crear una copia de la obra
    const { obraId: _, ContactoObra, createdAt, updatedAt, ...obraData } = originalObra

    const duplicatedObra = await prisma.obra.create({
      data: {
        ...obraData,
        numeroObra: `${obraData.numeroObra}-COPIA`,
        createdAt: new Date(),
        updatedAt: new Date(),
        ContactoObra: {
          create: ContactoObra.map(({ id, obraId, ...contactData }) => contactData)
        }
      },
      include: {
        ContactoObra: true
      }
    })

    return NextResponse.json(duplicatedObra, { status: 201 })
  } catch (error) {
    console.error('Error al duplicar obra:', error)

    return NextResponse.json(
      { error: 'Error al duplicar la obra', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    )
  }
}
