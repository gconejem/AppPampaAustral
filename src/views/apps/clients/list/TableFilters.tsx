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
import type { Cliente } from '@/types/cliente'

// Datos dummy para los filtros
const DUMMY_DATA = {
  estados: ['Activo', 'Inactivo', 'Bloqueado'],
  industrias: ['Tecnología', 'Manufactura', 'Retail', 'Servicios', 'Construcción'],
  segmentos: ['Corporativo', 'Pyme', 'Retail', 'Gobierno']
}

type EstadoType = '' | 'Activo' | 'Inactivo' | 'Bloqueado';
type IndustriaType = '' | 'Tecnología' | 'Manufactura' | 'Retail' | 'Servicios' | 'Construcción';
type SegmentoType = '' | 'Corporativo' | 'Pyme' | 'Retail' | 'Gobierno';

interface TableFiltersProps {
  setData: (data: Cliente[]) => void;
  tableData?: Cliente[];
}

const TableFilters = ({ setData, tableData }: TableFiltersProps) => {
  // States
  const [segmentoFilter, setSegmentoFilter] = useState<SegmentoType>('')
  const [industriaFilter, setIndustriaFilter] = useState<IndustriaType>('')
  const [estadoFilter, setEstadoFilter] = useState<EstadoType>('')

  useEffect(() => {
    if (tableData) {
      // Usar Array.prototype.filter directamente
      const filtered = Array.isArray(tableData) ? tableData.filter(cliente => {
        // Solo aplicar filtros si hay un valor seleccionado
        if (segmentoFilter && cliente.segmento !== segmentoFilter) return false;
        if (industriaFilter && cliente.industria !== industriaFilter) return false;
        if (estadoFilter && cliente.estado !== estadoFilter) return false;
        
        return true;
      }) : [];

      setData(filtered);
    }
  }, [segmentoFilter, industriaFilter, estadoFilter, tableData, setData]);

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
              value={estadoFilter}
              onChange={e => setEstadoFilter(e.target.value as EstadoType)}
              label='Estado'
              labelId='role-select'
            >
              <MenuItem value=''>Todos</MenuItem>
              {DUMMY_DATA.estados.map(estado => (
                <MenuItem key={estado} value={estado}>{estado}</MenuItem>
              ))}
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
              value={industriaFilter}
              onChange={e => setIndustriaFilter(e.target.value as IndustriaType)}
              label='Industria'
              labelId='plan-select'
            >
              <MenuItem value=''>Todas</MenuItem>
              {DUMMY_DATA.industrias.map(industria => (
                <MenuItem key={industria} value={industria}>{industria}</MenuItem>
              ))}
            </Select>
          </FormControl>
        </Grid>
      </Grid>
    </CardContent>
  )
}

export default TableFilters
