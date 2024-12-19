const { PrismaClient } = require('@prisma/client')

declare global {
  var prisma: typeof PrismaClient | undefined
}

export const prisma = global.prisma || new PrismaClient({
  log: ['query', 'error', 'warn']
})

if (process.env.NODE_ENV !== 'production') {
  global.prisma = prisma
}

export default prisma 