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
    tieneVencimiento?: boolean
    submuestrasVencimiento?: SubmuestraVencimiento[]
    codigoProducto?: string
}

export interface CodigoAgrupador {
    id: string
    dbId?: number
    codigoId: string
    codigoNombre: string
    rcmsVinculados: Array<{ id: number; numeroTarjeta: string; rcmType: string; numeroRcm?: string }>
    ensayos: Array<{ productoId: number; sku: string; nombre: string }>
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

export interface Step2CreateRcmsProps {
    ensayosAsociados: EnsayoAsociado[]
    setEnsayosAsociados: React.Dispatch<React.SetStateAction<EnsayoAsociado[]>>
    savedRcms: RCMData[]
    setSavedRcms: React.Dispatch<React.SetStateAction<RCMData[]>>
    otData?: any
    initialRcmType?: string
    onClearInitialRcmType?: () => void
    onDraftCountChange?: (count: number) => void
    onAgrupadosCountChange?: (count: number) => void
    onRegisterFinalizar?: (fn: () => void) => void
    onIsSavingChange?: (isSaving: boolean) => void
}
