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
    console.log('Contactos a crear:', body.contactos)

    // Primero creamos la obra
    const obra = await prisma.obra.create({
      data: {
        numeroObra: body.numeroObra,
        fechaIngreso: new Date(body.fechaIngreso),
        estado: body.estado || 'activo',
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
        informeMandante: body.informeMandante || false,
        acreditacionPersonal: body.acreditacionPersonal || false,
        especificacionesTecnicas: body.especificacionesTecnicas || false,
        acreditacionEquipos: body.acreditacionEquipos || false,
        cartaCompromiso: body.cartaCompromiso || false,
        mandatoServiu: body.mandatoServiu || false,
        estadoPago: body.estadoPago || false,
        hes: body.hes || false,
        oc: body.oc || false,
        sector: body.sector || null,
        georreferencia: body.georreferencia || null,
        referencia: body.referencia || null,
        mandante: body.mandante || null,
        textoMandante: body.textoMandante || null,
        otrosRequisitos: body.otrosRequisitos || null,
        otrasReferencias: body.otrasReferencias || null,

        // Crear los contactos
        contactos: {
          create: Array.isArray(body.contactos)
            ? body.contactos.map((contacto: any) => ({
                nombre: contacto.nombre,
                rol: contacto.rol,
                email: contacto.email,
                telefono1: contacto.telefono1,
                isPrincipal: contacto.isPrincipal || false
              }))
            : []
        }
      },
      include: {
        contactos: true
      }
    })

    console.log('Obra creada:', obra)

    return NextResponse.json(obra, { status: 201 })
  } catch (error) {
    console.error('Error detallado:', error)

    return NextResponse.json(
      {
        error: 'Error al crear la obra',
        details: error,
        message: error instanceof Error ? error.message : 'Error desconocido'
      },
      { status: 500 }
    )
  }
}
