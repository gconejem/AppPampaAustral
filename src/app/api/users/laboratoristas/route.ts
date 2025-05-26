import { NextResponse } from 'next/server'

import { prisma } from '@/lib/prisma'

export async function GET() {
  try {
    // Obtener usuarios que tienen el rol de laboratorista
    const laboratoristas = await prisma.user.findMany({
      where: {
        roles: {
          some: {
            rol: {
              nombre: 'Laboratorista'
            }
          }
        }
      },
      select: {
        id: true,
        name: true,
        email: true,
        roles: {
          select: {
            rol: {
              select: {
                nombre: true
              }
            }
          }
        }
      }
    })

    return NextResponse.json(laboratoristas)
  } catch (error) {
    console.error('Error al obtener laboratoristas:', error)

    return NextResponse.json({ error: 'Error al obtener laboratoristas' }, { status: 500 })
  }
}
