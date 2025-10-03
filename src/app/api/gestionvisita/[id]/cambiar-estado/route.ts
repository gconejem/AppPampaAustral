import { NextResponse } from 'next/server'

import { EstadoAgenda, MotivoSuspension } from '@prisma/client'

import { prisma } from '@/lib/prisma'

export const dynamic = 'force-dynamic'
export const revalidate = 0

export async function PUT(request: Request, { params }: { params: { id: string } }) {
  try {
    const visitaId = parseInt(params.id)

    if (isNaN(visitaId)) {
      return NextResponse.json({ error: 'ID de visita inválido' }, { status: 400 })
    }

    const data = await request.json()
    const {
      estado,
      ordenesTrabajoEstado,
      observacionEliminada,
      motivoSuspension,
      observacionSuspendida,
      observacionEnRevision,
      observacionAnulada,
      observacionRecibidaOK
    } = data

    // Validar que el estado sea uno de los permitidos
    const estadosPermitidos = [
      'CREADA', 'ELIMINADA', 'AGENDADA', 'SUSPENDIDA', 'SUSPENDIDA_TERRENO',
      'COMPLETADA', 'EN_REVISION', 'ANULADA', 'RECIBIDA_OK', 'CODIFICADA'
    ]

    if (estado && !estadosPermitidos.includes(estado)) {
      return NextResponse.json({ error: 'Estado de visita no válido' }, { status: 400 })
    }

    // Validaciones específicas por estado
    if (estado === 'ELIMINADA' && !observacionEliminada?.trim()) {
      return NextResponse.json({ error: 'Debe proporcionar observaciones para eliminación' }, { status: 400 })
    }

    if (estado === 'SUSPENDIDA' && !motivoSuspension) {
      return NextResponse.json({ error: 'Debe proporcionar un motivo de suspensión' }, { status: 400 })
    }

    if (estado === 'SUSPENDIDA' && motivoSuspension === 'OTRO' && !observacionSuspendida?.trim()) {
      return NextResponse.json({ error: 'Debe especificar el motivo de suspensión' }, { status: 400 })
    }

    if ((estado === 'EN_REVISION' || estado === 'ANULADA' || estado === 'RECIBIDA_OK') &&
      !observacionEnRevision?.trim() && !observacionAnulada?.trim() && !observacionRecibidaOK?.trim()) {
      return NextResponse.json({ error: 'Debe proporcionar observaciones para este estado' }, { status: 400 })
    }

    // Preparar los datos para actualizar
    const updateData: any = { estado }

    // Manejar campos específicos según el estado
    if (estado === 'ELIMINADA') {
      updateData.observacionEliminada = observacionEliminada
      updateData.motivoSuspension = null
      updateData.observacionSuspendida = null
      updateData.observacionEnRevision = null
      updateData.observacionAnulada = null
      updateData.observacionRecibidaOK = null
    } else if (estado === 'SUSPENDIDA') {
      updateData.motivoSuspension = motivoSuspension as MotivoSuspension
      updateData.observacionSuspendida = motivoSuspension === 'OTRO' ? observacionSuspendida : null
      updateData.observacionEliminada = null
      updateData.observacionEnRevision = null
      updateData.observacionAnulada = null
      updateData.observacionRecibidaOK = null
    } else if (estado === 'EN_REVISION') {
      updateData.observacionEnRevision = observacionEnRevision
      updateData.observacionEliminada = null
      updateData.motivoSuspension = null
      updateData.observacionSuspendida = null
      updateData.observacionAnulada = null
      updateData.observacionRecibidaOK = null
    } else if (estado === 'ANULADA') {
      updateData.observacionAnulada = observacionAnulada
      updateData.observacionEliminada = null
      updateData.motivoSuspension = null
      updateData.observacionSuspendida = null
      updateData.observacionEnRevision = null
      updateData.observacionRecibidaOK = null
    } else if (estado === 'RECIBIDA_OK') {
      updateData.observacionRecibidaOK = observacionRecibidaOK
      updateData.observacionEliminada = null
      updateData.motivoSuspension = null
      updateData.observacionSuspendida = null
      updateData.observacionEnRevision = null
      updateData.observacionAnulada = null
    } else {
      // Limpiar todos los campos de observación para otros estados
      updateData.observacionEliminada = null
      updateData.motivoSuspension = null
      updateData.observacionSuspendida = null
      updateData.observacionEnRevision = null
      updateData.observacionAnulada = null
      updateData.observacionRecibidaOK = null
    }

    // Actualizar el estado de la visita (agenda)
    const visita = await prisma.agenda.update({
      where: { id: visitaId },
      data: updateData,
      include: {
        ordenesTrabajo: true
      }
    })

    // Si se cambió el estado a RECIBIDA_OK, automáticamente actualizar todas las OTs a DISPONIBLE
    if (estado === 'RECIBIDA_OK' && visita.ordenesTrabajo && visita.ordenesTrabajo.length > 0) {
      console.log(`Actualizando ${visita.ordenesTrabajo.length} OTs a DISPONIBLE para visita ${visitaId}`)

      // Actualizar todas las órdenes de trabajo asociadas a esta visita a DISPONIBLE
      await prisma.ordenTrabajo.updateMany({
        where: { agendaId: visitaId },
        data: { estado: 'DISPONIBLE' }
      })

      // Obtener las órdenes de trabajo actualizadas
      const ordenesTrabajo = await prisma.ordenTrabajo.findMany({
        where: { agendaId: visitaId }
      })

      return NextResponse.json({
        visita,
        ordenesTrabajo,
        message: `Visita actualizada a RECIBIDA_OK y ${ordenesTrabajo.length} OTs actualizadas a DISPONIBLE`
      })
    }

    // Si se proporcionó un estado para las órdenes de trabajo, actualizarlas
    if (ordenesTrabajoEstado && visita.ordenesTrabajo && visita.ordenesTrabajo.length > 0) {
      // Actualizar todas las órdenes de trabajo asociadas a esta visita
      await prisma.ordenTrabajo.updateMany({
        where: { agendaId: visitaId },
        data: { estado: ordenesTrabajoEstado }
      })

      // Obtener las órdenes de trabajo actualizadas
      const ordenesTrabajo = await prisma.ordenTrabajo.findMany({
        where: { agendaId: visitaId }
      })

      return NextResponse.json({
        visita,
        ordenesTrabajo
      })
    }

    return NextResponse.json({ visita })
  } catch (error) {
    console.error('Error al actualizar el estado de la visita:', error)

    return NextResponse.json({ error: 'Error al actualizar el estado de la visita' }, { status: 500 })
  }
}
