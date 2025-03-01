import { NextResponse } from 'next/server'

import { prisma } from '@/lib/prisma'

export async function POST(request: Request) {
  try {
    const data = await request.json()

    const agenda = await prisma.agenda.create({
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
        estado: 'AGENDADA',

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
        }
      }
    })

    return NextResponse.json(agenda)
  } catch (error) {
    console.error('Error al crear agenda:', error)

    return NextResponse.json({ error: 'Error al crear la agenda' }, { status: 500 })
  }
}

export async function GET() {
  try {
    const agendas = await prisma.agenda.findMany({
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

    return NextResponse.json(agendas)
  } catch (error) {
    console.error('Error al obtener agendas:', error)

    return NextResponse.json({ error: 'Error al obtener las agendas' }, { status: 500 })
  }
}
