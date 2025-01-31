import { NextResponse } from 'next/server'

import type { NextRequest } from 'next/server'

import { prisma } from '@/lib/prisma'

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()

    // Crear la obra principal con los campos requeridos
    const obra = await prisma.obra.create({
      data: {
        numeroObra: body.numeroObra,
        fechaIngreso: new Date(body.fechaIngreso),
        estado: body.estado || 'activo',
        estadoObra: body.estadoObra,
        rut: body.rut,
        nombreCliente: body.nombreCliente,
        razonSocial: body.razonSocial,
        nombreObra: body.nombreObra,
        direccion: body.direccion,
        region: body.region,
        comuna: body.comuna,
        sector: body.sector,
        georreferencia: body.georreferencia,
        referencia: body.referencia,
        mandante: body.mandante,
        informeMandante: body.informeMandante || false,
        textoMandante: body.textoMandante,
        acreditacionPersonal: body.acreditacionPersonal || false,
        especificacionesTecnicas: body.especificacionesTecnicas || false,
        acreditacionEquipos: body.acreditacionEquipos || false,
        cartaCompromiso: body.cartaCompromiso || false,
        mandatoServiu: body.mandatoServiu || false,
        otrosRequisitos: body.otrosRequisitos,
        giro: body.giro,
        direccionComercial: body.direccionComercial,
        comunaFacturacion: body.comunaFacturacion,
        telefonoFacturacion: body.telefonoFacturacion,
        listaPrecios: body.listaPrecios,
        mailRecepcionFactura: body.mailRecepcionFactura,
        estadoPago: body.estadoPago || false,
        hes: body.hes || false,
        oc: body.oc || false,
        otrasReferencias: body.otrasReferencias,
        createdAt: new Date(),
        updatedAt: new Date(),
        ContactoObra: {
          create: body.contactos?.map((contacto: any) => ({
            nombre: contacto.nombre,
            rol: contacto.rol,
            email: contacto.email,
            telefono1: contacto.telefono1,
            telefono2: contacto.telefono2,
            isPrincipal: contacto.isPrincipal || false
          }))
        }
      },
      include: {
        ContactoObra: true
      }
    })

    return NextResponse.json(obra, { status: 201 })
  } catch (error) {
    console.error('Error al crear obra:', error)

    return NextResponse.json(
      { error: 'Error al crear la obra', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    )
  }
}

export async function GET() {
  try {
    const obras = await prisma.obra.findMany({
      include: {
        ContactoObra: true
      },
      orderBy: {
        fechaIngreso: 'desc'
      }
    })

    // Transformar los datos para el formato que espera la tabla
    const formattedObras = obras.map(obra => ({
      ...obra,

      // Usar los campos que sí existen en el modelo
      cliente: obra.nombreCliente,
      encargado: obra.ContactoObra.find(c => c.isPrincipal)?.nombre || '',
      rutCliente: obra.rut,
      estado: obra.estado
    }))

    return NextResponse.json(formattedObras)
  } catch (error) {
    console.error('Error al obtener obras:', error)

    return NextResponse.json({ error: 'Error al obtener obras' }, { status: 500 })
  }
}
