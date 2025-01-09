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

    console.log('Datos recibidos en POST /api/obras:', body)

    // Obtener la región y comuna por sus códigos
    const region = await prisma.region.findUnique({
      where: { codigo: body.region },
      select: { nombre: true }
    })

    // Buscar la comuna por ID en lugar de por nombre
    const comuna = await prisma.comuna.findUnique({
      where: {
        id: parseInt(body.comuna)
      },
      select: { nombre: true }
    })

    if (!region || !comuna) {
      console.error('Región o comuna no encontrada:', {
        regionCodigo: body.region,
        comunaId: body.comuna,
        regionEncontrada: region,
        comunaEncontrada: comuna
      })

      return NextResponse.json({ error: 'Región o comuna no válida', details: { region, comuna } }, { status: 400 })
    }

    // Crear la obra con todos los campos necesarios
    const obra = await prisma.obra.create({
      data: {
        numeroObra: body.numeroObra,
        fechaIngreso: new Date(body.fechaIngreso),
        estado: body.estado || 'activo',
        estadoObra: body.estadoObra || 'Activo',
        nombreObra: body.nombreObra,
        direccion: body.direccion,
        region: region.nombre,
        comuna: comuna.nombre,
        nombreCliente: body.nombreCliente,
        razonSocial: body.razonSocial,
        rut: body.rut,
        giro: body.giro,
        direccionComercial: body.direccionComercial,
        comunaFacturacion: body.comunaFacturacion,
        telefonoFacturacion: body.telefonoFacturacion,
        listaPrecios: body.listaPrecios,
        mailRecepcionFactura: body.mailRecepcionFactura,

        // Campos opcionales
        telefono: body.telefono || null,
        sitioWeb: body.sitioWeb || null,
        sector: body.sector || null,
        georreferencia: body.georreferencia || null,
        referencia: body.referencia || null,
        mandante: body.mandante || null,
        textoMandante: body.textoMandante || null,
        otrosRequisitos: body.otrosRequisitos || null,
        otrasReferencias: body.otrasReferencias || null,

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

        // Crear los contactos si existen
        contactos: {
          create: Array.isArray(body.contactos) ? body.contactos : []
        }
      }
    })

    console.log('Obra creada:', obra)

    return NextResponse.json(obra, { status: 201 })
  } catch (error) {
    console.error('Error detallado al crear obra:', error)

    return NextResponse.json(
      {
        error: 'Error al crear la obra',
        details: error instanceof Error ? error.message : 'Error desconocido'
      },
      { status: 500 }
    )
  }
}
