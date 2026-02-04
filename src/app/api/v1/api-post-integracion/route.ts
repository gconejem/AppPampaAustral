import { NextResponse } from 'next/server'

import { prisma } from '@/lib/prisma'

export const dynamic = 'force-dynamic'
export const revalidate = 0

const ALLOWED_ORIGINS = new Set([
  'http://localhost:8080',
  'http://localhost:3000',
  'http://localhost:5173',
  'https://localhost'
])

const corsHeaders = (origin?: string | null) => {
  const allowedOrigin = origin && ALLOWED_ORIGINS.has(origin) ? origin : null
  return {
    ...(allowedOrigin ? { 'Access-Control-Allow-Origin': allowedOrigin } : {}),
    'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    'Access-Control-Allow-Credentials': 'true'
  }
}

export async function OPTIONS(request: Request) {
  return NextResponse.json({}, { headers: corsHeaders(request.headers.get('origin')) })
}

const parseBracketPath = (key: string): string[] => {
  return key.match(/[^\[\]]+/g) || [key]
}

const setDeepValue = (target: any, path: string[], value: any) => {
  const key = path[0]
  const isIndex = /^\d+$/.test(key)

  if (path.length === 1) {
    if (isIndex) {
      target[Number(key)] = value
    } else {
      target[key] = value
    }
    return
  }

  const nextKey = path[1]
  const nextIsIndex = /^\d+$/.test(nextKey)

  if (isIndex) {
    const idx = Number(key)
    if (target[idx] === undefined) {
      target[idx] = nextIsIndex ? [] : {}
    }
    setDeepValue(target[idx], path.slice(1), value)
    return
  }

  if (target[key] === undefined) {
    target[key] = nextIsIndex ? [] : {}
  }

  setDeepValue(target[key], path.slice(1), value)
}

const parseFormBody = (text: string) => {
  const params = new URLSearchParams(text)
  const payload: any = {}

  for (const [key, value] of params.entries()) {
    const path = parseBracketPath(key)
    setDeepValue(payload, path, value)
  }

  if (typeof payload.integracionData === 'string') {
    try {
      payload.integracionData = JSON.parse(payload.integracionData)
    } catch {
      // ignore
    }
  }

  if (payload.integracionData?.data && typeof payload.integracionData.data === 'string') {
    try {
      payload.integracionData.data = JSON.parse(payload.integracionData.data)
    } catch {
      // ignore
    }
  }

  return payload
}

const parseRequestPayload = async (request: Request) => {
  const contentType = request.headers.get('content-type') || ''
  const text = await request.text()

  if (contentType.includes('application/json')) {
    try {
      return JSON.parse(text)
    } catch {
      return parseFormBody(text)
    }
  }

  try {
    return JSON.parse(text)
  } catch {
    return parseFormBody(text)
  }
}

const logRequest = (request: Request, contentType: string, payload: any) => {
  const origin = request.headers.get('origin')
  const forwardedFor = request.headers.get('x-forwarded-for')
  const realIp = request.headers.get('x-real-ip')
  const ip = forwardedFor || realIp || '-'

  const integracionTipo = payload?.integracionTipo
  const integracionEstado = payload?.integracionEstado
  const mensajeLog = payload?.mensajeLog
  const sessionId = payload?.sessionId

  const data = payload?.integracionData?.data
  const dataCount = Array.isArray(data) ? data.length : 0
  const sampleClave = Array.isArray(data) && data.length > 0 ? data[0]?.CLAVE : undefined

  console.info('[api-post-integracion] ===== REQUEST START =====')
  console.info('[api-post-integracion] ts:', new Date().toISOString())
  console.info('[api-post-integracion] origin:', origin || '-')
  console.info('[api-post-integracion] ip:', ip)
  console.info('[api-post-integracion] content-type:', contentType)
  console.info('[api-post-integracion] sessionId:', sessionId || '-')
  console.info('[api-post-integracion] integracionTipo:', integracionTipo)
  console.info('[api-post-integracion] integracionEstado:', integracionEstado)
  console.info('[api-post-integracion] mensajeLog:', mensajeLog)
  console.info('[api-post-integracion] dataCount:', dataCount, 'sampleClave:', sampleClave)

  if (integracionTipo === 'UpdateLBRUTAS' && Array.isArray(data)) {
    const withAceptacion = data.filter((x: any) => x?.CLAVE && x?.ACEPVISITA).length
    console.info('[api-post-integracion] UpdateLBRUTAS with ACEPVISITA:', withAceptacion)
  }

  if (integracionTipo === 'NewLBRUTAOT' && Array.isArray(data)) {
    const sample = data[0] || {}
    console.info('[api-post-integracion] NewLBRUTAOT sample:', {
      CLAVE: sample?.CLAVE,
      FKLBRUTAS: sample?.FKLBRUTAS,
      FKLBDOCVER: sample?.FKLBDOCVER,
      FKLBRUTSER: sample?.FKLBRUTSER,
      ESTADO: sample?.ESTADO
    })
  }

  console.info('[api-post-integracion] ===== REQUEST END =====')
}

const getTipoOTFromDocCode = async (fklbdocver: string): Promise<number> => {
  let docCode: string
  if (fklbdocver.startsWith('X-1')) {
    docCode = fklbdocver.substring(0, 3)
  } else {
    docCode = fklbdocver.substring(0, 7)
  }

  const tipoOTMap: { [key: string]: string } = {
    'R-12-03': 'R-12-03',
    'R-12-39': 'R-12-39',
    'R-12-99': 'R-12-99',
    'R-12-27': 'R-12-27',
    'R-12-58': 'R-12-58',
    'R-12-31': 'R-12-31',
    'R-12-69': 'R-12-69',
    'R-12-34': 'R-12-34',
    'X-1': 'X-1'
  }

  const codigo = tipoOTMap[docCode]

  if (codigo) {
    const tipoOT = await prisma.tipoOrdenTrabajo.findFirst({
      where: { codigo }
    })

    if (tipoOT) {
      return tipoOT.id
    }
  }

  const tipoOTDefault = await prisma.tipoOrdenTrabajo.findFirst({
    where: { codigo: 'R-12-34' }
  })

  return tipoOTDefault?.id || 8
}

export async function POST(request: Request) {
  try {
    const contentType = request.headers.get('content-type') || ''
    const payload = await parseRequestPayload(request)
    const origin = request.headers.get('origin')

    logRequest(request, contentType, payload)

    if (!payload?.integracionTipo || !payload?.integracionData?.data) {
      return NextResponse.json({ error: 'Payload inválido' }, { status: 400, headers: corsHeaders(origin) })
    }

    const { integracionTipo } = payload
    const data = payload.integracionData.data

    const user = await prisma.user.findFirst()
    if (!user) {
      return NextResponse.json({ error: 'No se encontró ningún laboratorista' }, { status: 500, headers: corsHeaders(origin) })
    }

    if (integracionTipo === 'NewLBRUTAOT') {
      if (!Array.isArray(data) || data.length === 0) {
        return NextResponse.json({ error: 'No hay OTs para procesar' }, { status: 400, headers: corsHeaders(origin) })
      }

      const ordenesTrabajo = await Promise.all(
        data.map(async (ot: {
          CLAVE: string
          ESTADO?: string
          ORIGEN?: string
          FKLBRUTAS?: string
          CORRELATIV?: string
          FKLBDOCVER?: string
          FKLBRUTSER?: string
          RESPUESTA?: any
        }) => {
          const tipoOTId = await getTipoOTFromDocCode(ot.FKLBDOCVER || '')

          let numeroTarjeta: string | undefined = undefined
          if (ot.RESPUESTA?.nTarjetaArray && Array.isArray(ot.RESPUESTA.nTarjetaArray)) {
            numeroTarjeta = ot.RESPUESTA.nTarjetaArray.join(',')
          }

          return prisma.ordenTrabajo.create({
            data: {
              clave: ot.CLAVE,
              estado: ot.ESTADO || 'PENDIENTE',
              origen: ot.ORIGEN || 'VISITA',
              fklbrutas: ot.FKLBRUTAS || '',
              correlativ: ot.CORRELATIV || '001',
              fklbdocver: ot.FKLBDOCVER || '',
              fklbrutser: ot.FKLBRUTSER || '',
              numeroTarjeta,
              jsonOT: ot,
              agenda: {
                connect: {
                  id: parseInt(ot.FKLBRUTAS || '-1')
                }
              },
              tipoOT: {
                connect: {
                  id: tipoOTId
                }
              },
              user: {
                connect: {
                  id: user.id
                }
              }
            }
          })
        })
      )

      return NextResponse.json({ message: 'OTs creadas correctamente', data: ordenesTrabajo }, { headers: corsHeaders(origin) })
    }

    if (integracionTipo === 'UpdateLBRUTAS') {
      if (!Array.isArray(data) || data.length === 0) {
        return NextResponse.json({ error: 'No hay visitas para procesar' }, { status: 400, headers: corsHeaders(origin) })
      }

      const agendasActualizadas = []

      for (const item of data) {
        if (item?.ACEPVISITA && item?.CLAVE) {
          const agenda = await prisma.agenda.update({
            where: { id: parseInt(item.CLAVE) },
            data: {
              horaLlegada: item.ACEPVISITA.hora_llegada,
              horaSalida: item.ACEPVISITA.hora_salida,
              movilizacion: item.ACEPVISITA.movilizacion,
              comprobanteVisitaJSON: item
            }
          })

          agendasActualizadas.push(agenda)
        }
      }

      return NextResponse.json({ message: 'Aceptación de visita procesada correctamente', data: agendasActualizadas }, { headers: corsHeaders(origin) })
    }

    return NextResponse.json({ error: `Integración no soportada: ${integracionTipo}` }, { status: 400, headers: corsHeaders(origin) })
  } catch (error) {
    console.error('Error en api-post-integracion:', error)
    return NextResponse.json({ error: 'Error al procesar integración' }, { status: 500, headers: corsHeaders(request.headers.get('origin')) })
  }
}
