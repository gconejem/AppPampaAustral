export interface TipoOrdenTrabajo {
  id: number
  codigo: string | null
  descripcion: string | null
  createdAt: Date
  updatedAt: Date
}

export interface OrdenTrabajo {
  id: string
  clave: string
  tipoOT: TipoOrdenTrabajo
  tipoOrdenTrabajoId: number
  estado: string
  estadoOriginal?: string // Campo para mantener el estado original (código)
  origen: string
  fklbrutas: string
  correlativ: string
  fklbdocver: string
  fklbrutser: string
  numeroTarjeta?: string
  numeroCorrelativo?: number
  jsonOT?: any
  createdAt: Date
  updatedAt: Date
  userId: string
  agendaId?: number
  agenda?: {
    fechaInicio?: Date | string
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
