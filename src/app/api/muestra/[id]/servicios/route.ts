import { NextRequest, NextResponse } from 'next/server'
import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

export async function GET(
    request: NextRequest,
    { params }: { params: { id: string } }
) {
    try {
        const muestraId = parseInt(params.id)

        if (isNaN(muestraId)) {
            return NextResponse.json({ error: 'ID inválido' }, { status: 400 })
        }

        // ✅ 1. Cargar la muestra con sus campos
        const muestra = await prisma.muestra.findUnique({
            where: { id: muestraId },
            include: {
                rcm: true
            }
        })

        if (!muestra) {
            return NextResponse.json({ error: 'Muestra no encontrada' }, { status: 404 })
        }

        // ✅ 2. Cargar servicioMuestra relacionados con esta muestra
        const servicios = await prisma.servicioMuestra.findMany({
            where: {
                muestraId: muestraId
            },
            include: {
                producto: true
            }
        })

        // ✅ 3. Mapear servicios - SKU como código
        const serviciosEnriquecidos = servicios.map(s => ({
            id: s.id,
            codigo: s.producto?.sku ?? s.producto?.SKU ?? s.producto?.codigo ?? s.productoId?.toString() ?? s.id.toString(),
            nombre: s.producto?.nombre ?? 'Sin nombre',
            tipo: s.producto?.familia?.includes('Ensayo') ? 'Ensayo' : 'Análisis',
            cantidad: s.cantidad ?? 1,
            estado: s.estado ?? 'CODIFICADO',
            area: s.producto?.area,
            familia: s.producto?.familia
        }))

        // ✅ 4. Retornar muestra + servicios (observaciones incluido)
        return NextResponse.json({
            muestra: {
                id: muestra.id,
                numeroMuestra: muestra.numeroMuestra,
                numeroTarjeta: muestra.numeroTarjeta,
                tipoMaterial: muestra.tipoMaterial,
                elemento: muestra.elemento,
                item: muestra.item,
                grado: muestra.grado,
                procedencia: muestra.procedencia,
                cotas: muestra.cotas,
                ubicacionSector: muestra.ubicacionSector,
                observaciones: muestra.observaciones ?? muestra.observacion ?? '' // ✅ agregar fallback a 'observacion' (sin 'es')
            },
            servicios: serviciosEnriquecidos
        })
    } catch (error) {
        console.error('Error fetching servicios:', error)
        return NextResponse.json({
            error: 'Error al cargar servicios',
            details: error instanceof Error ? error.message : String(error)
        }, { status: 500 })
    }
}
