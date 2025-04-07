'use client'

// MUI Imports
import { useEffect, useState } from 'react'

import { useSearchParams } from 'next/navigation'

import Grid from '@mui/material/Grid'

// Component Imports
import UserListTable3 from './UserListTable3'
import Header from './header'

// Definición de tipos básicos para evitar errores
interface UsersType {
  id: string
  [key: string]: any
}

const UserList = ({ userData }: { userData?: UsersType[] }) => {
  const searchParams = useSearchParams()
  const [otId, setOtId] = useState<string | null>(null)
  const [otData, setOtData] = useState<any>(null)
  const [loading, setLoading] = useState(true)

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

  return (
    <Grid container spacing={6}>
      {/* Agregamos el Header con los datos de la OT */}
      <Grid item xs={12}>
        <Header otData={otData} loading={loading} />
      </Grid>

      {/* Componente de la tabla con los servicios de la OT */}
      <Grid item xs={12}>
        <UserListTable3 tableData={userData} otId={otId} otData={otData} loading={loading} />
      </Grid>
    </Grid>
  )
}

export default UserList
