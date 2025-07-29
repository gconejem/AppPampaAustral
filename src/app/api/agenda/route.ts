import { NextResponse } from 'next/server'

import { prisma } from '@/lib/prisma'

export async function POST(request: Request) {
  try {
    const data = await request.json()

    // Función helper para parsear fechas que vienen del frontend
    const parseLocalDate = (dateString: string) => {
      // La fecha viene ya ajustada desde el frontend para compensar la zona horaria
      return new Date(dateString)
    }

    const agenda = await prisma.agenda.create({
      data: {
        titulo: data.titulo,
        tipoVisita: data.tipoVisita,
        esRecurrente: data.esRecurrente,
        fechaInicio: parseLocalDate(data.fechaInicio),
        fechaFin: parseLocalDate(data.fechaFin),
        clienteId: data.clienteId,
        obraId: data.obraId,
        solicitudId: data.solicitudId,
        sectorComercial: data.sectorComercial || '',
        region: data.region || '',
        comuna: data.comuna || '',
        direccion: data.direccion || '',
        referencia: data.referencia || '',
        observaciones: data.observaciones,
        estado: data.estado || 'CREADA',

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
            esPrincipal: false
          }))
        },

        // Crear asignaciones de equipos
        equipos: {
          create: data.equipos.map((equipo: any) => ({
            equipoId: equipo.id,
            cantidad: 1
          }))
        },

        // Crear contactos relacionados
        contactos: {
          create: data.contactos.map((contacto: any) => ({
            nombre: contacto.nombre,
            rol: contacto.rol,
            email: contacto.email,
            telefono1: contacto.telefono1,
            telefono2: contacto.telefono2,
            isPrincipal: contacto.isPrincipal
          }))
        }
      }
    })

    return NextResponse.json(agenda)
  } catch (error) {
    console.error('Error al crear agenda:', error)

    return NextResponse.json({ error: 'Error al crear la agenda' }, { status: 500 })
  }
}

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const fechaInicio = searchParams.get('fechaInicio')
    const fechaFin = searchParams.get('fechaFin')

    // Construir el filtro de fechas
    const dateFilter: any = {}

    console.log('Query params:', { fechaInicio, fechaFin })

    if (fechaInicio && fechaFin) {
      // Crear fechas en UTC para incluir todo el día
      const startDate = new Date(fechaInicio + 'T00:00:00.000Z')
      const endDate = new Date(fechaFin + 'T23:59:59.999Z')

      console.log('Date range filter:', { startDate, endDate })

      dateFilter.fechaInicio = {
        gte: startDate,
        lte: endDate
      }
    } else if (fechaInicio) {
      const startDate = new Date(fechaInicio + 'T00:00:00.000Z')
      console.log('Start date filter:', { startDate })
      dateFilter.fechaInicio = {
        gte: startDate
      }
    } else if (fechaFin) {
      const endDate = new Date(fechaFin + 'T23:59:59.999Z')
      console.log('End date filter:', { endDate })
      dateFilter.fechaInicio = {
        lte: endDate
      }
    }

    console.log('Final dateFilter:', dateFilter)

    const agendas = await prisma.agenda.findMany({
      where: dateFilter,
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
        obra: true,
        contactos: {
          include: {
            contacto: true
          }
        }
      },
      orderBy: {
        fechaInicio: 'asc'
      }
    })

    return NextResponse.json(agendas)
  } catch (error) {
    console.error('Error al obtener agendas:', error)

    return NextResponse.json({ error: 'Error al obtener las agendas' }, { status: 500 })
  }
}
