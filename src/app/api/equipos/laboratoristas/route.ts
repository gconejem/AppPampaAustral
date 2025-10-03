import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export const dynamic = 'force-dynamic'
export const revalidate = 0

export async function GET() {
    try {
        // Obtener todos los usuarios que tengan rol de laboratorista
        const laboratoristas = await prisma.user.findMany({
            where: {
                activo: 'ACTIVO',
                roles: {
                    some: {
                        rol: {
                            OR: [
                                { nombre: { equals: 'Laboratorista', mode: 'insensitive' } },
                                { nombre: { equals: 'Laboratorista / E. de Área Sala', mode: 'insensitive' } }
                            ]
                        }
                    }
                }
            },
            select: {
                id: true,
                name: true,
                email: true,
                rut: true,
                usuario: true,
                roles: {
                    include: {
                        rol: true
                    }
                },
                equiposAsignados: {
                    select: {
                        id: true,
                        codigo: true,
                        nombre: true
                    }
                }
            },
            orderBy: {
                name: 'asc'
            }
        })

        // Formatear la respuesta para incluir información útil
        const laboratoristaFormateados = laboratoristas.map(laboratorista => ({
            ...laboratorista,
            equiposCount: laboratorista.equiposAsignados.length,
            roles: laboratorista.roles.map(userRol => userRol.rol.nombre)
        }))

        return NextResponse.json(laboratoristaFormateados)
    } catch (error) {
        console.error('Error al obtener laboratoristas:', error)
        return NextResponse.json({ error: 'Error al obtener los laboratoristas' }, { status: 500 })
    }
}
