import { NextResponse } from 'next/server'

import { EstadoAgenda } from '@prisma/client'

import { prisma } from '@/lib/prisma'

export async function PUT(request: Request, { params }: { params: { id: string } }) {
  try {
    const agendaId = parseInt(params.id)
    const { estado, observacionEliminada } = await request.json()

    // Verificar que el estado sea válido
    if (!Object.values(EstadoAgenda).includes(estado)) {
      return NextResponse.json({ error: 'Estado no válido' }, { status: 400 })
    }

    // Verificar que si el estado es ELIMINADA, se proporcione una observación
    if (estado === EstadoAgenda.ELIMINADA && !observacionEliminada?.trim()) {
      return NextResponse.json({ error: 'Debe proporcionar un motivo para eliminar el evento' }, { status: 400 })
    }

    // Verificar que la agenda existe
    const agenda = await prisma.agenda.findUnique({
      where: { id: agendaId }
    })

    if (!agenda) {
      return NextResponse.json({ error: 'Agenda no encontrada' }, { status: 404 })
    }

    // Preparar los datos para actualizar
    const updateData: { estado: EstadoAgenda; observacionEliminada?: string | null } = { estado }

    // Solo incluir observacionEliminada si el estado es ELIMINADA
    if (estado === EstadoAgenda.ELIMINADA) {
      updateData.observacionEliminada = observacionEliminada
    } else {
      // Limpiar observacionEliminada si el estado no es ELIMINADA
      updateData.observacionEliminada = null
    }

    // Actualizar el estado de la agenda
    const agendaActualizada = await prisma.agenda.update({
      where: { id: agendaId },
      data: updateData
    })

    return NextResponse.json(agendaActualizada)
  } catch (error) {
    console.error('Error al cambiar el estado de la agenda:', error)

    return NextResponse.json({ error: 'Error al cambiar el estado de la agenda' }, { status: 500 })
  }
}
