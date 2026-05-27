import { NextResponse } from 'next/server'

import { prisma } from '@/lib/prisma'

export const dynamic = 'force-dynamic'

interface TarjetaMatch {
    id: number
    numeroRcm: string
    numeroTarjeta: string | null
    ordenTrabajoId: string | null
    createdAt: Date
    clienteId: number | null
    nombreCliente: string | null
    razonSocial: string | null
    obraId: number | null
    nombreObra: string | null
}

const buildResponse = (matches: TarjetaMatch[]) => ({
    exists: matches.length > 0,
    matches: matches.map(match => ({
        id: match.id,
        numeroRcm: match.numeroRcm,
        numeroTarjeta: match.numeroTarjeta,
        ordenTrabajoId: match.ordenTrabajoId,
        createdAt: match.createdAt,
        cliente: match.clienteId
            ? {
                id: match.clienteId,
                nombreCliente: match.nombreCliente,
                razonSocial: match.razonSocial,
            }
            : null,
        obra: match.obraId
            ? {
                id: match.obraId,
                nombreObra: match.nombreObra,
            }
            : null,
    })),
})

export async function GET(request: Request) {
    try {
        const { searchParams } = new URL(request.url)
        const numero = searchParams.get('numero')?.trim()
        const excludeIdParam = searchParams.get('excludeId')
        const excludeId = excludeIdParam ? Number.parseInt(excludeIdParam, 10) : null

        if (!numero) {
            return NextResponse.json(buildResponse([]))
        }

        const matches = excludeId && Number.isFinite(excludeId)
            ? await prisma.$queryRaw<TarjetaMatch[]>`
                SELECT
                    r."id",
                    r."numeroRcm",
                    r."numeroTarjeta",
                    r."ordenTrabajoId",
                    r."createdAt",
                    c."clienteId",
                    c."nombreCliente",
                    c."razonSocial",
                    o."obraId",
                    o."nombreObra"
                FROM "RCM" r
                LEFT JOIN "Cliente" c ON c."clienteId" = r."clienteId"
                LEFT JOIN "Obra" o ON o."obraId" = r."obraId"
                WHERE r."rcmType" = 'Muestra'
                    AND r."numeroTarjeta" IS NOT NULL
                    AND TRIM(r."numeroTarjeta") = ${numero}
                    AND r."id" <> ${excludeId}
                ORDER BY r."createdAt" DESC
                LIMIT 5
            `
            : await prisma.$queryRaw<TarjetaMatch[]>`
                SELECT
                    r."id",
                    r."numeroRcm",
                    r."numeroTarjeta",
                    r."ordenTrabajoId",
                    r."createdAt",
                    c."clienteId",
                    c."nombreCliente",
                    c."razonSocial",
                    o."obraId",
                    o."nombreObra"
                FROM "RCM" r
                LEFT JOIN "Cliente" c ON c."clienteId" = r."clienteId"
                LEFT JOIN "Obra" o ON o."obraId" = r."obraId"
                WHERE r."rcmType" = 'Muestra'
                    AND r."numeroTarjeta" IS NOT NULL
                    AND TRIM(r."numeroTarjeta") = ${numero}
                ORDER BY r."createdAt" DESC
                LIMIT 5
            `

        return NextResponse.json(buildResponse(matches))
    } catch (error) {
        console.error('Error al consultar tarjeta RCM:', error)

        return NextResponse.json(
            {
                error: 'Error al consultar tarjeta RCM',
                message: error instanceof Error ? error.message : 'Error desconocido',
            },
            { status: 500 }
        )
    }
}
