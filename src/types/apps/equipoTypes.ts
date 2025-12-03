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
    funcionarioAsignadoId: string | null
    areaId: number | null
    estado: string
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
    nombre: string
    tipoEquipoId: number | null
    descripcion?: string
    serie?: string
    funcionarioAsignadoId?: string | null
    areaId?: number | null
    estado: string
    observaciones?: string
}
