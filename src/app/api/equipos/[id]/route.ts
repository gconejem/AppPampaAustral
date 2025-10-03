import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export const dynamic = 'force-dynamic'
export const revalidate = 0

export async function GET(
    request: Request,
    { params }: { params: { id: string } }
) {
    try {
        const equipoId = parseInt(params.id)

        const equipo = await prisma.equipo.findUnique({
            where: { id: equipoId },
            include: {
                tipoEquipo: true,
                funcionarioAsignado: {
                    select: {
                        id: true,
                        name: true,
                        email: true,
                        rut: true,
                        roles: {
                            include: {
                                rol: true
                            }
                        }
                    }
                }
            }
        })

        if (!equipo) {
            return NextResponse.json({ error: 'Equipo no encontrado' }, { status: 404 })
        }

        return NextResponse.json(equipo)
    } catch (error) {
        console.error('Error al obtener equipo:', error)
        return NextResponse.json({ error: 'Error al obtener el equipo' }, { status: 500 })
    }
}

export async function PUT(
    request: Request,
    { params }: { params: { id: string } }
) {
    try {
        const equipoId = parseInt(params.id)
        const body = await request.json()
        const { codigo, nombre, tipoEquipoId, descripcion, serie, funcionarioAsignadoId, estado, observaciones } = body

        // Verificar que el equipo existe
        const equipoExistente = await prisma.equipo.findUnique({
            where: { id: equipoId }
        })

        if (!equipoExistente) {
            return NextResponse.json({ error: 'Equipo no encontrado' }, { status: 404 })
        }

        // Verificar si el código ya existe en otro equipo
        if (codigo !== equipoExistente.codigo) {
            const equipoConCodigo = await prisma.equipo.findUnique({
                where: { codigo }
            })

            if (equipoConCodigo) {
                return NextResponse.json(
                    { error: 'Ya existe otro equipo con este código' },
                    { status: 400 }
                )
            }
        }

        // Verificar que el tipo de equipo existe
        if (tipoEquipoId) {
            const tipoEquipo = await prisma.tipoEquipo.findUnique({
                where: { id: tipoEquipoId }
            })

            if (!tipoEquipo) {
                return NextResponse.json(
                    { error: 'El tipo de equipo especificado no existe' },
                    { status: 400 }
                )
            }
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

        const equipoActualizado = await prisma.equipo.update({
            where: { id: equipoId },
            data: {
                codigo,
                nombre,
                tipoEquipoId,
                descripcion,
                serie,
                funcionarioAsignadoId,
                estado,
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

        return NextResponse.json(equipoActualizado)
    } catch (error) {
        console.error('Error al actualizar equipo:', error)
        return NextResponse.json({ error: 'Error al actualizar el equipo' }, { status: 500 })
    }
}

export async function DELETE(
    request: Request,
    { params }: { params: { id: string } }
) {
    try {
        const equipoId = parseInt(params.id)

        // Verificar que el equipo existe
        const equipoExistente = await prisma.equipo.findUnique({
            where: { id: equipoId }
        })

        if (!equipoExistente) {
            return NextResponse.json({ error: 'Equipo no encontrado' }, { status: 404 })
        }

        // Verificar si el equipo está siendo usado en agendas
        const agendaEquipo = await prisma.agendaEquipo.findFirst({
            where: { equipoId }
        })

        if (agendaEquipo) {
            return NextResponse.json(
                { error: 'No se puede eliminar el equipo porque está asignado a una o más agendas' },
                { status: 400 }
            )
        }

        await prisma.equipo.delete({
            where: { id: equipoId }
        })

        return NextResponse.json({ message: 'Equipo eliminado correctamente' })
    } catch (error) {
        console.error('Error al eliminar equipo:', error)
        return NextResponse.json({ error: 'Error al eliminar el equipo' }, { status: 500 })
    }
}
