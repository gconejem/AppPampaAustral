import { NextResponse } from 'next/server'

import { prisma } from '@/lib/prisma'

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

    // Obtener el rol LABORATORISTA
    const rolLaboratorista = await prisma.rol.findUnique({
      where: {
        nombre: 'LABORATORISTA'
      }
    })

    if (!rolLaboratorista) {
      return NextResponse.json({ error: 'Rol LABORATORISTA no encontrado' }, { status: 404 })
    }

    // Verificar que todos los usuarios existen y son laboratoristas
    const usuarios = await prisma.user.findMany({
      where: {
        id: {
          in: laboratoristas
        },
        roles: {
          some: {
            rolId: rolLaboratorista.id
          }
        }
      }
    })

    if (usuarios.length !== laboratoristas.length) {
      return NextResponse.json({ error: 'Uno o más usuarios no existen o no son laboratoristas' }, { status: 400 })
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
