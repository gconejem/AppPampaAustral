export type ContactoObra = {
  id: number
  nombre: string
  cargo: string
  email: string
  telefono1: string
  telefono2?: string
  isPrincipal: boolean
}

export type Obra = {
  obraId: number
  fechaCreacion?: Date
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

  // Datos del mandante
  informeMandante: boolean
  textoMandante?: string

  // Requisitos
  acreditacionPersonal: boolean
  especificacionesTecnicas: boolean
  acreditacionEquipos: boolean
  cartaCompromiso: boolean
  mandatoServiu: boolean
  otrosRequisitos: string

  // Facturación
  razonSocial: string
  rut: string
  giro: string
  direccionComercial: string
  comunaFacturacion: string
  telefonoFacturacion: string
  listaPrecios: string
  mailRecepcionFactura: string

  // Referencias
  estadoPago: boolean
  hes: boolean
  oc: boolean
  otrasReferencias: string

  contactos: ContactoObra[]
  createdAt?: Date
  updatedAt?: Date
}

export type FormValidateType = {
  numeroObra: string
  fechaIngreso: string
  estado: string
  estadoObra: string
  nombreObra: string
  direccion: string
  region: string
  comuna: string
  telefono: string
  sitioWeb: string

  informeMandante: boolean
  textoMandante: string

  acreditacionPersonal: boolean
  especificacionesTecnicas: boolean
  acreditacionEquipos: boolean
  cartaCompromiso: boolean
  mandatoServiu: boolean
  otrosRequisitos: string

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
  otrasReferencias: string
}

export const initialFormData = {
  numeroObra: '',
  fechaIngreso: new Date().toISOString().split('T')[0],
  estado: 'activo',
  estadoObra: '',
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
  otrasReferencias: ''
}

export type WorkTypeWithAction = Obra & {
  action?: string
}
