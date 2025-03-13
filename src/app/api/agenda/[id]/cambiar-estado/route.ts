import { NextResponse } from 'next/server'

import { EstadoAgenda } from '@prisma/client'

import { prisma } from '@/lib/prisma'

export async function PUT(request: Request, { params }: { params: { id: string } }) {
  try {
    const agendaId = parseInt(params.id)
    const { estado } = await request.json()

    // Verificar que el estado sea válido
    if (!Object.values(EstadoAgenda).includes(estado)) {
      return NextResponse.json({ error: 'Estado no válido' }, { status: 400 })
    }

    // Verificar que la agenda existe
    const agenda = await prisma.agenda.findUnique({
      where: { id: agendaId }
    })

    if (!agenda) {
      return NextResponse.json({ error: 'Agenda no encontrada' }, { status: 404 })
    }

    // Actualizar el estado de la agenda
    const agendaActualizada = await prisma.agenda.update({
      where: { id: agendaId },
      data: { estado }
    })

    return NextResponse.json(agendaActualizada)
  } catch (error) {
    console.error('Error al cambiar el estado de la agenda:', error)

    return NextResponse.json({ error: 'Error al cambiar el estado de la agenda' }, { status: 500 })
  }
}
