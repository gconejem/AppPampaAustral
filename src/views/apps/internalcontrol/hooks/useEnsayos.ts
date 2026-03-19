import { useState, useRef, useEffect } from 'react'
import type { EnsayoAsociado, SubProducto, ProductoType } from '../types/rcm-types'

interface UseEnsayosParams {
    ensayosAsociados: EnsayoAsociado[]
    setEnsayosAsociados: React.Dispatch<React.SetStateAction<EnsayoAsociado[]>>
}

export function useEnsayos({ ensayosAsociados, setEnsayosAsociados }: UseEnsayosParams) {
    const [ensayosPendientes, setEnsayosPendientes] = useState<Set<number>>(new Set())
    const lastEnsayoCantidadRef = useRef<HTMLInputElement>(null)
    const [statusMenuAnchor, setStatusMenuAnchor] = useState<HTMLElement | null>(null)
    const [selectedEnsayoId, setSelectedEnsayoId] = useState<number | null>(null)

    // Focus en el campo de cantidad cuando se agrega un nuevo ensayo (no paquete)
    useEffect(() => {
        if (ensayosAsociados.length > 0 && lastEnsayoCantidadRef.current) {
            const lastEnsayo = ensayosAsociados[ensayosAsociados.length - 1]
            if (lastEnsayo.esPaquete) return

            setTimeout(() => {
                const inputElement = lastEnsayoCantidadRef.current?.querySelector('input')
                if (inputElement) {
                    inputElement.focus()
                    inputElement.select()
                }
            }, 0)
        }
    }, [ensayosAsociados.length])

    const handleSelectProduct = async (producto: ProductoType) => {
        const idProducto = (producto as any).productoId || producto.id

        const yaExiste = ensayosAsociados.some(e => e.productoId === idProducto)
        if (yaExiste) return

        if (producto.esPaquete) {
            try {
                const response = await fetch(`/api/productos/${idProducto}/productos`)
                if (response.ok) {
                    const data = await response.json()
                    const productosDelPaquete = data.productos || []

                    const subProductos: SubProducto[] = productosDelPaquete.map((p: any, idx: number) => ({
                        id: Date.now() + idx + 1,
                        productoId: p.productoId,
                        sku: p.sku,
                        nombre: p.nombre,
                        norma: p.norma || '',
                        cantidad: p.cantidad || 1,
                        observacion: '',
                        isEditing: false
                    }))

                    const nuevoEnsayoPaquete: EnsayoAsociado = {
                        id: Date.now(),
                        productoId: idProducto,
                        sku: producto.sku,
                        nombre: producto.nombre,
                        norma: producto.norma,
                        cantidad: 1,
                        observacion: '',
                        estadoOperativo: 'Codificado',
                        esPaquete: true,
                        subProductos
                    }

                    setEnsayosAsociados(prev => [...prev, nuevoEnsayoPaquete])
                }
            } catch (error) {
                console.error('Error al cargar productos del paquete:', error)
            }
        } else {
            const nuevoEnsayo: EnsayoAsociado = {
                id: Date.now(),
                productoId: idProducto,
                sku: producto.sku,
                nombre: producto.nombre,
                norma: producto.norma,
                cantidad: 1,
                observacion: '',
                estadoOperativo: 'Codificado'
            }

            setEnsayosAsociados(prev => [...prev, nuevoEnsayo])
            setEnsayosPendientes(prev => new Set([...prev, nuevoEnsayo.id]))
        }
    }

    const handleDeleteEnsayo = (ensayoId: number) => {
        setEnsayosAsociados(ensayosAsociados.filter(e => e.id !== ensayoId))
        setEnsayosPendientes(prev => {
            const newSet = new Set(prev)
            newSet.delete(ensayoId)
            return newSet
        })
    }

    const handleDeleteSubProducto = (ensayoId: number, subProductoId: number) => {
        setEnsayosAsociados(prev => prev.map(e => {
            if (e.id !== ensayoId || !e.subProductos) return e
            return { ...e, subProductos: e.subProductos.filter(sp => sp.id !== subProductoId) }
        }))
    }

    const handleToggleEditSubProducto = (ensayoId: number, subProductoId: number) => {
        setEnsayosAsociados(prev => prev.map(e => {
            if (e.id !== ensayoId || !e.subProductos) return e
            return {
                ...e,
                subProductos: e.subProductos.map(sp =>
                    sp.id === subProductoId ? { ...sp, isEditing: !sp.isEditing } : sp
                )
            }
        }))
    }

    const handleChangeSubProductoCantidad = (ensayoId: number, subProductoId: number, cantidad: number) => {
        setEnsayosAsociados(prev => prev.map(e => {
            if (e.id !== ensayoId || !e.subProductos) return e
            return {
                ...e,
                subProductos: e.subProductos.map(sp =>
                    sp.id === subProductoId ? { ...sp, cantidad } : sp
                )
            }
        }))
    }

    const handleChangeSubProductoObservacion = (ensayoId: number, subProductoId: number, observacion: string) => {
        setEnsayosAsociados(prev => prev.map(e => {
            if (e.id !== ensayoId || !e.subProductos) return e
            return {
                ...e,
                subProductos: e.subProductos.map(sp =>
                    sp.id === subProductoId ? { ...sp, observacion } : sp
                )
            }
        }))
    }

    const handleToggleEditEnsayo = (ensayoId: number) => {
        setEnsayosAsociados(prev => prev.map(e =>
            e.id === ensayoId ? { ...e, isEditing: !e.isEditing } : e
        ))
    }

    const handleConfirmEnsayo = (ensayoId: number) => {
        setEnsayosPendientes(prev => {
            const newSet = new Set(prev)
            newSet.delete(ensayoId)
            return newSet
        })
        if (document.activeElement instanceof HTMLElement) {
            document.activeElement.blur()
        }
    }

    const handleCancelEnsayo = (ensayoId: number) => {
        handleDeleteEnsayo(ensayoId)
    }

    const handleChangeCantidad = (ensayoId: number, cantidad: number) => {
        setEnsayosAsociados(ensayosAsociados.map(e =>
            e.id === ensayoId ? { ...e, cantidad } : e
        ))
    }

    const handleKeyPressQuantity = (e: React.KeyboardEvent, ensayoId: number) => {
        if (e.key === 'Enter') {
            e.preventDefault()
            handleConfirmEnsayo(ensayoId)
        }
    }

    const handleChangeObservacion = (ensayoId: number, observacion: string) => {
        setEnsayosAsociados(ensayosAsociados.map(e =>
            e.id === ensayoId ? { ...e, observacion } : e
        ))
    }

    const handleChangeEstadoOperativo = (ensayoId: number, estadoOperativo: string) => {
        setEnsayosAsociados(ensayosAsociados.map(e =>
            e.id === ensayoId ? { ...e, estadoOperativo } : e
        ))
    }

    const handleOpenStatusMenu = (event: React.MouseEvent<HTMLElement>, ensayoId: number) => {
        setStatusMenuAnchor(event.currentTarget)
        setSelectedEnsayoId(ensayoId)
    }

    const handleCloseStatusMenu = () => {
        setStatusMenuAnchor(null)
        setSelectedEnsayoId(null)
    }

    const handleSelectStatus = (status: string) => {
        if (selectedEnsayoId !== null) {
            handleChangeEstadoOperativo(selectedEnsayoId, status)
        }
        handleCloseStatusMenu()
    }

    const clearPendientes = () => {
        setEnsayosPendientes(new Set())
    }

    return {
        ensayosPendientes,
        lastEnsayoCantidadRef,
        statusMenuAnchor,
        selectedEnsayoId,
        clearPendientes,
        handleSelectProduct,
        handleDeleteEnsayo,
        handleDeleteSubProducto,
        handleToggleEditSubProducto,
        handleChangeSubProductoCantidad,
        handleChangeSubProductoObservacion,
        handleToggleEditEnsayo,
        handleConfirmEnsayo,
        handleCancelEnsayo,
        handleChangeCantidad,
        handleKeyPressQuantity,
        handleChangeObservacion,
        handleChangeEstadoOperativo,
        handleOpenStatusMenu,
        handleCloseStatusMenu,
        handleSelectStatus,
    }
}
