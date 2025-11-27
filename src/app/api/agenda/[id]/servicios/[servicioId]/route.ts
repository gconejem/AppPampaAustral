import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export const dynamic = 'force-dynamic'
export const revalidate = 0

// PUT /api/agenda/[id]/servicios/[servicioId] - Actualizar un servicio de una visita
export async function PUT(
    request: Request,
    { params }: { params: { id: string; servicioId: string } }
) {
    try {
        const agendaId = parseInt(params.id)
        const servicioId = parseInt(params.servicioId)
        const data = await request.json()

        // Verificar que la agenda existe
        const agenda = await prisma.agenda.findUnique({
            where: { id: agendaId }
        })

        if (!agenda) {
            return NextResponse.json({ error: 'Visita no encontrada' }, { status: 404 })
        }

        // Verificar que el servicio existe y pertenece a esta agenda
        const servicioExistente = await prisma.agendaServicio.findFirst({
            where: {
                id: servicioId,
                agendaId: agendaId
            }
        })

        if (!servicioExistente) {
            return NextResponse.json({
                error: 'Servicio no encontrado o no pertenece a esta visita'
            }, { status: 404 })
        }

        // Actualizar el servicio
        const servicioActualizado = await prisma.agendaServicio.update({
            where: { id: servicioId },
            data: {
                cantidad: data.cantidad,
                observacion: data.observacion || ''
            }
        })

        return NextResponse.json({
            message: 'Servicio actualizado correctamente',
            servicio: servicioActualizado
        })

    } catch (error) {
        console.error('Error al actualizar servicio:', error)
        return NextResponse.json({
            error: 'Error interno del servidor al actualizar el servicio'
        }, { status: 500 })
    }
}

// DELETE /api/agenda/[id]/servicios/[servicioId] - Eliminar un servicio de una visita
export async function DELETE(
    request: Request,
    { params }: { params: { id: string; servicioId: string } }
) {
    try {
        const agendaId = parseInt(params.id)
        const servicioId = parseInt(params.servicioId)

        // Verificar que la agenda existe
        const agenda = await prisma.agenda.findUnique({
            where: { id: agendaId }
        })

        if (!agenda) {
            return NextResponse.json({ error: 'Visita no encontrada' }, { status: 404 })
        }

        // Verificar que el servicio existe y pertenece a esta agenda
        const servicio = await prisma.agendaServicio.findFirst({
            where: {
                id: servicioId,
                agendaId: agendaId
            }
        })

        if (!servicio) {
            return NextResponse.json({
                error: 'Servicio no encontrado o no pertenece a esta visita'
            }, { status: 404 })
        }

        // Eliminar el servicio
        await prisma.agendaServicio.delete({
            where: { id: servicioId }
        })

        return NextResponse.json({
            message: 'Servicio eliminado correctamente'
        })

    } catch (error) {
        console.error('Error al eliminar servicio:', error)
        return NextResponse.json({
            error: 'Error interno del servidor al eliminar el servicio'
        }, { status: 500 })
    }
}
