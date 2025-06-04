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
  areas: string[]
  familias: string[]
  tipos: string[]
  resetPage: () => void
}

const TableFilters = ({ productData, setFilteredData, areas, familias, tipos, resetPage }: TableFiltersProps) => {
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

    let filteredData = [...productData]

    // Aplicar filtros solo si hay valores seleccionados
    if (selectedArea) {
      filteredData = filteredData.filter(product => product.area === selectedArea)
    }

    if (selectedFamilia) {
      filteredData = filteredData.filter(product => product.familia === selectedFamilia)
    }

    if (selectedTipo) {
      filteredData = filteredData.filter(product => {

        if (selectedTipo === 'Ensayo') {
          return product.tipo === 'Ensayo'
        }

        if (selectedTipo === 'Terreno') {
          return product.tipo === 'Terreno'
        }

        if (selectedTipo === 'Paquete') {
          return product.esPaquete === true
        }

        return true
      })
    }

    console.log('Filtros aplicados:', { selectedArea, selectedFamilia, selectedTipo })
    console.log('Datos filtrados:', filteredData)

    setFilteredData(filteredData)
  }, [selectedArea, selectedFamilia, selectedTipo, productData, setFilteredData])

  // Función para manejar cambios en los filtros
  const handleFilterChange = (filterType: string, value: string) => {
    switch (filterType) {
      case 'area':
        setSelectedArea(value)
        break
      case 'familia':
        setSelectedFamilia(value)
        break
      case 'tipo':
        setSelectedTipo(value)
        break
      default:
        break
    }
    resetPage()
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
              value={selectedArea}
              onChange={e => handleFilterChange('area', e.target.value)}
              labelId='area-select'
            >
              <MenuItem value=''>Todas las áreas</MenuItem>
              {areas.map(area => (
                <MenuItem key={area} value={area}>
                  {area}
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
              onChange={e => handleFilterChange('familia', e.target.value)}
              label='Familia'
              labelId='familia-select'
            >
              <MenuItem value=''>Todas las familias</MenuItem>
              {familias.map(familia => (
                <MenuItem key={familia} value={familia}>
                  {familia}
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
              onChange={e => handleFilterChange('tipo', e.target.value)}
              label='Tipo'
              labelId='tipo-select'
            >
              <MenuItem value=''>Todos los tipos</MenuItem>
              {tipos.map(tipo => (
                <MenuItem key={tipo} value={tipo}>
                  {tipo}
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
