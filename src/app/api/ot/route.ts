import { NextResponse } from 'next/server'

import { prisma } from '@/lib/prisma'

// Función para obtener el tipo de OT basado en el código de documento
const getTipoOTFromDocCode = async (fklbdocver: string): Promise<number> => {
  // Extraer la parte relevante del código (R-12-XX)
  const docCode = fklbdocver.substring(0, 7) // Tomar solo los primeros 7 caracteres (R-12-34)

  console.log(docCode)

  // Mapear el código al ID del tipo de OT en la base de datos
  const tipoOTMap: { [key: string]: string } = {
    'R-12-03': 'R-12-03', // Control de Compactación
    'R-12-39': 'R-12-39', // Muestreo de Hormigón Fresco
    'R-12-99': 'R-12-99', // Retiro de Probeta Hormigón
    'R-12-27': 'R-12-27', // Muestreo de Materiales
    'R-12-58': 'R-12-58', // Testigos
    'R-12-31': 'R-12-31', // Extracción Asfáltica
    'R-12-69': 'R-12-69', // Dosificación
    'R-12-34': 'R-12-34', // General
    'X-1-001': 'X-1-001'  // Suspendido en Terreno
  }

  const codigo = tipoOTMap[docCode]

  if (codigo) {
    // Buscar el tipo de OT por código en la base de datos
    const tipoOT = await prisma.tipoOrdenTrabajo.findFirst({
      where: { codigo }
    })

    if (tipoOT) {
      console.log('Tipo OT encontrado:', tipoOT)
      return tipoOT.id
    }
  }

  // Si no se encuentra, devolver el ID del tipo "General" por defecto
  const tipoOTDefault = await prisma.tipoOrdenTrabajo.findFirst({
    where: { codigo: 'R-12-34' }
  })

  return tipoOTDefault?.id || 8 // ID 8 corresponde a "General"
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
        tipoOT: true,
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
    /* const usuario = await prisma.user.findUnique({
      where: {
        id: data.usuario.id
      }
    })

    if (!usuario) {
      return NextResponse.json({ error: 'Usuario no encontrado' }, { status: 404 })
    } */

    //temporal para tener un id de usuario existente en la base de datos
    const user = await prisma.user.findFirst()
    if (!user) {
      throw new Error('No se encontró ningún laboratorista')
    }
    //fin temporal

    // Verificar si es un JSON de tipo aceptación de visita
    const esAceptacionVisita = data.data.some((item: any) => item.ACEPVISITA)

    if (esAceptacionVisita) {
      console.log('Es aceptación de visita')
      // Procesar cada item de aceptación de visita
      for (const item of data.data) {
        if (item.ACEPVISITA) {
          // Actualizar directamente la agenda usando la clave como ID
          await prisma.agenda.update({
            where: {
              id: parseInt(item.CLAVE)
            },
            data: {
              horaLlegada: item.ACEPVISITA.hora_llegada,
              horaSalida: item.ACEPVISITA.hora_salida,
              movilizacion: item.ACEPVISITA.movilizacion
            }
          })
        }
      }

      return NextResponse.json({ message: 'Aceptación de visita procesada correctamente' })
    }
    console.log('No es aceptación de visita')

    // Procesar todas las órdenes de trabajo normales
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
        const tipoOTId = await getTipoOTFromDocCode(ot.FKLBDOCVER || '')

        const ordenData = {
          clave: ot.CLAVE,
          estado: ot.ESTADO || 'PENDIENTE',
          origen: ot.ORIGEN || 'VISITA',
          fklbrutas: ot.FKLBRUTAS || '',
          correlativ: ot.CORRELATIV || '001',
          fklbdocver: ot.FKLBDOCVER || '',
          fklbrutser: ot.FKLBRUTSER || '',
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
              //id: data.usuario.id
              id: user.id
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
            tipoOT: true,
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
    console.error('Error al procesar OTs:', error)

    return NextResponse.json({ error: 'Error al procesar las órdenes de trabajo' }, { status: 500 })
  }
}
