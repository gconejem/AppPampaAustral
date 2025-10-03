import { NextResponse } from 'next/server'

import { prisma } from '@/lib/prisma'

export const dynamic = 'force-dynamic'
export const revalidate = 0

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
      include: { contactos: true }
    })

    if (!originalObra) {
      return NextResponse.json({ error: 'Obra no encontrada' }, { status: 404 })
    }

    // Obtener el último número de obra
    const lastObra = await prisma.obra.findFirst({
      orderBy: {
        numeroObra: 'desc'
      }
    })

    // Generar el nuevo número de obra
    let nextNumeroObra = '1'

    if (lastObra) {
      const lastNumber = parseInt(lastObra.numeroObra)

      nextNumeroObra = (lastNumber + 1).toString()
    }

    // Crear una copia de la obra
    const { obraId: _, contactos, ...obraData } = originalObra

    const duplicatedObra = await prisma.obra.create({
      data: {
        ...obraData,
        numeroObra: nextNumeroObra,
        createdAt: new Date(),
        updatedAt: new Date(),
        contactos: {
          create: contactos.map(({ id, obraId, ...contactData }) => contactData)
        }
      },
      include: {
        contactos: true
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
