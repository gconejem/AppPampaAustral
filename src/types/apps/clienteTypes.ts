export interface Cliente {
  id: number
  rut: string
  estado: string
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
  createdAt: Date
  updatedAt: Date
} 
