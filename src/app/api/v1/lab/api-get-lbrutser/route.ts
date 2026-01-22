import { prisma } from '@/lib/prisma'

export const dynamic = 'force-dynamic'
export const revalidate = 0
function corsHeaders() {
  return {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization'
  }
}

export async function OPTIONS() {
  return new Response(null, { headers: corsHeaders() })
}

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

const TARGET_KEYS = ['CODIGO', 'FORMULARIO', 'DESCRIP']

export async function GET(request: Request) {
  try {
    if (!prisma) {
      return new Response(JSON.stringify({ error: 'Prisma client not initialized' }), { status: 500, headers: { ...corsHeaders(), 'Content-Type': 'application/json' } })
    }

    const model =
      (prisma as any).tipoOrdenTrabajo ??
      (prisma as any).TipoOrdenTrabajo ??
      (prisma as any).tipoordentrabajo ??
      (prisma as any).tipoOrdenTrabajos ??
      (prisma as any).TipoOrdenTrabajos

    if (!model || typeof model.findMany !== 'function') {
      return new Response(JSON.stringify({ error: "Prisma model for 'TipoOrdenTrabajo' not available", prismaKeys: Object.keys(prisma) }), {
        status: 500,
        headers: { ...corsHeaders(), 'Content-Type': 'application/json' }
      })
    }

    const { searchParams } = new URL(request.url)
    const id = searchParams.get('id')
    const nombre = searchParams.get('nombre')
    const estado = searchParams.get('estado')
    const limit = Number(searchParams.get('limit') ?? 200)

    const where: any = {}
    if (id) {
      const n = Number(id)
      where.id = Number.isNaN(n) ? id : n
    }
    if (nombre) where.nombre = { contains: nombre, mode: 'insensitive' }
    if (estado) where.estado = estado

    const raw = await model.findMany({ where, take: limit })

    function findValue(flat: Record<string, any>, target: string) {
      const tn = normalizeKey(target)
      const foundKey = Object.keys(flat).find(k => {
        const kn = normalizeKey(k)
        return kn === tn || kn.includes(tn) || tn.includes(kn)
      })
      return foundKey !== undefined ? flat[foundKey] : undefined
    }

    // mapear cada registro: incluir sólo las claves TARGET_KEYS que hagan match (omitir las que no)
    const mapped = raw.map((r: any) => {
      const flat = flattenOneLevel(r)
      const out: Record<string, any> = {}

      // intentos directos por TARGET_KEYS
      for (const tk of TARGET_KEYS) {
        const v = findValue(flat, tk)
        if (v !== undefined) out[tk] = v instanceof Date ? v.toISOString() : v
      }

      // fallbacks heurísticos, sólo si permiten un match válido (y sólo se agregan si efectivamente hay valor)
      if (!out['CODIGO']) {
        const fb = findValue(flat, 'codigo') ?? findValue(flat, 'code') ?? findValue(flat, 'id') ?? findValue(flat, 'clave')
        if (fb !== undefined) out['CODIGO'] = fb
      }
      if (!out['FORMULARIO']) {
        const fb = findValue(flat, 'formulario') ?? findValue(flat, 'form') ?? findValue(flat, 'form_code') ?? findValue(flat, 'formulario_codigo')
        if (fb !== undefined) out['FORMULARIO'] = fb
      }
      if (!out['DESCRIP']) {
        const fb = findValue(flat, 'descrip') ?? findValue(flat, 'descripcion') ?? findValue(flat, 'desc') ?? findValue(flat, 'name')
        if (fb !== undefined) out['DESCRIP'] = fb
      }

      return out
    })

    // devolver array: cada objeto sólo contiene los campos que hicieron match
    return new Response(JSON.stringify({ data: mapped }), { status: 200, headers: { ...corsHeaders(), 'Content-Type': 'application/json' } })
  } catch (error: any) {
    console.error('Error en api-get-lbrutser:', error)
    return new Response(JSON.stringify({ error: error?.message ?? 'unknown' }), { status: 500, headers: { ...corsHeaders(), 'Content-Type': 'application/json' } })
  }
}
