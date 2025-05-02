import { NextResponse } from 'next/server'

import { prisma } from '@/lib/prisma'
import { TipoOrdenTrabajo } from '@prisma/client'

// Función para obtener el tipo de OT basado en el código de documento
const getTipoOTFromDocCode = (fklbdocver: string): TipoOrdenTrabajo => {
  // Extraer la parte relevante del código (R-12-XX)
  const docCode = fklbdocver.substring(0, 7) // Tomar solo los primeros 7 caracteres (R-12-34)
  
  console.log(docCode)
  
  // Mapear el código al tipo de OT
  const tipoOTMap: { [key: string]: TipoOrdenTrabajo } = {
    'R-12-01': TipoOrdenTrabajo.ACEPTACION_VISITA,
    'R-12-03': TipoOrdenTrabajo.DENSIDADES,
    'R-12-27': TipoOrdenTrabajo.MUESTREO_MATERIAL,
    'R-12-31': TipoOrdenTrabajo.EXTRACCION_ASFALTICA,
    'R-12-34': TipoOrdenTrabajo.ACEPTACION_VISITA,
    'R-12-39': TipoOrdenTrabajo.HORMIGON_FRESCO,
    'R-12-58': TipoOrdenTrabajo.TESTIGOS,
    'R-12-99': TipoOrdenTrabajo.RETIRO_PROBETA
  }

  console.log(tipoOTMap[docCode])

  return tipoOTMap[docCode] || TipoOrdenTrabajo.ACEPTACION_VISITA
}

// GET /api/ot - Obtener todas las OTs
export async function GET() {
  try {
    const ordenesTrabajo = await prisma.ordenTrabajo.findMany({
      include: {
        aceptacionVisita: true,
        densidad: true,
        hormigonFresco: true,
        testigos: true,
        extraccionAsfaltica: true,
        muestreoMaterial: true,
        retiroProbeta: true,
        user: {
          select: {
            id: true,
            name: true,
            email: true
          }
        }
      }
    })

    return NextResponse.json(ordenesTrabajo)
  } catch (error) {
    console.error('Error al obtener OTs:', error)

    return NextResponse.json({ error: 'Error al obtener las órdenes de trabajo' }, { status: 500 })
  }
}

// POST /api/ot - Crear una nueva OT
export async function POST(request: Request) {
  try {
    const data = await request.json()

    // Validar datos mínimos requeridos
    if (!data.data || !Array.isArray(data.data) || data.data.length === 0) {
      return NextResponse.json({ error: 'No hay órdenes de trabajo para procesar' }, { status: 400 })
    }

    // Verificar que el usuario exista
    const usuario = await prisma.user.findUnique({
      where: {
        id: data.usuario.id
      }
    })

    if (!usuario) {
      return NextResponse.json({ error: 'Usuario no encontrado' }, { status: 404 })
    }

    // Procesar todas las órdenes de trabajo
    const ordenesTrabajo = await Promise.all(
      data.data.map(async (ot: {
        CLAVE: string
        ESTADO?: string
        ORIGEN?: string
        FKLBRUTAS?: string
        CORRELATIV?: string
        FKLBDOCVER?: string
        FKLBRUTSER?: string
      }) => {
        const ordenData = {
          clave: ot.CLAVE,
          estado: ot.ESTADO || 'PENDIENTE',
          origen: ot.ORIGEN || 'VISITA',
          fklbrutas: ot.FKLBRUTAS || '',
          correlativ: ot.CORRELATIV || '001',
          fklbdocver: ot.FKLBDOCVER || '',
          fklbrutser: ot.FKLBRUTSER || '',
          tipoOT: getTipoOTFromDocCode(ot.FKLBDOCVER || ''),
          user: {
            connect: {
              id: data.usuario.id
            }
          }
        }

        return prisma.ordenTrabajo.create({
          data: ordenData,
          include: {
            aceptacionVisita: true,
            densidad: true,
            hormigonFresco: true,
            testigos: true,
            extraccionAsfaltica: true,
            muestreoMaterial: true,
            retiroProbeta: true,
            user: {
              select: {
                id: true,
                name: true,
                email: true
              }
            }
          }
        })
      })
    )

    return NextResponse.json(ordenesTrabajo, { status: 201 })
  } catch (error) {
    console.error('Error al crear OTs:', error)

    return NextResponse.json({ error: 'Error al crear las órdenes de trabajo' }, { status: 500 })
  }
}
