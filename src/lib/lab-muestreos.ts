import { prisma } from '@/lib/prisma'
import { LAB_FORMULARIOS } from '@/lib/lab-formularios'

type LoadMuestreosOptions = {
  obra: { numeroObra: string } | { obraId: number }
  sinRetiro: boolean
  sortDirection: 'asc' | 'desc'
  take: number
}

const opcionesTipoProbeta = JSON.parse(
  LAB_FORMULARIOS.find(formulario => formulario.CLAVE === 'R-12-39010')?.OPCIONES || '{"opciones":[]}'
).opciones.find((opcion: { nombre: string }) => opcion.nombre === 'Tipo de Probeta')?.opciones || []

const normalizeReference = (value: unknown) => String(value ?? '').trim()

export const describeTipoProbeta = (value: unknown) => {
  const codigo = normalizeReference(value)
  if (!codigo) return ''
  const option = opcionesTipoProbeta.find((item: { erp?: string; texto: string }) => item.erp === codigo)
  if (option) return option.texto
  const aliases: Record<string, string> = {
    'CILINDRO-15': 'Cilíndricas (300x150)',
    'PRISMA': 'Prismática (530x150)',
    'CUBO-15': 'Cúbica (150x150)',
    'CUBO-20': 'Cúbica (200x200)',
    'RILEM': 'Rilem (160x40x40)'
  }
  return aliases[codigo.toUpperCase()] || codigo
}

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
        fklbdocver: { startsWith: 'R-12-39' }
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
