import { NextResponse } from 'next/server'

import { prisma } from '@/lib/prisma'

export const dynamic = 'force-dynamic'
export const revalidate = 0

export async function POST(request: Request, { params }: { params: { id: string } }) {
  try {
    const id = parseInt(params.id)
    const { laboratoristas } = await request.json()

    // Verificar que la agenda existe
    const existeAgenda = await prisma.agenda.findUnique({
      where: { id },
      include: {
        asignados: true
      }
    })

    if (!existeAgenda) {
      return NextResponse.json({ error: 'Agenda no encontrada' }, { status: 404 })
    }

    // Obtener los roles de laboratorista
    const rolesLaboratorista = await prisma.rol.findMany({
      where: {
        nombre: {
          in: ['Laboratorista', 'Laboratorista / E. de Área Sala']
        }
      }
    })

    if (rolesLaboratorista.length === 0) {
      return NextResponse.json({ error: 'Roles de laboratorista no encontrados' }, { status: 404 })
    }

    // Verificar que todos los usuarios existen y tienen alguno de los roles de laboratorista
    const usuarios = await prisma.user.findMany({
      where: {
        id: {
          in: laboratoristas
        },
        roles: {
          some: {
            rolId: {
              in: rolesLaboratorista.map(rol => rol.id)
            }
          }
        }
      }
    })

    if (usuarios.length !== laboratoristas.length) {
      return NextResponse.json({ error: 'Uno o más usuarios no existen o no tienen rol de laboratorista' }, { status: 400 })
    }

    // Eliminar asignaciones existentes
    await prisma.agendaAsignado.deleteMany({
      where: {
        agendaId: id
      }
    })

    // Crear nuevas asignaciones
    const asignaciones = await prisma.agendaAsignado.createMany({
      data: laboratoristas.map((userId: string) => ({
        agendaId: id,
        userId,
        esPrincipal: false
      }))
    })

    // Obtener la agenda actualizada con las nuevas asignaciones
    const agendaActualizada = await prisma.agenda.findUnique({
      where: { id },
      include: {
        asignados: {
          include: {
            user: {
              include: {
                roles: {
                  include: {
                    rol: true
                  }
                }
              }
            }
          }
        }
      }
    })

    return NextResponse.json(agendaActualizada)
  } catch (error) {
    console.error('Error al asignar laboratoristas:', error)

    return NextResponse.json({ error: 'Error al asignar laboratoristas' }, { status: 500 })
  }
}
