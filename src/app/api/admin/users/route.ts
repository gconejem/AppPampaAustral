import { NextResponse } from 'next/server'
import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

export async function GET() {
    const users = await prisma.user.findMany({
        include: {
            roles: {
                include: {
                    rol: {
                        include: {
                            permisos: {
                                include: { permission: true }
                            }
                        }
                    }
                }
            }
        }
    })

    const mapped = users.map(u => ({
        id: u.id,
        name: u.name,
        email: u.email,
        active: u.activo,
        roles: u.roles.map(r => r.rol.nombre),
        permissions: u.roles.flatMap(r => r.rol.permisos.map(p => p.permission.name))
    }))
    return NextResponse.json(mapped)
}

export async function POST(request: Request) {
    const data = await request.json()
    // Elimina el campo 'active' si existe
    delete data.active

    const user = await prisma.user.create({
        data: {
            name: data.name,
            email: data.email,
            activo: 'ACTIVO', // <-- usa el campo correcto
            roles: {
                create: data.roles.map((rolNombre: string) => ({
                    rol: { connect: { nombre: rolNombre } }
                }))
            }
        }
    })
    return NextResponse.json(user)
}
