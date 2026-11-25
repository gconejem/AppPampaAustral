import { prisma } from '@/lib/prisma'

type LoadMuestreosOptions = {
  obra: { numeroObra: string } | { obraId: number }
  sinRetiro: boolean
  sortDirection: 'asc' | 'desc'
  take: number
}

const normalizeReference = (value: unknown) => String(value ?? '').trim()

const getRespuesta = (jsonOT: unknown): Record<string, any> => {
  if (!jsonOT || typeof jsonOT !== 'object') return {}
  const parsed = jsonOT as Record<string, any>
  return parsed.RESPUESTA && typeof parsed.RESPUESTA === 'object'
    ? parsed.RESPUESTA as Record<string, any>
    : parsed
}

export const getMuestreosRetirados = (retiros: Array<{
  estado: string
  jsonOT: unknown
  retiroProbeta: { otMuestreo: string | null } | null
}>) => {
  const muestreosRetirados = new Set<string>()
  retiros.forEach(retiro => {
    const estado = String(retiro.estado || '').toUpperCase()
    if (estado !== 'C' && estado !== 'COMPLETADA') return
    const respuesta = getRespuesta(retiro.jsonOT)
    const otMuestreo = normalizeReference(respuesta.ot_muestreo || retiro.retiroProbeta?.otMuestreo)
    if (otMuestreo) muestreosRetirados.add(otMuestreo)
  })
  return muestreosRetirados
}

export const loadMuestreosConRetiro = async ({
  obra,
  sinRetiro,
  sortDirection,
  take
}: LoadMuestreosOptions) => {
  const agenda = { obra }
  const [muestreos, retiros] = await Promise.all([
    prisma.ordenTrabajo.findMany({
      where: {
        agenda,
        OR: [
          { fklbdocver: { startsWith: 'R-12-39' } },
          { fklbdocver: { startsWith: 'R-12-27' } },
          { fklbdocver: { startsWith: 'R-12-58' } },
          { hormigonFresco: { isNot: null } },
          { muestreoMaterial: { isNot: null } },
          { testigos: { isNot: null } }
        ]
      },
      include: {
        hormigonFresco: true,
        muestreoMaterial: true,
        testigos: true,
        retiroProbeta: true,
        agenda: {
          include: {
            obra: true
          }
        }
      },
      orderBy: {
        createdAt: sortDirection
      },
      take
    }),
    prisma.ordenTrabajo.findMany({
      where: {
        agenda,
        OR: [
          { fklbdocver: { startsWith: 'R-12-99' } },
          { retiroProbeta: { isNot: null } }
        ]
      },
      select: {
        estado: true,
        jsonOT: true,
        retiroProbeta: {
          select: {
            otMuestreo: true
          }
        }
      }
    })
  ])
  const muestreosRetirados = getMuestreosRetirados(retiros)
  const resultados = muestreos.map(orden => {
    const clave = normalizeReference(orden.clave)
    const respuesta = getRespuesta(orden.jsonOT)
    const retirada = orden.retiroProbeta || muestreosRetirados.has(clave) ? 1 : 0
    return {
      orden,
      respuesta,
      retirada
    }
  })
  return sinRetiro ? resultados.filter(item => item.retirada === 0) : resultados
}
