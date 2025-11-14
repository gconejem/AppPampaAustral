import { NextRequest, NextResponse } from 'next/server'
import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

export async function GET(
    request: NextRequest,
    { params }: { params: { id: string } }
) {
    const { id } = params

    if (!id) {
        return NextResponse.json({ error: 'Missing id' }, { status: 400 })
    }

    try {
        const servicioMuestraId = Number(id)

        console.log(`📊 ===== INICIANDO BÚSQUEDA DE HISTORIAL =====`)
        console.log(`📊 servicioMuestraId recibido: ${servicioMuestraId}`)
        console.log(`📊 Tipo: ${typeof servicioMuestraId}`)

        // ✅ Primero verificar si el ServicioMuestra existe
        const servicioMuestra = await prisma.servicioMuestra.findUnique({
            where: { id: servicioMuestraId },
            select: {
                id: true,
                muestraId: true,
                productoId: true,
                estado: true
            }
        })

        console.log(`📦 ServicioMuestra encontrado:`, servicioMuestra)

        if (!servicioMuestra) {
            console.log(`⚠️ ServicioMuestra ${servicioMuestraId} no existe`)
            return NextResponse.json({ error: 'ServicioMuestra no encontrado' }, { status: 404 })
        }

        // ✅ Consultar historial
        console.log(`🔍 Buscando en ServicioMuestraHistorial donde servicioMuestraId = ${servicioMuestraId}`)

        const historial = await prisma.servicioMuestraHistorial.findMany({
            where: { servicioMuestraId },
            orderBy: { registro: 'desc' },
            include: {
                servicioMuestra: {
                    include: {
                        producto: true,
                        muestra: true
                    }
                }
            }
        })

        console.log(`📊 Registros encontrados: ${historial.length}`)

        if (historial.length > 0) {
            console.log(`📋 Primer registro completo:`, JSON.stringify(historial[0], null, 2))
        } else {
            console.log(`⚠️ No se encontraron registros de historial para servicioMuestraId: ${servicioMuestraId}`)

            // Debug adicional: buscar TODOS los registros para ver qué IDs existen
            const todosLosRegistros = await prisma.servicioMuestraHistorial.findMany({
                select: {
                    id: true,
                    servicioMuestraId: true,
                    tipo: true,
                    registro: true
                },
                take: 10
            })

            console.log(`📊 Muestra de registros existentes en ServicioMuestraHistorial:`, todosLosRegistros)
        }

        // ✅ Mapear al formato esperado por el frontend
        const mapped = historial.map(h => ({
            registro: h.registro,
            funcionario: h.funcionario,
            aplicadoA: h.aplicadoA,
            ensayoServicio: h.ensayoServicio ?? h.servicioMuestra?.producto?.nombre ?? null,
            tipo: h.tipo,
            estAnterior: h.estAnterior,
            estNuevo: h.estNuevo,
            fechaAccion: h.fechaAccion,
            observacion: h.observacion,
            motivo: h.motivo,
            informe: h.informe
        }))

        console.log(`✅ Retornando ${mapped.length} registros mapeados`)

        return NextResponse.json(mapped)
    } catch (error) {
        console.error('❌ Error fetching servicioMuestra history:', error)
        return NextResponse.json(
            {
                error: 'Internal server error',
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
        // ✅ servicioMuestraId viene del parámetro de la URL
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

        // ✅ Crear registro de historial - servicioMuestraId viene del param, NO del body
        const historyEntry = await prisma.servicioMuestraHistorial.create({
            data: {
                servicioMuestraId, // ← CORRECTO: usa el param de la URL
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

        // ✅ Actualizar estado del servicio
        await prisma.servicioMuestra.update({
            where: { id: servicioMuestraId },
            data: { estado: body.estNuevo }
        })

        console.log(`✅ Updated servicioMuestra ${servicioMuestraId} estado to ${body.estNuevo}`)

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
