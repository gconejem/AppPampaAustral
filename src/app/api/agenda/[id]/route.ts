import { NextResponse } from 'next/server'

import { prisma } from '@/lib/prisma'

export async function PUT(request: Request, { params }: { params: { id: string } }) {
  try {
    const id = parseInt(params.id)
    const data = await request.json()

    // Verificar que el evento existe
    const existeAgenda = await prisma.agenda.findUnique({
      where: { id },
      include: {
        servicios: true,
        asignados: true,
        equipos: true
      }
    })

    if (!existeAgenda) {
      return NextResponse.json({ error: 'Agenda no encontrada' }, { status: 404 })
    }

    // Eliminar relaciones existentes para reemplazarlas con las nuevas
    await prisma.$transaction([
      prisma.agendaServicio.deleteMany({ where: { agendaId: id } }),
      prisma.agendaAsignado.deleteMany({ where: { agendaId: id } }),
      prisma.agendaEquipo.deleteMany({ where: { agendaId: id } })
    ])

    // Actualizar el evento con los nuevos datos
    const agendaActualizada = await prisma.agenda.update({
      where: { id },
      data: {
        titulo: data.titulo,
        tipoVisita: data.tipoVisita,
        esRecurrente: data.esRecurrente,
        fechaInicio: new Date(data.fechaInicio),
        fechaFin: new Date(data.fechaFin),
        clienteId: data.clienteId,
        obraId: data.obraId,
        solicitudId: data.solicitudId,
        sectorComercial: data.sectorComercial || '',
        region: data.region || '',
        comuna: data.comuna || '',
        direccion: data.direccion || '',
        referencia: data.referencia || '',
        observaciones: data.observaciones,
        estado: data.estado,

        // Crear servicios relacionados
        servicios: {
          create: data.servicios.map((servicio: any) => ({
            codigo: servicio.codigo,
            servicio: servicio.servicio,
            cantidad: servicio.cantidad,
            observacion: servicio.observacion,
            esSegundaVisita: servicio.esSegundaVisita
          }))
        },

        // Crear asignaciones de laboratoristas
        asignados: {
          create: data.laboratoristas.map((lab: any) => ({
            userId: lab.id,
            esPrincipal: lab.esPrincipal || false
          }))
        },

        // Crear asignaciones de equipos
        equipos: {
          create: data.equipos.map((equipo: any) => ({
            equipoId: equipo.id,
            cantidad: equipo.cantidad || 1,
            observacion: equipo.observacion
          }))
        }
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
        obra: true
      }
    })

    return NextResponse.json(agendaActualizada)
  } catch (error) {
    console.error('Error al actualizar agenda:', error)

    return NextResponse.json({ error: 'Error al actualizar la agenda' }, { status: 500 })
  }
}

export async function GET(request: Request, { params }: { params: { id: string } }) {
  try {
    const id = parseInt(params.id)

    const agenda = await prisma.agenda.findUnique({
      where: { id },
      include: {
        cliente: true,
        servicios: true,
        asignados: {
          include: {
            user: {
              include: {
                roles: {
                  include: {
                    rol: true
                  }
                }
              }
            }
          }
        },
        equipos: {
          include: {
            equipo: true
          }
        },
        obra: true
      }
    })

    if (!agenda) {
      return NextResponse.json({ error: 'Agenda no encontrada' }, { status: 404 })
    }

    return NextResponse.json(agenda)
  } catch (error) {
    console.error('Error al obtener agenda:', error)

    return NextResponse.json({ error: 'Error al obtener la agenda' }, { status: 500 })
  }
}
