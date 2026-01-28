import { NextResponse } from 'next/server'
import { compare } from 'bcryptjs'
import crypto from 'crypto'
import { prisma } from '@/lib/prisma'

export const dynamic = 'force-dynamic'
export const revalidate = 0

function corsHeaders() {
  return {
    'Access-Control-Allow-Origin': 'https://localhost',
    'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    'Access-Control-Allow-Credentials': 'true'
  }
}

export async function OPTIONS() {
  return NextResponse.json({}, { headers: corsHeaders() })
}

function badCombo(username: string, message = 'No se encuentra ese usuario en el sistema') {
  return NextResponse.json(
    {
      hasErrors: true,
      errorData: [{ username }],
      errorDescription: [message]
    },
    { status: 400, headers: corsHeaders() }
  )
}

function normalizeRut(rut: string) {
  return (rut || '').toString().trim().toUpperCase()
}

function normalizeEmail(email: string) {
  return (email || '').toString().trim().toLowerCase()
}

function buildSessionId(rut: string | null | undefined) {
  const now = new Date()
  const pad = (n: number) => n.toString().padStart(2, '0')
  const timestamp = `${now.getFullYear()}-${pad(now.getMonth() + 1)}-${pad(now.getDate())}-${pad(
    now.getHours()
  )}:${pad(now.getMinutes())}:${pad(now.getSeconds())}`
  const random = crypto.randomBytes(16).toString('hex')
  const cleanRut = normalizeRut(rut || '') || 'SIN-RUT'
  return `${timestamp}-${cleanRut}-${random}`
}

export async function PUT(req: Request) {
  try {
    const body = await req.json()
    const { username, password, isRut = false, isFuncionario = false } = body || {}

    if (!username || !password) {
      return badCombo(username || '', 'Faltan credenciales')
    }

    const normalizedUsername = isRut ? normalizeRut(username) : normalizeEmail(username)

    console.log('Login attempt:', { normalizedUsername, isRut, isFuncionario })

    const user = await prisma.user.findFirst({
      where: isRut
        ? { rut: normalizedUsername }
        : { email: { equals: normalizedUsername, mode: 'insensitive' } }
    })

    console.log('User lookup result:', { found: !!user, email: user?.email, usuario: user?.usuario })

    if (!user) {
      return badCombo(username)
    }

    if (!user.password) {
      return badCombo(username, 'Usuario sin contraseña configurada')
    }

    const isValid = await compare(password, user.password)
    if (!isValid) {
      return badCombo(username, 'Credenciales inválidas')
    }

    const sessionId = buildSessionId(user.rut ?? normalizedUsername)
    const expires = new Date()
    expires.setDate(expires.getDate() + 30)

    await prisma.session.create({
      data: {
        sessionToken: sessionId,
        userId: user.id,
        expires
      }
    })

    const response: any = {
      session: sessionId,
      user: {
        emailAddress: user.email ?? '',
        emailStatus: 'confirmed',
        fullName: user.name ?? '',
        isSuperAdmin: false,
        id: user.id,
        rut: user.rut ?? ''
      }
    }

    if (isFuncionario) {
      // La App Terreno filtra las visitas por ?persona[]=<CODIGO> comparando contra user.id en agenda.asignados.
      // Para que no quede en blanco cuando el usuario tiene RUT, forzamos CODIGO al user.id y dejamos el RUT en el campo RUT.
      response.funcionario = {
        CODIGO: user.id, // este valor se usa como persona[] en /lab/api-get-lbrutas-check-integracion
        NOMBRE: user.name ?? '',
        RUT: user.rut ?? '',
        LISTAPRE: null,
        NOMBREUSO: user.name ?? '',
        CARGO: 'Vendedor',
        FUNCIONES: '',
        NOMBRECOM: user.name ?? ''
      }

      console.log('=== LOGIN BACKEND - ENVIANDO ===');
      console.log('Usuario:', user.name, '| user.id:', user.id, '| user.rut:', user.rut);
      console.log('funcionario.CODIGO:', response.funcionario.CODIGO);
    }

    return NextResponse.json(response, { status: 200, headers: corsHeaders() })
  } catch (error) {
    console.error('Error en /api/v1/login:', error)
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500, headers: corsHeaders() })
  }
}
