import { NextResponse } from 'next/server'

import { prisma } from '@/lib/prisma'

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const regionId = searchParams.get('regionId')

    console.log('API ubicacion llamada, regionId:', regionId)

    // Si no hay regionId, devolver todas las regiones
    if (!regionId) {
      const regiones = await prisma.region.findMany({
        orderBy: {
          nombre: 'asc'
        }
      })

      return NextResponse.json(regiones)
    }

    // Si hay regionId, buscar las comunas de esa región
    const comunas = await prisma.comuna.findMany({
      where: {
        codigo: {
          startsWith: regionId
        }
      },
      orderBy: {
        nombre: 'asc'
      }
    })

    return NextResponse.json(comunas)
  } catch (error) {
    console.error('Error en API ubicacion:', error)

    return NextResponse.json({ error: 'Error al obtener datos de ubicación' }, { status: 500 })
  }
}
