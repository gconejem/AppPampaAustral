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

    console.log('Actualizando obra:', obraId)
    console.log('Datos recibidos:', body)

    // Primero actualizamos la obra
    const obra = await prisma.obra.update({
      where: { obraId },
      data: {
        numeroObra: body.numeroObra,
        fechaIngreso: new Date(body.fechaIngreso),
        estado: body.estado,
        estadoObra: body.estadoObra,
        nombreObra: body.nombreObra,
        direccion: body.direccion,
        region: body.region,
        comuna: body.comuna,
        telefono: body.telefono || '',
        sitioWeb: body.sitioWeb || '',
        nombreCliente: body.nombreCliente,
        rut: body.rut,
        razonSocial: body.razonSocial,
        giro: body.giro,
        direccionComercial: body.direccionComercial,
        comunaFacturacion: body.comunaFacturacion,
        telefonoFacturacion: body.telefonoFacturacion,
        listaPrecios: body.listaPrecios,
        mailRecepcionFactura: body.mailRecepcionFactura,
        informeMandante: body.informeMandante,
        acreditacionPersonal: body.acreditacionPersonal,
        especificacionesTecnicas: body.especificacionesTecnicas,
        acreditacionEquipos: body.acreditacionEquipos,
        cartaCompromiso: body.cartaCompromiso,
        mandatoServiu: body.mandatoServiu,
        estadoPago: body.estadoPago,
        hes: body.hes,
        oc: body.oc,
        sector: body.sector || null,
        georreferencia: body.georreferencia || null,
        referencia: body.referencia || null,
        mandante: body.mandante || null,
        textoMandante: body.textoMandante || null,
        otrosRequisitos: body.otrosRequisitos || null,
        otrasReferencias: body.otrasReferencias || null
      },
      include: {
        contactos: true
      }
    })

    console.log('Obra actualizada:', obra)

    return NextResponse.json(obra)
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
