// React Imports
import { useState, useEffect } from 'react'

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
  setFilteredData: (data: Producto[]) => void
  areas: Array<{ id: number; nombre: string }>
  familias: Array<{ id: number; nombre: string }>
  tipos: Array<{ id: number; nombre: string }>
}

const TableFilters = ({ productData, setFilteredData, areas, familias, tipos }: TableFiltersProps) => {
  // States
  const [selectedArea, setSelectedArea] = useState('')
  const [selectedFamilia, setSelectedFamilia] = useState('')
  const [selectedTipo, setSelectedTipo] = useState('')

  // Efecto para aplicar filtros
  useEffect(() => {
    if (!Array.isArray(productData)) {
      setFilteredData([])

      return
    }

    const filteredData = productData.filter(product => {
      const areaMatch = !selectedArea || product.area === selectedArea
      const familiaMatch = !selectedFamilia || product.familia === selectedFamilia
      const tipoMatch = !selectedTipo || product.tipo === selectedTipo

      return areaMatch && familiaMatch && tipoMatch
    })

    setFilteredData(filteredData)
  }, [selectedArea, selectedFamilia, selectedTipo, productData, setFilteredData])

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
              value={selectedArea}
              onChange={e => setSelectedArea(e.target.value)}
              labelId='area-select'
            >
              <MenuItem value=''>Todas las áreas</MenuItem>
              {Array.isArray(areas) &&
                areas.map(area => (
                  <MenuItem key={area.id} value={area.nombre}>
                    {area.nombre}
                  </MenuItem>
                ))}
            </Select>
          </FormControl>
        </Grid>
        <Grid item xs={12} sm={4}>
          <FormControl fullWidth>
            <InputLabel id='familia-select'>Familia</InputLabel>
            <Select
              fullWidth
              id='select-familia'
              value={selectedFamilia}
              onChange={e => setSelectedFamilia(e.target.value)}
              label='Familia'
              labelId='familia-select'
            >
              <MenuItem value=''>Todas las familias</MenuItem>
              {Array.isArray(familias) &&
                familias.map(familia => (
                  <MenuItem key={familia.id} value={familia.nombre}>
                    {familia.nombre}
                  </MenuItem>
                ))}
            </Select>
          </FormControl>
        </Grid>
        <Grid item xs={12} sm={4}>
          <FormControl fullWidth>
            <InputLabel id='tipo-select'>Tipo</InputLabel>
            <Select
              fullWidth
              id='select-tipo'
              value={selectedTipo}
              onChange={e => setSelectedTipo(e.target.value)}
              label='Tipo'
              labelId='tipo-select'
            >
              <MenuItem value=''>Todos los tipos</MenuItem>
              {Array.isArray(tipos) &&
                tipos.map(tipo => (
                  <MenuItem key={tipo.id} value={tipo.nombre}>
                    {tipo.nombre}
                  </MenuItem>
                ))}
            </Select>
          </FormControl>
        </Grid>
      </Grid>
    </CardContent>
  )
}

export default TableFilters
