import { NextResponse } from 'next/server'

import { prisma } from '@/lib/prisma'

// GET - Obtener una obra específica
export async function GET(request: Request, { params }: { params: { id: string } }) {
  try {
    const obraId = parseInt(params.id)

    const obra = await prisma.obra.findUnique({
      where: { obraId },
      include: {
        ContactoObra: true
      }
    })

    if (!obra) {
      return NextResponse.json({ error: 'Obra no encontrada' }, { status: 404 })
    }

    return NextResponse.json(obra)
  } catch (error) {
    console.error('Error al obtener obra:', error)

    return NextResponse.json({ error: 'Error al obtener la obra' }, { status: 500 })
  }
}

// PUT - Actualizar una obra
export async function PUT(request: Request, { params }: { params: { id: string } }) {
  try {
    const obraId = parseInt(params.id)
    const body = await request.json()

    console.log('Datos recibidos para actualizar:', body)

    // Extraer los contactos del body
    const { ContactoObra, ...obraData } = body

    // Actualizar la obra
    const updatedObra = await prisma.obra.update({
      where: {
        obraId: obraId
      },
      data: {
        ...obraData,
        updatedAt: new Date(),

        // Actualizar los contactos si existen
        ContactoObra: ContactoObra
          ? {
              deleteMany: {}, // Eliminar contactos existentes
              create: ContactoObra.map((contacto: any) => ({
                nombre: contacto.nombre,
                rol: contacto.rol,
                email: contacto.email,
                telefono1: contacto.telefono1,
                telefono2: contacto.telefono2,
                isPrincipal: contacto.isPrincipal
              }))
            }
          : undefined
      },
      include: {
        ContactoObra: true // Usar ContactoObra en lugar de contactos
      }
    })

    return NextResponse.json(updatedObra)
  } catch (error) {
    console.error('Error updating obra:', error)

    return NextResponse.json({ error: 'Error al actualizar la obra' }, { status: 500 })
  }
}

// DELETE - Eliminar una obra
export async function DELETE(request: Request, { params }: { params: { id: string } }) {
  try {
    const obraId = parseInt(params.id)

    // Primero eliminamos los contactos asociados
    await prisma.contactoObra.deleteMany({
      where: { obraId }
    })

    // Luego eliminamos la obra
    const deletedObra = await prisma.obra.delete({
      where: { obraId }
    })

    return NextResponse.json(deletedObra)
  } catch (error) {
    console.error('Error al eliminar obra:', error)

    return NextResponse.json({ error: 'Error al eliminar la obra' }, { status: 500 })
  }
}

// PATCH - Actualizar el estado de una obra
export async function PATCH(request: Request, { params }: { params: { id: string } }) {
  try {
    const obraId = parseInt(params.id)
    const body = await request.json()

    const updatedObra = await prisma.obra.update({
      where: { obraId },
      data: {
        estado: body.estado,
        updatedAt: new Date()
      }
    })

    return NextResponse.json(updatedObra)
  } catch (error) {
    console.error('Error al actualizar estado:', error)

    return NextResponse.json({ error: 'Error al actualizar el estado' }, { status: 500 })
  }
}
