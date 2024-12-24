export interface FormValidateType {
  rut: string
  estado: string
  razonSocial: string
  nombreCliente: string
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
}

export interface FormNonValidateType {
  region: string
  city: string
  commune: string
  address: string
  phone: string
  website: string
  segment: string
  industry: string
  pais: string
  vendedor: string
  condicionVenta: string
  observaciones: string
}

export const initialFormData: FormNonValidateType = {
  region: '',
  city: '',
  commune: '',
  address: '',
  phone: '',
  website: '',
  segment: '',
  industry: '',
  pais: '',
  vendedor: '',
  condicionVenta: '',
  observaciones: ''
}

export interface Cliente {
  clienteId: number
  fechaCreacion: Date
  estado: string
  rut: string
  razonSocial: string
  nombreCliente: string
  pais: string
  region: string
  ciudad: string
  comuna: string
  direccion: string
  telefono: string
  sitioWeb?: string
  segmento: string
  industria: string
  clientesContactos?: ClienteContacto[]
  condicionesComerciales?: CondicionComercial
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
  createdAt?: Date
}

export interface CondicionComercial {
  id?: number
  vendedor: string
  condicionVenta: string
  observaciones?: string
}
