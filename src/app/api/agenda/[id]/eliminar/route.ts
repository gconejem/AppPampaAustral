import { NextResponse } from 'next/server'

import { prisma } from '@/lib/prisma'

export const dynamic = 'force-dynamic'
export const revalidate = 0

export async function DELETE(request: Request, { params }: { params: { id: string } }) {
  try {
    const agendaId = parseInt(params.id)

    // Verificar que la agenda existe
    const agenda = await prisma.agenda.findUnique({
      where: { id: agendaId }
    })

    if (!agenda) {
      return NextResponse.json({ error: 'Agenda no encontrada' }, { status: 404 })
    }

    // Usar una transacción para eliminar todo en el orden correcto
    await prisma.$transaction(async tx => {
      // 1. Eliminar contactos asociados
      await tx.contactoAgenda.deleteMany({
        where: { agendaId }
      })

      // 2. Eliminar servicios asociados
      await tx.agendaServicio.deleteMany({
        where: { agendaId }
      })

      // 3. Eliminar asignados
      await tx.agendaAsignado.deleteMany({
        where: { agendaId }
      })

      // 4. Eliminar equipos
      await tx.agendaEquipo.deleteMany({
        where: { agendaId }
      })

      // 5. Finalmente eliminar la agenda
      await tx.agenda.delete({
        where: { id: agendaId }
      })
    })

    return NextResponse.json({ message: 'Agenda eliminada correctamente' })
  } catch (error) {
    console.error('Error al eliminar la agenda:', error)

    return NextResponse.json({ error: 'Error al eliminar la agenda' }, { status: 500 })
  }
}
