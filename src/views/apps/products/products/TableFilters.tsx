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

interface Area {
  id: number
  nombre: string
}

interface Familia {
  id: number
  nombre: string
  area: {
    id: number
    nombre: string
  }
}

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
  const [areaOptions, setAreaOptions] = useState<Area[]>([])
  const [familiaOptions, setFamiliaOptions] = useState<Familia[]>([])
  const [selectedAreaId, setSelectedAreaId] = useState<number | null>(null)

  // Cargar áreas cuando se monta el componente
  useEffect(() => {
    fetch('/api/areas')
      .then(res => res.json())
      .then(data => {
        console.log('Áreas recibidas:', data)
        setAreaOptions(data)
      })
      .catch(error => {
        console.error('Error al cargar áreas:', error)
      })
  }, [])

  // Cargar familias cuando se selecciona un área
  useEffect(() => {
    if (selectedAreaId) {
      fetch(`/api/familias?areaId=${selectedAreaId}`)
        .then(res => res.json())
        .then(data => {
          console.log('Familias recibidas:', data)
          setFamiliaOptions(data)
        })
        .catch(error => {
          console.error('Error al cargar familias:', error)
        })
    } else {
      setFamiliaOptions([])
    }
  }, [selectedAreaId])

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

        if (selectedTipo === 'Servicio') {
          return product.tipo === 'Servicio'
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
        const areaId = value ? Number(value) : null
        setSelectedAreaId(areaId)
        setSelectedArea(areaId ? areaOptions.find(a => a.id === areaId)?.nombre || '' : '')
        setSelectedFamilia('') // Resetear familia cuando cambia el área
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
              value={selectedAreaId?.toString() || ''}
              onChange={e => handleFilterChange('area', e.target.value)}
              labelId='area-select'
            >
              <MenuItem value=''>Todas las áreas</MenuItem>
              {areaOptions.map(area => (
                <MenuItem key={area.id} value={area.id}>
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
              onChange={e => handleFilterChange('familia', e.target.value)}
              label='Familia'
              labelId='familia-select'
              disabled={!selectedAreaId}
            >
              <MenuItem value=''>Todas las familias</MenuItem>
              {familiaOptions.map(familia => (
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
