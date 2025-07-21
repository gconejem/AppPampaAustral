import type { Prisma } from '@prisma/client'

export interface ContactType {
  contactId: number
  nombre: string
  cargo?: string
  email: string
  telefono1: string
  telefono2?: string
  comuna?: string
  direccion?: string
  empresa?: string
  estado: 'ACTIVO' | 'INACTIVO'
  createdAt: string
  updatedAt: string
  rol: string
}

export interface ContactoWithRelations extends ContactType {
  // Aquí puedes añadir las relaciones si las hay
}

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

export interface ContactoObraForm {
  rol: string
  nombre: string
  email: string
  telefono1: string
  telefono2?: string
  isEditing?: boolean
  isPrincipal?: boolean
}
