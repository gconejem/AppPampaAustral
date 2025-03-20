export type TipoOrdenTrabajo =
  | 'CONTROL_COMPACTACION'
  | 'MUESTREO_HORMIGON'
  | 'RETIRO_PROBETA'
  | 'MUESTREO_MATERIALES'
  | 'TESTIGOS'
  | 'EXTRACCION_ASFALTICA'
  | 'DOSIFICACION'
  | 'GENERAL'
  | 'SUSPENDIDO_TERRENO'

export interface OrdenTrabajo {
  id: string
  clave: string
  tipoOT: TipoOrdenTrabajo
  estado: string
  origen: string
  fklbrutas: string
  correlativ: string
  fklbdocver: string
  fklbrutser: string
  createdAt: Date
  updatedAt: Date
  userId: string
  agendaId?: number
  agenda?: {
    cliente?: {
      rut: string
      nombreCliente: string
    }
    obra?: {
      numeroObra: string
      nombreObra: string
      comuna: string
      region: string
    }
  }
  user?: User
  densidad?: {
    id: string
    ordenTrabajoId: string
    item?: string
    marca?: string
    modelo?: string
    controles?: any
    codigoEquipo?: string
    descripSuelo?: string
    listaChequeo?: any
  }
  hormigonFresco?: {
    id: string
    ordenTrabajoId: string
    item?: string
    clima?: string
    tAmbiente?: number
    tHormigon?: number
    numTarjeta?: string
    tipoHormigon?: string
    volumenHormigon?: number
    cantidadProbetas?: number
    conoAsentamiento?: number
    elementoHormigonado?: string
    ubicacionHormigonado?: string
    caracteristicasMezcla?: string
    probetas?: any
  }
}

interface User {
  id: string
  name?: string
  email?: string
}
