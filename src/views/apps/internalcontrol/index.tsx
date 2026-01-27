'use client'

// MUI Imports
import { useEffect, useState } from 'react'

import { useSearchParams } from 'next/navigation'

import Grid from '@mui/material/Grid'

// Component Imports
import UserListTable3 from './UserListTable3'
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
  nombre: string
  norma?: string
  cantidad: number
}

interface RCMData {
  id: number
  rcmType: string
  numeroTarjeta: string
  tipoMaterial: string
  item: string
  ensayos: EnsayoAsociado[]
}

const UserList = ({ userData }: { userData?: UsersType[] }) => {
  const searchParams = useSearchParams()
  const [otId, setOtId] = useState<string | null>(null)
  const [otData, setOtData] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [activeStep, setActiveStep] = useState(1) // 1 = Área y Servicio, 2 = Crear RCMs, 3 = Agrupar Códigos
  const [selectedArea, setSelectedArea] = useState<number | ''>('')
  const [selectedTipoServicio, setSelectedTipoServicio] = useState<number | ''>('')
  const [selectedAreaNombre, setSelectedAreaNombre] = useState('')
  const [selectedTipoServicioNombre, setSelectedTipoServicioNombre] = useState('')

  // Estados para persistir datos del Paso 2
  const [ensayosAsociados, setEnsayosAsociados] = useState<EnsayoAsociado[]>([])
  const [savedRcms, setSavedRcms] = useState<RCMData[]>([])

  useEffect(() => {
    if (!searchParams) return

    const otIdParam = searchParams.get('otId')

    setOtId(otIdParam)

    if (otIdParam) {
      // Cargar datos de la OT
      const fetchOtData = async () => {
        try {
          setLoading(true)
          const response = await fetch(`/api/ot/${otIdParam}`)

          if (!response.ok) throw new Error('Error al cargar datos de la OT')
          const data = await response.json()

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

  const handleStepClick = (step: number) => {
    // No permitir avanzar al paso 2 sin área y servicio seleccionados
    if (step === 2 && (!selectedArea || !selectedTipoServicio)) {
      return
    }
    setActiveStep(step)
  }

  const handleGoToStep2 = () => {
    // Solo avanzar si hay área y servicio seleccionados
    if (selectedArea && selectedTipoServicio) {
      setActiveStep(2)
    }
  }

  return (
    <Grid container spacing={6}>
      {/* Agregamos el Header con los datos de la OT */}
      <Grid item xs={12}>
        <Header
          otData={otData}
          loading={loading}
          activeStep={activeStep}
          onStepClick={handleStepClick}
          canAdvanceToStep2={!!(selectedArea && selectedTipoServicio)}
          hasSavedRcms={savedRcms.length > 0}
          selectedAreaNombre={selectedAreaNombre}
          selectedTipoServicioNombre={selectedTipoServicioNombre}
        />
      </Grid>

      {/* Paso 1: Área y Servicio */}
      {activeStep === 1 && (
        <Grid item xs={12}>
          <UserListTable3
            tableData={userData}
            otId={otId}
            otData={otData}
            loading={loading}
            onGoToStep2={handleGoToStep2}
            selectedArea={selectedArea}
            setSelectedArea={setSelectedArea}
            selectedTipoServicio={selectedTipoServicio}
            setSelectedTipoServicio={setSelectedTipoServicio}
            setSelectedAreaNombre={setSelectedAreaNombre}
            setSelectedTipoServicioNombre={setSelectedTipoServicioNombre}
          />
        </Grid>
      )}

      {/* Paso 2: Crear RCMs */}
      {activeStep === 2 && (
        <Grid item xs={12}>
          <Step2CreateRcms
            ensayosAsociados={ensayosAsociados}
            setEnsayosAsociados={setEnsayosAsociados}
            savedRcms={savedRcms}
            setSavedRcms={setSavedRcms}
          />
        </Grid>
      )}
    </Grid>
  )
}

export default UserList
