import { NextResponse } from 'next/server'

import { prisma } from '@/lib/prisma'

export async function PUT(request: Request, { params }: { params: { id: string } }) {
  try {
    const visitaId = parseInt(params.id)

    if (isNaN(visitaId)) {
      return NextResponse.json({ error: 'ID de visita inválido' }, { status: 400 })
    }

    const data = await request.json()
    const { estado, ordenesTrabajoEstado } = data

    // Validar que el estado sea uno de los permitidos
    const estadosPermitidos = ['AGENDADA', 'COMPLETADA', 'SUSPENDIDA', 'CANCELADA', 'REVISIÓN', 'OK']

    if (estado && !estadosPermitidos.includes(estado)) {
      return NextResponse.json({ error: 'Estado de visita no válido' }, { status: 400 })
    }

    // Actualizar el estado de la visita (agenda)
    const visita = await prisma.agenda.update({
      where: { id: visitaId },
      data: { estado },
      include: {
        ordenesTrabajo: true
      }
    })

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
