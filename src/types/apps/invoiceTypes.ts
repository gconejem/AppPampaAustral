export type InvoiceStatus = 'Paid' | string

export type InvoiceLayoutProps = {
  id: string | undefined
}

export type InvoiceClientType = {
  name: string
  address: string
  company: string
  country: string
  contact: string
  companyEmail: string
}

interface Contacto {
  nombre: string
  cargo?: string
  email?: string
  telefono1?: string
}

export interface InvoiceType {
  id: number
  numeroCotizacion: string
  tipoCotizacion: string
  fecha: string
  empresa: string
  comuna: string
  tipo: 'VALORES_UNITARIOS' | 'EMS' | 'MENSUAL' | string
  contacto: Contacto | null
  estado: 'BORRADOR' | 'COTIZADA' | 'GESTIONADA' | 'ACEPTADA' | 'SIN_RESPUESTA' | 'RECHAZADA'
  detalles: any[]
  total: number
  cargo?: string
  email?: string
  telefono?: string
  observacionGestion?: string
}

export type InvoicePaymentType = {
  iban: string
  totalDue: string
  bankName: string
  country: string
  swiftCode: string
}

export type SingleInvoiceType = {
  invoice: InvoiceType
  paymentDetails: InvoicePaymentType
}
