import { useState, useEffect } from 'react'
import type { ProductoType, AreaType, FamiliaType } from '../types/rcm-types'
import { ITEMS_PER_PAGE } from '../types/rcm-types'

interface UseProductSearchParams {
    area: number | ''
    anchorEl: HTMLElement | null
    agrupadorSearchAnchor: HTMLElement | null
    skuSearchAnchor: HTMLElement | null
}

export function useProductSearch({ area, anchorEl, agrupadorSearchAnchor, skuSearchAnchor }: UseProductSearchParams) {
    const [searchTerm, setSearchTerm] = useState('')
    const [productsPage, setProductsPage] = useState(0)
    const [allProductos, setAllProductos] = useState<ProductoType[]>([])
    const [areas, setAreas] = useState<AreaType[]>([])
    const [familias, setFamilias] = useState<AreaType[]>([])
    const [todasLasFamilias, setTodasLasFamilias] = useState<FamiliaType[]>([])
    const [tipos, setTipos] = useState<string[]>([])
    const [selectedAreaId, setSelectedAreaId] = useState<number | null>(null)
    const [selectedTipo, setSelectedTipo] = useState('')
    const [selectedFamilia, setSelectedFamilia] = useState('')
    const [showOnlyPaquetes, setShowOnlyPaquetes] = useState(false)
    const [totalProductos, setTotalProductos] = useState(0)
    const [paginatedProductos, setPaginatedProductos] = useState<ProductoType[]>([])
    const [filterResetKey, setFilterResetKey] = useState(0)

    // Cargar áreas y familias iniciales
    useEffect(() => {
        const fetchInitialData = async () => {
            try {
                const [areasResponse, familiasResponse] = await Promise.all([
                    fetch('/api/areas'),
                    fetch('/api/familias')
                ])

                if (areasResponse.ok) {
                    const areasData = await areasResponse.json()
                    setAreas(areasData)
                }

                if (familiasResponse.ok) {
                    const familiasData = await familiasResponse.json()
                    const familiasConAreaId = familiasData.map((f: any) => ({
                        id: f.id,
                        nombre: f.nombre,
                        areaId: f.area?.id || 0
                    }))
                    setTodasLasFamilias(familiasConAreaId)
                }
            } catch (error) {
                console.error('Error al cargar datos iniciales:', error)
            }
        }
        fetchInitialData()
    }, [])

    // Cargar familias filtradas cuando cambia el área seleccionada en el popover
    useEffect(() => {
        if (!selectedAreaId) {
            setFamilias([])
            return
        }

        const fetchFamilias = async () => {
            try {
                const response = await fetch(`/api/familias?areaId=${selectedAreaId}`)
                if (response.ok) {
                    const data = await response.json()
                    setFamilias(data)
                }
            } catch (error) {
                console.error('Error al cargar familias:', error)
            }
        }
        fetchFamilias()
    }, [selectedAreaId])

    // Cargar productos con filtros
    useEffect(() => {
        if (!anchorEl && !agrupadorSearchAnchor && !skuSearchAnchor) return

        const fetchProductos = async () => {
            try {
                const params = new URLSearchParams({
                    page: productsPage.toString(),
                    limit: ITEMS_PER_PAGE.toString()
                })

                if (searchTerm) params.append('q', searchTerm)

                const currentAreaName = areas.find(a => a.id === area)?.nombre
                if (currentAreaName) params.append('area', currentAreaName)

                if (showOnlyPaquetes) params.append('esPaquete', 'true')

                console.log('Cargando productos con params:', params.toString())
                const response = await fetch(`/api/productos/search?${params.toString()}`)

                if (response.ok) {
                    const data = await response.json()
                    console.log('Productos cargados:', data)

                    const productosArray = Array.isArray(data) ? data : (data.productos || [])

                    console.log('Array de productos:', productosArray)
                    console.log('Cantidad de productos:', productosArray.length)

                    setAllProductos(productosArray)
                    setTotalProductos(productosArray.length)
                } else {
                    console.error('Error en la respuesta:', response.status)
                }
            } catch (error) {
                console.error('Error al cargar productos:', error)
            }
        }

        fetchProductos()
    }, [anchorEl, agrupadorSearchAnchor, skuSearchAnchor, searchTerm, area, areas, showOnlyPaquetes])

    // Aplicar paginación local
    useEffect(() => {
        const startIndex = productsPage * ITEMS_PER_PAGE
        const endIndex = startIndex + ITEMS_PER_PAGE
        const paginated = allProductos.slice(startIndex, endIndex)
        setPaginatedProductos(paginated)
    }, [allProductos, productsPage])

    const handleSearchChange = (event: React.ChangeEvent<HTMLInputElement>) => {
        setSearchTerm(event.target.value)
        setProductsPage(0)
    }

    const handleAreaChange = (event: any) => {
        const areaId = event.target.value ? Number(event.target.value) : null
        setSelectedAreaId(areaId)
        setSelectedTipo('')
        setSelectedFamilia('')
        setProductsPage(0)
    }

    const handleTipoChange = (event: any) => {
        setSelectedTipo(event.target.value)
        setProductsPage(0)
    }

    const handleFamiliaChange = (event: any) => {
        setSelectedFamilia(event.target.value)
        setProductsPage(0)
    }

    const handleShowOnlyPaquetesChange = () => {
        setShowOnlyPaquetes(!showOnlyPaquetes)
        setProductsPage(0)
    }

    const handleClearFilters = () => {
        setSelectedAreaId(null)
        setSelectedTipo('')
        setSelectedFamilia('')
        setSearchTerm('')
        setProductsPage(0)
        setFilterResetKey(prev => prev + 1)
    }

    return {
        // State
        searchTerm,
        setSearchTerm,
        productsPage,
        setProductsPage,
        allProductos,
        paginatedProductos,
        areas,
        familias,
        todasLasFamilias,
        tipos,
        selectedAreaId,
        setSelectedAreaId,
        selectedTipo,
        selectedFamilia,
        showOnlyPaquetes,
        totalProductos,
        filterResetKey,
        // Handlers
        handleSearchChange,
        handleAreaChange,
        handleTipoChange,
        handleFamiliaChange,
        handleShowOnlyPaquetesChange,
        handleClearFilters,
    }
}
