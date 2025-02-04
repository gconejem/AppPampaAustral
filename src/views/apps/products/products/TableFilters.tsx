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
        console.log('Filtrando producto:', {
          nombre: product.nombre,
          tipo: product.tipo,
          esPaquete: product.esPaquete
        })

        if (selectedTipo === 'Paquete') {
          return product.tipo === 'Paquete' || product.esPaquete === true
        }

        if (selectedTipo === 'Ensayo') {
          return product.tipo === 'Ensayo' || product.esPaquete === false
        }

        return true
      })
    }

    console.log('Filtros aplicados:', { selectedArea, selectedFamilia, selectedTipo })
    console.log('Datos filtrados:', filteredData)

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
              onChange={e => setSelectedFamilia(e.target.value)}
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
              onChange={e => setSelectedTipo(e.target.value)}
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
