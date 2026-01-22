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

// aplana un nivel y devuelve claves originales + claves compuestas "parent.child"
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

// lista de campos de salida exactos (se devolverán siempre, con null si no hay match)
const TARGET_KEYS = [
  'CODIGO',
  'ESTADO',
  'NOMBRE',
  'DIRECC',
  'MAN_CODI',
  'MAN_TEXT',
  'MAN_INFO',
  'ENC_NOMB',
  'ENC_FONO',
  'ENC_MAIL',
  'ET_SINO',
  'ET_OBSER',
  'AVI_TIPO',
  'AVI_SMS',
  'AVI_MAIL',
  'INF_NOMB',
  'INF_MAIL',
  'CLIE_RUT',
  'DOC_RUT',
  'DOC_CORR',
  'DOC_MEDIO',
  'GUARDIAN',
  'MYWEB',
  'INGRESO',
  'REP_NOMB',
  'REP_RUT',
  'REP_FONO',
  'REP_MAIL'
]

export async function GET(request: Request) {
  try {
    if (!prisma) {
      return new Response(JSON.stringify({ error: 'Prisma client not initialized' }), { status: 500, headers: { 'Content-Type': 'application/json' } })
    }

    const obraModel =
      (prisma as any).obra ??
      (prisma as any).Obra ??
      (prisma as any).obras ??
      (prisma as any).Obras

    if (!obraModel || typeof obraModel.findMany !== 'function') {
      return new Response(JSON.stringify({ error: "Prisma model 'obra' not available", prismaKeys: Object.keys(prisma) }), { status: 500, headers: { 'Content-Type': 'application/json' } })
    }

    const { searchParams } = new URL(request.url)
    const obraId = searchParams.get('obraId')
    const direccion = searchParams.get('direccion')
    const clienteId = searchParams.get('clienteId')
    const codigo = searchParams.get('codigo[]') || searchParams.get('codigo')
    const limit = Number(searchParams.get('limit') ?? 100)

    const whereFilter: any = {}
    if (obraId) whereFilter.obraId = Number(obraId)
    if (direccion) whereFilter.direccion = { contains: direccion }
    if (clienteId) whereFilter.clienteId = Number(clienteId)
    if (codigo) whereFilter.numeroObra = { in: String(codigo).split(',').filter(Boolean) }

    const raw = await obraModel.findMany({
      where: whereFilter,
      take: limit
      // no select fijo: necesitamos todos los campos disponibles para matching
    })

    // busca un valor en el mapa aplastado que haga match con la target key
    function findValueForTarget(flat: Record<string, any>, target: string) {
      const tn = normalizeKey(target)
      // prefer exact or containing matches on key names
      const found = Object.keys(flat).find(k => {
        const kn = normalizeKey(k)
        return kn === tn || kn.includes(tn) || tn.includes(kn)
      })
      return found !== undefined ? flat[found] : undefined
    }

    const mapped = raw.map((obra: any) => {
      const flat = flattenOneLevel(obra)
      const out: Record<string, any> = {}

      // inicializar todas las claves objetivo en null
      for (const tk of TARGET_KEYS) out[tk] = null

      // rellenar matches
      for (const tk of TARGET_KEYS) {
        const val = findValueForTarget(flat, tk)
        if (val !== undefined) {
          out[tk] = val instanceof Date ? val.toISOString() : val
        }
      }

      // fallbacks puntuales
      if (!out['CODIGO']) {
        const fallback = findValueForTarget(flat, 'codigo') ?? findValueForTarget(flat, 'id') ?? findValueForTarget(flat, 'obraId') ?? findValueForTarget(flat, 'idobra')
        if (fallback !== undefined) out['CODIGO'] = fallback instanceof Date ? fallback.toISOString() : fallback
      }
      if (!out['INGRESO']) {
        const fallback = findValueForTarget(flat, 'ingreso') ?? findValueForTarget(flat, 'createdAt') ?? findValueForTarget(flat, 'fechaIngreso')
        if (fallback !== undefined) out['INGRESO'] = fallback instanceof Date ? fallback.toISOString() : fallback
      }

      // ciudad: construir objeto ciudad solo con CODIGO y NOMBRE si existe en origen
      const cityObjKey = Object.keys(obra).find(k => {
        const kk = normalizeKey(k)
        return kk === 'ciudad' || kk === 'comuna' || kk.includes('ciudad') || kk.includes('comuna')
      })
      if (cityObjKey && obra[cityObjKey] && typeof obra[cityObjKey] === 'object') {
        const cityFlat = flattenOneLevel(obra[cityObjKey])
        const codigo = findValueForTarget(cityFlat, 'codigo') ?? findValueForTarget(cityFlat, 'cod') ?? findValueForTarget(cityFlat, 'id')
        const nombre = findValueForTarget(cityFlat, 'nombre') ?? findValueForTarget(cityFlat, 'name')
        out['ciudad'] = { CODIGO: codigo === undefined ? null : codigo, NOMBRE: nombre === undefined ? null : nombre }
      } else {
        out['ciudad'] = { CODIGO: null, NOMBRE: null }
      }

      // Si el origen incluye una propiedad 'obra' y algunas coincidencias provinieron de esa propiedad,
      // y el usuario pidió explícitamente "mantener campo obra", se conservará la propiedad 'obra' completa
      // únicamente si al menos una target key se obtuvo de ese subobjeto.
      // Para evitar exceso de datos, solo se conserva si se encuentra correspondencia.
      const obraSourceKey = Object.keys(obra).find(k => normalizeKey(k) === 'obra')
      if (obraSourceKey) {
        // comprobar si alguna target provino de keys dentro de obra[obraSourceKey]
        const obraFlat = flattenOneLevel(obra[obraSourceKey])
        const anyFromObra = TARGET_KEYS.some(tk => {
          const v = findValueForTarget(obraFlat, tk)
          return v !== undefined
        })
        if (anyFromObra) {
          out['obra'] = obra[obraSourceKey] // conservar el objeto origen tal cual
        } else {
          out['obra'] = null
        }
      }

      return out
    })

    // devolver sólo el array de objetos con las claves especificadas
    return new Response(JSON.stringify({ data: mapped }), { status: 200, headers: { ...corsHeaders(), 'Content-Type': 'application/json' } })
  } catch (error: any) {
    console.error('GET Error en get-obras: mapping error:', error)
    return new Response(JSON.stringify({ error: error?.message ?? 'unknown' }), { status: 500, headers: { ...corsHeaders(), 'Content-Type': 'application/json' } })
  }
}
