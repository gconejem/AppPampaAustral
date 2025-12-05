import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

// GET - Obtener todas las calibraciones o las de un equipo específico
export async function GET(request: NextRequest) {
    try {
        const { searchParams } = new URL(request.url)
        const equipoId = searchParams.get('equipoId')

        const calibraciones = await prisma.calibracionEquipo.findMany({
            where: equipoId ? { equipoId: parseInt(equipoId) } : {},
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
            },
            orderBy: {
                fechaCalibracion: 'desc'
            }
        })

        return NextResponse.json(calibraciones)
    } catch (error: any) {
        console.error('Error al obtener calibraciones:', error)
        return NextResponse.json(
            { error: 'Error al obtener las calibraciones' },
            { status: 500 }
        )
    }
}

// POST - Crear una nueva calibración
export async function POST(request: NextRequest) {
    try {
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

        // Crear calibración con detalles
        const calibracion = await prisma.calibracionEquipo.create({
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

        return NextResponse.json(calibracion, { status: 201 })
    } catch (error: any) {
        console.error('Error al crear calibración:', error)
        return NextResponse.json(
            { error: 'Error al crear la calibración' },
            { status: 500 }
        )
    }
}
