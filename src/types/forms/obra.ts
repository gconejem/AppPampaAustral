export type ContactoObra = {
  id?: number
  rol: string
  nombre: string
  email: string
  telefono1: string
  isPrincipal?: boolean
}

export interface Obra {
  obraId: number
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
  nombreCliente: string
  rut: string
  razonSocial: string
  giro: string

  // ... resto de campos
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
  nombreCliente: string
  rut: string
  razonSocial: string
  giro: string
  direccionComercial: string
  comunaFacturacion: string
  telefonoFacturacion: string
  listaPrecios: string
  mailRecepcionFactura: string
  informeMandante: boolean
  acreditacionPersonal: boolean
  especificacionesTecnicas: boolean
  acreditacionEquipos: boolean
  cartaCompromiso: boolean
  mandatoServiu: boolean
  estadoPago: boolean
  hes: boolean
  oc: boolean
  sector: string
  georreferencia: string
  referencia: string
  mandante: string
  textoMandante: string
  otrosRequisitos: string
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
