'use client'

// React Imports
import { useEffect, useState, useMemo, useCallback } from 'react'

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
import Box from '@mui/material/Box'
import MuiLink from '@mui/material/Link'
import InputLabel from '@mui/material/InputLabel'

// Importar los componentes de tabla con alias
import {
  Table as MuiTable,
  TableBody as MuiTableBody,
  TableCell as MuiTableCell,
  TableContainer as MuiTableContainer,
  TableHead as MuiTableHead,
  TableRow as MuiTableRow
} from '@mui/material'

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
  getSortedRowModel,
  SortingState
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

// Definir los roles legibles
const ROLES_CONTACTO = [
  { value: 'encargado_obra', label: 'Encargado de Obra' },
  { value: 'envio_informes', label: 'Envío de Informes' },
  { value: 'dueno_representante', label: 'Dueño Representante' },
  { value: 'jefe_obra_planta', label: 'Jefe de Obra / Planta' },
  { value: 'supervisor', label: 'Supervisor' },
  { value: 'administrador_obra', label: 'Administrador de Obra' },
  { value: 'encargado_calidad', label: 'Encargado de Calidad' },
  { value: 'autocontrol', label: 'Autocontrol' },
  { value: 'profesional', label: 'Profesional' },
  { value: 'laboratorista', label: 'Laboratorista' },
  { value: 'otro', label: 'Otro (Especificar)' }
]

const getCargoLabel = (value: string) => {
  return ROLES_CONTACTO.find(r => r.value === value)?.label || value
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
                <Typography>{getCargoLabel(contact.cargo)}</Typography>
              </div>
              <div className='flex items-center gap-2'>
                <i className='ri-mail-line text-textSecondary' />
                <MuiLink href={`mailto:${contact.contacto.email}`} sx={{ textDecoration: 'none' }}>
                  {contact.contacto.email}
                </MuiLink>
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

// Definir el tipo para las opciones del menú
interface OptionMenuItemType {
  text: string
  icon: string
  menuItemProps?: {
    onClick: () => void
  }
}

const ClientListTable = ({ userData, setData }: Props) => {
  // Asegurarnos de que userData siempre sea un array
  const safeUserData = Array.isArray(userData) ? userData : []

  // States
  const [addUserOpen, setAddUserOpen] = useState(false)
  const [editUserOpen, setEditUserOpen] = useState(false)
  const [selectedUser, setSelectedUser] = useState<Cliente | null>(null)
  const [rowSelection, setRowSelection] = useState({})
  const [globalFilter, setGlobalFilter] = useState('')
  const [tableData, setTableData] = useState<Cliente[]>(safeUserData)
  const [sorting, setSorting] = useState<SortingState>([])

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
  const [motivoBloqueo, setMotivoBloqueo] = useState('')

  // Mantener una copia local de los datos
  const [localData, setLocalData] = useState<Cliente[]>(safeUserData)

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

  // Efecto para aplicar filtros
  useEffect(() => {
    const applyFilters = () => {
      // Asegurarnos de que estamos trabajando con un array
      let results = [...safeUserData]

      if (filterStatus) {
        results = results.filter(cliente => cliente.estado === filterStatus)
      }

      if (selectedSegmento) {
        results = results.filter(cliente => cliente.segmento === selectedSegmento)
      }

      if (dateRange[0] && dateRange[1]) {
        const [start, end] = dateRange

        results = results.filter(item => {
          const date = new Date(item.fechaCreacion)

          return date >= start! && date <= end!
        })
      }

      if (globalFilter) {
        results = results.filter(cliente => {
          const searchStr = globalFilter.toLowerCase()

          return (
            cliente.rut?.toLowerCase().includes(searchStr) ||
            cliente.nombreCliente?.toLowerCase().includes(searchStr) ||
            cliente.razonSocial?.toLowerCase().includes(searchStr)
          )
        })
      }

      setTableData(results)
    }

    applyFilters()
  }, [safeUserData, filterStatus, selectedSegmento, dateRange, globalFilter])

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

  const handleEdit = useCallback((client: Cliente) => {
    setSelectedUser(client)
    setEditUserOpen(true)
  }, [])

  const handleEditClose = useCallback(() => {
    setEditUserOpen(false)
    setSelectedUser(null)
  }, [])

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
      const updateData = {
        estado: newStatus,
        motivoBloqueo: newStatus === 'blocked' ? motivoBloqueo : null
      }

      const response = await axios.patch(`/api/clientes/${clientId}/status`, updateData)

      if (response.status === 200) {
        const updatedData = tableData.map(client =>
          client.clienteId === clientId
            ? { ...client, estado: newStatus, motivoBloqueo: updateData.motivoBloqueo }
            : client
        )

        setData(updatedData)
        setTableData(updatedData)
        setMotivoBloqueo('') // Limpiar el motivo después de guardar

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
          escapeField(getCargoLabel(contactoPrincipal?.cargo)),
          escapeField(contactoPrincipal?.email),
          escapeField(contactoPrincipal?.telefono1),
          escapeField(contactoPrincipal?.telefono2),
          escapeField(cliente.condicionesComerciales?.vendedor),
          escapeField(cliente.condicionesComerciales?.condicionVenta),
          escapeField(cliente.condicionesComerciales?.observaciones)
        ]
      })

      // Crear el contenido del CSV con formato mejorado
      const allRows = [...headers, ...csvData]
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

  // Función para cargar los clientes
  const fetchClients = async () => {
    try {
      const response = await fetch('/api/clientes')

      if (!response.ok) throw new Error('Error al cargar clientes')
      const data = await response.json()

      console.log('Datos recibidos:', data)
      setData(data)
      setTableData(data) // También actualizar los datos filtrados
    } catch (error) {
      console.error('Error:', error)
      toast.error('Error al cargar los clientes')
    }
  }

  // Cargar datos al montar el componente
  useEffect(() => {
    fetchClients()
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
        cell: ({ row }: { row: Row<Cliente> }) => <Typography>{row.original.rut}</Typography>,
        enableSorting: true
      }),
      columnHelper.accessor('fechaCreacion', {
        header: 'FECHA INGRESO',
        cell: ({ row }: { row: Row<Cliente> }) => (
          <Typography>
            {new Date(row.original.fechaCreacion).toLocaleDateString('es-CL', {
              year: 'numeric',
              month: '2-digit',
              day: '2-digit'
            })}
          </Typography>
        ),
        enableSorting: true
      }),
      columnHelper.accessor('razonSocial', {
        header: 'CLIENTE',
        cell: ({ row }: { row: Row<Cliente> }) => {
          const text = row.original.nombreCliente || row.original.razonSocial
          const displayText = text.length > 20 ? `${text.substring(0, 20)}...` : text

          return <Typography title={text}>{displayText}</Typography>
        },
        enableSorting: true
      }),
      columnHelper.accessor('comuna', {
        header: 'COMUNA',
        cell: ({ row }: { row: Row<Cliente> }) => {
          if (comunasMap[row.original.comuna]) {
            return <Typography variant='body2'>{comunasMap[row.original.comuna]}</Typography>
          }

          if (row.original.comuna) {
            return <Typography variant='body2'>{row.original.comuna}</Typography>
          }

          return <Typography variant='body2'>-</Typography>
        },
        enableSorting: true
      }),
      columnHelper.accessor('segmento', {
        header: 'SEGMENTO',
        cell: ({ row }) => {
          const segmento = row.original.segmento

          const segmentConfig = {
            'Corporativo Estratégico': {
              icon: 'ri-building-4-line',
              color: 'primary'
            },
            Consolidado: {
              icon: 'ri-building-3-line',
              color: 'success'
            },
            Expansión: {
              icon: 'ri-line-chart-line',
              color: 'warning'
            },
            Ocasional: {
              icon: 'ri-store-2-line',
              color: 'info'
            },
            'Nuevo prospecto': {
              icon: 'ri-user-add-line',
              color: 'secondary'
            }
          }

          const config = segmentConfig[segmento as keyof typeof segmentConfig] || {
            icon: 'ri-question-line',
            color: 'default'
          }

          return (
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
              <i
                className={config.icon}
                style={{ fontSize: '1.25rem', color: `var(--mui-palette-${config.color}-main)` }}
              />
              <Typography>{segmento}</Typography>
            </Box>
          )
        },
        enableSorting: true
      }),
      columnHelper.accessor('clientesContactos', {
        header: 'CONTACTO',
        cell: ({ row }) => {
          const cliente = row.original
          const contactoPrincipal = cliente.clientesContactos?.find(c => c.isPrincipal)

          if (!cliente.clientesContactos || cliente.clientesContactos.length === 0) {
            return (
              <div className='flex items-center gap-2'>
                <div className='w-2 h-2 rounded-full bg-error' />
                <Typography color='error'>Sin contactos</Typography>
              </div>
            )
          }

          const formatContactName = (name: string) => {
            return name.length > 15 ? `${name.substring(0, 15)}...` : name
          }

          return (
            <div
              className='flex items-center gap-2 cursor-pointer'
              onClick={() => {
                setSelectedContacts(cliente.clientesContactos || [])
                setContactsModalOpen(true)
              }}
            >
              {contactoPrincipal ? (
                <>
                  <i className='ri-star-fill text-warning' style={{ fontSize: '1.25rem' }} />
                  <Typography title={contactoPrincipal.contacto?.nombre}>
                    {formatContactName(contactoPrincipal.contacto?.nombre || '')}
                  </Typography>
                </>
              ) : (
                <>
                  <i className='ri-user-line text-primary' style={{ fontSize: '1.25rem' }} />
                  <Typography title={cliente.clientesContactos[0].contacto?.nombre}>
                    {formatContactName(cliente.clientesContactos[0].contacto?.nombre || '')}
                  </Typography>
                </>
              )}
            </div>
          )
        }
      }),
      columnHelper.accessor('estado', {
        header: 'ESTADO',
        cell: ({ row }: { row: Row<Cliente> }) => {
          const estado = row.original.estado.toLowerCase()
          let color: 'success' | 'warning' | 'error' | 'default' = 'default'
          let label = 'Desconocido'

          switch (estado) {
            case 'active':
              color = 'success'
              label = 'Activo'
              break
            case 'inactive':
              color = 'warning'
              label = 'Inactivo'
              break
            case 'blocked':
              color = 'error'
              label = 'Bloqueado'
              break
          }

          return <Chip label={label} color={color} size='small' />
        },
        enableSorting: true
      }),
      {
        id: 'actions',
        header: 'ACCIONES',
        cell: ({ row }: { row: Row<Cliente> }) => (
          <Box sx={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <IconButton
              size='small'
              color='info'
              onClick={async () => {
                try {
                  const response = await axios.get(`/api/clientes/${row.original.clienteId}`)
                  const clienteCompleto = response.data

                  console.log('Cliente completo desde API:', clienteCompleto)
                  setSelectedUser(clienteCompleto)
                  setPreviewDialogOpen(true)
                } catch (error) {
                  console.error('Error al obtener datos del cliente:', error)
                  toast.error('Error al obtener datos del cliente')
                }
              }}
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
              onClick={async () => {
                try {
                  if (row.original.clienteId) {
                    const response = await axios.get(`/api/clientes/${row.original.clienteId}`)
                    const clienteCompleto = response.data

                    console.log('Cliente completo para editar:', clienteCompleto)
                    setSelectedUser(clienteCompleto)
                    setEditUserOpen(true)
                  }
                } catch (error) {
                  console.error('Error al obtener datos del cliente:', error)
                  toast.error('Error al obtener datos del cliente')
                }
              }}
              sx={{
                '&:hover': {
                  backgroundColor: 'primary.light'
                }
              }}
            >
              <i className='ri-pencil-line' style={{ fontSize: '1.25rem' }} />
            </IconButton>

            <OptionMenu
              options={[
                {
                  text: 'Cambiar Estado',
                  icon: 'ri-exchange-line',
                  menuItemProps: {
                    onClick: () => {
                      if (row.original.clienteId) {
                        setSelectedClientId(row.original.clienteId)
                        setSelectedStatus(row.original.estado)
                        setChangeStatusOpen(true)
                      }
                    }
                  }
                }
              ]}
            />
          </Box>
        ),
        enableSorting: false
      }
    ],
    [comunasMap]
  )

  const table = useReactTable({
    data: tableData,
    columns,
    filterFns: {
      fuzzy: fuzzyFilter
    },
    state: {
      rowSelection,
      globalFilter,
      sorting
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
    onSortingChange: setSorting,
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
        const updatedData = tableData.filter(client => client.clienteId !== selectedClientId)

        setData(updatedData)
        setTableData(updatedData)

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

  return (
    <>
      <Card>
        <CardHeader
          title={<Typography variant='h5'>Clientes</Typography>}
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
                    <th key={header.id}>
                      {header.isPlaceholder ? null : (
                        <>
                          <div
                            className={classnames({
                              'flex items-center': header.column.getIsSorted(),
                              'cursor-pointer select-none': header.column.getCanSort()
                            })}
                            onClick={header.column.getToggleSortingHandler()}
                          >
                            {flexRender(header.column.columnDef.header, header.getContext())}
                            {{
                              asc: <i className='ri-arrow-up-s-line text-xl' />,
                              desc: <i className='ri-arrow-down-s-line text-xl' />
                            }[header.column.getIsSorted() as 'asc' | 'desc'] ?? null}
                          </div>
                        </>
                      )}
                    </th>
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
          <EditClientForm
            open={editUserOpen}
            handleClose={handleEditClose}
            userData={safeUserData}
            setData={setData}
            currentUser={selectedUser}
          />
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

      {/* Modal para mostrar los contactos */}
      <Dialog open={contactsModalOpen} onClose={() => setContactsModalOpen(false)} maxWidth='md' fullWidth>
        <DialogTitle sx={{ borderBottom: 1, borderColor: 'divider', pb: 2 }}>Contactos del Cliente</DialogTitle>
        <DialogContent sx={{ mt: 2 }}>
          <MuiTableContainer>
            <MuiTable>
              <MuiTableHead>
                <MuiTableRow>
                  <MuiTableCell sx={{ fontWeight: 'bold' }}>Nombre</MuiTableCell>
                  <MuiTableCell sx={{ fontWeight: 'bold' }}>Cargo</MuiTableCell>
                  <MuiTableCell sx={{ fontWeight: 'bold' }}>Email</MuiTableCell>
                  <MuiTableCell sx={{ fontWeight: 'bold' }}>Teléfono 1</MuiTableCell>
                  <MuiTableCell sx={{ fontWeight: 'bold' }}>Teléfono 2</MuiTableCell>
                </MuiTableRow>
              </MuiTableHead>
              <MuiTableBody>
                {selectedContacts.map((contacto, index) => (
                  <MuiTableRow key={index} sx={{ '&:hover': { backgroundColor: 'action.hover' } }}>
                    <MuiTableCell>{contacto.contacto.nombre}</MuiTableCell>
                    <MuiTableCell>{getCargoLabel(contacto.cargo)}</MuiTableCell>
                    <MuiTableCell>
                      <MuiLink
                        href={`mailto:${contacto.contacto.email}`}
                        sx={{
                          textDecoration: 'none',
                          color: 'text.primary',
                          '&:hover': { color: 'primary.main' }
                        }}
                      >
                        {contacto.contacto.email}
                      </MuiLink>
                    </MuiTableCell>
                    <MuiTableCell>
                      <MuiLink
                        href={`tel:${contacto.contacto.telefono1}`}
                        sx={{
                          textDecoration: 'none',
                          color: 'text.primary',
                          '&:hover': { color: 'primary.main' }
                        }}
                      >
                        {contacto.contacto.telefono1}
                      </MuiLink>
                    </MuiTableCell>
                    <MuiTableCell>
                      {contacto.contacto.telefono2 && (
                        <MuiLink
                          href={`tel:${contacto.contacto.telefono2}`}
                          sx={{
                            textDecoration: 'none',
                            color: 'text.primary',
                            '&:hover': { color: 'primary.main' }
                          }}
                        >
                          {contacto.contacto.telefono2}
                        </MuiLink>
                      )}
                    </MuiTableCell>
                  </MuiTableRow>
                ))}
              </MuiTableBody>
            </MuiTable>
          </MuiTableContainer>
        </DialogContent>
        <DialogActions sx={{ borderTop: 1, borderColor: 'divider', pt: 2 }}>
          <Button onClick={() => setContactsModalOpen(false)} variant='contained'>
            Cerrar
          </Button>
        </DialogActions>
      </Dialog>

      {/* Diálogo de cambio de estado */}
      <Dialog
        open={changeStatusOpen}
        onClose={() => {
          setChangeStatusOpen(false)
          setMotivoBloqueo('') // Limpiar el motivo al cerrar
        }}
        maxWidth='sm'
        fullWidth
      >
        <DialogTitle>Editar Estado</DialogTitle>
        <DialogContent sx={{ minWidth: '400px', pt: 4 }}>
          <FormControl fullWidth size='small'>
            <Select
              value={selectedStatus}
              onChange={e => setSelectedStatus(e.target.value)}
              displayEmpty
              sx={{
                minHeight: 40,
                '& .MuiSelect-select': {
                  py: 1.5,
                  width: '100%'
                }
              }}
            >
              <MenuItem value='' disabled>
                Seleccione un estado
              </MenuItem>
              <MenuItem value='active'>Activo</MenuItem>
              <MenuItem value='inactive'>Inactivo</MenuItem>
              <MenuItem value='blocked'>Bloqueado</MenuItem>
            </Select>
          </FormControl>

          {selectedStatus === 'blocked' && (
            <TextField
              fullWidth
              label='Motivo del Bloqueo'
              multiline
              rows={3}
              value={motivoBloqueo}
              onChange={e => setMotivoBloqueo(e.target.value)}
              sx={{ mt: 4 }}
              required
            />
          )}
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 3 }}>
          <Button
            onClick={() => {
              setChangeStatusOpen(false)
              setMotivoBloqueo('') // Limpiar el motivo al cancelar
            }}
          >
            Cancelar
          </Button>
          <Button
            onClick={() => handleStatusChange(selectedClientId!, selectedStatus)}
            variant='contained'
            disabled={selectedStatus === 'blocked' && !motivoBloqueo.trim()}
          >
            Guardar
          </Button>
        </DialogActions>
      </Dialog>

      {/* Diálogo de Preview */}
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
