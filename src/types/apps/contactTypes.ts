import type { Prisma } from '@prisma/client'

export type ContactoWithRelations = Prisma.contactoGetPayload<{
  include: {
    ClienteContacto: {
      include: {
        Cliente: true
      }
    }
  }
}>

export interface ContactoFormData {
  nombre: string
  cargo: string
  email: string
  telefono1: string
  telefono2?: string | null
}

export interface ContactTableProps {
  data: ContactoWithRelations[]
  onEdit: (id: number) => void
  onDelete: (id: number) => void
}
