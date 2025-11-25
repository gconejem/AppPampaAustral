import { NextResponse } from 'next/server'
import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

export async function PUT(request: Request, { params }: { params: { id: string } }) {
    const data = await request.json()

    // Actualiza usuario
    await prisma.user.update({
        where: { id: params.id },
        data: {
            name: data.name,
            email: data.email,
        }
    })

    // Actualiza roles: elimina los actuales y asigna los nuevos
    await prisma.userRol.deleteMany({ where: { userId: params.id } })
    await prisma.user.update({
        where: { id: params.id },
        data: {
            roles: {
                create: data.roles.map((rolNombre: string) => ({
                    rol: { connect: { nombre: rolNombre } }
                }))
            }
        }
    })

    return NextResponse.json({ ok: true })
}

export async function DELETE(request: Request, { params }: { params: { id: string } }) {
    await prisma.user.update({
        where: { id: params.id },
        data: { activo: 'INACTIVO' } // <-- usa 'activo' y el valor 'INACTIVO'
    })
    return NextResponse.json({ ok: true })
}
