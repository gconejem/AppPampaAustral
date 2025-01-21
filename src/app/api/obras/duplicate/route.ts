import { NextResponse } from 'next/server'

import prisma from '@/libs/prisma'

export async function POST(request: Request) {
  try {
    const body = await request.json()
    const { obraId } = body

    if (!obraId) {
      return NextResponse.json({ error: 'ID de obra no proporcionado' }, { status: 400 })
    }

    // Obtener la obra original con sus contactos
    const obraOriginal = await prisma.obra.findUnique({
      where: { obraId },
      include: { contactos: true }
    })

    if (!obraOriginal) {
      return NextResponse.json({ error: 'Obra no encontrada' }, { status: 404 })
    }

    // Crear una copia de la obra sin los campos únicos y generados
    const { obraId: id, createdAt, updatedAt, ...obraSinId } = obraOriginal
    const contactosOriginales = obraOriginal.contactos

    // Crear la nueva obra con sus contactos
    const nuevaObra = await prisma.obra.create({
      data: {
        ...obraSinId,
        numeroObra: `${obraSinId.numeroObra}-copia`,
        nombreObra: `${obraSinId.nombreObra} (Copia)`,
        contactos: {
          create: contactosOriginales.map(({ id, createdAt, updatedAt, obraId, ...contacto }) => contacto)
        }
      },
      include: {
        contactos: true
      }
    })

    return NextResponse.json(nuevaObra, { status: 201 })
  } catch (error) {
    console.error('Error al duplicar obra:', error)

    return NextResponse.json({ error: 'Error al duplicar la obra' }, { status: 500 })
  }
}
