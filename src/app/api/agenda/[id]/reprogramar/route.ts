import { NextResponse } from 'next/server'

import { prisma } from '@/lib/prisma'

export async function PUT(request: Request, { params }: { params: { id: string } }) {
  try {
    const id = parseInt(params.id)
    const data = await request.json()

    // Verificar que el evento existe
    const existeAgenda = await prisma.agenda.findUnique({
      where: { id }
    })

    if (!existeAgenda) {
      return NextResponse.json({ error: 'Agenda no encontrada' }, { status: 404 })
    }

    // Verificar que el evento no esté suspendido
    if (existeAgenda.estado === 'SUSPENDIDA') {
      return NextResponse.json({ error: 'No se puede reprogramar un evento suspendido' }, { status: 400 })
    }

    // Función helper para parsear fechas que vienen del frontend
    const parseLocalDate = (dateString: string) => {
      // La fecha viene ya ajustada desde el frontend para compensar la zona horaria
      return new Date(dateString)
    }

    // Actualizar solo las fechas del evento
    const agendaReprogramada = await prisma.agenda.update({
      where: { id },
      data: {
        fechaInicio: parseLocalDate(data.fechaInicio),
        fechaFin: parseLocalDate(data.fechaFin)
      },
      include: {
        cliente: true,
        servicios: true,
        asignados: {
          include: {
            user: true
          }
        },
        equipos: {
          include: {
            equipo: true
          }
        },
        obra: true,
        contactos: true
      }
    })

    return NextResponse.json(agendaReprogramada)
  } catch (error) {
    console.error('Error al reprogramar agenda:', error)

    return NextResponse.json({ error: 'Error al reprogramar la agenda' }, { status: 500 })
  }
}

// Endpoint para reprogramación masiva de eventos
export async function POST(request: Request, { params }: { params: { id: string } }) {
  try {
    const data = await request.json()
    const { ids, fechaInicio, fechaFin } = data

    if (!ids || !Array.isArray(ids) || ids.length === 0) {
      return NextResponse.json({ error: 'Se requieren IDs de eventos válidos' }, { status: 400 })
    }

    if (!fechaInicio || !fechaFin) {
      return NextResponse.json({ error: 'Se requieren fecha de inicio y fin' }, { status: 400 })
    }

    // Función helper para parsear fechas
    const parseLocalDate = (dateString: string) => {
      return new Date(dateString)
    }

    // Verificar que todos los eventos existen
    const eventosExistentes = await prisma.agenda.findMany({
      where: {
        id: {
          in: ids
        }
      }
    })

    if (eventosExistentes.length !== ids.length) {
      return NextResponse.json({ error: 'Algunos eventos no fueron encontrados' }, { status: 404 })
    }

    // Verificar que ningún evento esté suspendido
    const eventosSuspendidos = eventosExistentes.filter(evento => evento.estado === 'SUSPENDIDA')
    if (eventosSuspendidos.length > 0) {
      return NextResponse.json({
        error: `No se pueden reprogramar eventos suspendidos. ${eventosSuspendidos.length} evento(s) tienen estado suspendido.`
      }, { status: 400 })
    }

    // Actualizar todos los eventos en una transacción
    const eventosActualizados = await prisma.$transaction(
      ids.map((id: number) =>
        prisma.agenda.update({
          where: { id },
          data: {
            fechaInicio: parseLocalDate(fechaInicio),
            fechaFin: parseLocalDate(fechaFin)
          },
          include: {
            cliente: true,
            servicios: true,
            asignados: {
              include: {
                user: true
              }
            },
            equipos: {
              include: {
                equipo: true
              }
            },
            obra: true,
            contactos: true
          }
        })
      )
    )

    return NextResponse.json({
      message: `${eventosActualizados.length} eventos reprogramados exitosamente`,
      eventos: eventosActualizados
    })
  } catch (error) {
    console.error('Error al reprogramar eventos masivamente:', error)

    return NextResponse.json({ error: 'Error al reprogramar los eventos' }, { status: 500 })
  }
} 
