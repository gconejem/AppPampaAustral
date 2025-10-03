import { NextResponse } from 'next/server'

import { prisma } from '@/lib/prisma'

export const dynamic = 'force-dynamic'
export const revalidate = 0

export async function GET() {
  try {
    // Obtener usuarios que tienen el rol de laboratorista o laboratorista/encargado de área sala
    const laboratoristas = await prisma.user.findMany({
      where: {
        roles: {
          some: {
            rol: {
              nombre: {
                in: ['Laboratorista', 'Laboratorista / E. de Área Sala']
              }
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
