import { NextResponse } from 'next/server'

import prisma from '@/lib/prisma'

// GET - Obtener una obra específica
export async function GET(request: Request, { params }: { params: { id: string } }) {
  try {
    console.log('Buscando obra:', params.id)

    const obra = await prisma.obra.findUnique({
      where: {
        obraId: parseInt(params.id)
      },
      include: {
        contactos: true
      }
    })

    if (!obra) {
      return NextResponse.json({ error: 'Obra no encontrada' }, { status: 404 })
    }

    console.log('Obra encontrada:', obra)

    return NextResponse.json(obra)
  } catch (error) {
    console.error('Error al obtener la obra:', error)

    return NextResponse.json({ error: 'Error al obtener la obra' }, { status: 500 })
  }
}

// PUT - Actualizar una obra
export async function PUT(request: Request, { params }: { params: { id: string } }) {
  try {
    const body = await request.json()

    console.log('Datos recibidos para actualizar:', body)

    // Si la comuna cambió, buscarla por nombre
    let comunaNombre = body.comuna

    if (body.comuna) {
      const comunaData = await prisma.comuna.findFirst({
        where: {
          nombre: body.comuna
        }
      })

      if (!comunaData) {
        return NextResponse.json({ error: 'Comuna no encontrada' }, { status: 400 })
      }

      comunaNombre = comunaData.nombre
    }

    // Actualizar la obra
    const updatedObra = await prisma.obra.update({
      where: {
        obraId: parseInt(params.id)
      },
      data: {
        numeroObra: body.numeroObra,
        fechaIngreso: new Date(body.fechaIngreso),
        estado: body.estado,
        estadoObra: body.estadoObra,
        nombreObra: body.nombreObra,
        direccion: body.direccion,
        region: body.region,
        comuna: comunaNombre,
        sector: body.sector,
        georreferencia: body.georreferencia,
        referencia: body.referencia,
        mandante: body.mandante,
        informeMandante: body.informeMandante,
        textoMandante: body.textoMandante,
        razonSocial: body.razonSocial,
        rut: body.rut,
        giro: body.giro,
        direccionComercial: body.direccionComercial,
        comunaFacturacion: body.comunaFacturacion,
        telefonoFacturacion: body.telefonoFacturacion,
        listaPrecios: body.listaPrecios,
        mailRecepcionFactura: body.mailRecepcionFactura,
        nombreCliente: body.nombreCliente

        // Otros campos que necesites actualizar...
      },
      include: {
        contactos: true
      }
    })

    return NextResponse.json(updatedObra)
  } catch (error) {
    console.error('Error updating obra:', error)

    return NextResponse.json({ error: 'Error al actualizar la obra' }, { status: 500 })
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
