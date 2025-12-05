import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

// GET - Obtener una calibración específica
export async function GET(
    request: NextRequest,
    { params }: { params: { id: string } }
) {
    try {
        const id = parseInt(params.id)

        const calibracion = await prisma.calibracionEquipo.findUnique({
            where: { id },
            include: {
                detalles: {
                    orderBy: {
                        id: 'asc'
                    }
                },
                equipo: {
                    select: {
                        id: true,
                        codigo: true,
                        nombre: true
                    }
                }
            }
        })

        if (!calibracion) {
            return NextResponse.json(
                { error: 'Calibración no encontrada' },
                { status: 404 }
            )
        }

        return NextResponse.json(calibracion)
    } catch (error: any) {
        console.error('Error al obtener calibración:', error)
        return NextResponse.json(
            { error: 'Error al obtener la calibración' },
            { status: 500 }
        )
    }
}

// PUT - Actualizar una calibración
export async function PUT(
    request: NextRequest,
    { params }: { params: { id: string } }
) {
    try {
        const id = parseInt(params.id)
        const body = await request.json()
        const { fechaCalibracion, certificado, equipoId, detalles } = body

        // Validaciones
        if (!fechaCalibracion || !certificado) {
            return NextResponse.json(
                { error: 'Fecha de calibración y certificado son requeridos' },
                { status: 400 }
            )
        }

        if (!Array.isArray(detalles) || detalles.length === 0) {
            return NextResponse.json(
                { error: 'Debe proporcionar al menos un detalle de corrección' },
                { status: 400 }
            )
        }

        // Verificar que existe
        const existingCalibracion = await prisma.calibracionEquipo.findUnique({
            where: { id }
        })

        if (!existingCalibracion) {
            return NextResponse.json(
                { error: 'Calibración no encontrada' },
                { status: 404 }
            )
        }

        // Actualizar calibración
        // Primero eliminar detalles existentes
        await prisma.detalleCalibracion.deleteMany({
            where: { calibracionEquipoId: id }
        })

        // Luego actualizar calibración y crear nuevos detalles
        const calibracion = await prisma.calibracionEquipo.update({
            where: { id },
            data: {
                fechaCalibracion: new Date(fechaCalibracion),
                certificado,
                equipoId: equipoId ? parseInt(equipoId) : null,
                detalles: {
                    create: detalles.map((detalle: { datoEquipo: string; correccion: string }) => ({
                        datoEquipo: detalle.datoEquipo,
                        correccion: detalle.correccion
                    }))
                }
            },
            include: {
                detalles: true,
                equipo: {
                    select: {
                        id: true,
                        codigo: true,
                        nombre: true
                    }
                }
            }
        })

        return NextResponse.json(calibracion)
    } catch (error: any) {
        console.error('Error al actualizar calibración:', error)
        return NextResponse.json(
            { error: 'Error al actualizar la calibración' },
            { status: 500 }
        )
    }
}

// DELETE - Eliminar una calibración
export async function DELETE(
    request: NextRequest,
    { params }: { params: { id: string } }
) {
    try {
        const id = parseInt(params.id)

        // Verificar que existe
        const existingCalibracion = await prisma.calibracionEquipo.findUnique({
            where: { id }
        })

        if (!existingCalibracion) {
            return NextResponse.json(
                { error: 'Calibración no encontrada' },
                { status: 404 }
            )
        }

        // Eliminar calibración (los detalles se eliminan automáticamente por onDelete: Cascade)
        await prisma.calibracionEquipo.delete({
            where: { id }
        })

        return NextResponse.json({ message: 'Calibración eliminada correctamente' })
    } catch (error: any) {
        console.error('Error al eliminar calibración:', error)
        return NextResponse.json(
            { error: 'Error al eliminar la calibración' },
            { status: 500 }
        )
    }
}
