import { NextResponse } from 'next/server'

import { prisma } from '@/lib/prisma'

export const dynamic = 'force-dynamic'
export const revalidate = 0

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const laboratoristaId = searchParams.get('laboratoristaId')

    let equipos

    if (laboratoristaId) {
      // Si se especifica un laboratorista, mostrar sus equipos asignados primero, luego los disponibles
      const equiposAsignados = await prisma.equipo.findMany({
        where: {
          estado: 'Activo',
          funcionarioAsignadoId: laboratoristaId
        },
        include: {
          tipoEquipo: true,
          funcionarioAsignado: {
            select: {
              id: true,
              name: true,
              email: true
            }
          }
        },
        orderBy: {
          codigo: 'asc'
        }
      })

      const equiposDisponibles = await prisma.equipo.findMany({
        where: {
          estado: 'Activo',
          OR: [
            { funcionarioAsignadoId: null },
            { funcionarioAsignadoId: { not: laboratoristaId } }
          ]
        },
        include: {
          tipoEquipo: true,
          funcionarioAsignado: {
            select: {
              id: true,
              name: true,
              email: true
            }
          }
        },
        orderBy: {
          codigo: 'asc'
        }
      })

      // Combinar: equipos asignados al laboratorista primero, luego los disponibles
      equipos = [
        ...equiposAsignados.map(equipo => ({
          ...equipo,
          esAsignadoAlLaboratorista: true
        })),
        ...equiposDisponibles.map(equipo => ({
          ...equipo,
          esAsignadoAlLaboratorista: false
        }))
      ]
    } else {
      // Si no se especifica laboratorista, mostrar todos los equipos activos
      equipos = await prisma.equipo.findMany({
        where: {
          estado: 'Activo'
        },
        include: {
          tipoEquipo: true,
          funcionarioAsignado: {
            select: {
              id: true,
              name: true,
              email: true
            }
          }
        },
        orderBy: {
          codigo: 'asc'
        }
      })
    }

    return NextResponse.json(equipos)
  } catch (error) {
    console.error('Error al obtener equipos:', error)

    return NextResponse.json({ error: 'Error al obtener los equipos' }, { status: 500 })
  }
}
