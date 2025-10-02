import { NextResponse } from 'next/server'

import { EstadoAgenda, MotivoSuspension } from '@prisma/client'

import { prisma } from '@/lib/prisma'

export async function PUT(request: Request, { params }: { params: { id: string } }) {
  try {
    const agendaId = parseInt(params.id)
    const { estado, observacionEliminada, motivoSuspension, observacionSuspendida, observacionAgendada, observacionAnuladaGeneral } = await request.json()

    // Verificar que el estado sea válido
    if (!Object.values(EstadoAgenda).includes(estado)) {
      return NextResponse.json({ error: 'Estado no válido' }, { status: 400 })
    }

    // Verificar que si el estado es ELIMINADA, se proporcione una observación
    if (estado === EstadoAgenda.ELIMINADA && !observacionEliminada?.trim()) {
      return NextResponse.json({ error: 'Debe proporcionar un motivo para eliminar el evento' }, { status: 400 })
    }

    // Verificar que si el estado es SUSPENDIDA, se proporcione un motivo
    if (estado === EstadoAgenda.SUSPENDIDA && !motivoSuspension) {
      return NextResponse.json({ error: 'Debe proporcionar un motivo de suspensión' }, { status: 400 })
    }

    // Verificar que si el motivo es OTRO, se proporcione una observación
    if (estado === EstadoAgenda.SUSPENDIDA && motivoSuspension === 'OTRO' && !observacionSuspendida?.trim()) {
      return NextResponse.json({ error: 'Debe especificar el motivo de suspensión' }, { status: 400 })
    }

    // Verificar que la agenda existe
    const agenda = await prisma.agenda.findUnique({
      where: { id: agendaId }
    })

    if (!agenda) {
      return NextResponse.json({ error: 'Agenda no encontrada' }, { status: 404 })
    }

    // Preparar los datos para actualizar
    const updateData: {
      estado: EstadoAgenda;
      observacionEliminada?: string | null;
      motivoSuspension?: MotivoSuspension | null;
      observacionSuspendida?: string | null;
      observacionAgendada?: string | null;
      observacionAnuladaGeneral?: string | null;
    } = { estado }

    // Manejar campos específicos según el estado
    if (estado === EstadoAgenda.ELIMINADA) {
      updateData.observacionEliminada = observacionEliminada
      updateData.motivoSuspension = null
      updateData.observacionSuspendida = null
      updateData.observacionAgendada = null
      updateData.observacionAnuladaGeneral = null
    } else if (estado === EstadoAgenda.SUSPENDIDA) {
      updateData.motivoSuspension = motivoSuspension as MotivoSuspension
      updateData.observacionSuspendida = motivoSuspension === 'OTRO' ? observacionSuspendida : null
      updateData.observacionAnuladaGeneral = observacionAnuladaGeneral
      updateData.observacionEliminada = null
      updateData.observacionAgendada = null
    } else if (estado === EstadoAgenda.AGENDADA) {
      updateData.observacionAgendada = observacionAgendada
      updateData.observacionEliminada = null
      updateData.motivoSuspension = null
      updateData.observacionSuspendida = null
      updateData.observacionAnuladaGeneral = null
    } else {
      // Limpiar todos los campos de observación para otros estados
      updateData.observacionEliminada = null
      updateData.motivoSuspension = null
      updateData.observacionSuspendida = null
      updateData.observacionAgendada = null
      updateData.observacionAnuladaGeneral = null
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
