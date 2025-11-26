import { NextResponse } from 'next/server'
import { PrismaClient } from '@prisma/client'
import bcrypt from 'bcryptjs'

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
    const existing = await prisma.user.findUnique({ where: { email: data.email } })
    if (existing) {
        return new Response(JSON.stringify({ error: 'El email ya está registrado.' }), { status: 400 })
    }
    // Elimina el campo 'active' si existe
    delete data.active

    const passwordHash = await bcrypt.hash('pampa123', 10)

    const newUser = {
        name: data.name,
        email: data.email,
        usuario: data.usuario,
        rut: data.rut,
        activo: 'ACTIVO',
        roles: data.roles,
        password: passwordHash
    }

    const user = await prisma.user.create({
        data: {
            name: newUser.name,
            email: newUser.email,
            usuario: newUser.usuario,
            rut: newUser.rut,
            activo: newUser.activo,
            password: newUser.password,
            roles: {
                create: newUser.roles.map((rolNombre: string) => ({
                    rol: { connect: { nombre: rolNombre } }
                }))
            }
        }
    })
    return NextResponse.json(user)
}
