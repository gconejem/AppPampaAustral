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
    return NextResponse.json(users)
}

export async function POST(req: Request) {
    const data = await req.json()
    // data: { name, email, password, roles: [rolId, ...] }
    const user = await prisma.user.create({
        data: {
            name: data.name,
            email: data.email,
            password: data.password,
            roles: {
                create: data.roles.map((rolId: number) => ({ rolId }))
            }
        }
    })
    return NextResponse.json(user)
}
