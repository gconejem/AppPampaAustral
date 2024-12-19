export interface Cliente {
  id?: number
  fechaCreacion?: Date
  estado: string
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
  role?: string
  currentPlan?: string
  status?: string
  contactos?: IContacto[]
  condicionesComerciales?: ICondicionComercial
}

export interface IContacto {
  id?: number
  nombre: string
  cargo: string
  email: string
  telefono1: string
  telefono2?: string
  clienteId?: number
}

export interface ICondicionComercial {
  id?: number
  vendedor: string
  condicionVenta: string
  observaciones?: string
  clienteId?: number
}
