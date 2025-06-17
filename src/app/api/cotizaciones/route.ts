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

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const fechaInicio = searchParams.get('fechaInicio')
    const fechaFin = searchParams.get('fechaFin')

    const whereClause: any = {}

    if (fechaInicio || fechaFin) {
      whereClause.fechaCreacion = {}
      if (fechaInicio) {
        // Establecer la hora de inicio al comienzo del día (00:00:00)
        const inicioDate = new Date(fechaInicio)
        inicioDate.setHours(0, 0, 0, 0)
        whereClause.fechaCreacion.gte = inicioDate
      }
      if (fechaFin) {
        // Establecer la hora de fin al final del día (23:59:59)
        const finDate = new Date(fechaFin)
        finDate.setHours(23, 59, 59, 999)
        whereClause.fechaCreacion.lte = finDate
      }
    }

    console.log('Filtros de fecha:', {
      fechaInicio: whereClause.fechaCreacion?.gte,
      fechaFin: whereClause.fechaCreacion?.lte
    })

    const cotizaciones = await prisma.cotizacion.findMany({
      where: whereClause,
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

    console.log('Cotizaciones encontradas:', cotizaciones.length)

    const formattedCotizaciones = cotizaciones.map(cotizacion => {
      return {
        id: cotizacion.id,
        numeroCotizacion: cotizacion.numeroCotizacion,
        cliente: cotizacion.cliente?.nombreCliente || 'Sin cliente',
        fecha: cotizacion.fechaCreacion.toLocaleDateString('es-CL', {
          day: '2-digit',
          month: '2-digit',
          year: 'numeric'
        }).replace(/\//g, '-'),
        estado: cotizacion.estado,
        tipo: normalizeTipoCotizacion(cotizacion.tipoCotizacion as string),
        contacto: cotizacion.contacto
          ? {
              contactId: cotizacion.contacto.contactId,
              nombre: cotizacion.contacto.nombre,
              cargo: cotizacion.contacto.cargo,
              email: cotizacion.contacto.email,
              telefono1: cotizacion.contacto.telefono1
            }
          : null,
        comuna: cotizacion.cliente?.comuna || cotizacion.ubicacion?.split(',').pop()?.trim() || 'No especificada',
        empresa: cotizacion.empresa || 'No especificada',
        observacionGestion: cotizacion.observacionGestion,
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
    let contactId = body.contactId

    // Si no hay contactId pero hay datos de contacto, buscar o crear el contacto
    if (!contactId && body.contacto) {
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
        contactId = contactoExistente.contactId
      } else {
        const nuevoContacto = await prisma.contacto.create({
          data: {
            nombre: body.contacto.nombre,
            cargo: body.contacto.cargo || '',
            email: body.contacto.email || '',
            telefono1: body.contacto.telefono1 || ''
          }
        })

        contactId = nuevoContacto.contactId
      }
    }

    console.log('Detalles recibidos en el backend:', body.detalles)

    const result = await prisma.$transaction(async prisma => {
      const cotizacion = await prisma.cotizacion.create({
        data: {
          numeroCotizacion: body.numeroCotizacion,
          version: body.version || '00',
          tipoCotizacion: normalizeTipoCotizacion(body.tipoCotizacion),
          fechaInicio,
          fechaFin,
          estado: body.estado || 'BORRADOR',
          nombreProyecto: body.nombreProyecto || '',
          empresa: body.empresa || '',
          ubicacion: body.ubicacion || '',
          cliente: body.clienteId ? { connect: { clienteId: body.clienteId } } : undefined,
          obra: body.obraId ? { connect: { obraId: body.obraId } } : undefined,
          vendedorId: body.vendedorId,
          observaciones: body.observaciones || '',
          subtotal: body.subtotal || 0,
          descuento: body.descuento || 0,
          impuesto: body.impuesto || 0,
          total: body.total || 0,
          contacto: contactId ? { connect: { contactId } } : undefined,
          formaPago: body.formaPago || '',
          listaPrecio: body.listaPrecioId ? { connect: { id: body.listaPrecioId } } : undefined,
          ...(normalizeTipoCotizacion(body.tipoCotizacion) === 'B' && {
            superficieEMS: body.superficieEMS || '',
            antecedentesEMS: body.antecedentesEMS || '',
            plazoEntregaEMS: body.plazoEntregaEMS || ''
          })
        }
      })

      // Extraer el array de detalles, sea plano o anidado en { create: [...] }
      const detallesArray = Array.isArray(body.detalles)
        ? body.detalles
        : body.detalles && Array.isArray(body.detalles.create)
          ? body.detalles.create
          : []

      if (detallesArray.length > 0) {
        console.log('Insertando detalles en la BD:', detallesArray)

        try {
          await prisma.detalleCotizacion.createMany({
            data: detallesArray.map((detalle: any) => ({
              cotizacionId: cotizacion.id,
              productoId: detalle.productoId,
              cantidad: detalle.cantidad,
              precioUnitario: detalle.precioUnitario,
              descuento: detalle.descuento || 0,
              subtotal: detalle.subtotal,
              esPaquete: detalle.esPaquete || false,
              esSubProducto: detalle.esSubProducto || false,
              paqueteId: detalle.paqueteId || null
            }))
          })
        } catch (error) {
          console.error('Error al insertar detalles:', error)
        }
      } else {
        console.log('No se insertaron detalles: condición no cumplida o array vacío')
      }

      // Traer la cotización recién creada con el contacto incluido
      const cotizacionConContacto = await prisma.cotizacion.findUnique({
        where: { id: cotizacion.id },
        include: {
          cliente: true,
          contacto: true,
          detalles: { include: { producto: true } }
        }
      })

      return cotizacionConContacto
    })

    return NextResponse.json({ message: 'Cotización creada correctamente', cotizacion: result })
  } catch (error) {
    console.error('Error al crear cotización:', error)

    return NextResponse.json({ error: 'Error al crear cotización' }, { status: 500 })
  }
}
