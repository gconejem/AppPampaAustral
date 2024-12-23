// React Imports
import { useState, useEffect } from 'react'
import { jsPDF } from 'jspdf'
import autoTable from 'jspdf-autotable'
import { toast } from 'react-hot-toast'

// MUI Imports
import CardContent from '@mui/material/CardContent'
import FormControl from '@mui/material/FormControl'
import Grid from '@mui/material/Grid'
import InputLabel from '@mui/material/InputLabel'
import MenuItem from '@mui/material/MenuItem'
import Select from '@mui/material/Select'
import TextField from '@mui/material/TextField'
import InputAdornment from '@mui/material/InputAdornment'
import Button from '@mui/material/Button'
import SearchIcon from '@mui/icons-material/Search'

// DatePicker Imports
import PickersRange from './date' // Asegúrate de que esta importación esté correctamente referenciada

// Type Imports
import type { Cliente } from '@/types/forms/cliente'

// Datos dummy para los filtros
import { ESTADOS_CLIENTE, INDUSTRIAS, SEGMENTOS } from '@/data/clientData'

type EstadoType = '' | 'active' | 'inactive' | 'pending' | 'blocked';
type IndustriaType = '' | string;
type SegmentoType = '' | string;

interface Props {
  setData: (data: Cliente[]) => void
  data: Cliente[]
  toggleAddUserDrawer: () => void
}

const TableFilters = ({ setData, data, toggleAddUserDrawer }: Props) => {
  // States
  const [segmentoFilter, setSegmentoFilter] = useState<SegmentoType>('')
  const [industriaFilter, setIndustriaFilter] = useState<IndustriaType>('')
  const [estadoFilter, setEstadoFilter] = useState<EstadoType>('')
  const [searchValue, setSearchValue] = useState('')

  useEffect(() => {
    if (data) {
      const filtered = Array.isArray(data) ? data.filter(cliente => {
        if (segmentoFilter && cliente.segmento !== segmentoFilter) return false;
        if (estadoFilter && cliente.estado !== estadoFilter) return false;
        return true;
      }) : [];
      setData(filtered);
    }
  }, [segmentoFilter, estadoFilter, data, setData]);

  const handleSearch = (value: string) => {
    setSearchValue(value)
    const filtered = data.filter(client => 
      client.razonSocial?.toLowerCase().includes(value.toLowerCase()) ||
      client.nombreCliente?.toLowerCase().includes(value.toLowerCase()) ||
      client.rut?.toLowerCase().includes(value.toLowerCase())
    )
    setData(filtered)
  }

  const handleExport = () => {
    try {
      const doc = new jsPDF()
      
      // Título
      doc.text('Lista de Clientes', 14, 15)
      
      // Datos para la tabla
      const tableData = data.map(client => [
        client.rut,
        client.nombreCliente,
        client.segmento || '',
        client.clientesContactos?.length ? 'Con Contacto' : 'Sin Contacto',
        client.estado
      ])
      
      // Configuración de la tabla
      autoTable(doc, {
        head: [['RUT', 'NOMBRE COMERCIAL', 'SEGMENTO', 'CONTACTO', 'ESTADO']],
        body: tableData,
        startY: 20,
        theme: 'grid'
      })
      
      // Guardar el PDF
      doc.save('clientes.pdf')
      
      toast.success('Exportación exitosa')
    } catch (error) {
      console.error('Error al exportar:', error)
      toast.error('Error al exportar')
    }
  }

  return (
    <CardContent>
      <Grid container spacing={2} alignItems='center'>
        <Grid container item spacing={2} xs={12}>
          <Grid item xs={12} sm={4}>
            <PickersRange />
          </Grid>
          <Grid item xs={12} sm={2.5}>
            <FormControl fullWidth size='small'>
              <InputLabel>Estado</InputLabel>
              <Select
                value={estadoFilter}
                label='Estado'
                onChange={e => setEstadoFilter(e.target.value as EstadoType)}
              >
                <MenuItem value=''>Todos</MenuItem>
                {ESTADOS_CLIENTE.map(estado => (
                  <MenuItem key={estado.value} value={estado.value}>
                    {estado.label}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
          </Grid>
          <Grid item xs={12} sm={2.5}>
            <FormControl fullWidth size='small'>
              <InputLabel>Segmento</InputLabel>
              <Select
                value={segmentoFilter}
                label='Segmento'
                onChange={e => setSegmentoFilter(e.target.value as SegmentoType)}
              >
                <MenuItem value=''>Todos</MenuItem>
                {SEGMENTOS.map(segmento => (
                  <MenuItem key={segmento.value} value={segmento.value}>
                    {segmento.label}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
          </Grid>
          <Grid item xs={12} sm={3}>
            <Button
              variant='contained'
              onClick={toggleAddUserDrawer}
              sx={{ backgroundColor: '#3366FF' }}
            >
              + Nuevo Cliente
            </Button>
          </Grid>
        </Grid>

        <Grid container item spacing={2} xs={12} sx={{ mt: 2 }}>
          <Grid item xs={12} sm={2}>
            <Button
              variant='outlined'
              startIcon={<i className='ri-download-line' />}
              fullWidth
              onClick={handleExport}
            >
              Exportar
            </Button>
          </Grid>
          <Grid item xs={12} sm={10}>
            <TextField
              fullWidth
              size='small'
              placeholder='Buscar Cliente'
              InputProps={{
                startAdornment: (
                  <InputAdornment position='start'>
                    <SearchIcon />
                  </InputAdornment>
                )
              }}
              onChange={e => handleSearch(e.target.value)}
              value={searchValue}
            />
          </Grid>
        </Grid>
      </Grid>
    </CardContent>
  )
}

export default TableFilters
