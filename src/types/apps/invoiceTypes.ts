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

export interface InvoiceType {
  id: number
  numeroCotizacion: string
  fecha: string
  empresa: string
  comuna: string
  tipo: 'A' | 'B' | 'C'
  contacto: string
  estado: 'BORRADOR' | 'COTIZADA' | 'GESTIONADA' | 'ACEPTADA' | 'SIN_RESPUESTA' | 'RECHAZADA'
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
