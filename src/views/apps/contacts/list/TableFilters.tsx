// React Imports
import { useState, useEffect } from 'react'

// MUI Imports
import CardContent from '@mui/material/CardContent'
import FormControl from '@mui/material/FormControl'
import Grid from '@mui/material/Grid'
import InputLabel from '@mui/material/InputLabel'
import MenuItem from '@mui/material/MenuItem'
import Select from '@mui/material/Select'

// DatePicker Imports
import PickersRange from './date' // Asegúrate de que esta importación esté correctamente referenciada

// Type Imports
import type { ContactType } from '@/types/apps/contactTypes'

type Props = {
  setData: (data: ContactType[] | ((prevData: ContactType[]) => ContactType[])) => void
  tableData?: ContactType[]
}

const TableFilters = ({ setData, tableData }: Props) => {
  // States
  const [nombre, setNombre] = useState('')
  const [estado, setEstado] = useState('')

  useEffect(() => {
    const filteredData = tableData?.filter(user => {
      if (nombre && user.nombre !== nombre) return false
      return true
    })

    setData(filteredData || [])
  }, [nombre, tableData, setData])

  return (
    <CardContent>
      <Grid container spacing={2} alignItems='center'>
        {' '}
        {/* Rango de Fechas */}
        <Grid item xs={12} sm={3} sx={{ marginRight: '-79px' }}>
          {' '}
          <PickersRange />
        </Grid>
        {/* Filtro de Estado */}
        <Grid item xs={12} sm={3}>
          <FormControl fullWidth>
            <InputLabel id='role-select'>Estado</InputLabel>
            <Select
              fullWidth
              id='select-role'
              value={estado}
              onChange={e => setEstado(e.target.value)}
              label='Estado'
              labelId='role-select'
            >
              <MenuItem value=''>...</MenuItem>
            </Select>
          </FormControl>
        </Grid>
        {/* Filtro de Industria */}
        <Grid item xs={12} sm={3}>
          <FormControl fullWidth>
            <InputLabel id='plan-select'>Industria</InputLabel>
            <Select
              fullWidth
              id='select-plan'
              value={nombre}
              onChange={e => setNombre(e.target.value)}
              label='Industria'
              labelId='plan-select'
            >
              <MenuItem value=''>...</MenuItem>
            </Select>
          </FormControl>
        </Grid>
      </Grid>
    </CardContent>
  )
}

export default TableFilters
