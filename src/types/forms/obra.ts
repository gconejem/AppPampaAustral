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

export interface ContactoObra {
  nombre: string
  rol: string
  email: string
  telefono1: string
  isPrincipal?: boolean
}

export interface FormValidateType {
  numeroObra: string
  fechaIngreso: string
  estado?: string
  estadoObra?: string
  nombreObra: string
  direccion: string
  region: string
  comuna: string
  nombreCliente: string

  // Datos de facturación
  razonSocial: string
  rut: string
  giro: string
  direccionComercial: string
  comunaFacturacion: string
  telefonoFacturacion: string
  listaPrecios: string
  mailRecepcionFactura: string

  // Campos opcionales
  telefono?: string
  sitioWeb?: string
  sector?: string
  georreferencia?: string
  referencia?: string
  mandante?: string
  textoMandante?: string
  otrosRequisitos?: string
  otrasReferencias?: string

  // Campos booleanos
  informeMandante?: boolean
  acreditacionPersonal?: boolean
  especificacionesTecnicas?: boolean
  acreditacionEquipos?: boolean
  cartaCompromiso?: boolean
  mandatoServiu?: boolean
  estadoPago?: boolean
  hes?: boolean
  oc?: boolean

  // Contactos
  contactos?: ContactoObra[]
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
