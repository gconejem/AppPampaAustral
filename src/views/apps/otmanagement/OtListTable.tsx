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
import Popover from '@mui/material/Popover'
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
  ordenesTrabajo?: OrdenTrabajo[] // Opcional ya que no lo usamos más
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

// Función para obtener el nombre del servicio desde el objeto tipoOT
const getServiceName = (tipoOT: any) => {
  if (typeof tipoOT === 'object' && tipoOT?.descripcion) {
    return tipoOT.descripcion
  }
  return 'Servicio no definido'
}

// Función para obtener el código de OT desde el objeto tipoOT
const getOTCode = (tipoOT: any) => {
  if (typeof tipoOT === 'object' && tipoOT?.codigo) {
    return tipoOT.codigo
  }
  return 'Sin código'
}

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
  // Estado para los tipos de orden de trabajo desde la base de datos
  const [tiposOrdenTrabajo, setTiposOrdenTrabajo] = useState<Array<{ value: number, label: string }>>([])

  // Cargar tipos de orden de trabajo
  useEffect(() => {
    const fetchTiposOT = async () => {
      try {
        const response = await fetch('/api/tipos-orden-trabajo')
        if (response.ok) {
          const tipos = await response.json()
          const tiposFormatted = tipos.map((tipo: any) => ({
            value: tipo.id,
            label: tipo.descripcion || 'Sin descripción'
          }))
          setTiposOrdenTrabajo(tiposFormatted)
        }
      } catch (error) {
        console.error('Error al cargar tipos de OT:', error)
      }
    }

    fetchTiposOT()
  }, [])
  const [agendas, setAgendas] = useState<Agenda[]>([])

  // Estado para el popover de obra
  const [popoverAnchor, setPopoverAnchor] = useState<HTMLElement | null>(null)
  const [popoverContent, setPopoverContent] = useState('')

  // Funciones para manejar el popover
  const handlePopoverOpen = (event: React.MouseEvent<HTMLElement>, nombreObra: string) => {
    setPopoverAnchor(event.currentTarget)
    setPopoverContent(`Nombre Obra: ${nombreObra}`)
  }

  const handlePopoverClose = () => {
    setPopoverAnchor(null)
    setPopoverContent('')
  }

  const isPopoverOpen = Boolean(popoverAnchor)

  // Función helper para obtener información de cliente y obra por agendaId
  const getClienteObraByAgendaId = (agendaId: string | number | undefined) => {
    if (!agendaId) return { cliente: 'Sin cliente', numeroObra: 'Sin obra', nombreObra: 'Sin obra' }

    const agendaIdNum = typeof agendaId === 'string' ? parseInt(agendaId) : agendaId
    const agenda = agendas.find(a => a.id === agendaIdNum)

    if (agenda) {
      return {
        cliente: agenda.cliente?.nombreCliente || 'Sin cliente',
        numeroObra: agenda.obra?.numeroObra || 'Sin obra',
        nombreObra: agenda.obra?.nombreObra || 'Sin obra'
      }
    }

    return { cliente: 'Sin cliente', numeroObra: 'Sin obra', nombreObra: 'Sin obra' }
  }

  // Cargar todas las agendas
  useEffect(() => {
    const fetchAgendas = async () => {
      try {
        const response = await fetch('/api/agenda')
        if (!response.ok) throw new Error('Error al cargar agendas')
        const data = await response.json()
        setAgendas(data)
      } catch (error) {
        console.error('Error al cargar agendas:', error)
      }
    }

    fetchAgendas()
  }, [])

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
    const baseData = selectedVisit
      ? allOTs.filter(ot => ot.agendaId === selectedVisit.id)
      : allOTs

    console.log('OtListTable - selectedVisit:', selectedVisit?.id)
    console.log('OtListTable - allOTs count:', allOTs.length)
    console.log('OtListTable - baseData count:', baseData.length)

    let result = [...baseData]

    // Filtrar por número de OT
    if (filters.ot) {
      result = result.filter(ot => ot.clave.toLowerCase().includes(filters.ot.toLowerCase()))
    }

    // Filtrar por servicio
    if (filters.servicio) {
      result = result.filter(ot => {
        const serviceName = getServiceName(ot.tipoOT)
        return serviceName.toLowerCase().includes(filters.servicio.toLowerCase())
      })
    }

    // Filtrar por estado OT
    if (filters.estadoOT) {
      result = result.filter(ot => ot.estado.toLowerCase().includes(filters.estadoOT.toLowerCase()))
    }

    // Filtrar por tipo de OT
    if (filters.tipoOT) {
      result = result.filter(ot => ot.tipoOrdenTrabajoId === parseInt(filters.tipoOT))
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

    const codigo = ot.tipoOT?.codigo

    switch (codigo) {
      case 'R-12-03': // Control de Compactación
        return <DensidadPDF ot={ot} />
      case 'R-12-39': // Muestreo de Hormigón Fresco
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
        row => {
          // Usar el agendaId para obtener información del cliente y obra
          const agendaId = row.agendaId
          return getClienteObraByAgendaId(agendaId)
        },
        {
          id: 'cliente',
          header: 'CLIENTE/OBRA',
          cell: info => {
            const data = info.getValue()
            return (
              <Box
                onMouseEnter={(e) => handlePopoverOpen(e, data.nombreObra)}
                onMouseLeave={handlePopoverClose}
                sx={{ cursor: 'pointer' }}
              >
                <Typography className='capitalize' color='text.primary' variant='body2'>
                  {data.cliente}
                </Typography>
                <Typography className='capitalize' color='text.secondary' variant='caption'>
                  {data.numeroObra}
                </Typography>
              </Box>
            )
          }
        }
      ),
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
    [selectedVisit, agendas]
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

      {/* Popover para mostrar el nombre completo de la obra */}
      <Popover
        id="ot-obra-popover"
        open={isPopoverOpen}
        anchorEl={popoverAnchor}
        onClose={handlePopoverClose}
        anchorOrigin={{
          vertical: 'bottom',
          horizontal: 'left',
        }}
        transformOrigin={{
          vertical: 'top',
          horizontal: 'left',
        }}
        sx={{
          pointerEvents: 'none',
        }}
        PaperProps={{
          sx: {
            backgroundColor: 'rgba(97, 97, 97, 0.92)',
            color: 'white',
            borderRadius: 1,
            boxShadow: '0px 4px 20px rgba(0, 0, 0, 0.15)',
            '& .MuiTypography-root': {
              color: 'white'
            }
          }
        }}
      >
        <Box sx={{ p: 1.5, maxWidth: 300 }}>
          <Typography variant="body2" sx={{ color: 'white', fontSize: '0.875rem' }}>
            {popoverContent}
          </Typography>
        </Box>
      </Popover>
    </>
  )
}

export default OtListTable
