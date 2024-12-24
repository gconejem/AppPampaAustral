export type Contacto = {
  contactId: number
  nombre: string
  cargo: string
  email: string
  telefono1: string
  telefono2?: string
  createdAt?: Date
  updatedAt?: Date
}

export type ContactType = Contacto 
