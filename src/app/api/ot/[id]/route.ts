import { NextResponse } from 'next/server'

import { prisma } from '@/lib/prisma'
import { normalizeOrdenTrabajoTarjetas } from '@/lib/orden-trabajo-tarjetas'

export const dynamic = 'force-dynamic'
export const revalidate = 0

const baseInclude = {
  tipoOT: true,
  user: {
    select: {
      id: true,
      name: true,
      email: true
    }
  },
  agenda: {
    include: {
      obra: true,
      cliente: true,
      servicios: true
    }
  }
} as const

// GET /api/ot/[id] - Obtener una OT específica
export async function GET(request: Request, { params }: { params: { id: string } }) {
  try {
    let ordenTrabajo: any = null

    try {
      ordenTrabajo = await prisma.ordenTrabajo.findUnique({
        where: { id: params.id },
        include: {
          aceptacionVisita: true,
          densidad: true,
          hormigonFresco: true,
          testigos: true,
          extraccionAsfaltica: true,
          muestreoMaterial: true,
          retiroProbeta: true,
          ...baseInclude
        }
      })
    } catch (fullIncludeError) {
      console.warn('GET /api/ot/[id]: fallo include completo, usando include base', {
        id: params.id,
        error: fullIncludeError
      })

      ordenTrabajo = await prisma.ordenTrabajo.findUnique({
        where: { id: params.id },
        include: baseInclude
      })
    }

    if (!ordenTrabajo) {
      return NextResponse.json({ error: 'Orden de trabajo no encontrada' }, { status: 404 })
    }

    // Enriquecer servicios sin romper el endpoint completo si un lookup de producto falla.
    if (ordenTrabajo.agenda?.servicios) {
      const serviciosConProducto = await Promise.all(
        ordenTrabajo.agenda.servicios.map(async (servicio: any) => {
          const codigo = String(servicio?.codigo ?? '').trim()

          if (!codigo) {
            return {
              ...servicio,
              area: null,
              familia: null,
              nombreProducto: servicio?.servicio ?? null
            }
          }

          try {
            // Usar findFirst evita fallar por diferencias inesperadas en el origen del dato.
            const producto = await prisma.producto.findFirst({
              where: { sku: codigo },
              select: {
                area: true,
                familia: true,
                nombre: true
              }
            })

            return {
              ...servicio,
              area: producto?.area ?? null,
              familia: producto?.familia ?? null,
              nombreProducto: producto?.nombre ?? servicio?.servicio ?? null
            }
          } catch (serviceError) {
            console.warn('No se pudo enriquecer servicio de agenda:', {
              ordenTrabajoId: params.id,
              agendaServicioId: servicio?.id,
              codigo,
              error: serviceError
            })

            return {
              ...servicio,
              area: null,
              familia: null,
              nombreProducto: servicio?.servicio ?? null
            }
          }
        })
      )

      ordenTrabajo.agenda.servicios = serviciosConProducto
    }

    return NextResponse.json(ordenTrabajo)
  } catch (error) {
    console.error('Error al obtener OT:', error)

    return NextResponse.json({ error: 'Error al obtener la orden de trabajo' }, { status: 500 })
  }
}

// PUT /api/ot/[id] - Actualizar una OT específica
export async function PUT(request: Request, { params }: { params: { id: string } }) {
  try {
    const data = await request.json()
    const numeroTarjeta = normalizeOrdenTrabajoTarjetas(data.numeroTarjeta)

    // Verificar que la OT existe
    const existingOT = await prisma.ordenTrabajo.findUnique({
      where: { id: params.id }
    })

    if (!existingOT) {
      return NextResponse.json({ error: 'Orden de trabajo no encontrada' }, { status: 404 })
    }

    const ordenTrabajo = await prisma.ordenTrabajo.update({
      where: { id: params.id },
      data: {
        ...data,
        numeroTarjeta
      },
      include: {
        aceptacionVisita: true,
        densidad: true,
        hormigonFresco: true,
        testigos: true,
        extraccionAsfaltica: true,
        muestreoMaterial: true,
        retiroProbeta: true,
        tipoOT: true,
        user: {
          select: {
            id: true,
            name: true,
            email: true
          }
        },
        agenda: {
          include: {
            obra: true,
            cliente: true,
            servicios: true
          }
        }
      }
    })

    // Enriquecer servicios sin romper la respuesta si falla algún producto.
    if (ordenTrabajo.agenda?.servicios) {
      const serviciosConProducto = await Promise.all(
        ordenTrabajo.agenda.servicios.map(async (servicio: any) => {
          const codigo = String(servicio?.codigo ?? '').trim()

          if (!codigo) {
            return {
              ...servicio,
              area: null,
              familia: null,
              nombreProducto: servicio?.servicio ?? null
            }
          }

          try {
            const producto = await prisma.producto.findFirst({
              where: { sku: codigo },
              select: {
                area: true,
                familia: true,
                nombre: true
              }
            })

            return {
              ...servicio,
              area: producto?.area ?? null,
              familia: producto?.familia ?? null,
              nombreProducto: producto?.nombre ?? servicio?.servicio ?? null
            }
          } catch (serviceError) {
            console.warn('No se pudo enriquecer servicio de agenda (PUT):', {
              ordenTrabajoId: params.id,
              agendaServicioId: servicio?.id,
              codigo,
              error: serviceError
            })

            return {
              ...servicio,
              area: null,
              familia: null,
              nombreProducto: servicio?.servicio ?? null
            }
          }
        })
      )

      ordenTrabajo.agenda.servicios = serviciosConProducto
    }

    return NextResponse.json(ordenTrabajo)
  } catch (error) {
    console.error('Error al actualizar OT:', error)

    return NextResponse.json({ error: 'Error al actualizar la orden de trabajo' }, { status: 500 })
  }
}

// PATCH /api/ot/[id] - Actualizar parcialmente una OT específica (para jsonOT)
export async function PATCH(request: Request, { params }: { params: { id: string } }) {
  try {
    const data = await request.json()
    const numeroTarjeta = normalizeOrdenTrabajoTarjetas(data.numeroTarjeta)

    // Verificar que la OT existe
    const existingOT = await prisma.ordenTrabajo.findUnique({
      where: { id: params.id }
    })

    if (!existingOT) {
      return NextResponse.json({ error: 'Orden de trabajo no encontrada' }, { status: 404 })
    }

    // Solo actualizar los campos que se envían
    const ordenTrabajo = await prisma.ordenTrabajo.update({
      where: { id: params.id },
      data: {
        ...data,
        numeroTarjeta,
        updatedAt: new Date()
      }
    })

    return NextResponse.json(ordenTrabajo)
  } catch (error) {
    console.error('Error al actualizar OT:', error)

    return NextResponse.json({ error: 'Error al actualizar la orden de trabajo' }, { status: 500 })
  }
}

// DELETE /api/ot/[id] - Eliminar una OT específica
export async function DELETE(request: Request, { params }: { params: { id: string } }) {
  try {
    // Verificar que la OT existe
    const existingOT = await prisma.ordenTrabajo.findUnique({
      where: { id: params.id }
    })

    if (!existingOT) {
      return NextResponse.json({ error: 'Orden de trabajo no encontrada' }, { status: 404 })
    }

    await prisma.ordenTrabajo.delete({
      where: { id: params.id }
    })

    return NextResponse.json({ message: 'Orden de trabajo eliminada' })
  } catch (error) {
    console.error('Error al eliminar OT:', error)

    return NextResponse.json({ error: 'Error al eliminar la orden de trabajo' }, { status: 500 })
  }
}
