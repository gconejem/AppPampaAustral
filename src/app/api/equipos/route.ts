import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export const dynamic = 'force-dynamic'
export const revalidate = 0

export async function GET(request: Request) {
    try {
        const { searchParams } = new URL(request.url)
        const page = parseInt(searchParams.get('page') || '1')
        const limit = parseInt(searchParams.get('limit') || '10')
        const search = searchParams.get('search') || ''

        // Obtener filtros (pueden ser múltiples)
        const tipoEquipoIds = searchParams.getAll('tipoEquipoId')
        const estados = searchParams.getAll('estado')
        const areaIds = searchParams.getAll('areaId')
        const funcionarioAsignadoIds = searchParams.getAll('funcionarioAsignadoId')

        const skip = (page - 1) * limit

        const where: any = {}

        if (search) {
            const searchConditions: any[] = [
                { codigo: { contains: search, mode: 'insensitive' } },
                { nombre: { contains: search, mode: 'insensitive' } },
                { descripcion: { contains: search, mode: 'insensitive' } },
                { serie: { contains: search, mode: 'insensitive' } },
                { tipoEquipo: { tipo: { contains: search, mode: 'insensitive' } } },
                { area: { nombre: { contains: search, mode: 'insensitive' } } },
                { funcionarioAsignado: { name: { contains: search, mode: 'insensitive' } } },
                { funcionarioAsignado: { rut: { contains: search, mode: 'insensitive' } } }
            ]

            // Si es un número, buscar también por ID (correlativo)
            const searchNumber = parseInt(search)
            if (!isNaN(searchNumber)) {
                searchConditions.push({ id: searchNumber })
            }

            where.OR = searchConditions
        }

        // Filtros con multiselección
        if (tipoEquipoIds.length > 0) {
            where.tipoEquipoId = {
                in: tipoEquipoIds.map(id => parseInt(id))
            }
        }

        if (estados.length > 0) {
            where.estado = {
                in: estados
            }
        }

        if (areaIds.length > 0) {
            where.areaId = {
                in: areaIds.map(id => parseInt(id))
            }
        }

        if (funcionarioAsignadoIds.length > 0) {
            where.funcionarioAsignadoId = {
                in: funcionarioAsignadoIds
            }
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
                    },
                    area: {
                        select: {
                            id: true,
                            nombre: true
                        }
                    }
                },
                orderBy: {
                    id: 'asc'
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
        const { codigo, nombre, tipoEquipoId, descripcion, serie, funcionarioAsignadoId, areaId, estado, observaciones } = body

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
                areaId,
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
                },
                area: {
                    select: {
                        id: true,
                        nombre: true
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
