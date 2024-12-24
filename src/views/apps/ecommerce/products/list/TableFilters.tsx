// React Imports
import { useState } from 'react'

// MUI Imports
import Grid from '@mui/material/Grid'
import CardContent from '@mui/material/CardContent'
import FormControl from '@mui/material/FormControl'
import InputLabel from '@mui/material/InputLabel'
import MenuItem from '@mui/material/MenuItem'
import Select from '@mui/material/Select'

// Type Imports
import type { Producto } from './ProductListTable'

interface TableFiltersProps {
  productData: Producto[]
  setData: (data: Producto[]) => void
}

const TableFilters = ({ productData, setData }: TableFiltersProps) => {
  // States
  const [area, setArea] = useState('')
  const [familia, setFamilia] = useState('')
  const [tipo, setTipo] = useState('')

  const filterData = () => {
    const filteredData = productData?.filter(product => {
      if (area && product.area !== area) return false
      if (familia && product.familia !== familia) return false
      if (tipo && product.tipo !== tipo) return false

      return true
    })

    return filteredData ?? []
  }

  const handleFilterChange = (
    type: 'area' | 'familia' | 'tipo',
    value: string
  ) => {
    switch (type) {
      case 'area':
        setArea(value)
        break
      case 'familia':
        setFamilia(value)
        break
      case 'tipo':
        setTipo(value)
        break
    }

    const newData = filterData()
    setData(newData)
  }

  return (
    <CardContent>
      <Grid container spacing={6}>
        <Grid item xs={12} sm={4}>
          <FormControl fullWidth>
            <InputLabel id='area-select'>Área</InputLabel>
            <Select
              fullWidth
              id='select-area'
              label='Área'
              value={area}
              onChange={e => handleFilterChange('area', e.target.value)}
              labelId='area-select'
            >
              <MenuItem value=''>Todas las áreas</MenuItem>
              <MenuItem value='Suelos'>Suelos</MenuItem>
              <MenuItem value='Hormigones'>Hormigones</MenuItem>
              <MenuItem value='Asfaltos'>Asfaltos</MenuItem>
              <MenuItem value='Agregados'>Agregados</MenuItem>
            </Select>
          </FormControl>
        </Grid>
        <Grid item xs={12} sm={4}>
          <FormControl fullWidth>
            <InputLabel id='familia-select'>Familia</InputLabel>
            <Select
              fullWidth
              id='select-familia'
              value={familia}
              onChange={e => handleFilterChange('familia', e.target.value)}
              label='Familia'
              labelId='familia-select'
            >
              <MenuItem value=''>Todas las familias</MenuItem>
              <MenuItem value='Clasificación'>Clasificación</MenuItem>
              <MenuItem value='Compactación'>Compactación</MenuItem>
              <MenuItem value='Densidad'>Densidad</MenuItem>
              <MenuItem value='Resistencia'>Resistencia</MenuItem>
              <MenuItem value='Deformación'>Deformación</MenuItem>
            </Select>
          </FormControl>
        </Grid>
        <Grid item xs={12} sm={4}>
          <FormControl fullWidth>
            <InputLabel id='tipo-select'>Tipo</InputLabel>
            <Select
              fullWidth
              id='select-tipo'
              value={tipo}
              onChange={e => handleFilterChange('tipo', e.target.value)}
              label='Tipo'
              labelId='tipo-select'
            >
              <MenuItem value=''>Todos los tipos</MenuItem>
              <MenuItem value='Ensayo'>Ensayo</MenuItem>
              <MenuItem value='Paquete'>Paquete</MenuItem>
            </Select>
          </FormControl>
        </Grid>
      </Grid>
    </CardContent>
  )
}

export default TableFilters
