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

    // Primero buscamos la comuna por nombre
    const comuna = await prisma.comuna.findFirst({
      where: {
        nombre: body.comuna
      },
      select: {
        id: true,
        nombre: true
      }
    })

    if (!comuna) {
      return NextResponse.json({ error: 'Comuna no encontrada' }, { status: 400 })
    }

    // Crear la obra con el ID de la comuna
    const obra = await prisma.obra.create({
      data: {
        numeroObra: body.numeroObra,
        fechaIngreso: new Date(body.fechaIngreso),
        estado: body.estado,
        estadoObra: body.estadoObra,
        nombreObra: body.nombreObra,
        direccion: body.direccion,
        region: body.region,
        comuna: comuna.nombre, // Usamos el nombre de la comuna
        sector: body.sector || null,
        georreferencia: body.georreferencia || null,
        referencia: body.referencia || null,
        mandante: body.mandante || null,
        informeMandante: body.informeMandante || false,
        textoMandante: body.textoMandante || null,
        razonSocial: body.razonSocial,
        rut: body.rut,
        giro: body.giro,
        direccionComercial: body.direccionComercial,
        comunaFacturacion: body.comunaFacturacion,
        telefonoFacturacion: body.telefonoFacturacion,
        listaPrecios: body.listaPrecios,
        mailRecepcionFactura: body.mailRecepcionFactura,
        nombreCliente: body.nombreCliente,
        contactos: {
          create: body.contactos.map((contacto: any) => ({
            nombre: contacto.nombre,
            rol: contacto.rol,
            email: contacto.email,
            telefono1: contacto.telefono1,
            isPrincipal: contacto.isPrincipal
          }))
        }
      }
    })

    return NextResponse.json(obra)
  } catch (error) {
    console.error('Error detallado al crear obra:', error)

    return NextResponse.json({ error: 'Error al crear la obra' }, { status: 500 })
  }
}
