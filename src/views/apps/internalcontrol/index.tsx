'use client'

// MUI Imports
import { useEffect, useRef, useState } from 'react'

import { useSearchParams } from 'next/navigation'

import Grid from '@mui/material/Grid'

// Component Imports
import Header from './header'
import Step2CreateRcms from './step2-create-rcms'

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
  const [agrupadosCount, setAgrupadosCount] = useState(0) // RCMs con Código Producto asignado
  const [isSaving, setIsSaving] = useState(false)
  const finalizarRef = useRef<(() => void) | null>(null)

  const handleFinalizarCodificacion = () => {
    finalizarRef.current?.()
  }

  // Cálculo de contadores
  const borradores = openDraftCount
  const agrupados = agrupadosCount
  const pendientes = savedRcms.length - agrupados // Guardados sin agrupar
  const totalRcms = borradores + savedRcms.length
  const unsavedCount = savedRcms.filter(rcm => !rcm.dbId).length

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

      {/* Formulario y Listado de RCMs */}
      <Grid item xs={12}>
        <Step2CreateRcms
          ensayosAsociados={ensayosAsociados}
          setEnsayosAsociados={setEnsayosAsociados}
          savedRcms={savedRcms}
          setSavedRcms={setSavedRcms}
          otData={otData}
          initialRcmType={initialRcmType}
          onClearInitialRcmType={() => setInitialRcmType('')}
          onDraftCountChange={setOpenDraftCount}
          onAgrupadosCountChange={setAgrupadosCount}
          onIsSavingChange={setIsSaving}
          onRegisterFinalizar={(fn: () => void) => { finalizarRef.current = fn }}
        />
      </Grid>
    </Grid>
  )
}

export default UserList
