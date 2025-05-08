import { NextResponse } from 'next/server'

import type { TipoCotizacion } from '@prisma/client'

import { prisma } from '@/lib/prisma'

// Función auxiliar para normalizar el tipo de cotización
const normalizeTipoCotizacion = (tipo: string): TipoCotizacion => {
  if (!tipo) return 'A'

  const normalizedTipo = tipo.toUpperCase().trim()

  switch (normalizedTipo) {
    case 'A':
    case 'VALORES_UNITARIOS':
      return 'A'
    case 'B':
    case 'EMS':
      return 'B'
    case 'C':
    case 'MENSUAL':
      return 'C'
    default:
      return 'A'
  }
}

export async function GET() {
  try {
    const cotizaciones = await prisma.cotizacion.findMany({
      orderBy: {
        fechaCreacion: 'desc'
      },
      include: {
        cliente: {
          select: {
            nombreCliente: true,
            comuna: true
          }
        },
        contacto: true
      }
    })

    const formattedCotizaciones = cotizaciones.map(cotizacion => {
      return {
        id: cotizacion.id,
        numeroCotizacion: cotizacion.numeroCotizacion,
        cliente: cotizacion.cliente?.nombreCliente || 'Sin cliente',
        fecha: cotizacion.fechaCreacion.toLocaleDateString(),
        estado: cotizacion.estado,
        tipo: normalizeTipoCotizacion(cotizacion.tipoCotizacion as string),
        contacto: cotizacion.contacto || null,
        comuna: cotizacion.cliente?.comuna || cotizacion.ubicacion?.split(',').pop()?.trim() || 'No especificada',
        total: parseFloat(cotizacion.total.toString())
      }
    })

    return NextResponse.json(formattedCotizaciones)
  } catch (error) {
    console.error('Error al obtener cotizaciones:', error)

    return NextResponse.json({ error: 'Error al obtener cotizaciones' }, { status: 500 })
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json()

    console.log('Body recibido:', body)

    const fechaInicio = body.fechaInicio ? new Date(body.fechaInicio) : new Date()
    const fechaFin = body.fechaFin ? new Date(body.fechaFin) : new Date(Date.now() + 15 * 24 * 60 * 60 * 1000)

    if (isNaN(fechaInicio.getTime()) || isNaN(fechaFin.getTime())) {
      return NextResponse.json({ error: 'Fechas inválidas proporcionadas' }, { status: 400 })
    }

    // Manejar el contacto
    let contactoId = body.contactoId

    // Si no hay contactoId pero hay datos de contacto, buscar o crear el contacto
    if (!contactoId && body.contacto) {
      const contactoExistente = await prisma.contacto.findFirst({
        where: {
          OR: [
            {
              AND: [{ nombre: body.contacto.nombre }, { email: body.contacto.email }]
            },
            {
              AND: [{ nombre: body.contacto.nombre }, { telefono1: body.contacto.telefono1 }]
            }
          ]
        }
      })

      if (contactoExistente) {
        contactoId = contactoExistente.contactId
      } else {
        const nuevoContacto = await prisma.contacto.create({
          data: {
            nombre: body.contacto.nombre,
            cargo: body.contacto.cargo || '',
            email: body.contacto.email || '',
            telefono1: body.contacto.telefono1 || ''
          }
        })

        contactoId = nuevoContacto.contactId
      }
    }

    const result = await prisma.$transaction(async prisma => {
      const cotizacion = await prisma.cotizacion.create({
        data: {
          numeroCotizacion: body.numeroCotizacion,
          tipoCotizacion: normalizeTipoCotizacion(body.tipoCotizacion),
          fechaInicio,
          fechaFin,
          estado: body.estado || 'BORRADOR',
          nombreProyecto: body.nombreProyecto || '',
          empresa: body.empresa || '',
          ubicacion: body.ubicacion || '',
          clienteId: body.clienteId,
          obraId: body.obraId,
          vendedorId: body.vendedorId,
          observaciones: body.observaciones || '',
          subtotal: body.subtotal || 0,
          descuento: body.descuento || 0,
          impuesto: body.impuesto || 0,
          total: body.total || 0,
          contactoId: contactoId,
          formaPago: body.formaPago || ''
        },
        include: {
          cliente: true,
          contacto: true,
          detalles: {
            include: {
              producto: true
            }
          }
        }
      })

      if (body.detalles && Array.isArray(body.detalles) && body.detalles.length > 0) {
        await prisma.detalleCotizacion.createMany({
          data: body.detalles.map((detalle: any) => ({
            cotizacionId: cotizacion.id,
            productoId: detalle.productoId,
            cantidad: detalle.cantidad,
            precioUnitario: detalle.precioUnitario,
            descuento: detalle.descuento || 0,
            subtotal: detalle.subtotal
          }))
        })
      }

      return cotizacion
    })

    return NextResponse.json({ message: 'Cotización creada correctamente', cotizacion: result })
  } catch (error) {
    console.error('Error al crear cotización:', error)

    return NextResponse.json({ error: 'Error al crear cotización' }, { status: 500 })
  }
}
