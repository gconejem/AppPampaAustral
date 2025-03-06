// Interfaces para Obra
export interface Obra {
  obraId?: number
  numeroObra: string
  fechaIngreso: Date
  estado: string
  estadoObra: string
  nombreObra: string
  direccion: string
  region: string
  comuna: string
  nombreCliente: string
  rut: string
  mandante?: string
  sector?: string
  referencia?: string
  georreferencia?: string
  informeMandante: boolean
  textoMandante?: string
  acreditacionPersonal: boolean
  especificacionesTecnicas: boolean
  acreditacionEquipos: boolean
  cartaCompromiso: boolean
  mandatoServiu: boolean
  otrosRequisitos?: string
  contactos?: ContactoObra[]
  razonSocial?: string
  giro?: string
  direccionComercial?: string
  comunaFacturacion?: string
  telefonoFacturacion?: string
  listaPrecios?: string
  mailRecepcionFactura?: string
  estadoPago?: boolean
  hes?: boolean
  oc?: boolean
  otrasReferencias?: string
  createdAt?: Date
  updatedAt?: Date
}

export interface ContactoObra {
  id?: number
  obraId: number
  nombre: string
  email?: string
  telefono1?: string
  telefono2?: string
  isPrincipal: boolean
  rol: string
}

export interface FormValidateType {
  numeroObra: string
  fechaIngreso: string
  estado: string
  estadoObra: string
  nombreObra: string
  direccion: string
  region: string
  comuna: string
  nombreCliente: string
  rut: string
  mandante?: string
  sector?: string
  referencia?: string
  georreferencia?: string
  informeMandante?: boolean
  textoMandante?: string
  acreditacionPersonal?: boolean
  especificacionesTecnicas?: boolean
  acreditacionEquipos?: boolean
  cartaCompromiso?: boolean
  mandatoServiu?: boolean
  otrosRequisitos?: string

  // Campos de facturación
  razonSocial?: string
  giro?: string
  direccionComercial?: string
  comunaFacturacion?: string
  telefonoFacturacion?: string
  telefono?: string
  listaPrecios?: string
  mailRecepcionFactura?: string

  // Referencias
  estadoPago?: boolean
  hes?: boolean
  oc?: boolean
  otrasReferencias?: string
}

export const initialFormData = {
  numeroObra: '',
  fechaIngreso: new Date().toISOString().split('T')[0],
  estado: 'ACTIVO',
  estadoObra: '',
  nombreObra: '',
  direccion: '',
  region: '',
  comuna: '',
  nombreCliente: '',
  rut: '',
  mandante: '',
  sector: '',
  referencia: '',
  razonSocial: '',
  giro: '',
  direccionComercial: '',
  comunaFacturacion: '',
  telefonoFacturacion: '',
  listaPrecios: '',
  mailRecepcionFactura: ''
}

export type WorkTypeWithAction = Obra & {
  action?: string
}
