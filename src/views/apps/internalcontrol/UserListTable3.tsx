'use client'

// React Imports
import { useEffect, useState } from 'react'

// MUI Imports
import Grid from '@mui/material/Grid'
import Card from '@mui/material/Card'
import Button from '@mui/material/Button'
import Typography from '@mui/material/Typography'
import Select from '@mui/material/Select'
import MenuItem from '@mui/material/MenuItem'
import FormControl from '@mui/material/FormControl'
import InputLabel from '@mui/material/InputLabel'
import Box from '@mui/material/Box'

const UserListTable3 = ({
  otId,
  otData,
  loading,
  onGoToStep2,
  selectedArea,
  setSelectedArea,
  selectedTipoServicio,
  setSelectedTipoServicio
}: {
  tableData?: any[]
  otId?: string | null
  otData?: any
  loading?: boolean
  onGoToStep2?: () => void
  selectedArea: number | ''
  setSelectedArea: (value: number | '') => void
  selectedTipoServicio: number | ''
  setSelectedTipoServicio: (value: number | '') => void
}) => {
  // States
  const [areas, setAreas] = useState<Array<{ id: number, nombre: string }>>([])
  const [familias, setFamilias] = useState<Array<{ id: number, nombre: string, areaId: number }>>([])
  const [loadingAreas, setLoadingAreas] = useState(false)
  const [loadingFamilias, setLoadingFamilias] = useState(false)

  // Efecto para cargar las áreas desde la API
  useEffect(() => {
    const fetchAreas = async () => {
      setLoadingAreas(true)
      try {
        const response = await fetch('/api/areas')
        if (response.ok) {
          const areasData = await response.json()
          setAreas(areasData)
        }
      } catch (error) {
        console.error('Error al cargar áreas:', error)
      } finally {
        setLoadingAreas(false)
      }
    }

    fetchAreas()
  }, [])

  // Efecto para cargar las familias cuando cambia el área seleccionada
  useEffect(() => {
    const fetchFamilias = async () => {
      if (!selectedArea) {
        setFamilias([])
        setSelectedTipoServicio('')
        return
      }

      setLoadingFamilias(true)
      try {
        const response = await fetch(`/api/familias?areaId=${selectedArea}`)
        if (response.ok) {
          const familiasData = await response.json()
          setFamilias(familiasData)

          // Solo limpiar el tipo de servicio si no está en la lista de familias cargadas
          if (selectedTipoServicio && !familiasData.some((f: any) => f.id === selectedTipoServicio)) {
            setSelectedTipoServicio('')
          }
        }
      } catch (error) {
        console.error('Error al cargar familias:', error)
      } finally {
        setLoadingFamilias(false)
      }
    }

    fetchFamilias()
  }, [selectedArea])

  // Si está cargando
  if (loading) {
    return (
      <Card>
        <Typography p={4} textAlign='center'>
          Cargando...
        </Typography>
      </Card>
    )
  }

  // Si no hay OT seleccionada
  if (!otId || !otData) {
    return (
      <Card>
        <Typography p={4} textAlign='center'>
          Seleccione una orden de trabajo para configurar RCMs
        </Typography>
      </Card>
    )
  }

  // Renderizado normal con la nueva interfaz
  return (
    <Card>
      <Box sx={{ p: 6 }}>
        {/* Título y Subtítulo */}
        <Box sx={{ mb: 4 }}>
          <Typography variant='h5' sx={{ mb: 1, fontWeight: 'bold' }}>
            Paso 1: Definir Área y Tipo de Servicio
          </Typography>
          <Typography variant='body2' color='text.secondary'>
            Configure los parámetros iniciales antes de crear RCMs
          </Typography>
        </Box>

        {/* Formulario con los selectores y botón */}
        <Grid container spacing={3} alignItems='center'>
          <Grid item xs={12} sm={5}>
            <FormControl fullWidth required>
              <InputLabel shrink>Área</InputLabel>
              <Select
                value={selectedArea}
                label='Área'
                disabled={loadingAreas}
                onChange={(e) => setSelectedArea(e.target.value)}
                displayEmpty
                notched
              >
                <MenuItem value='' disabled>
                  Seleccionar área
                </MenuItem>
                {areas.map((area) => (
                  <MenuItem key={area.id} value={area.id}>
                    {area.nombre}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
          </Grid>

          <Grid item xs={12} sm={5}>
            <FormControl fullWidth required>
              <InputLabel shrink>Tipo de Servicio</InputLabel>
              <Select
                value={selectedTipoServicio}
                label='Tipo de Servicio'
                disabled={loadingFamilias || !selectedArea}
                onChange={(e) => setSelectedTipoServicio(e.target.value)}
                displayEmpty
                notched
              >
                <MenuItem value='' disabled>
                  Seleccionar tipo de servicio
                </MenuItem>
                {familias.map((familia) => (
                  <MenuItem key={familia.id} value={familia.id}>
                    {familia.nombre}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
          </Grid>

          <Grid item xs={12} sm={2}>
            <Button
              fullWidth
              variant='contained'
              startIcon={<i className='ri-add-line' />}
              disabled={!selectedArea || !selectedTipoServicio}
              onClick={() => {
                if (onGoToStep2) {
                  onGoToStep2()
                }
              }}
            >
              Nuevo RCM
            </Button>
          </Grid>
        </Grid>
      </Box>
    </Card>
  )
}

export default UserListTable3
