import { NextResponse } from 'next/server'

import prisma from '@/lib/prisma'
import { createObra, getObras, getObraById, updateObra, deleteObra } from './index'

// GET - Obtener todas las obras
export async function GET() {
  try {
    console.log('Fetching obras...')

    const obras = await prisma.obra.findMany({
      include: {
        contactos: true
      }
    })

    return NextResponse.json(obras)
  } catch (error) {
    console.error('Error al obtener obras:', error)

    return NextResponse.json({ error: 'Error al obtener las obras' }, { status: 500 })
  }
}

// POST - Crear una nueva obra
export async function POST(request: Request) {
  try {
    const body = await request.json()

    console.log('Recibiendo datos:', body)

    const obra = await prisma.obra.create({
      data: {
        // Campos básicos
        numeroObra: body.numeroObra,
        fechaIngreso: new Date(body.fechaIngreso),
        estado: body.estado || 'activo',
        estadoObra: body.estadoObra,
        nombreObra: body.nombreObra,

        // Ubicación
        direccion: body.direccion,
        region: body.region,
        comuna: body.comuna,
        telefono: body.telefono || '',
        sitioWeb: body.sitioWeb || '',

        // Cliente
        nombreCliente: body.nombreCliente,
        rut: body.rut,
        razonSocial: body.razonSocial,
        giro: body.giro,

        // Facturación
        direccionComercial: body.direccionComercial,
        comunaFacturacion: body.comunaFacturacion,
        telefonoFacturacion: body.telefonoFacturacion,
        listaPrecios: body.listaPrecios,
        mailRecepcionFactura: body.mailRecepcionFactura,

        // Campos booleanos
        informeMandante: body.informeMandante || false,
        acreditacionPersonal: body.acreditacionPersonal || false,
        especificacionesTecnicas: body.especificacionesTecnicas || false,
        acreditacionEquipos: body.acreditacionEquipos || false,
        cartaCompromiso: body.cartaCompromiso || false,
        mandatoServiu: body.mandatoServiu || false,
        estadoPago: body.estadoPago || false,
        hes: body.hes || false,
        oc: body.oc || false,

        // Campos opcionales
        sector: body.sector || null,
        georreferencia: body.georreferencia || null,
        referencia: body.referencia || null,
        mandante: body.mandante || null,
        textoMandante: body.textoMandante || null,
        otrosRequisitos: body.otrosRequisitos || null,
        otrasReferencias: body.otrasReferencias || null
      }
    })

    return NextResponse.json(obra, { status: 201 })
  } catch (error) {
    console.error('Error creating obra:', error)

    return NextResponse.json({ error: 'Error al crear la obra', details: error }, { status: 500 })
  }
}
