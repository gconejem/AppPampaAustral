'use client'

// MUI Imports
import { useEffect, useRef, useState } from 'react'

import { useSearchParams } from 'next/navigation'

import Grid from '@mui/material/Grid'
import Alert from '@mui/material/Alert'

// Component Imports
import Header from './header'
import Step2CreateRcms from './step2-create-rcms'
import CodificacionExistenteBar from './components/CodificacionExistenteBar'
import { useCodificacionExistente } from './hooks/useCodificacionExistente'
import type { ReagruparData } from './types/rcm-types'

// Definición de tipos básicos para evitar errores
interface UsersType {
  id: string
  [key: string]: any
}

interface EnsayoAsociado {
  id: number
  productoId: number
  sku: string
  nombre: string
  norma?: string
  cantidad: number
  observacion: string
  estadoOperativo: string
}

interface RCMData {
  id: number
  rcmType: string
  area?: string
  tipoServicio?: string
  numeroTarjeta: string
  tipoMaterial: string
  item: string
  procedencia?: string
  ensayos: EnsayoAsociado[]
  fechaServicio: string
  fechaMuestreo?: string
  tomaMuestra?: string
  cantidadMuestras: string
  numeroRcm?: string
  dbId?: number
  estado: string
  tieneVencimiento?: boolean
  submuestrasVencimiento?: Array<{
    id: number
    submuestra: string
    numero: number
    dias: number
    fechaVencimiento: string
    cantidad: number
  }>
}

const UserList = ({ userData }: { userData?: UsersType[] }) => {
  const searchParams = useSearchParams()
  const [otId, setOtId] = useState<string | null>(null)
  const [otData, setOtData] = useState<any>(null)
  const [loading, setLoading] = useState(true)

  // Estados para persistir datos del Paso 2
  const [ensayosAsociados, setEnsayosAsociados] = useState<EnsayoAsociado[]>([])
  const [savedRcms, setSavedRcms] = useState<RCMData[]>([])
  const [initialRcmType, setInitialRcmType] = useState<string>('')

  // Estados para contadores en tiempo real
  const [openDraftCount, setOpenDraftCount] = useState(0) // Borradores (formularios abiertos sin guardar)
  const [agrupadosIds, setAgrupadosIds] = useState<Set<number>>(new Set()) // IDs de RCMs con Código Producto asignado
  const [isSaving, setIsSaving] = useState(false)
  const finalizarRef = useRef<(() => void) | null>(null)
  // Codificación incremental: solo cuando la OT ya está CODIFICADA
  const [codificacionRefreshKey, setCodificacionRefreshKey] = useState(0)
  const esOtCodificada = otData?.estado === 'CODIFICADA'
  const { data: codificacionExistente } = useCodificacionExistente(otId, esOtCodificada, codificacionRefreshKey)
  // Reagrupar: carga los CP y RCM confirmados en el workbench
  const reagruparRef = useRef<((data: ReagruparData) => void) | null>(null)
  const [modoReagrupar, setModoReagrupar] = useState(false)
  const [cargandoReagrupar, setCargandoReagrupar] = useState(false)
  const [reagruparError, setReagruparError] = useState('')
  const handleReagrupar = async () => {
    if (!otId || modoReagrupar || cargandoReagrupar) return
    try {
      setCargandoReagrupar(true)
      setReagruparError('')
      const response = await fetch(`/api/ot/${otId}/reagrupar`, { cache: 'no-store' })
      const data = await response.json().catch(() => null)
      if (!response.ok || !data) throw new Error(data?.error || 'No se pudo cargar la codificación para reagrupar')
      reagruparRef.current?.(data)
      setModoReagrupar(true)
      setTimeout(() => document.getElementById('rcms-creados')?.scrollIntoView({ behavior: 'smooth', block: 'start' }), 100)
    } catch (error) {
      setReagruparError(error instanceof Error ? error.message : 'No se pudo cargar la codificación para reagrupar')
    } finally {
      setCargandoReagrupar(false)
    }
  }

  const handleFinalizarCodificacion = () => {
    finalizarRef.current?.()
  }

  // Cálculo de contadores
  const borradores = openDraftCount
  const agrupados = agrupadosIds.size
  const pendientes = savedRcms.length - agrupados // Guardados sin agrupar
  const totalRcms = borradores + savedRcms.length
  // Sin guardar y sin agrupar (los agrupados se persisten al finalizar la codificación)
  const unsavedCount = savedRcms.filter(rcm => !rcm.dbId && !agrupadosIds.has(rcm.id)).length

  useEffect(() => {
    if (!searchParams) return

    const otIdParam = searchParams.get('otId')

    setOtId(otIdParam)

    if (otIdParam) {
      // Cargar datos de la OT
      const fetchOtData = async () => {
        try {
          setLoading(true)
          const otResponse = await fetch(`/api/ot/${otIdParam}`)

          if (!otResponse.ok) throw new Error('Error al cargar datos de la OT')
          const data = await otResponse.json()

          setOtData(data)
        } catch (error) {
          console.error('Error al cargar datos de la OT:', error)
        } finally {
          setLoading(false)
        }
      }

      fetchOtData()
    } else {
      setLoading(false)
    }
  }, [searchParams])

  // Navigation warning when there are unsaved RCMs
  useEffect(() => {
    const hasUnsavedRcms = savedRcms.some(rcm => !rcm.dbId)

    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      if (hasUnsavedRcms) {
        e.preventDefault()
        e.returnValue = '' // Chrome requires returnValue to be set
        return '' // Some browsers use the return value
      }
    }

    if (hasUnsavedRcms) {
      window.addEventListener('beforeunload', handleBeforeUnload)
    }

    return () => {
      window.removeEventListener('beforeunload', handleBeforeUnload)
    }
  }, [savedRcms])

  return (
    <Grid container spacing={6}>
      {/* Agregamos el Header con los datos de la OT */}
      <Grid item xs={12}>
        <Header
          otData={otData}
          loading={loading}
          hasSavedRcms={savedRcms.length > 0}
          borradores={borradores}
          pendientes={pendientes}
          agrupados={agrupados}
          totalRcms={totalRcms}
          unsavedCount={unsavedCount}
          onFinalizarCodificacion={handleFinalizarCodificacion}
          isSaving={isSaving}
        />
      </Grid>

      {/* Codificación existente (CP y RCM confirmados) */}
      {esOtCodificada && (codificacionExistente?.codigos.length ?? 0) > 0 && (
        <Grid item xs={12}>
          <CodificacionExistenteBar data={codificacionExistente!} onReagrupar={handleReagrupar} reagrupando={modoReagrupar || cargandoReagrupar} />
          {reagruparError && <Alert severity='error' onClose={() => setReagruparError('')} sx={{ mt: 2 }}>{reagruparError}</Alert>}
        </Grid>
      )}
      {/* Formulario y Listado de RCMs */}
      <Grid item xs={12} id='rcms-creados'>
        <Step2CreateRcms
          ensayosAsociados={ensayosAsociados}
          setEnsayosAsociados={setEnsayosAsociados}
          savedRcms={savedRcms}
          setSavedRcms={setSavedRcms}
          otData={otData}
          initialRcmType={initialRcmType}
          onClearInitialRcmType={() => setInitialRcmType('')}
          onDraftCountChange={setOpenDraftCount}
          onAgrupadosIdsChange={setAgrupadosIds}
          onIsSavingChange={setIsSaving}
          onRegisterFinalizar={(fn: () => void) => { finalizarRef.current = fn }}
          onRegisterReagrupar={(fn: (data: ReagruparData) => void) => { reagruparRef.current = fn }}
          onCodificacionGuardada={() => {
            setModoReagrupar(false)
            setOtData((prev: any) => (prev ? { ...prev, estado: 'CODIFICADA' } : prev))
            setCodificacionRefreshKey(k => k + 1)
          }}
        />
      </Grid>
    </Grid>
  )
}

export default UserList
