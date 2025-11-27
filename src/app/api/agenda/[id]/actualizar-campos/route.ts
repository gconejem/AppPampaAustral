import { NextResponse } from 'next/server'

import { prisma } from '@/lib/prisma'

export const dynamic = 'force-dynamic'
export const revalidate = 0

export async function PUT(request: Request, { params }: { params: { id: string } }) {
    try {
        const id = parseInt(params.id)
        const data = await request.json()

        // Verificar que el evento existe
        const existeAgenda = await prisma.agenda.findUnique({
            where: { id }
        })

        if (!existeAgenda) {
            return NextResponse.json({ error: 'Agenda no encontrada' }, { status: 404 })
        }

        // Obtener el comprobanteVisitaJSON actual para actualizarlo
        const comprobanteActual = existeAgenda.comprobanteVisitaJSON as any || {}

        // Actualizar el JSON con los nuevos valores
        const comprobanteActualizado = {
            ...comprobanteActual,
            ACEPVISITA: {
                ...comprobanteActual.ACEPVISITA,
                hora_llegada: data.horaLlegada,
                hora_salida: data.horaSalida,
                movilizacion: data.movilizacion,
                // Agregar kmAdicionales si existe en el JSON original o si se está actualizando
                ...(data.kmAdicionales !== undefined && { km_adicionales: data.kmAdicionales })
            }
        }

        // Actualizar solo los campos específicos
        const agendaActualizada = await prisma.agenda.update({
            where: { id },
            data: {
                horaLlegada: data.horaLlegada,
                horaSalida: data.horaSalida,
                movilizacion: data.movilizacion,
                kmAdicionales: data.kmAdicionales,
                comprobanteVisitaJSON: comprobanteActualizado
            },
            include: {
                cliente: true,
                servicios: true,
                asignados: {
                    include: {
                        user: true
                    }
                },
                equipos: {
                    include: {
                        equipo: true
                    }
                },
                obra: true,
                contactos: true
            }
        })

        return NextResponse.json(agendaActualizada)
    } catch (error) {
        console.error('Error al actualizar campos de agenda:', error)

        return NextResponse.json({
            error: 'Error al actualizar los campos de la agenda',
            message: error instanceof Error ? error.message : 'Error desconocido'
        }, { status: 500 })
    }
}
