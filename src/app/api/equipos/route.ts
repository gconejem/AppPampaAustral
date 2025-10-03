import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export const dynamic = 'force-dynamic'

export async function GET(request: Request) {
    try {
        const { searchParams } = new URL(request.url)
        const page = parseInt(searchParams.get('page') || '1')
        const limit = parseInt(searchParams.get('limit') || '10')
        const search = searchParams.get('search') || ''
        const tipoEquipoId = searchParams.get('tipoEquipoId')
        const estado = searchParams.get('estado')

        const skip = (page - 1) * limit

        const where: any = {}

        if (search) {
            where.OR = [
                { codigo: { contains: search, mode: 'insensitive' } },
                { nombre: { contains: search, mode: 'insensitive' } },
                { descripcion: { contains: search, mode: 'insensitive' } }
            ]
        }

        if (tipoEquipoId) {
            where.tipoEquipoId = parseInt(tipoEquipoId)
        }

        if (estado) {
            where.estado = estado
        }

        const [equipos, total] = await Promise.all([
            prisma.equipo.findMany({
                where,
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
                },
                orderBy: {
                    codigo: 'asc'
                },
                skip,
                take: limit
            }),
            prisma.equipo.count({ where })
        ])

        return NextResponse.json({
            equipos,
            total,
            pages: Math.ceil(total / limit),
            currentPage: page
        })
    } catch (error) {
        console.error('Error al obtener equipos:', error)
        return NextResponse.json({ error: 'Error al obtener los equipos' }, { status: 500 })
    }
}

export async function POST(request: Request) {
    try {
        const body = await request.json()
        const { codigo, nombre, tipoEquipoId, descripcion, serie, funcionarioAsignadoId, estado, observaciones } = body

        // Verificar si el código ya existe
        const equipoExistente = await prisma.equipo.findUnique({
            where: { codigo }
        })

        if (equipoExistente) {
            return NextResponse.json(
                { error: 'Ya existe un equipo con este código' },
                { status: 400 }
            )
        }

        // Verificar que el tipo de equipo existe
        const tipoEquipo = await prisma.tipoEquipo.findUnique({
            where: { id: tipoEquipoId }
        })

        if (!tipoEquipo) {
            return NextResponse.json(
                { error: 'El tipo de equipo especificado no existe' },
                { status: 400 }
            )
        }

        // Si se asigna un funcionario, verificar que tiene rol de laboratorista
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

        const equipo = await prisma.equipo.create({
            data: {
                codigo,
                nombre,
                tipoEquipoId,
                descripcion,
                serie,
                funcionarioAsignadoId,
                estado: estado || 'Activo',
                observaciones
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

        return NextResponse.json(equipo, { status: 201 })
    } catch (error) {
        console.error('Error al crear equipo:', error)
        return NextResponse.json({ error: 'Error al crear el equipo' }, { status: 500 })
    }
}
