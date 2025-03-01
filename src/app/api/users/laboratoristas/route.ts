import { NextResponse } from 'next/server'

import { prisma } from '@/lib/prisma'

export async function GET() {
  try {
    // Obtener el ID del rol LABORATORISTA
    const rolLaboratorista = await prisma.rol.findUnique({
      where: {
        nombre: 'LABORATORISTA'
      }
    })

    if (!rolLaboratorista) {
      return NextResponse.json({ error: 'Rol LABORATORISTA no encontrado' }, { status: 404 })
    }

    // Obtener usuarios con rol LABORATORISTA
    const laboratoristas = await prisma.user.findMany({
      where: {
        roles: {
          some: {
            rolId: rolLaboratorista.id
          }
        }
      },
      include: {
        roles: {
          include: {
            rol: true
          }
        }
      }
    })

    // Formatear la respuesta
    const formattedLaboratoristas = laboratoristas.map(lab => ({
      id: lab.id,
      nombre: lab.name || '',
      email: lab.email || '',
      rol: 'LABORATORISTA'
    }))

    return NextResponse.json(formattedLaboratoristas)
  } catch (error) {
    console.error('Error al obtener laboratoristas:', error)

    return NextResponse.json({ error: 'Error al obtener laboratoristas' }, { status: 500 })
  }
}
