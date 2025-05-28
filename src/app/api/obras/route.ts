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

export async function GET() {
  try {
    console.log('Iniciando consulta de obras...')

    const obras = await prisma.obra.findMany({
      include: {
        contactos: true,
        cotizaciones: true,
        solicitudes: true
      },
      orderBy: {
        numeroObra: 'desc'
      }
    })

    return NextResponse.json(obras)
  } catch (error) {
    console.error('Error al obtener obras:', error)

    return NextResponse.json({ error: 'Error al obtener obras' }, { status: 500 })
  }
}
