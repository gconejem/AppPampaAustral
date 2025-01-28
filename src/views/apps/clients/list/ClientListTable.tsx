'use client'

// React Imports
import { useEffect, useState, useMemo } from 'react'

// Next Imports
import Link from 'next/link'
import { useParams } from 'next/navigation'

import axios from 'axios'

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
import { styled } from '@mui/material/styles'
import TablePagination from '@mui/material/TablePagination'
import InputAdornment from '@mui/material/InputAdornment'
import Dialog from '@mui/material/Dialog'
import DialogTitle from '@mui/material/DialogTitle'
import DialogContent from '@mui/material/DialogContent'
import DialogContentText from '@mui/material/DialogContentText'
import DialogActions from '@mui/material/DialogActions'
import Tooltip from '@mui/material/Tooltip'
import EditIcon from '@mui/icons-material/Edit'
import DeleteIcon from '@mui/icons-material/Delete'
import CircularProgress from '@mui/material/CircularProgress'
import Popover from '@mui/material/Popover'
import MenuItem from '@mui/material/MenuItem'
import FormControl from '@mui/material/FormControl'
import Select from '@mui/material/Select'
import TableContainer from '@mui/material/TableContainer'
import type Table from '@mui/material/Table'
import TableHead from '@mui/material/TableHead'
import TableBody from '@mui/material/TableBody'
import TableRow from '@mui/material/TableRow'
import TableCell from '@mui/material/TableCell'
import Box from '@mui/material/Box'

// Third-party Imports
import classnames from 'classnames'
import { rankItem } from '@tanstack/match-sorter-utils'
import { toast } from 'react-hot-toast'
import type { Table, Row } from '@tanstack/react-table'
import {
  createColumnHelper,
  flexRender,
  getCoreRowModel,
  useReactTable,
  getFilteredRowModel,
  getFacetedRowModel,
  getFacetedUniqueValues,
  getFacetedMinMaxValues,
  getPaginationRowModel,
  getSortedRowModel
} from '@tanstack/react-table'
import { jsPDF } from 'jspdf'
import autoTable from 'jspdf-autotable'
import dayjs from 'dayjs'
import * as XLSX from 'xlsx'

// Type Imports
import type { Cliente } from '@/types/forms/cliente'
import { useRegionesYComunas } from '@/hooks/useRegionesYComunas'
import { ESTADOS_CLIENTE } from '@/data/constants'

// Interface Props
interface Props {
  userData: Cliente[]
  setData: (data: Cliente[] | ((prevData: Cliente[]) => Cliente[])) => void
}

// Component Imports
import TableFilters from './TableFilters'
import AddClient from './AddClient'
import EditClientForm from '../edit/EditClientForm'
import OptionMenu from '@core/components/option-menu'
import ClientPreview from '../preview/ClientPreview'

// Style Imports
import tableStyles from '@core/styles/table.module.css'

// Column Helper
const columnHelper = createColumnHelper<Cliente>()

const fuzzyFilter = (row: any, columnId: string, value: string, addMeta: any) => {
  const itemRank = rankItem(row.getValue(columnId), value)

  addMeta({ itemRank })

  return itemRank.passed
}

// Cerca del inicio del archivo, definir el objeto de configuración de segmentos
const segmentConfig = {
  corporativo: {
    icon: 'ri-building-line',
    color: 'primary'
  },
  pyme: {
    icon: 'ri-store-2-line',
    color: 'success'
  },
  retail: {
    icon: 'ri-shopping-bag-line',
    color: 'warning'
  },
  gobierno: {
    icon: 'ri-government-line',
    color: 'info'
  },
  institucional: {
    icon: 'ri-bank-line',
    color: 'secondary'
  },
  industrial: {
    icon: 'ri-factory-line',
    color: 'error'
  }
}

// Nuevo componente para el modal de contactos
const ContactsModal = ({
  open,
  handleClose,
  contacts
}: {
  open: boolean
  handleClose: () => void
  contacts: any[]
}) => {
  return (
    <Dialog open={open} onClose={handleClose} maxWidth='sm' fullWidth>
      <DialogTitle>Contactos del Cliente</DialogTitle>
      <DialogContent>
        {contacts.map((contact, index) => (
          <div key={index} className='mb-4 p-4 border rounded-lg'>
            <div className='flex items-center gap-2 mb-2'>
              <i className='ri-user-line text-primary' />
              <Typography variant='subtitle1'>{contact.contacto.nombre}</Typography>
              {contact.isPrincipal && <Chip label='Principal' size='small' color='primary' />}
            </div>
            <div className='grid grid-cols-2 gap-2'>
              <div className='flex items-center gap-2'>
                <i className='ri-briefcase-line text-textSecondary' />
                <Typography>{contact.contacto.cargo}</Typography>
              </div>
              <div className='flex items-center gap-2'>
                <i className='ri-mail-line text-textSecondary' />
                <Typography>{contact.contacto.email}</Typography>
              </div>
              <div className='flex items-center gap-2'>
                <i className='ri-phone-line text-textSecondary' />
                <Typography>{contact.contacto.telefono1}</Typography>
              </div>
              {contact.contacto.telefono2 && (
                <div className='flex items-center gap-2'>
                  <i className='ri-phone-line text-textSecondary' />
                  <Typography>{contact.contacto.telefono2}</Typography>
                </div>
              )}
            </div>
          </div>
        ))}
      </DialogContent>
      <DialogActions>
        <Button onClick={handleClose}>Cerrar</Button>
      </DialogActions>
    </Dialog>
  )
}

const ClientListTable = ({ userData, setData }: Props) => {
  // Verificar si userData está definido, si no, usar array vacío
  const safeUserData = userData || []

  // States
  const [addUserOpen, setAddUserOpen] = useState(false)
  const [editUserOpen, setEditUserOpen] = useState(false)
  const [selectedUser, setSelectedUser] = useState<Cliente | null>(null)
  const [rowSelection, setRowSelection] = useState({})
  const [globalFilter, setGlobalFilter] = useState('')
  const [filteredData, setFilteredData] = useState<Cliente[]>(userData)
  const [openDialog, setOpenDialog] = useState(false)
  const [contactsModalOpen, setContactsModalOpen] = useState(false)
  const [selectedContacts, setSelectedContacts] = useState<any[]>([])
  const [changeStatusOpen, setChangeStatusOpen] = useState(false)
  const [selectedStatus, setSelectedStatus] = useState('')
  const [selectedSegmento, setSelectedSegmento] = useState('')
  const [dateRange, setDateRange] = useState<[Date | null, Date | null]>([null, null])
  const [anchorEl, setAnchorEl] = useState<{ [key: number]: HTMLElement | null }>({})
  const [selectedClientForMenu, setSelectedClientForMenu] = useState<Cliente | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [comunasMap, setComunasMap] = useState<{ [key: string]: string }>({})
  const [isDeleteLoading, setIsDeleteLoading] = useState(false)
  const [selectedClientId, setSelectedClientId] = useState<number | null>(null)
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false)
  const [previewDialogOpen, setPreviewDialogOpen] = useState(false)
  const [filterStatus, setFilterStatus] = useState('')

  // Solo necesitamos regiones y comunas del hook
  const { regiones, comunas, loading } = useRegionesYComunas()

  // Manejadores para los filtros
  const handleGlobalFilter = (value: string) => {
    setGlobalFilter(value)
  }

  const handleEstadoChange = (value: string) => {
    setFilterStatus(value)
  }

  const handleSegmentoChange = (value: string) => {
    setSelectedSegmento(value)
  }

  const handleDateRangeChange = (dates: [Date | null, Date | null]) => {
    setDateRange(dates)
  }

  // Efecto para aplicar todos los filtros
  useEffect(() => {
    let filteredResults = [...safeUserData]

    // Aplicar filtro de estado
    if (filterStatus) {
      filteredResults = filteredResults.filter(item => item.estado === filterStatus)
    }

    // Aplicar filtro de segmento
    if (selectedSegmento) {
      filteredResults = filteredResults.filter(item => item.segmento === selectedSegmento)
    }

    // Aplicar filtro de rango de fechas
    if (dateRange[0] && dateRange[1]) {
      const [start, end] = dateRange

      filteredResults = filteredResults.filter(item => {
        const date = new Date(item.fechaCreacion)

        return date >= start! && date <= end!
      })
    }

    setFilteredData(filteredResults)
  }, [safeUserData, filterStatus, selectedSegmento, dateRange])

  useEffect(() => {
    setIsLoading(false)
  }, [userData])

  const handleDelete = async (clienteId: number) => {
    try {
      setIsDeleteLoading(true)

      const response = await fetch(`/api/clientes/${clienteId}`, {
        method: 'DELETE'
      })

      if (!response.ok) {
        throw new Error('Error al eliminar cliente')
      }

      // Actualizar la lista de clientes
      setData(prevData => prevData.filter(client => client.clienteId !== clienteId))

      toast.success('Cliente eliminado correctamente')
      handleCloseDialog()
    } catch (error) {
      console.error('Error:', error)
      toast.error('Error al eliminar el cliente')
    } finally {
      setIsDeleteLoading(false)
    }
  }

  const handleCloseDialog = () => {
    setOpenDialog(false)
  }

  const handleClickOpenDialog = (client: Cliente) => {
    setSelectedUser(client)
    setOpenDialog(true)
  }

  const handleEdit = (client: Cliente) => {
    setSelectedUser(client)
    setEditUserOpen(true)
  }

  const handleMenuOpen = (event: React.MouseEvent<HTMLElement>, cliente: Cliente) => {
    event.stopPropagation()
    setAnchorEl(prev => ({
      ...prev,
      [cliente.clienteId]: event.currentTarget
    }))
    setSelectedClientForMenu(cliente)
  }

  const handleMenuClose = () => {
    setAnchorEl({})
    setSelectedClientForMenu(null)
  }

  const handleStatusChange = async (clientId: number, newStatus: string) => {
    try {
      const response = await axios.patch(`/api/clientes/${clientId}/status`, { estado: newStatus })

      if (response.status === 200) {
        // Actualizar ambos estados inmediatamente
        const updatedData = filteredData.map(client =>
          client.clienteId === clientId ? { ...client, estado: newStatus } : client
        )

        setData(updatedData)
        setFilteredData(updatedData)

        toast.success('Estado actualizado exitosamente', {
          duration: 3000,
          position: 'top-right',
          style: {
            background: '#10B981',
            color: '#fff'
          }
        })
      }
    } catch (error) {
      console.error('Error al actualizar el estado:', error)
      toast.error('Error al actualizar el estado', {
        duration: 3000,
        position: 'top-right',
        style: {
          background: '#EF4444',
          color: '#fff'
        }
      })
    } finally {
      setChangeStatusOpen(false)
      setSelectedStatus('')
      setSelectedClientId(null)
    }
  }

  const handleExport = () => {
    try {
      setIsLoading(true)

      const selectedRows = table.getSelectedRowModel().rows

      if (selectedRows.length === 0) {
        toast.error('Por favor, seleccione al menos un cliente para exportar')

        return
      }

      // Preparar los datos para Excel con formato de tabla
      const headers = [
        ['INFORMACIÓN DEL CLIENTE'],
        [], // Fila vacía para separación
        [
          'RUT',
          'RAZÓN SOCIAL',
          'NOMBRE CLIENTE',
          'PAÍS',
          'REGIÓN',
          'COMUNA',
          'DIRECCIÓN',
          'TELÉFONO',
          'SITIO WEB',
          'SEGMENTO',
          'INDUSTRIA',
          'ESTADO',
          'FECHA CREACIÓN',
          'CONTACTO PRINCIPAL',
          '',
          '',
          '',
          '',
          'CONDICIONES COMERCIALES',
          '',
          ''
        ],
        [
          '',
          '',
          '',
          '',
          '',
          '',
          '',
          '',
          '',
          '',
          '',
          '',
          '',
          'Nombre',
          'Cargo',
          'Email',
          'Teléfono 1',
          'Teléfono 2',
          'Vendedor',
          'Condición Venta',
          'Observaciones'
        ]
      ]

      const csvData = selectedRows.map(row => {
        const cliente = row.original
        const contactos = cliente.clientesContactos || []
        const contactoPrincipal = contactos[0]?.contacto

        // Función para escapar campos con comas o saltos de línea
        const escapeField = (field: string | null | undefined) => {
          if (!field) return ''
          const needsQuotes = field.includes(',') || field.includes('\n') || field.includes('"')

          return needsQuotes ? `"${field.replace(/"/g, '""')}"` : field
        }

        return [
          escapeField(cliente.rut),
          escapeField(cliente.razonSocial),
          escapeField(cliente.nombreCliente),
          escapeField(cliente.pais),
          escapeField(cliente.region),
          escapeField(comunasMap[cliente.comuna] || cliente.comuna),
          escapeField(cliente.direccion),
          escapeField(cliente.telefono),
          escapeField(cliente.sitioWeb),
          escapeField(cliente.segmento),
          escapeField(cliente.industria),
          escapeField(cliente.estado),
          escapeField(new Date(cliente.fechaCreacion).toLocaleDateString()),
          escapeField(contactoPrincipal?.nombre),
          escapeField(contactoPrincipal?.cargo),
          escapeField(contactoPrincipal?.email),
          escapeField(contactoPrincipal?.telefono1),
          escapeField(contactoPrincipal?.telefono2),
          escapeField(cliente.condicionesComerciales?.vendedor),
          escapeField(cliente.condicionesComerciales?.condicionVenta),
          escapeField(cliente.condicionesComerciales?.observaciones)
        ]
      })

      // Agregar una fila vacía entre cada cliente para mejor legibilidad
      const dataWithSpacing = csvData.reduce((acc: string[][], row: string[], index: number) => {
        if (index > 0) acc.push([]) // Agregar fila vacía entre clientes
        acc.push(row)

        return acc
      }, [])

      // Crear el contenido del CSV con formato mejorado
      const allRows = [...headers, ...dataWithSpacing]
      const csvContent = allRows.map(row => row.join(',')).join('\n')

      const BOM = '\uFEFF'

      const blob = new Blob([BOM + csvContent], {
        type: 'text/csv;charset=utf-8'
      })

      const link = document.createElement('a')

      link.href = URL.createObjectURL(blob)
      link.download =
        selectedRows.length === 1
          ? `Cliente_${selectedRows[0].original.rut}.csv`
          : `Clientes_${new Date().toISOString().split('T')[0]}.csv`

      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)
      URL.revokeObjectURL(link.href)

      toast.success(`${selectedRows.length} cliente(s) exportado(s) exitosamente`)
    } catch (error) {
      console.error('Error al exportar:', error)
      toast.error('Error al exportar clientes')
    } finally {
      setIsLoading(false)
    }
  }

  // Efecto para cargar las comunas de todos los clientes
  useEffect(() => {
    const fetchComunas = async () => {
      try {
        // Obtener todas las regiones primero
        const regResponse = await fetch('/api/ubicacion/regiones')
        const regiones = await regResponse.json()

        // Para cada región, obtener sus comunas
        const comunasPromises = regiones.map(region =>
          fetch(`/api/ubicacion/comunas/${region.codigo}`).then(res => res.json())
        )

        const todasLasComunas = await Promise.all(comunasPromises)

        // Crear un mapa de id -> nombre de comuna
        const mapasComunas = todasLasComunas.flat().reduce(
          (acc, comuna) => {
            acc[comuna.id] = comuna.nombre

            return acc
          },
          {} as { [key: string]: string }
        )

        setComunasMap(mapasComunas)
      } catch (error) {
        console.error('Error al cargar comunas:', error)
      }
    }

    fetchComunas()
  }, [])

  const columns = useMemo(
    () => [
      {
        id: 'select',
        header: ({ table }: { table: Table<Cliente> }) => (
          <Checkbox checked={table.getIsAllRowsSelected()} onChange={table.getToggleAllRowsSelectedHandler()} />
        ),
        cell: ({ row }: { row: Row<Cliente> }) => (
          <Checkbox checked={row.getIsSelected()} onChange={row.getToggleSelectedHandler()} />
        )
      },
      columnHelper.accessor('rut', {
        header: 'RUT',
        cell: ({ row }: { row: Row<Cliente> }) => <Typography>{row.original.rut}</Typography>
      }),
      columnHelper.accessor('razonSocial', {
        header: 'CLIENTE',
        cell: ({ row }: { row: Row<Cliente> }) => (
          <Typography>{row.original.nombreCliente || row.original.razonSocial}</Typography>
        )
      }),
      columnHelper.accessor('comuna', {
        header: 'COMUNA',
        cell: ({ row }: { row: Row<Cliente> }) => {
          // Si tenemos el nombre de la comuna en el mapa, lo mostramos
          if (comunasMap[row.original.comuna]) {
            return <Typography variant='body2'>{comunasMap[row.original.comuna]}</Typography>
          }

          // Si no tenemos el nombre pero tenemos el ID, mostramos el ID
          if (row.original.comuna) {
            return <Typography variant='body2'>{row.original.comuna}</Typography>
          }

          // Si no tenemos nada, mostramos un guión
          return <Typography variant='body2'>-</Typography>
        }
      }),
      columnHelper.accessor('segmento', {
        header: 'SEGMENTO',
        cell: ({ row }: { row: Row<Cliente> }) => {
          const segment = row.original.segmento?.toLowerCase()

          return (
            <div className='flex items-center gap-2'>
              {segment === 'corporativo' && (
                <>
                  <i className='ri-building-line text-primary' />
                  <Typography>Corporativo</Typography>
                </>
              )}
              {segment === 'pyme' && (
                <>
                  <i className='ri-store-2-line text-success' />
                  <Typography>Pyme</Typography>
                </>
              )}
              {segment === 'retail' && (
                <>
                  <i className='ri-shopping-bag-line text-warning' />
                  <Typography>Retail</Typography>
                </>
              )}
              {segment === 'gobierno' && (
                <>
                  <i className='ri-government-line text-info' />
                  <Typography>Gobierno</Typography>
                </>
              )}
              {segment === 'institucional' && (
                <>
                  <i className='ri-bank-line text-secondary' />
                  <Typography>Institucional</Typography>
                </>
              )}
              {segment === 'industrial' && (
                <>
                  <i className='ri-factory-line text-error' />
                  <Typography>Industrial</Typography>
                </>
              )}
            </div>
          )
        }
      }),
      columnHelper.accessor('clientesContactos', {
        header: 'CONTACTO',
        cell: ({ row }: { row: Row<Cliente> }) => {
          const contacts = row.original.clientesContactos || []
          const hasContacts = contacts.length > 0

          return (
            <div className='flex items-center gap-2'>
              <div className={`w-2 h-2 rounded-full ${hasContacts ? 'bg-success' : 'bg-error'}`} />
              <Button
                variant='text'
                size='small'
                onClick={() => {
                  if (hasContacts) {
                    setSelectedContacts(contacts)
                    setContactsModalOpen(true)
                  }
                }}
                disabled={!hasContacts}
              >
                {hasContacts ? `${contacts.length} contacto${contacts.length > 1 ? 's' : ''}` : 'Sin contactos'}
              </Button>
            </div>
          )
        }
      }),
      columnHelper.accessor('estado', {
        header: 'ESTADO',
        cell: ({ row }: { row: Row<Cliente> }) => (
          <Chip
            label={row.original.estado}
            color={row.original.estado.toLowerCase() === 'active' ? 'success' : 'warning'}
            size='small'
          />
        )
      }),
      {
        accessorKey: 'actions',
        header: 'ACCIONES',
        cell: ({ row }) => (
          <Box sx={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <IconButton
              size='small'
              color='info'
              onClick={() => handlePreview(row.original)}
              sx={{
                '&:hover': {
                  backgroundColor: 'info.light'
                }
              }}
            >
              <i className='ri-eye-line' style={{ fontSize: '1.25rem' }} />
            </IconButton>
            <IconButton
              size='small'
              color='primary'
              onClick={() => handleEdit(row.original)}
              sx={{
                '&:hover': {
                  backgroundColor: 'primary.light'
                }
              }}
            >
              <i className='ri-pencil-line' style={{ fontSize: '1.25rem' }} />
            </IconButton>
            <OptionMenu
              iconButtonProps={{ className: 'cursor-pointer' }}
              options={[
                {
                  text: 'Cambiar Estado',
                  icon: 'ri-exchange-line',
                  menuItemProps: {
                    onClick: () => {
                      setSelectedClientId(row.original.clienteId)
                      setSelectedStatus(row.original.estado)
                      setChangeStatusOpen(true)
                    }
                  }
                },
                {
                  text: 'Eliminar',
                  icon: 'ri-delete-bin-line',
                  menuItemProps: {
                    onClick: () => handleDeleteClick(row.original.clienteId)
                  }
                }
              ]}
            />
          </Box>
        )
      }
    ],
    [comunasMap]
  )

  const table = useReactTable({
    data: filteredData,
    columns,
    filterFns: {
      fuzzy: fuzzyFilter
    },
    state: {
      rowSelection,
      globalFilter
    },
    enableRowSelection: true,
    manualPagination: false,
    initialState: {
      pagination: {
        pageSize: 10
      }
    },
    globalFilterFn: fuzzyFilter,
    onRowSelectionChange: setRowSelection,
    getCoreRowModel: getCoreRowModel(),
    onGlobalFilterChange: setGlobalFilter,
    getFilteredRowModel: getFilteredRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    getFacetedRowModel: getFacetedRowModel(),
    getFacetedUniqueValues: getFacetedUniqueValues(),
    getFacetedMinMaxValues: getFacetedMinMaxValues()
  })

  // Función para alternar el drawer de nuevo cliente
  const toggleAddUserDrawer = () => setAddUserOpen(!addUserOpen)

  // Función para manejar el clic en eliminar
  const handleDeleteClick = (clientId: number) => {
    setSelectedClientId(clientId)
    setDeleteDialogOpen(true)
  }

  // Función para confirmar la eliminación
  const handleDeleteConfirm = async () => {
    if (!selectedClientId) return

    try {
      const response = await axios.delete(`/api/clientes/${selectedClientId}`)

      if (response.status === 200) {
        // Actualizar ambos estados inmediatamente
        const updatedData = filteredData.filter(client => client.clienteId !== selectedClientId)

        setData(updatedData)
        setFilteredData(updatedData)

        toast.success('Cliente eliminado exitosamente', {
          duration: 3000,
          position: 'top-right',
          style: {
            background: '#10B981',
            color: '#fff'
          }
        })
      }
    } catch (error) {
      console.error('Error al eliminar cliente:', error)
      toast.error('Error al eliminar el cliente', {
        duration: 3000,
        position: 'top-right',
        style: {
          background: '#EF4444',
          color: '#fff'
        }
      })
    } finally {
      setDeleteDialogOpen(false)
      setSelectedClientId(null)
    }
  }

  const handlePreview = (client: Cliente) => {
    setSelectedUser(client)
    setPreviewDialogOpen(true)
  }

  return (
    <>
      <Card>
        <CardHeader
          title={<Typography variant='h6'>Clientes</Typography>}
          action={
            <Button variant='contained' onClick={() => setAddUserOpen(true)} startIcon={<i className='ri-add-line' />}>
              Nuevo Cliente
            </Button>
          }
        />

        <TableFilters
          value={globalFilter ?? ''}
          selectedEstado={filterStatus}
          selectedSegmento={selectedSegmento}
          dateRange={dateRange}
          handleFilter={handleGlobalFilter}
          handleEstadoChange={handleEstadoChange}
          handleSegmentoChange={handleSegmentoChange}
          handleDateRangeChange={handleDateRangeChange}
        />

        <Divider />

        <div className='flex justify-between p-5 gap-4 flex-col items-start sm:flex-row sm:items-center'>
          <Button
            color='secondary'
            variant='outlined'
            startIcon={<i className='ri-upload-2-line text-xl' />}
            onClick={handleExport}
            disabled={isLoading}
            className='max-sm:is-full'
          >
            Exportar
          </Button>
          <div className='flex items-center gap-x-4 gap-4 flex-col max-sm:is-full sm:flex-row'>
            <TextField
              size='small'
              value={globalFilter ?? ''}
              onChange={e => setGlobalFilter(e.target.value)}
              placeholder='Buscar'
              style={{ width: '500px' }}
              className='max-sm:is-full min-is-[200px]'
              InputProps={{
                startAdornment: (
                  <InputAdornment position='start'>
                    <i className='ri-search-line' />
                  </InputAdornment>
                ),
                sx: {
                  padding: '8px',
                  borderRadius: '8px',
                  border: '1px solid #E0E0E0'
                }
              }}
            />
          </div>
        </div>

        <Divider />

        {/* Tabla con el mismo estilo que WorkListTable */}
        <div className='overflow-x-auto'>
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
              {table.getRowModel().rows.length === 0 ? (
                <tr>
                  <td colSpan={table.getAllColumns().length} className='text-center p-4'>
                    No hay datos disponibles
                  </td>
                </tr>
              ) : (
                table.getRowModel().rows.map(row => (
                  <tr key={row.id}>
                    {row.getVisibleCells().map(cell => (
                      <td key={cell.id}>{flexRender(cell.column.columnDef.cell, cell.getContext())}</td>
                    ))}
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        <TablePagination
          component='div'
          rowsPerPageOptions={[10, 25, 50]}
          count={table.getFilteredRowModel().rows.length}
          rowsPerPage={table.getState().pagination.pageSize}
          page={table.getState().pagination.pageIndex}
          onPageChange={(_, page) => table.setPageIndex(page)}
          onRowsPerPageChange={e => table.setPageSize(Number(e.target.value))}
        />

        {/* Drawer de nuevo cliente */}
        <AddClient open={addUserOpen} handleClose={() => setAddUserOpen(false)} setData={setData} />

        {selectedUser && (
          <>
            {console.log('Rendering EditClientForm with selectedUser:', selectedUser)}
            <EditClientForm
              open={editUserOpen}
              handleClose={() => {
                setEditUserOpen(false)
                setSelectedUser(null)
              }}
              userData={userData}
              setData={setData}
              currentUser={selectedUser}
            />
          </>
        )}
      </Card>
      {/* Diálogo de confirmación de eliminación */}
      <Dialog open={deleteDialogOpen} onClose={() => setDeleteDialogOpen(false)}>
        <DialogTitle>Confirmar eliminación</DialogTitle>
        <DialogContent>¿Está seguro que desea eliminar este cliente? Esta acción no se puede deshacer.</DialogContent>
        <DialogActions>
          <Button onClick={() => setDeleteDialogOpen(false)} color='primary'>
            Cancelar
          </Button>
          <Button onClick={handleDeleteConfirm} color='error' variant='contained'>
            Eliminar
          </Button>
        </DialogActions>
      </Dialog>

      <ContactsModal
        open={contactsModalOpen}
        handleClose={() => setContactsModalOpen(false)}
        contacts={selectedContacts}
      />

      {/* Diálogo para cambiar estado */}
      <Dialog
        open={changeStatusOpen}
        onClose={() => {
          setChangeStatusOpen(false)
          setSelectedStatus('')
          setSelectedClientId(null)
        }}
        maxWidth='xs'
        fullWidth
      >
        <DialogTitle>Editar Estado</DialogTitle>
        <DialogContent>
          <FormControl fullWidth sx={{ mt: 2 }}>
            <Select value={selectedStatus} onChange={e => setSelectedStatus(e.target.value)} displayEmpty>
              {ESTADOS_CLIENTE.map(estado => (
                <MenuItem key={estado.value} value={estado.value}>
                  {estado.label}
                </MenuItem>
              ))}
            </Select>
          </FormControl>
        </DialogContent>
        <DialogActions>
          <Button variant='outlined' color='secondary' onClick={() => setChangeStatusOpen(false)}>
            Cancelar
          </Button>
          <Button
            variant='contained'
            onClick={() => selectedClientId && handleStatusChange(selectedClientId, selectedStatus)}
          >
            Aceptar
          </Button>
        </DialogActions>
      </Dialog>

      <Dialog open={previewDialogOpen} onClose={() => setPreviewDialogOpen(false)} maxWidth='lg' fullWidth>
        <DialogTitle>Detalles del Cliente</DialogTitle>
        <DialogContent>
          <ClientPreview client={selectedUser} />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setPreviewDialogOpen(false)} variant='contained'>
            Cerrar
          </Button>
        </DialogActions>
      </Dialog>
    </>
  )
}

export default ClientListTable
