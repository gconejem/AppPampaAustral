import { useState, useEffect } from 'react'
import type { CodificacionExistenteData } from '../types/rcm-types'

// Carga los CP y RCM ya confirmados de la OT (solo en modo incremental: OT CODIFICADA)
export function useCodificacionExistente(otId: string | null, enabled: boolean, refreshKey: number) {
    const [data, setData] = useState<CodificacionExistenteData | null>(null)
    const [loading, setLoading] = useState(false)
    const [error, setError] = useState<string | null>(null)

    useEffect(() => {
        if (!otId || !enabled) {
            setData(null)
            setError(null)
            setLoading(false)
            return
        }

        let cancelled = false
        const fetchData = async () => {
            try {
                setLoading(true)
                setError(null)
                const response = await fetch(`/api/ot/${otId}/codificacion-existente`, { cache: 'no-store' })
                if (!response.ok) throw new Error('Error al cargar la codificación existente')
                const json: CodificacionExistenteData = await response.json()
                if (!cancelled) setData(json)
            } catch (e) {
                console.error('Error al cargar codificación existente:', e)
                if (!cancelled) {
                    setData(null)
                    setError(e instanceof Error ? e.message : 'Error al cargar la codificación existente')
                }
            } finally {
                if (!cancelled) setLoading(false)
            }
        }

        fetchData()

        return () => { cancelled = true }
    }, [otId, enabled, refreshKey])

    return { data, loading, error }
}
