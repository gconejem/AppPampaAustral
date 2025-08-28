'use client'

// React Imports
import { useState, useMemo, useEffect } from 'react'

// MUI Imports
import Card from '@mui/material/Card'
import CardHeader from '@mui/material/CardHeader'
import Divider from '@mui/material/Divider'
import Button from '@mui/material/Button'
import TextField from '@mui/material/TextField'
import Typography from '@mui/material/Typography'
import Chip from '@mui/material/Chip'
import Checkbox from '@mui/material/Checkbox'
import IconButton from '@mui/material/IconButton'
import Grid from '@mui/material/Grid'
import TablePagination from '@mui/material/TablePagination'
import Box from '@mui/material/Box'
import FormControl from '@mui/material/FormControl'
import InputLabel from '@mui/material/InputLabel'
import Select from '@mui/material/Select'
import MenuItem from '@mui/material/MenuItem'
import type { SelectChangeEvent } from '@mui/material/Select'

// Third-party Imports
import {
  createColumnHelper,
  flexRender,
  getCoreRowModel,
  useReactTable,
  getPaginationRowModel,
  getFilteredRowModel,
  type FilterFn
} from '@tanstack/react-table'
import { rankItem } from '@tanstack/match-sorter-utils'

// Components Imports
import PDFModal from './components/PDFModal'
import DensidadPDF from './pdfs/DensidadPDF'
import HormigonFrescoPDF from './pdfs/HormigonFrescoPDF'
import type { OrdenTrabajo as OTType } from '@/types/otTypes'

// Interfaces
interface OrdenTrabajo extends OTType {
  user?: {
    id: string
    name?: string
    email?: string
  }
}

interface Agenda {
  id: number
  titulo: string
  cliente?: {
    nombreCliente: string
    rut?: string
  }
  obra?: {
    nombreObra: string
    numeroObra?: string
  }
  ordenesTrabajo: OrdenTrabajo[]
}

// Table Styles
import tableStyles from '@core/styles/table.module.css'

const columnHelper = createColumnHelper<OrdenTrabajo>()

// Función de filtro fuzzy
const fuzzyFilter: FilterFn<any> = (row, columnId, value, addMeta) => {
  const itemRank = rankItem(row.getValue(columnId), value)

  addMeta({ itemRank })

  return itemRank.passed
}

// Función de filtro global
const globalFilterFn: FilterFn<any> = (row, columnId, value, addMeta) => {
  const itemRank = rankItem(row.getValue(columnId), value)

  addMeta({ itemRank })

  return itemRank.passed
}

// Función para mapear códigos de OT a nombres descriptivos
const getServiceName = (tipoOT: string) => {
  const serviceNames = {
    CONTROL_COMPACTACION: 'Control de Compactación',
    MUESTREO_HORMIGON: 'Muestreo de Hormigón Fresco',
    RETIRO_PROBETA: 'Retiro de Probeta Hormigón',
    MUESTREO_MATERIALES: 'Muestreo de Materiales',
    TESTIGOS: 'Testigos',
    EXTRACCION_ASFALTICA: 'Extracción Asfáltica',
    DOSIFICACION: 'Dosificación',
    GENERAL: 'General',
    SUSPENDIDO_TERRENO: 'Suspendido en terreno'
  }

  return serviceNames[tipoOT as keyof typeof serviceNames] || tipoOT
}

// Función para mapear tipos de OT a sus códigos
const getOTCode = (tipoOT: string) => {
  const otCodes = {
    DENSIDADES: 'R-12-03',
    HORMIGON_FRESCO: 'R-12-39',
    RETIRO_PROBETA: 'R-12-99',
    MUESTREO_MATERIALES: 'R-12-27',
    TESTIGOS: 'R-12-58',
    EXTRACCION_ASFALTICA: 'R-12-31',
    DOSIFICACION: 'R-12-69',
    GENERAL: 'R-12-34',
    ACEPTACION_VISITA: 'R-12-01',
    SUSPENDIDO_TERRENO: 'X-1 001'
  }

  return otCodes[tipoOT as keyof typeof otCodes] || tipoOT
}

// Lista de tipos de orden de trabajo basada en el enum TipoOrdenTrabajo
const tiposOrdenTrabajo = [
  { value: 'ACEPTACION_VISITA', label: 'Aceptación Visita' },
  { value: 'DENSIDADES', label: 'Densidades' },
  { value: 'HORMIGON_FRESCO', label: 'Hormigón Fresco' },
  { value: 'TESTIGOS', label: 'Testigos' },
  { value: 'EXTRACCION_ASFALTICA', label: 'Extracción Asfáltica' },
  { value: 'MUESTREO_MATERIAL', label: 'Muestreo de Material' },
  { value: 'RETIRO_PROBETA', label: 'Retiro de Probeta' },
  // Tipos adicionales que pueden existir en el sistema
  { value: 'CONTROL_COMPACTACION', label: 'Control de Compactación' },
  { value: 'MUESTREO_HORMIGON', label: 'Muestreo de Hormigón' },
  { value: 'MUESTREO_MATERIALES', label: 'Muestreo de Materiales' },
  { value: 'DOSIFICACION', label: 'Dosificación' },
  { value: 'GENERAL', label: 'General' },
  { value: 'SUSPENDIDO_TERRENO', label: 'Suspendido en Terreno' }
]

const OtListTable = ({ selectedVisit }: { selectedVisit: Agenda | null }) => {
  // States
  const [pageSize, setPageSize] = useState(6)
  const [pageIndex, setPageIndex] = useState(0)
  const [selectedOT, setSelectedOT] = useState<OrdenTrabajo | null>(null)
  const [pdfModalOpen, setPdfModalOpen] = useState(false)
  const [globalFilter, setGlobalFilter] = useState('')
  const [filteredData, setFilteredData] = useState<OrdenTrabajo[]>([])
  const [filters, setFilters] = useState({ ot: '', servicio: '', estadoOT: '', tipoOT: '' })
  const [allOTs, setAllOTs] = useState<OrdenTrabajo[]>([])
  const [loading, setLoading] = useState(true)

  // Cargar todas las OTs al iniciar
  useEffect(() => {
    const fetchAllOTs = async () => {
      try {
        setLoading(true)
        const response = await fetch('/api/ot')

        if (!response.ok) throw new Error('Error al cargar OTs')
        const data = await response.json()

        setAllOTs(data)
        setFilteredData(data)
      } catch (error) {
        console.error('Error al cargar OTs:', error)
      } finally {
        setLoading(false)
      }
    }

    fetchAllOTs()
  }, [])

  // Effect para manejar los filtros y la selección de visita
  useEffect(() => {
    // Si no hay OTs, no hacer nada
    if (allOTs.length === 0) return

    // Base de datos a filtrar: todas las OTs o las de la visita seleccionada
    const baseData = selectedVisit ? selectedVisit.ordenesTrabajo : allOTs

    let result = [...baseData]

    // Filtrar por número de OT
    if (filters.ot) {
      result = result.filter(ot => ot.clave.toLowerCase().includes(filters.ot.toLowerCase()))
    }

    // Filtrar por servicio
    if (filters.servicio) {
      result = result.filter(ot => ot.tipoOT.toLowerCase().includes(filters.servicio.toLowerCase()))
    }

    // Filtrar por estado OT
    if (filters.estadoOT) {
      result = result.filter(ot => ot.estado.toLowerCase().includes(filters.estadoOT.toLowerCase()))
    }

    // Filtrar por tipo de OT
    if (filters.tipoOT) {
      result = result.filter(ot => ot.tipoOT === filters.tipoOT)
    }

    // Búsqueda global
    if (globalFilter) {
      result = result.filter(ot =>
        Object.values(ot).some(
          value => typeof value === 'string' && value.toLowerCase().includes(globalFilter.toLowerCase())
        )
      )
    }

    setFilteredData(result)
  }, [selectedVisit, allOTs, filters, globalFilter])

  // Handler para limpiar filtros
  const handleClearFilters = () => {
    setFilters({ ot: '', servicio: '', estadoOT: '', tipoOT: '' })
    setGlobalFilter('')
  }

  // Handler para manejar los cambios en los filtros
  const handleFilterChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>, field: string) => {
    setFilters(prev => ({ ...prev, [field]: e.target.value }))
  }

  // Handler para manejar el cambio del Select de tipo de OT
  const handleTipoOTChange = (e: SelectChangeEvent<string>) => {
    setFilters(prev => ({ ...prev, tipoOT: e.target.value }))
  }

  const handlePDFClick = (ot: OrdenTrabajo) => {
    console.log('OT seleccionada:', ot) // Para debug
    setSelectedOT(ot)
    setPdfModalOpen(true)
  }

  const renderPDFComponent = (ot: OrdenTrabajo) => {
    console.log('Rendering PDF for type:', ot.tipoOT) // Debug log

    switch (ot.tipoOT) {
      case 'CONTROL_COMPACTACION':
        return <DensidadPDF ot={ot} />
      case 'MUESTREO_HORMIGON':
        return <HormigonFrescoPDF ot={ot} />
      default:
        // Temporalmente mostrar un mensaje para los tipos no implementados
        return <Typography>PDF en desarrollo para el tipo de OT: {getServiceName(ot.tipoOT)}</Typography>
    }
  }

  // Columns Definition
  const columns = useMemo(
    () => [
      {
        id: 'select',
        header: ({ table }: any) => (
          <Checkbox
            checked={table.getIsAllRowsSelected()}
            onChange={table.getToggleAllRowsSelectedHandler()}
            indeterminate={table.getIsSomeRowsSelected()}
          />
        ),
        cell: ({ row }: any) => <Checkbox checked={row.getIsSelected()} onChange={row.getToggleSelectedHandler()} />,
        size: 50
      },
      columnHelper.accessor('tipoOT', {
        header: 'OT',
        cell: info => <Typography>{getOTCode(info.getValue())}</Typography>
      }),
      columnHelper.accessor('createdAt', {
        header: 'FECHA',
        cell: info => <Typography>{new Date(info.getValue()).toLocaleDateString()}</Typography>
      }),
      columnHelper.accessor(row => row.user?.name || 'Sin asignar', {
        id: 'laboratorista',
        header: 'LABRST.',
        cell: info => <Typography>{info.getValue()}</Typography>
      }),
      columnHelper.accessor(
        row => row.agenda?.cliente?.nombreCliente || selectedVisit?.cliente?.nombreCliente || 'Sin cliente',
        {
          id: 'cliente',
          header: 'CLIENTE',
          cell: info => <Typography>{info.getValue()}</Typography>
        }
      ),
      columnHelper.accessor(row => row.agenda?.obra?.numeroObra || selectedVisit?.obra?.numeroObra || 'Sin obra', {
        id: 'obra',
        header: 'OBRA',
        cell: info => <Typography>{info.getValue()}</Typography>
      }),
      columnHelper.accessor('tipoOT', {
        id: 'servicio',
        header: 'SERVICIO',
        cell: info => <Typography>{getServiceName(info.getValue())}</Typography>
      }),
      columnHelper.accessor('estado', {
        header: 'ESTADO',
        cell: info => (
          <Chip
            label={info.getValue().replace('_', ' ')}
            size='small'
            color={
              info.getValue() === 'EN REVISION' ? 'warning' : info.getValue() === 'DISPONIBLE' ? 'success' : 'info'
            }
            className='capitalize'
          />
        )
      }),
      columnHelper.accessor('id', {
        header: 'ACCIONES',
        cell: ({ row }) => (
          <div className='flex items-center gap-2'>
            <IconButton onClick={() => handlePDFClick(row.original)}>
              <i className='ri-file-pdf-line' style={{ fontSize: '1.2rem', color: '#FF0000' }} />
            </IconButton>
            <IconButton
              onClick={() =>
                window.open(`http://localhost:3001/en/apps/internalcontrol?otId=${row.original.id}`, '_blank')
              }
            >
              <i className='ri-code-s-slash-line' style={{ fontSize: '1.2rem' }} />
            </IconButton>
            <IconButton>
              <i className='ri-more-2-fill' style={{ fontSize: '1.2rem' }} />
            </IconButton>
          </div>
        )
      })
    ],
    [selectedVisit]
  )

  const table = useReactTable({
    data: filteredData,
    columns,
    filterFns: {
      fuzzy: fuzzyFilter,
      global: globalFilterFn
    },
    state: {
      pagination: { pageSize, pageIndex },
      globalFilter
    },
    onGlobalFilterChange: setGlobalFilter,
    getCoreRowModel: getCoreRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    getFilteredRowModel: getFilteredRowModel()
  })

  // Título dinámico de la tabla
  const tableTitle = selectedVisit
    ? `Órdenes de Trabajo - ${selectedVisit.cliente?.nombreCliente || ''}`
    : 'Todas las Órdenes de Trabajo'

  // Mostramos mensaje de carga mientras se obtienen las OTs
  if (loading) {
    return (
      <Card>
        <CardHeader title='Cargando Órdenes de Trabajo...' />
        <Box p={4} textAlign='center'>
          <Typography>Cargando datos...</Typography>
        </Box>
      </Card>
    )
  }

  return (
    <>
      <Card>
        <CardHeader title={tableTitle} />
        <Divider />

        {/* Filtros */}
        <Box p={3}>
          <Grid container spacing={2} alignItems='center'>
            {/* Primera Fila */}
            <Grid item xs={12} sm={3}>
              <TextField
                fullWidth
                size='small'
                label='Orden de Trabajo, Nº Tarjeta'
                value={filters.ot}
                onChange={e => handleFilterChange(e, 'ot')}
              />
            </Grid>
            <Grid item xs={12} sm={3}>
              <FormControl fullWidth size='small'>
                <InputLabel id='tipo-ot-label'>Tipo de OT</InputLabel>
                <Select
                  labelId='tipo-ot-label'
                  value={filters.tipoOT}
                  label='Tipo de OT'
                  onChange={handleTipoOTChange}
                >
                  <MenuItem value=''>
                    <em>Todos los tipos</em>
                  </MenuItem>
                  {tiposOrdenTrabajo.map(tipo => (
                    <MenuItem key={tipo.value} value={tipo.value}>
                      {tipo.label}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12} sm={3}>
              <TextField
                fullWidth
                size='small'
                label='Servicio'
                value={filters.servicio}
                onChange={e => handleFilterChange(e, 'servicio')}
              />
            </Grid>
            <Grid item xs={12} sm={3}>
              <TextField
                fullWidth
                size='small'
                label='Estado OT'
                value={filters.estadoOT}
                onChange={e => handleFilterChange(e, 'estadoOT')}
              />
            </Grid>

            {/* Segunda Fila */}
            <Grid item xs={12} sm={2}>
              <Button variant='contained' fullWidth onClick={handleClearFilters}>
                Limpiar Filtros
              </Button>
            </Grid>
            <Grid item xs={12} sm={7} />
            <Grid item xs={12} sm={3}>
              <TextField
                fullWidth
                size='small'
                placeholder='Buscar'
                value={globalFilter}
                onChange={e => setGlobalFilter(e.target.value)}
                InputProps={{
                  startAdornment: <i className='ri-search-line' style={{ marginRight: '8px', color: '#aaa' }} />
                }}
              />
            </Grid>
          </Grid>
        </Box>

        {/* Tabla */}
        <Box className='overflow-x-auto'>
          <table className={tableStyles.table}>
            <thead>
              {table.getHeaderGroups().map(headerGroup => (
                <tr key={headerGroup.id}>
                  {headerGroup.headers.map(header => (
                    <th key={header.id}>{flexRender(header.column.columnDef.header, header.getContext())}</th>
                  ))}
                </tr>
              ))}
            </thead>
            <tbody>
              {filteredData.length > 0 ? (
                table.getRowModel().rows.map(row => (
                  <tr key={row.id}>
                    {row.getVisibleCells().map(cell => (
                      <td key={cell.id}>{flexRender(cell.column.columnDef.cell, cell.getContext())}</td>
                    ))}
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={columns.length} style={{ textAlign: 'center', padding: '1rem' }}>
                    No se encontraron órdenes de trabajo
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </Box>

        {/* Paginación */}
        <TablePagination
          component='div'
          count={filteredData.length}
          rowsPerPage={pageSize}
          page={pageIndex}
          onPageChange={(_, page) => setPageIndex(page)}
          onRowsPerPageChange={e => setPageSize(Number(e.target.value))}
          rowsPerPageOptions={[6, 10, 25, 50]}
        />
      </Card>

      {/* Modal de PDF */}
      {selectedOT && (
        <PDFModal open={pdfModalOpen} onClose={() => setPdfModalOpen(false)} ot={selectedOT}>
          {renderPDFComponent(selectedOT)}
        </PDFModal>
      )}
    </>
  )
}

export default OtListTable
