export type Obra = {
  obraId: number
  numeroObra: string
  fechaIngreso: Date
  estado: string
  estadoObra: string
  nombreObra: string
  direccion: string
  region: string
  comuna: string
  telefono?: string
  sitioWeb?: string
  informeMandante: boolean
  textoMandante?: string
  acreditacionPersonal: boolean
  especificacionesTecnicas: boolean
  acreditacionEquipos: boolean
  cartaCompromiso: boolean
  mandatoServiu: boolean
  otrosRequisitos?: string
  razonSocial: string
  rut: string
  giro: string
  direccionComercial: string
  comunaFacturacion: string
  telefonoFacturacion: string
  listaPrecios: string
  mailRecepcionFactura: string
  estadoPago: boolean
  hes: boolean
  oc: boolean
  otrasReferencias?: string
  sector?: string
  georreferencia?: string
  referencia?: string
  mandante?: string
  nombreCliente: string
  contactos: ContactoObra[]
  createdAt: Date
  updatedAt: Date
}

export type ContactoObra = {
  id: number
  obraId: number
  nombre: string
  rol: string
  email: string
  telefono1: string
  telefono2?: string
  isPrincipal: boolean
  createdAt: Date
  updatedAt: Date
}

export type WorkTypeWithAction = Obra & {
  action?: string
}

// Agregar el initialFormData que falta
export const initialFormData = {
  numeroObra: '',
  fechaIngreso: new Date(),
  estado: 'activo',
  estadoObra: 'activo',
  nombreObra: '',
  direccion: '',
  region: '',
  comuna: '',
  telefono: '',
  sitioWeb: '',
  informeMandante: false,
  textoMandante: '',
  acreditacionPersonal: false,
  especificacionesTecnicas: false,
  acreditacionEquipos: false,
  cartaCompromiso: false,
  mandatoServiu: false,
  otrosRequisitos: '',
  razonSocial: '',
  rut: '',
  giro: '',
  direccionComercial: '',
  comunaFacturacion: '',
  telefonoFacturacion: '',
  listaPrecios: '',
  mailRecepcionFactura: '',
  estadoPago: false,
  hes: false,
  oc: false,
  otrasReferencias: '',
  sector: '',
  georreferencia: '',
  referencia: '',
  mandante: '',
  nombreCliente: '',
  contactos: []
}
