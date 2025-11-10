// React Imports
import { useState } from 'react'

// MUI Imports
import CardContent from '@mui/material/CardContent'
import FormControl from '@mui/material/FormControl'
import Grid from '@mui/material/Grid'
import InputLabel from '@mui/material/InputLabel'
import MenuItem from '@mui/material/MenuItem'
import Select from '@mui/material/Select'

// Type Imports
import type { UsersType } from '@/types/apps/userTypes'

interface RCM {
  id: number
  numeroRcm: string
  fechaCodificacion: string
  fechaMuestreo: string
  fechaIngreso: string
  estado: string
  cliente?: {
    nombreCliente: string
    comuna: string
  }
  obra?: {
    numeroObra: string
  }
}

const TableFilters = ({
  onFilterChange,
  initialData
}: {
  onFilterChange: (filteredData: RCM[]) => void
  initialData: RCM[]
}) => {
  // States
  const [estado, setEstado] = useState<string>('')
  const [area, setArea] = useState<string>('')

  const handleEstadoChange = (newEstado: string) => {
    setEstado(newEstado)

    const filteredData = initialData.filter(rcm => {
      if (newEstado && rcm.estado !== newEstado) return false

      return true
    })

    onFilterChange(filteredData)
  }

  return (
    <CardContent>
      <Grid container spacing={6}>
        <Grid item xs={12} sm={6}>
          <FormControl fullWidth size='small'>
            <InputLabel id='estado-select'>Estado</InputLabel>
            <Select
              label='Estado'
              value={estado}
              labelId='estado-select'
              onChange={e => handleEstadoChange(e.target.value)}
            >
              <MenuItem value=''>Todos</MenuItem>
              <MenuItem value='ACTIVO'>Activo</MenuItem>
              <MenuItem value='INACTIVO'>Inactivo</MenuItem>
              <MenuItem value='PENDIENTE'>Pendiente</MenuItem>
            </Select>
          </FormControl>
        </Grid>
        <Grid item xs={12} sm={6}>
          <FormControl fullWidth size='small'>
            <InputLabel id='area-select'>Área</InputLabel>
            <Select label='Área' value={area} labelId='area-select' onChange={e => setArea(e.target.value)}>
              <MenuItem value=''>Todas</MenuItem>
              <MenuItem value='HORMIGON'>Hormigón</MenuItem>
              <MenuItem value='SUELOS'>Suelos</MenuItem>
              <MenuItem value='ASFALTOS'>Asfaltos</MenuItem>
            </Select>
          </FormControl>
        </Grid>
      </Grid>
    </CardContent>
  )
}

export default TableFilters
