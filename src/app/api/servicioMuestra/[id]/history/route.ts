import { NextRequest, NextResponse } from 'next/server'
import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

export async function GET(
    request: NextRequest,
    { params }: { params: { id: string } }
) {
    try {
        const servicioMuestraId = parseInt(params.id)

        if (isNaN(servicioMuestraId)) {
            return NextResponse.json({ error: 'ID inválido' }, { status: 400 })
        }

        console.log('📋 Fetching history for servicioMuestraId:', servicioMuestraId)

        // ✅ CORRECCIÓN: usar servicioMuestraHistorial (sin 'es' al final)
        const history = await prisma.servicioMuestraHistorial.findMany({
            where: { servicioMuestraId },
            orderBy: { registro: 'desc' }
        })

        console.log('✅ History records found:', history.length)
        console.log('📦 Sample record:', history[0])

        return NextResponse.json(history)
    } catch (error) {
        console.error('❌ Error fetching servicioMuestra history:', error)
        return NextResponse.json(
            {
                error: 'Error al cargar historial',
                details: error instanceof Error ? error.message : String(error)
            },
            { status: 500 }
        )
    }
}

export async function POST(
    request: NextRequest,
    { params }: { params: { id: string } }
) {
    try {
        const servicioMuestraId = parseInt(params.id)

        if (isNaN(servicioMuestraId)) {
            return NextResponse.json({ error: 'ID inválido' }, { status: 400 })
        }

        const body = await request.json()

        console.log('📝 Creating history entry:', { servicioMuestraId, body })

        // Validación básica
        if (!body.tipo || !body.estNuevo) {
            return NextResponse.json(
                { error: 'Campos requeridos: tipo, estNuevo' },
                { status: 400 }
            )
        }

        // ✅ CORRECCIÓN: usar servicioMuestraHistorial (sin 'es')
        const historyEntry = await prisma.servicioMuestraHistorial.create({
            data: {
                servicioMuestraId,
                registro: new Date(),
                funcionario: body.funcionario ?? 'Usuario',
                aplicadoA: body.aplicadoA ?? null,
                ensayoServicio: body.ensayoServicio ?? null,
                tipo: body.tipo,
                estAnterior: body.estAnterior ?? body.estPrev ?? null,
                estNuevo: body.estNuevo,
                fechaAccion: new Date(),
                observacion: body.observacion ?? null,
                motivo: body.motivo ?? null,
                informe: body.informe ?? null
            }
        })

        console.log('✅ History entry created:', historyEntry)

        // Actualizar estado del servicio
        await prisma.servicioMuestra.update({
            where: { id: servicioMuestraId },
            data: { estado: body.estNuevo }
        })

        return NextResponse.json(historyEntry, { status: 201 })
    } catch (error) {
        console.error('❌ Error creating servicioMuestra history:', error)
        return NextResponse.json(
            {
                error: 'Error al crear historial',
                details: error instanceof Error ? error.message : String(error)
            },
            { status: 500 }
        )
    }
}
