'use client'

// MUI Imports
import { useEffect, useState } from 'react'

import { useSearchParams } from 'next/navigation'

import Grid from '@mui/material/Grid'

// Component Imports
import UserListCards from './UserListCards'
import Header from './header' // Importamos el Header
import StepperVerticalWithNumbers from './StepperVerticalWithNumbers' // Importamos el Stepper vertical

const UserList = () => {
  const searchParams = useSearchParams()
  const [otId, setOtId] = useState<string | null>(null)
  const [otData, setOtData] = useState<any>(null)
  const [servicioId, setServicioId] = useState<string | null>(null)
  const [tipoOT, setTipoOT] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!searchParams) return

    const otIdParam = searchParams.get('otId')
    const tipoParam = searchParams.get('tipo')
    const servicioIdParam = searchParams.get('servicioId')

    setOtId(otIdParam)
    setTipoOT(tipoParam)
    setServicioId(servicioIdParam)

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

  return (
    <Grid container spacing={6}>
      {/* Agregamos el Header */}
      <Grid item xs={12}>
        <Header otData={otData} tipoOT={tipoOT} loading={loading} />
      </Grid>

      {/* Integración del Stepper Vertical */}
      <Grid item xs={12}>
        <StepperVerticalWithNumbers
          otData={otData}
          otId={otId}
          tipoOT={tipoOT}
          servicioId={servicioId}
          loading={loading}
        />
      </Grid>

      {/* Contenido de UserListCards */}
      <Grid item xs={12}>
        <UserListCards otData={otData} loading={loading} />
      </Grid>
    </Grid>
  )
}

export default UserList
