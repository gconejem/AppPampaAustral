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
      if (token && session.user) {
        session.user.id = token.id as string
        session.user.email = token.email as string
        session.user.name = token.name as string
      }
      return session
    }
  },
  // ⚠️ SOLO debug en desarrollo, NUNCA en producción
  debug: process.env.NODE_ENV === 'development',
  
  // 🔒 Configuración adicional de seguridad
  logger: {
    error(code, metadata) {
      // Solo log en desarrollo
      if (process.env.NODE_ENV === 'development') {
        console.error('Auth Error:', code)
      }
    },
    warn(code) {
      if (process.env.NODE_ENV === 'development') {
        console.warn('Auth Warning:', code)
      }
    },
    debug(code, metadata) {
      // Comentar para reducir logs en desarrollo
      // console.log('Auth Debug:', code)
    }
  }
})
