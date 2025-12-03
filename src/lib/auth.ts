import NextAuth from 'next-auth'
import CredentialsProvider from 'next-auth/providers/credentials'
import { PrismaClient } from '@prisma/client'
import { compare } from 'bcryptjs'

const prisma = new PrismaClient()

export const { handlers, auth, signIn, signOut } = NextAuth({
  providers: [
    CredentialsProvider({
      name: 'Credentials',
      credentials: {
        email: { label: 'Email', type: 'email' },
        password: { label: 'Contraseña', type: 'password' }
      },
      async authorize(credentials) {
        // Solo log en desarrollo SIN datos sensibles
        if (process.env.NODE_ENV === 'development') {
          console.log('🔐 Intentando autenticar usuario')
        }

        if (!credentials?.email || !credentials?.password) {
          throw new Error('Email y contraseña son requeridos')
        }

        try {
          const user = await prisma.user.findUnique({
            where: { email: credentials.email as string },
            select: {
              id: true,
              name: true,
              email: true,
              password: true,
              rut: true,
              activo: true
            }
          })

          if (!user) {
            throw new Error('Credenciales inválidas')
          }

          if (user.activo !== 'ACTIVO') {
            throw new Error('Usuario inactivo')
          }

          if (!user.password) {
            throw new Error('Usuario sin contraseña configurada')
          }

          const isPasswordValid = await compare(
            credentials.password as string,
            user.password
          )

          if (!isPasswordValid) {
            throw new Error('Credenciales inválidas')
          }

          if (process.env.NODE_ENV === 'development') {
            console.log('✅ Autenticación exitosa')
          }

          return {
            id: user.id,
            name: user.name,
            email: user.email,
            rut: user.rut
          }
        } catch (error: any) {
          // Log mínimo sin exponer datos
          if (process.env.NODE_ENV === 'development') {
            console.error('❌ Error de autenticación')
          }
          throw error
        }
      }
    })
  ],
  session: {
    strategy: 'jwt',
    maxAge: 30 * 24 * 60 * 60,
  },
  pages: {
    signIn: '/login',
    error: '/login',
  },
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.id = user.id
        token.email = user.email
        token.name = user.name
      }
      return token
    },
    async session({ session, token }) {
      console.log('🔐 [session] token recibido:', token)
      if (token?.id && session.user) {
        const dbUser = await prisma.user.findUnique({
          where: { id: token.id as string },
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
        console.log('🔐 [session] usuario en BD:', dbUser)

        session.user.id = dbUser?.id
        session.user.email = dbUser?.email
        session.user.name = dbUser?.name
        session.user.roles = dbUser?.roles.map(r => r.rol.nombre) ?? []
        session.user.permissions = dbUser?.roles
          .flatMap(r => r.rol.permisos.map(p => p.permission.name)) ?? []

        console.log('🔐 [session] roles:', session.user.roles)
        console.log('🔐 [session] permisos:', session.user.permissions)
      }
      return session
    }
  },
  debug: process.env.NODE_ENV === 'development'
})
