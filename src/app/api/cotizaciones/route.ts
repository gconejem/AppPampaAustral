import { NextResponse } from 'next/server'

import { TipoCotizacion } from '@prisma/client'

import { prisma } from '@/lib/prisma'

// Función auxiliar para normalizar el tipo de cotización
const normalizeTipoCotizacion = (tipo: string): TipoCotizacion => {
  if (!tipo) return TipoCotizacion.VALORES_UNITARIOS

  const normalizedTipo = tipo.toUpperCase().trim()

  switch (normalizedTipo) {
    case 'A':
    case 'VALORES_UNITARIOS':
      return TipoCotizacion.VALORES_UNITARIOS
    case 'B':
    case 'EMS':
      return TipoCotizacion.EMS
    case 'C':
    case 'MENSUAL':
      return TipoCotizacion.MENSUAL
    default:
      return TipoCotizacion.VALORES_UNITARIOS
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
        contacto: {
          include: {
            contacto: true
          }
        }
      }
    })

    // Log para ver los datos crudos
    console.log('Datos crudos de cotizaciones:', JSON.stringify(cotizaciones, null, 2))

    const formattedCotizaciones = cotizaciones.map(cotizacion => {
      // Log para ver cada cotización individual
      console.log('Cotización individual:', {
        id: cotizacion.id,
        total: cotizacion.total,
        totalType: typeof cotizacion.total,
        contactoId: cotizacion.contactoId,
        contactoDatos: cotizacion.contacto?.contacto?.nombre,
        tipoCotizacion: cotizacion.tipoCotizacion
      })

      return {
        id: cotizacion.id,
        numeroCotizacion: cotizacion.numeroCotizacion,
        cliente: cotizacion.cliente?.nombreCliente || 'Sin cliente',
        fecha: cotizacion.fechaCreacion.toLocaleDateString(),
        estado: cotizacion.estado,
        tipo: normalizeTipoCotizacion(cotizacion.tipoCotizacion as string),
        contacto: cotizacion.contacto?.contacto?.nombre || 'Sin contacto',
        comuna: cotizacion.cliente?.comuna || cotizacion.ubicacion?.split(',').pop()?.trim() || 'No especificada',
        total: parseFloat(cotizacion.total.toString()) // Convertir el Decimal a número
      }
    })

    console.log('Cotizaciones formateadas:', formattedCotizaciones)

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

    // Asegurar que fechaInicio y fechaFin sean fechas válidas
    const fechaInicio = body.fechaInicio ? new Date(body.fechaInicio) : new Date()
    const fechaFin = body.fechaFin ? new Date(body.fechaFin) : new Date(Date.now() + 15 * 24 * 60 * 60 * 1000)

    // Validar que las fechas sean válidas
    if (isNaN(fechaInicio.getTime()) || isNaN(fechaFin.getTime())) {
      return NextResponse.json({ error: 'Fechas inválidas proporcionadas' }, { status: 400 })
    }

    let contactoId = body.contactoId || null

    // Verifica si hay un nuevo contacto que crear
    if (body.contacto && !contactoId) {
      try {
        // Crear contacto primero
        const nuevoContacto = await prisma.contacto.create({
          data: {
            nombre: body.contacto.nombre,
            email: body.contacto.email,
            telefono: body.contacto.telefono,
            clienteId: body.clienteId
          }
        })

        contactoId = nuevoContacto.id
        console.log('Contacto creado:', nuevoContacto)
      } catch (error) {
        console.error('Error al crear contacto:', error)

        return NextResponse.json({ error: 'Error al crear contacto' }, { status: 500 })
      }
    }

    // Luego crear la cotización
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
      }
    })

    // Verificar si se reciben detalles
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

    const cotizacionCreada = await prisma.cotizacion.findUnique({
      where: { id: cotizacion.id },
      include: {
        cliente: true,
        contacto: {
          include: {
            contacto: true
          }
        },
        detalles: {
          include: {
            producto: true
          }
        }
      }
    })

    return NextResponse.json({ message: 'Cotización creada correctamente', cotizacion: cotizacionCreada })
  } catch (error) {
    console.error('Error al crear cotización:', error)

    return NextResponse.json({ error: 'Error al crear cotización' }, { status: 500 })
  }
}
