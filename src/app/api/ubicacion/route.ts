import { NextResponse } from 'next/server'

import prisma from '@/lib/prisma'

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const regionId = searchParams.get('regionId')

    console.log('API ubicacion llamada, regionId:', regionId)

    if (regionId) {
      // Obtener comunas de una región específica
      const comunas = await prisma.comuna.findMany({
        where: {
          region: {
            codigo: regionId
          }
        },
        select: {
          id: true,
          codigo: true,
          nombre: true
        },
        orderBy: {
          nombre: 'asc'
        }
      })

      console.log(`Comunas encontradas para región ${regionId}:`, comunas.length)

      return NextResponse.json(comunas)
    }

    // Obtener todas las regiones
    const regiones = await prisma.region.findMany({
      select: {
        id: true,
        codigo: true,
        nombre: true,
        _count: {
          select: {
            comunas: true
          }
        }
      },
      orderBy: {
        nombre: 'asc'
      }
    })

    console.log('Total regiones encontradas:', regiones.length)
    console.log(
      'Conteo de comunas por región:',
      regiones.map(r => ({
        region: r.nombre,
        comunas: r._count.comunas
      }))
    )

    return NextResponse.json(regiones)
  } catch (error) {
    console.error('Error en API ubicacion:', error)

    return NextResponse.json({ error: 'Error al obtener datos de ubicación' }, { status: 500 })
  }
}
