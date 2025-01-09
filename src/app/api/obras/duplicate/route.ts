import { NextResponse } from 'next/server'

import prisma from '@/lib/prisma'

export async function POST(request: Request) {
  try {
    const body = await request.json()
    const { obraId } = body

    // Obtener la obra original con sus contactos
    const obraOriginal = await prisma.obra.findUnique({
      where: { obraId },
      include: { contactos: true }
    })

    if (!obraOriginal) {
      return NextResponse.json({ error: 'Obra no encontrada' }, { status: 404 })
    }

    // Crear una copia de la obra
    const { obraId: _, contactos, createdAt, updatedAt, ...obraData } = obraOriginal

    // Generar nuevo número de obra
    const nuevoNumeroObra = `${obraData.numeroObra}-copy`

    const nuevaObra = await prisma.obra.create({
      data: {
        ...obraData,
        numeroObra: nuevoNumeroObra,
        contactos: {
          create: contactos.map(({ id, obraId, createdAt, updatedAt, ...contactoData }) => contactoData)
        }
      },
      include: {
        contactos: true
      }
    })

    return NextResponse.json(nuevaObra, { status: 201 })
  } catch (error) {
    console.error('Error duplicando obra:', error)

    return NextResponse.json({ error: 'Error al duplicar la obra' }, { status: 500 })
  }
}
