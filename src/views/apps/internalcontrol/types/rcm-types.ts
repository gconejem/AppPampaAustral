export const ITEMS_PER_PAGE = 10

export interface ProductoType {
    id: number
    sku: string
    nombre: string
    precio: number
    area?: string
    familia?: string
    tipo?: string
    descripcion?: string
    esPaquete?: boolean
    norma?: string
}

export interface SubProducto {
    id: number
    productoId: number
    sku: string
    nombre: string
    norma?: string
    cantidad: number
    observacion: string
    isEditing?: boolean
}

export interface EnsayoAsociado {
    id: number
    productoId: number
    sku: string
    nombre: string
    norma?: string
    cantidad: number
    observacion: string
    estadoOperativo: string
    esPaquete?: boolean
    subProductos?: SubProducto[]
    isEditing?: boolean
}

export interface SubmuestraVencimiento {
    id: number
    submuestra: string
    numero: number
    dias: number
    fechaVencimiento: string
    cantidad: number
}

export interface RCMData {
    id: number
    dbId?: number
    temporaryCode?: string // Temporary code for display (RCM-001, RCM-002, etc.) until finalization
    rcmType: string
    sede?: string
    area?: string
    tipoServicio?: string
    numeroTarjeta: string
    tipoMaterial: string
    item: string
    procedencia?: string
    ubicacionSector?: string
    elemento?: string
    grado?: string
    calicata?: string
    estrato?: string
    cota1?: string
    cota2?: string
    observacionItem?: string
    observaciones?: string
    informeEnsayo?: boolean
    ensayos: EnsayoAsociado[]
    fechaServicio: string
    fechaCodificacion?: string
    fechaMuestreo?: string
    fechaIngreso?: string
    fechaEntrega?: string
    fechaConfeccion?: string
    tomaMuestra?: string
    cantidadMuestras: string
    numeroRcm?: string
    estado: string
    estadoOperativo?: string // Estado operativo real (solo RCM ya confirmados, cargados al reagrupar)
    tieneVencimiento?: boolean
    submuestrasVencimiento?: SubmuestraVencimiento[]
    codigoProducto?: string
}

export interface CodigoAgrupador {
    id: string
    dbId?: number
    temporaryCode?: string // Temporary code for display (PRD-001, PRD-002, etc.) until finalization
    codigoId: string
    codigoNombre: string
    rcmsVinculados: Array<{ id: number; numeroTarjeta: string; rcmType: string; numeroRcm?: string; temporaryCode?: string }>
    ensayos: Array<{ productoId: number; sku: string; nombre: string; cantidad?: number }>
    descripcionServicio: string
    cantidad: number
    unidad: string
    facturacion: 'Unitario' | 'Fijo'
}

export interface AreaType {
    id: number
    nombre: string
}

export interface FamiliaType {
    id: number
    nombre: string
    areaId: number
}

export interface ParametroAreaType {
    id: number
    areaId: number
    tipo: string
    descripcion: string
}

export interface Step2CreateRcmsProps {
    ensayosAsociados: EnsayoAsociado[]
    setEnsayosAsociados: React.Dispatch<React.SetStateAction<EnsayoAsociado[]>>
    savedRcms: RCMData[]
    setSavedRcms: React.Dispatch<React.SetStateAction<RCMData[]>>
    otData?: any
    initialRcmType?: string
    onClearInitialRcmType?: () => void
    onDraftCountChange?: (count: number) => void
    onAgrupadosIdsChange?: (ids: Set<number>) => void
    onRegisterFinalizar?: (fn: () => void) => void
    onIsSavingChange?: (isSaving: boolean) => void
    onCodificacionGuardada?: () => void
    onRegisterReagrupar?: (fn: (data: ReagruparData) => void) => void
}

// Datos para reagrupar: CP y RCM confirmados en formato del workbench
export interface ReagruparData {
    rcms: RCMData[]
    codigos: CodigoAgrupador[]
}

// Codificación existente (CP y RCM ya confirmados de una OT codificada)
export interface RcmResumenExistente {
    id: number
    numeroRcm: string
    rcmType: string
    estadoOperativo?: string | null
    fechaCodificacion?: string | null
    fechaMuestreo?: string | null
    fechaServicio?: string | null
    fechaConfeccion?: string | null
    numeroTarjeta?: string | null
    tomaMuestra?: string | null
    tipoMaterial?: string | null
    item?: string | null
    observacionItem?: string | null
    cota1?: string | null
    cota2?: string | null
    elemento?: string | null
    grado?: string | null
    area?: string | null
    tipoServicio?: string | null
    actividades: number
}

export interface CodigoProductoExistente {
    id: number
    codigoNombre: string
    descripcionServicio?: string | null
    area?: string | null
    rcms: RcmResumenExistente[]
}

export interface CodificacionExistenteData {
    estadoOT?: string
    codigos: CodigoProductoExistente[]
    totales: { codigos: number; rcms: number; porTipo: { Muestra: number; Control: number; Servicio: number } }
}
