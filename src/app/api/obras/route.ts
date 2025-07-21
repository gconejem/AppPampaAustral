import { NextResponse } from 'next/server'

import type { NextRequest } from 'next/server'

import { prisma } from '@/lib/prisma'

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()

    // Asegurar que mailRecepcionFactura sea un array
    const mailRecepcionFactura = Array.isArray(body.mailRecepcionFactura)
      ? body.mailRecepcionFactura
      : typeof body.mailRecepcionFactura === 'string'
        ? body.mailRecepcionFactura.split(',').map((email: string) => email.trim()).filter((email: string) => email !== '')
        : []

    // Usar una transacción para asegurar que todo se guarde correctamente
    const obra = await prisma.$transaction(async tx => {
      // Crear la obra principal con los campos requeridos
      const nuevaObra = await tx.obra.create({
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
          correos: body.correos || [],
          acreditacionPersonal: body.acreditacionPersonal || false,
          especificacionesTecnicas: body.especificacionesTecnicas || false,
          acreditacionEquipos: body.acreditacionEquipos || false,
          cartaCompromiso: body.cartaCompromiso || false,
          mandatoServiu: body.mandatoServiu || false,
          otrosRequisitos: body.otrosRequisitos || '',
          giro: body.giro,
          direccionComercial: body.direccionComercial,
          comunaFacturacion: body.comunaFacturacion,
          telefonoFacturacion: body.telefonoFacturacion,
          listaPrecios: body.listaPrecios,
          mailRecepcionFactura: mailRecepcionFactura,
          estadoPago: body.estadoPago || false,
          hes: body.hes || false,
          oc: body.oc || false,
          envioInformes: body.envioInformes || false,
          otrasReferencias: body.otrasReferencias,
          rutRepresentanteLegal: body.rutRepresentanteLegal || '',
          representanteLegal: body.representanteLegal || '',
          createdAt: new Date(),
          updatedAt: new Date()
        }
      })

      // Crear los contactos uno por uno dentro de la transacción
      for (const contacto of body.contactos || []) {
        // Buscar si el contacto ya existe por email o teléfono
        let contactoExistente = null

        if (contacto.email) {
          contactoExistente = await tx.contacto.findFirst({
            where: { email: contacto.email }
          })
        }

        if (!contactoExistente && contacto.telefono1) {
          contactoExistente = await tx.contacto.findFirst({
            where: { telefono1: contacto.telefono1 }
          })
        }

        let contactoId = null

        if (contactoExistente) {
          contactoId = contactoExistente.contactId
        } else {
          const nuevoContacto = await tx.contacto.create({
            data: {
              nombre: contacto.nombre,
              cargo: contacto.rol,
              email: contacto.email,
              telefono1: contacto.telefono1,
              telefono2: contacto.telefono2 || ''
            }
          })

          contactoId = nuevoContacto.contactId
        }

        // Crear la relación ContactoObra
        await tx.contactoObra.create({
          data: {
            nombre: contacto.nombre,
            rol: contacto.rol,
            email: contacto.email,
            telefono1: contacto.telefono1,
            telefono2: contacto.telefono2,
            isPrincipal: contacto.isPrincipal || false,
            obraId: nuevaObra.obraId,
            contactId: contactoId
          }
        })
      }

      // Retornar la obra con sus contactos
      return tx.obra.findUnique({
        where: { obraId: nuevaObra.obraId },
        include: {
          contactos: true
        }
      })
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

export async function GET(req: NextRequest) {
  try {
    console.log('Iniciando consulta de obras...')

    const { searchParams } = new URL(req.url)
    const rut = searchParams.get('rut')
    const search = searchParams.get('search')
    const clienteId = searchParams.get('clienteId')

    // Construir el filtro where dinámicamente
    const whereClause: any = {}

    if (rut) {
      whereClause.rut = rut
      console.log('Filtrando obras por RUT:', rut)
    }

    if (search) {
      whereClause.OR = [
        { nombreObra: { contains: search, mode: 'insensitive' } },
        { numeroObra: { contains: search, mode: 'insensitive' } },
        { nombreCliente: { contains: search, mode: 'insensitive' } },
        { direccion: { contains: search, mode: 'insensitive' } }
      ]
      console.log('Filtrando obras por búsqueda:', search)
    }

    // Si se proporciona clienteId, necesitamos buscar el RUT del cliente primero
    if (clienteId && !rut) {
      const cliente = await prisma.cliente.findUnique({
        where: { clienteId: parseInt(clienteId) },
        select: { rut: true }
      })

      if (cliente) {
        whereClause.rut = cliente.rut
        console.log('Filtrando obras por clienteId convertido a RUT:', cliente.rut)
      }
    }

    const obras = await prisma.obra.findMany({
      where: whereClause,
      include: {
        contactos: true,
        cotizaciones: true,
        solicitudes: true
      }
    })

    // Ordenar las obras por número de obra de forma numérica
    obras.sort((a, b) => {
      const numA = parseInt(a.numeroObra) || 0
      const numB = parseInt(b.numeroObra) || 0
      return numA - numB
    })

    console.log(`Encontradas ${obras.length} obras`)
    return NextResponse.json(obras)
  } catch (error) {
    console.error('Error al obtener obras:', error)

    return NextResponse.json({ error: 'Error al obtener obras' }, { status: 500 })
  }
}
