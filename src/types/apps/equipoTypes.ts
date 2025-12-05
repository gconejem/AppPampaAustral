export interface TipoEquipo {
    id: number
    tipo: string
}

export interface Laboratorista {
    id: string
    name: string | null
    email: string | null
    rut: string | null
    usuario: string | null
    roles: string[]
    equiposCount?: number
}

export interface Area {
    id: number
    nombre: string
}

export interface Equipo {
    id: number
    codigo: string
    nombre: string
    tipoEquipoId: number
    descripcion: string | null
    serie: string | null
    marca: string | null
    modelo: string | null
    funcionarioAsignadoId: string | null
    areaId: number | null
    estado: string
    agenda: boolean | null
    observaciones: string | null
    createdAt: Date
    updatedAt: Date
    tipoEquipo: TipoEquipo
    funcionarioAsignado: {
        id: string
        name: string | null
        email: string | null
        rut: string | null
    } | null
    area: Area | null
}

export interface EquipoFormData {
    codigo: string
    tipoEquipoId: number | null
    descripcion?: string
    serie?: string
    marca?: string
    modelo?: string
    areaId?: number | null
    funcionarioAsignadoId?: string | null
    estado: string
    agenda?: boolean
    observaciones?: string
}
