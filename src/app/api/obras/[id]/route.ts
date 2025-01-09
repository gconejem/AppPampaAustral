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

    console.log('Datos recibidos para actualizar:', body)

    // Obtener la región y comuna por sus códigos/ids
    const region = await prisma.region.findUnique({
      where: { codigo: body.region },
      select: { nombre: true }
    })

    const comuna = await prisma.comuna.findUnique({
      where: { id: parseInt(body.comuna) },
      select: { nombre: true }
    })

    if (!region || !comuna) {
      console.error('Región o comuna no encontrada:', { region, comuna })

      return NextResponse.json({ error: 'Región o comuna no válida' }, { status: 400 })
    }

    // Extraer los campos que no queremos enviar directamente a la actualización
    const { contactos, createdAt, updatedAt, obraId, ...dataToUpdate } = body

    // Actualizar la obra usando los nombres de región y comuna
    const updatedObra = await prisma.obra.update({
      where: {
        obraId: parseInt(params.id)
      },
      data: {
        ...dataToUpdate,
        region: region.nombre,
        comuna: comuna.nombre,
        fechaIngreso: new Date(body.fechaIngreso),

        // Actualizar contactos si es necesario
        contactos: {
          deleteMany: {}, // Eliminar contactos existentes
          create: contactos.map((contacto: any) => ({
            nombre: contacto.nombre,
            rol: contacto.rol,
            email: contacto.email,
            telefono1: contacto.telefono1,
            isPrincipal: contacto.isPrincipal
          }))
        }
      },
      include: {
        contactos: true
      }
    })

    console.log('Obra actualizada:', updatedObra)

    return NextResponse.json(updatedObra)
  } catch (error) {
    console.error('Error updating obra:', error)

    return NextResponse.json({ error: 'Error al actualizar la obra', details: error }, { status: 500 })
  }
}

export async function DELETE(req: Request, { params }: { params: { id: string } }) {
  try {
    const id = parseInt(params.id)

    // Primero eliminar los contactos asociados
    await prisma.contactoObra.deleteMany({
      where: {
        obraId: id
      }
    })

    // Luego eliminar la obra
    const deletedObra = await prisma.obra.delete({
      where: {
        obraId: id
      }
    })

    return NextResponse.json(deletedObra)
  } catch (error) {
    console.error('Error deleting obra:', error)

    return NextResponse.json({ error: 'Error deleting obra' }, { status: 500 })
  }
}
