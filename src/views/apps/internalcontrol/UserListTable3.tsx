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
  setSelectedTipoServicio,
  setSelectedAreaNombre,
  setSelectedTipoServicioNombre
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
  setSelectedAreaNombre?: (value: string) => void
  setSelectedTipoServicioNombre?: (value: string) => void
}) => {
  // States
  const [areas, setAreas] = useState<Array<{ id: number, nombre: string }>>([])
  const [todasLasFamilias, setTodasLasFamilias] = useState<Array<{ id: number, nombre: string, areaId: number }>>([])
  const [loadingData, setLoadingData] = useState(false)

  // Familias filtradas según el área seleccionada
  const familiasFiltradas = selectedArea
    ? todasLasFamilias.filter(f => f.areaId === selectedArea)
    : []

  // Efecto para cargar las áreas y familias al inicio
  useEffect(() => {
    const fetchData = async () => {
      setLoadingData(true)
      try {
        // Cargar áreas y familias en paralelo
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
          // Transformar los datos para incluir areaId
          const familiasConAreaId = familiasData.map((f: any) => ({
            id: f.id,
            nombre: f.nombre,
            areaId: f.area?.id || 0
          }))
          setTodasLasFamilias(familiasConAreaId)
        }
      } catch (error) {
        console.error('Error al cargar datos:', error)
      } finally {
        setLoadingData(false)
      }
    }

    fetchData()
  }, [])

  // Efecto para limpiar el tipo de servicio cuando cambia el área seleccionada
  useEffect(() => {
    if (!selectedArea) {
      setSelectedTipoServicio('')
      return
    }

    // Si hay un tipo de servicio seleccionado, verificar si pertenece al área actual
    if (selectedTipoServicio) {
      const familiaSeleccionada = todasLasFamilias.find(f => f.id === selectedTipoServicio)
      if (!familiaSeleccionada || familiaSeleccionada.areaId !== selectedArea) {
        setSelectedTipoServicio('')
      }
    }
  }, [selectedArea, selectedTipoServicio, todasLasFamilias])

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
                disabled={loadingData}
                onChange={(e) => {
                  const value = e.target.value as number | ''
                  setSelectedArea(value)
                  const areaSeleccionada = areas.find(a => a.id === value)
                  if (setSelectedAreaNombre) {
                    setSelectedAreaNombre(areaSeleccionada?.nombre || '')
                  }
                }}
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
                disabled={loadingData || !selectedArea}
                onChange={(e) => {
                  const value = e.target.value as number | ''
                  setSelectedTipoServicio(value)
                  const familiaSeleccionada = familiasFiltradas.find(f => f.id === value)
                  if (setSelectedTipoServicioNombre) {
                    setSelectedTipoServicioNombre(familiaSeleccionada?.nombre || '')
                  }
                }}
                displayEmpty
                notched
              >
                <MenuItem value='' disabled>
                  Seleccionar tipo de servicio
                </MenuItem>
                {familiasFiltradas.map((familia) => (
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
