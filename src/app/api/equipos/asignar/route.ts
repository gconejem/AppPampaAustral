import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function POST(request: Request) {
    try {
        const body = await request.json()
        const { equipoId, funcionarioAsignadoId } = body

        if (!equipoId) {
            return NextResponse.json(
                { error: 'El ID del equipo es requerido' },
                { status: 400 }
            )
        }

        // Verificar que el equipo existe
        const equipo = await prisma.equipo.findUnique({
            where: { id: equipoId }
        })

        if (!equipo) {
            return NextResponse.json(
                { error: 'El equipo especificado no existe' },
                { status: 404 }
            )
        }

        // Si se asigna un funcionario, verificar que existe y tiene rol de laboratorista
        if (funcionarioAsignadoId) {
            const usuario = await prisma.user.findUnique({
                where: { id: funcionarioAsignadoId },
                include: {
                    roles: {
                        include: {
                            rol: true
                        }
                    }
                }
            })

            if (!usuario) {
                return NextResponse.json(
                    { error: 'El usuario especificado no existe' },
                    { status: 404 }
                )
            }

            if (usuario.activo !== 'ACTIVO') {
                return NextResponse.json(
                    { error: 'El usuario especificado no está activo' },
                    { status: 400 }
                )
            }

            const esLaboratorista = usuario.roles.some(userRol => {
                const rolNombre = userRol.rol.nombre.toLowerCase()
                return rolNombre === 'laboratorista' || rolNombre === 'laboratorista / e. de área sala'
            })

            if (!esLaboratorista) {
                return NextResponse.json(
                    { error: 'Solo se pueden asignar equipos a usuarios con rol de laboratorista' },
                    { status: 400 }
                )
            }
        }

        // Actualizar la asignación del equipo
        const equipoActualizado = await prisma.equipo.update({
            where: { id: equipoId },
            data: {
                funcionarioAsignadoId: funcionarioAsignadoId || null
            },
            include: {
                tipoEquipo: true,
                funcionarioAsignado: {
                    select: {
                        id: true,
                        name: true,
                        email: true,
                        rut: true
                    }
                }
            }
        })

        return NextResponse.json({
            message: funcionarioAsignadoId
                ? 'Equipo asignado correctamente al laboratorista'
                : 'Equipo desasignado correctamente',
            equipo: equipoActualizado
        })
    } catch (error) {
        console.error('Error al asignar equipo:', error)
        return NextResponse.json({ error: 'Error al asignar el equipo' }, { status: 500 })
    }
}

export async function GET(request: Request) {
    try {
        const { searchParams } = new URL(request.url)
        const laboratoristaId = searchParams.get('laboratoristaId')

        if (!laboratoristaId) {
            return NextResponse.json(
                { error: 'El ID del laboratorista es requerido' },
                { status: 400 }
            )
        }

        // Obtener equipos asignados al laboratorista
        const equiposAsignados = await prisma.equipo.findMany({
            where: {
                funcionarioAsignadoId: laboratoristaId,
                estado: 'Activo'
            },
            include: {
                tipoEquipo: true
            },
            orderBy: {
                codigo: 'asc'
            }
        })

        // Obtener equipos disponibles (sin asignar o asignados a otros)
        const equiposDisponibles = await prisma.equipo.findMany({
            where: {
                funcionarioAsignadoId: null,
                estado: 'Activo'
            },
            include: {
                tipoEquipo: true
            },
            orderBy: {
                codigo: 'asc'
            }
        })

        return NextResponse.json({
            equiposAsignados,
            equiposDisponibles
        })
    } catch (error) {
        console.error('Error al obtener equipos por laboratorista:', error)
        return NextResponse.json({ error: 'Error al obtener los equipos' }, { status: 500 })
    }
}
