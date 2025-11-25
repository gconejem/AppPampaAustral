import { prisma } from '../../../../lib/prisma'

export const dynamic = 'force-dynamic'
export const revalidate = 0

function normalizeKey(k: string) {
    return (k || '').toString().toLowerCase().replace(/[^a-z0-9]/g, '')
}

function flattenOneLevel(obj: any): Record<string, any> {
    const out: Record<string, any> = {}
    for (const k of Object.keys(obj || {})) {
        const v = obj[k]
        out[k] = v
        if (v && typeof v === 'object' && !Array.isArray(v)) {
            for (const ck of Object.keys(v)) {
                out[`${k}.${ck}`] = v[ck]
            }
        }
    }
    return out
}

// campos simplificados que deben aparecer en la salida si hacen match
const TARGET_KEYS = [
    'lbrutas_clave',
    'CODIGO',
    'NOMBRE',
    'SERIE',
    'MARCA',
    'MODELO'
]

export async function GET(request: Request) {
    try {
        if (!prisma) {
            return new Response(JSON.stringify({ error: 'Prisma client not initialized' }), { status: 500, headers: { 'Content-Type': 'application/json' } })
        }

        const model =
            (prisma as any).equipo ??
            (prisma as any).Equipo ??
            (prisma as any).equipos ??
            (prisma as any).Equipos

        if (!model || typeof model.findMany !== 'function') {
            return new Response(JSON.stringify({ error: "Prisma model 'equipo' not available", prismaKeys: Object.keys(prisma) }), { status: 500, headers: { 'Content-Type': 'application/json' } })
        }

        const { searchParams } = new URL(request.url)
        const codigo = searchParams.get('codigo')
        const equipoId = searchParams.get('equipoId')
        const obraId = searchParams.get('obraId')
        const limit = Number(searchParams.get('limit') ?? 200)

        const where: any = {}
        if (codigo) where.codigo = { contains: codigo }
        if (equipoId) where.id = Number(equipoId)
        if (obraId) where.obraId = Number(obraId)

        const raw = await model.findMany({ where, take: limit })

        function findValue(flat: Record<string, any>, target: string) {
            const tn = normalizeKey(target)
            const found = Object.keys(flat).find(k => {
                const kn = normalizeKey(k)
                return kn === tn || kn.includes(tn) || tn.includes(kn)
            })
            return found !== undefined ? flat[found] : undefined
        }

        const mapped = raw.map((r: any) => {
            const flat = flattenOneLevel(r)
            const out: Record<string, any> = {}

            for (const tk of TARGET_KEYS) {
                const v = findValue(flat, tk)
                out[tk] = v === undefined ? null : (v instanceof Date ? v.toISOString() : v)
            }

            // fallbacks comunes:
            if (!out['CODIGO']) {
                out['CODIGO'] = findValue(flat, 'codigo') ?? findValue(flat, 'code') ?? findValue(flat, 'id') ?? null
            }
            if (!out['NOMBRE']) {
                out['NOMBRE'] = findValue(flat, 'nombre') ?? findValue(flat, 'name') ?? findValue(flat, 'descripcion') ?? null
            }
            if (!out['lbrutas_clave']) {
                out['lbrutas_clave'] = findValue(flat, 'clave') ?? findValue(flat, 'lbrutasclave') ?? null
            }

            return out
        })

        return new Response(JSON.stringify(mapped), { status: 200, headers: { 'Content-Type': 'application/json' } })
    } catch (error: any) {
        console.error('GET /api/equipo/app mapping error:', error)
        return new Response(JSON.stringify({ error: error?.message ?? 'unknown' }), { status: 500, headers: { 'Content-Type': 'application/json' } })
    }
}
