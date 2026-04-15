import { NextResponse } from 'next/server'

import { prisma } from '@/lib/prisma'

export const dynamic = 'force-dynamic'
export const revalidate = 0

export async function POST(request: Request, { params }: { params: { id: string } }) {
  try {
    const agendaId = parseInt(params.id)

    // Obtener la agenda original con todas sus relaciones
    const agendaOriginal = await prisma.agenda.findUnique({
      where: { id: agendaId },
      include: {
        servicios: true,
        asignados: true,
        equipos: true
      }
    })

    if (!agendaOriginal) {
      return NextResponse.json({ error: 'Agenda no encontrada' }, { status: 404 })
    }

    // Crear una nueva agenda con los mismos datos
    const nuevaAgenda = await prisma.agenda.create({
      data: {
        titulo: `${agendaOriginal.titulo} (Copia)`,
        tipoVisita: agendaOriginal.tipoVisita,
        esRecurrente: agendaOriginal.esRecurrente,
        fechaInicio: agendaOriginal.fechaInicio,
        fechaFin: agendaOriginal.fechaFin,
        estado: 'CREADA',
        sectorComercial: agendaOriginal.sectorComercial,
        region: agendaOriginal.region,
        comuna: agendaOriginal.comuna,
        direccion: agendaOriginal.direccion,
        referencia: agendaOriginal.referencia,
        clienteId: agendaOriginal.clienteId,
        obraId: agendaOriginal.obraId,
        solicitudId: agendaOriginal.solicitudId,
        observaciones: agendaOriginal.observaciones,

        // Duplicar servicios
        servicios: {
          create: agendaOriginal.servicios.map(servicio => ({
            codigo: servicio.codigo,
            servicio: servicio.servicio,
            cantidad: servicio.cantidad,
            observacion: servicio.observacion,
            esSegundaVisita: servicio.esSegundaVisita
          }))
        },

        // Duplicar asignados
        asignados: {
          create: agendaOriginal.asignados.map(asignado => ({
            userId: asignado.userId,
            esPrincipal: asignado.esPrincipal
          }))
        },

        // Duplicar equipos
        equipos: {
          create: agendaOriginal.equipos.map(equipo => ({
            equipoId: equipo.equipoId,
            cantidad: equipo.cantidad,
            observacion: equipo.observacion
          }))
        }
      }
    })

    return NextResponse.json(nuevaAgenda)
  } catch (error) {
    console.error('Error al duplicar la agenda:', error)

    return NextResponse.json({ error: 'Error al duplicar la agenda' }, { status: 500 })
  }
}
