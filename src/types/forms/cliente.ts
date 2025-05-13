export interface FormValidateType {
  rut: string
  estado: string
  razonSocial: string
  nombreCliente: string
  region: string
  ciudad: string
  comuna: string
  direccion: string
  telefono: string
  sitioWeb: string
  segmento: string
  industria: string
  vendedor: string
  condicionVenta: string
  observaciones: string
  fechaCreacion?: string
  giro?: string
  emailFacturacion?: string
  rutRepresentanteLegal?: string
  representanteLegal?: string
  contacto?: {
    nombre: string
    telefono: string
    email: string
    cargo: string
    isPrincipal: boolean
  }
}

export interface FormNonValidateType {
  region: string
  ciudad: string
  comuna: string
  direccion: string
  telefono: string
  sitioWeb: string
  segmento: string
  industria: string
  pais: string
  vendedor: string
  condicionVenta: string
  observaciones: string
  giro?: string
  emailFacturacion?: string
  rutRepresentanteLegal?: string
  representanteLegal?: string
  contacto?: {
    nombre: string
    telefono: string
    email: string
    cargo: string
    isPrincipal: boolean
  }
}

export const initialFormData: FormNonValidateType = {
  region: '',
  ciudad: '',
  comuna: '',
  direccion: '',
  telefono: '',
  sitioWeb: '',
  segmento: '',
  industria: '',
  pais: '',
  vendedor: '',
  condicionVenta: '',
  observaciones: '',
  contacto: {
    nombre: '',
    telefono: '',
    email: '',
    cargo: '',
    isPrincipal: false
  }
}

export interface Cliente {
  clienteId?: number
  rut: string
  razonSocial: string
  nombreCliente: string
  pais: string
  region: string
  ciudad: string
  comuna: string
  direccion: string
  telefono?: string
  sitioWeb?: string
  segmento?: string
  industria?: string
  fechaCreacion: Date
  estado: string
  giro?: string
  emailFacturacion?: string
  clientesContactos?: ClienteContacto[]
  condicionesComerciales?: CondicionComercial
  createdAt?: Date
  updatedAt?: Date
}

export interface Contacto {
  contactId?: number
  nombre: string
  cargo: string
  email: string
  telefono1: string
  telefono2?: string
  isPrincipal?: boolean
}

export interface ClienteContacto {
  id?: number
  clienteId: number
  contactoId: number
  contacto?: Contacto
  isPrincipal: boolean
  cargo: string
  createdAt?: Date
}

export interface CondicionComercial {
  id?: number
  vendedor: string
  condicionVenta: string
  observaciones?: string
}
