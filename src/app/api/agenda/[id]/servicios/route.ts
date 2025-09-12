import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

// POST /api/agenda/[id]/servicios - Agregar un nuevo servicio a una visita
export async function POST(request: Request, { params }: { params: { id: string } }) {
    try {
        const agendaId = parseInt(params.id)
        const data = await request.json()

        // Verificar que la agenda existe
        const agenda = await prisma.agenda.findUnique({
            where: { id: agendaId }
        })

        if (!agenda) {
            return NextResponse.json({ error: 'Visita no encontrada' }, { status: 404 })
        }

        // Validar datos requeridos
        if (!data.codigo || !data.servicio || data.cantidad === undefined) {
            return NextResponse.json({
                error: 'Faltan datos requeridos: codigo, servicio y cantidad'
            }, { status: 400 })
        }

        // Crear el nuevo servicio
        const nuevoServicio = await prisma.agendaServicio.create({
            data: {
                agendaId: agendaId,
                codigo: data.codigo,
                servicio: data.servicio,
                cantidad: data.cantidad,
                observacion: data.observacion || '',
                esSegundaVisita: data.esSegundaVisita || false
            }
        })

        return NextResponse.json({
            message: 'Servicio agregado correctamente',
            servicio: nuevoServicio
        })

    } catch (error) {
        console.error('Error al agregar servicio:', error)
        return NextResponse.json({
            error: 'Error interno del servidor al agregar el servicio'
        }, { status: 500 })
    }
}

