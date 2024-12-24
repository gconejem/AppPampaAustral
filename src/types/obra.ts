export type Obra = {
  id: number
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

  // Requisitos
  acreditacionPersonal: boolean
  especificacionesTecnicas: boolean
  acreditacionEquipos: boolean
  cartaCompromiso: boolean
  mandatoServiu: boolean
  otrosRequisitos?: string

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
  otrasReferencias?: string

  createdAt: Date
  updatedAt: Date

  contactos: ContactoObra[]
}

export type ContactoObra = {
  id: number
  nombre: string
  cargo: string
  email: string
  telefono1: string
  telefono2?: string
  obraId: number
}
