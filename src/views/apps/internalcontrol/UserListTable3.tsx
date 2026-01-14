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
  loading
}: {
  tableData?: any[]
  otId?: string | null
  otData?: any
  loading?: boolean
}) => {
  // States
  const [selectedArea, setSelectedArea] = useState<number | ''>('')
  const [selectedTipoServicio, setSelectedTipoServicio] = useState<number | ''>('')
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
        return
      }

      setLoadingFamilias(true)
      try {
        const response = await fetch(`/api/familias?areaId=${selectedArea}`)
        if (response.ok) {
          const familiasData = await response.json()
          setFamilias(familiasData)
        }
      } catch (error) {
        console.error('Error al cargar familias:', error)
      } finally {
        setLoadingFamilias(false)
      }
    }

    fetchFamilias()
    // Limpiar el filtro de familia cuando cambia el área
    setSelectedTipoServicio('')
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

        {/* Formulario con los selectores */}
        <Grid container spacing={3} alignItems='flex-start'>
          <Grid item xs={12} sm={6}>
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

          <Grid item xs={12} sm={6}>
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
        </Grid>

        {/* Botón Nuevo RCM */}
        <Box sx={{ mt: 4 }}>
          <Button
            variant='contained'
            startIcon={<i className='ri-add-line' />}
            disabled={!selectedArea || !selectedTipoServicio}
            onClick={() => {
              const params = new URLSearchParams({
                otId: otId || '',
                tipo: otData?.tipoOT?.codigo || ''
              })

              if (selectedArea) {
                params.append('areaId', selectedArea.toString())
              }

              if (selectedTipoServicio) {
                params.append('familiaId', selectedTipoServicio.toString())
              }

              window.open(`/en/apps/encoder?${params.toString()}`, '_blank')
            }}
          >
            Nuevo RCM
          </Button>
        </Box>
      </Box>
    </Card>
  )
}

export default UserListTable3
