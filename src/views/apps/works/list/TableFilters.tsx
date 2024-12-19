// React Imports
import { useState, useEffect } from 'react'

// MUI Imports
import CardContent from '@mui/material/CardContent'
import FormControl from '@mui/material/FormControl'
import Grid from '@mui/material/Grid'
import InputLabel from '@mui/material/InputLabel'
import MenuItem from '@mui/material/MenuItem'
import Select from '@mui/material/Select'

// Component Imports
import PickersRange from './date' // Asegúrate de importar el componente PickersRange para el selector de fecha

// Type Imports
import type { UsersType } from '@/types/apps/userTypes'

const TableFilters = ({ setData, tableData }: { setData: (data: UsersType[]) => void; tableData?: UsersType[] }) => {
  // States
  const [role, setRole] = useState<UsersType['role']>('')
  const [status, setStatus] = useState<UsersType['status']>('')

  useEffect(() => {
    const filteredData = tableData?.filter(user => {
      if (role && user.role !== role) return false
      if (status && user.status !== status) return false

      return true
    })

    setData(filteredData || [])
  }, [role, status, tableData, setData])

  return (
    <CardContent>
      <Grid container spacing={5} style={{ marginBottom: '16px' }}>
        {/* Rango de Fechas */}
        <Grid item xs={12} sm={3} sx={{ marginRight: '-79px' }}>
          {' '}
          <PickersRange />
        </Grid>
        {/* Campo de Estado */}
        <Grid item xs={12} sm={4}>
          <FormControl fullWidth>
            <InputLabel id='status-select'>Estado</InputLabel>
            <Select
              fullWidth
              id='select-status'
              label='Select Status'
              value={status}
              onChange={e => setStatus(e.target.value)}
              labelId='status-select'
              inputProps={{ placeholder: 'Select Status' }}
            >
              <MenuItem value=''>...</MenuItem>
            </Select>
          </FormControl>
        </Grid>
        {/* Tercer espacio vacío para alineación */}
        <Grid item xs={12} sm={4}></Grid>
      </Grid>
    </CardContent>
  )
}

export default TableFilters
