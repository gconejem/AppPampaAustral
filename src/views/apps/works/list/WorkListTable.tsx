'use client'

// React Imports
import { useEffect, useState, useMemo } from 'react'

// Next Imports
import Link from 'next/link'
import { useParams } from 'next/navigation'

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
import type { TextFieldProps } from '@mui/material/TextField'
import InputAdornment from '@mui/material/InputAdornment'
import CircularProgress from '@mui/material/CircularProgress'
import Dialog from '@mui/material/Dialog'
import DialogTitle from '@mui/material/DialogTitle'
import DialogContent from '@mui/material/DialogContent'
import DialogActions from '@mui/material/DialogActions'
import Menu from '@mui/material/Menu'
import MenuItem from '@mui/material/MenuItem'
import FormControl from '@mui/material/FormControl'
import InputLabel from '@mui/material/InputLabel'
import Select from '@mui/material/Select'
import Box from '@mui/material/Box'
import Popover from '@mui/material/Popover'
import DeleteIcon from '@mui/icons-material/Delete'
import PreviewIcon from '@mui/icons-material/Visibility'

// Third-party Imports
import axios from 'axios'
import { toast } from 'react-hot-toast'
import classnames from 'classnames'
import { rankItem } from '@tanstack/match-sorter-utils'
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
import type { ColumnDef, FilterFn } from '@tanstack/react-table'
import type { RankingInfo } from '@tanstack/match-sorter-utils'
import jsPDF from 'jspdf'
import 'jspdf-autotable'
import { utils as XLSXUtils, write as XLSXWrite } from 'xlsx'
import { saveAs } from 'file-saver'

// Type Imports
import type { ThemeColor } from '@core/types'
import type { UsersType } from '@/types/apps/userTypes'
import type { Locale } from '@configs/i18n'
import type { Obra, WorkTypeWithAction, ContactoObra } from '@/types/forms/obra'

// Component Imports
import TableFilters from './TableFilters'
import AddWork from './AddWork'
import OptionMenu from '@core/components/option-menu'
import CustomAvatar from '@core/components/mui/Avatar'
import EditWorksForm from '../edit/EditWorksForm'
import ViewContactsDialog from '../components/ViewContactsDialog'
import WorkPreview from '../preview/WorkPreview'

// Util Imports
import { getInitials } from '@/utils/getInitials'
import { getLocalizedUrl } from '@/utils/i18n'

// Style Imports
import tableStyles from '@core/styles/table.module.css'

// Data Imports
import { ESTADOS_OBRA } from '@/data/constants'

declare module '@tanstack/table-core' {
  interface FilterFns {
    fuzzy: FilterFn<unknown>
  }
  interface FilterMeta {
    itemRank: RankingInfo
  }
}

type UsersTypeWithAction = UsersType & {
  action?: string
}

type UserRoleType = {
  [key: string]: { icon: string; color: string }
}

type UserStatusType = {
  [key: string]: ThemeColor
}

// Styled Components
const Icon = styled('i')({})

const fuzzyFilter: FilterFn<any> = (row, columnId, value, addMeta) => {
  // Rank the item
  const itemRank = rankItem(row.getValue(columnId), value)

  // Store the itemRank info
  addMeta({
    itemRank
  })

  // Return if the item should be filtered in/out
  return itemRank.passed
}

const DebouncedInput = ({
  value: initialValue,
  onChange,
  debounce = 500,
  ...props
}: {
  value: string | number
  onChange: (value: string | number) => void
  debounce?: number
} & Omit<TextFieldProps, 'onChange'>) => {
  // States
  const [value, setValue] = useState(initialValue)

  useEffect(() => {
    setValue(initialValue)
  }, [initialValue])

  useEffect(() => {
    const timeout = setTimeout(() => {
      onChange(value)
    }, debounce)

    return () => clearTimeout(timeout)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [value])

  return <TextField {...props} value={value} onChange={e => setValue(e.target.value)} size='small' />
}

// Vars
const userRoleObj: UserRoleType = {
  admin: { icon: 'ri-vip-crown-line', color: 'error' },
  author: { icon: 'ri-computer-line', color: 'warning' },
  editor: { icon: 'ri-edit-box-line', color: 'info' },
  maintainer: { icon: 'ri-pie-chart-2-line', color: 'success' },
  subscriber: { icon: 'ri-user-3-line', color: 'primary' }
}

const userStatusObj: UserStatusType = {
  active: 'success',
  pending: 'warning',
  inactive: 'secondary'
}

// Definir la interfaz para los datos de obra
interface ObraType {
  id: number
  numeroObra: string
  nombreObra: string
  comuna: string
  rutCliente: string
  cliente: string
  encargado: string
  estado: string

  // ... otros campos necesarios
}

// Column Definitions
const columnHelper = createColumnHelper<ObraType>()

// Column Definitions
const WorkListTable = () => {
  // States
  const [rowSelection, setRowSelection] = useState({})
  const [data, setData] = useState<ObraType[]>([])
  const [filteredData, setFilteredData] = useState<ObraType[]>([])
  const [globalFilter, setGlobalFilter] = useState('')
  const [isLoading, setIsLoading] = useState(true)
  const [selectedObra, setSelectedObra] = useState<Obra | null>(null)
  const [editObraOpen, setEditObraOpen] = useState(false)
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false)
  const [selectedObraId, setSelectedObraId] = useState<number | null>(null)
  const [addObraOpen, setAddObraOpen] = useState<boolean>(false)
  const [menuState, setMenuState] = useState<{ [key: number]: HTMLElement | null }>({})
  const [selectedObraForMenu, setSelectedObraForMenu] = useState<Obra | null>(null)
  const [duplicateDialogOpen, setDuplicateDialogOpen] = useState(false)
  const [obraToDuplicate, setObraToDuplicate] = useState<Obra | null>(null)
  const [viewContactsOpen, setViewContactsOpen] = useState(false)
  const [selectedContacts, setSelectedContacts] = useState<ContactoObra[]>([])
  const [changeStatusOpen, setChangeStatusOpen] = useState(false)
  const [selectedStatus, setSelectedStatus] = useState('')
  const [anchorEl, setAnchorEl] = useState<{ [key: number]: HTMLElement | null }>({})
  const [selectedContact, setSelectedContact] = useState<any>(null)
  const [contactDialogOpen, setContactDialogOpen] = useState(false)
  const [previewDialogOpen, setPreviewDialogOpen] = useState(false)

  // Hooks
  const params = useParams()
  const locale = (params?.lang as string) || 'es'

  // Cargar obras cuando el componente se monta
  useEffect(() => {
    const fetchObras = async () => {
      try {
        setIsLoading(true)
        const response = await fetch('/api/obras')

        if (!response.ok) {
          throw new Error('Error al cargar las obras')
        }

        const data = await response.json()

        setData(data)
        setFilteredData(data)
      } catch (error) {
        console.error('Error:', error)
        toast.error('Error al cargar las obras')
      } finally {
        setIsLoading(false)
      }
    }

    fetchObras()
  }, [])

  const handleDeleteClick = (id: number) => {
    setSelectedObraId(id)
    setDeleteDialogOpen(true)
  }

  const handleDeleteConfirm = async () => {
    if (!selectedObraId) return

    try {
      const response = await axios.delete(`/api/obras/${selectedObraId}`)

      if (response.status === 200) {
        // Actualizar ambos estados inmediatamente
        const updatedData = data.filter(obra => obra.obraId !== selectedObraId)

        setData(updatedData)
        setFilteredData(updatedData) // Actualizar también los datos filtrados

        // Mostrar notificación de éxito
        toast.success('Obra eliminada exitosamente', {
          duration: 3000, // Duración de 3 segundos
          position: 'top-right', // Posición en la pantalla
          style: {
            background: '#10B981', // Color verde para éxito
            color: '#fff'
          }
        })
      }
    } catch (error) {
      console.error('Error deleting obra:', error)
      toast.error('Error al eliminar la obra', {
        duration: 3000,
        position: 'top-right',
        style: {
          background: '#EF4444', // Color rojo para error
          color: '#fff'
        }
      })
    } finally {
      setDeleteDialogOpen(false)
      setSelectedObraId(null)
    }
  }

  const handleEdit = async (obra: Obra) => {
    try {
      // Obtener los datos actualizados de la obra
      const response = await axios.get(`/api/obras/${obra.obraId}`)

      if (response.data) {
        // Guardar la obra seleccionada en el estado
        setSelectedObra(response.data)

        // Abrir el formulario de edición
        setEditObraOpen(true)
      }
    } catch (error) {
      console.error('Error al obtener los datos de la obra:', error)
      toast.error('Error al cargar los datos de la obra', {
        duration: 3000,
        position: 'top-right',
        style: {
          background: '#EF4444',
          color: '#fff'
        }
      })
    }
  }

  const handleExport = () => {
    const doc = new jsPDF()

    // Obtener las obras seleccionadas
    const selectedRows = table.getSelectedRowModel().rows

    const dataToExport = selectedRows.length > 0 ? selectedRows.map(row => row.original) : data // Si no hay selección, exportar todos

    // Configurar el título
    doc.setFontSize(15)
    doc.text('Reporte de Obras', 14, 15)
    doc.setFontSize(10)
    doc.text(`Fecha: ${new Date().toLocaleDateString()}`, 14, 25)

    // Configurar las columnas para la tabla
    const columns = [
      { header: 'OBRA', dataKey: 'numeroObra' },
      { header: 'NOMBRE OBRA', dataKey: 'nombreObra' },
      { header: 'COMUNA', dataKey: 'comuna' },
      { header: 'RUT CLIENTE', dataKey: 'rutCliente' },
      { header: 'CLIENTE', dataKey: 'cliente' },
      { header: 'ESTADO', dataKey: 'estado' }
    ]

    // Preparar los datos para la tabla
    const rows = dataToExport.map(obra => ({
      numeroObra: obra.numeroObra,
      nombreObra: obra.nombreObra,
      comuna: obra.comuna,
      rutCliente: obra.rutCliente,
      cliente: obra.cliente,
      estado: obra.estado
    }))

    // Generar la tabla
    doc.autoTable({
      startY: 35,
      head: [columns.map(col => col.header)],
      body: rows.map(row => columns.map(col => row[col.dataKey as keyof typeof row])),
      theme: 'grid',
      styles: { fontSize: 8, cellPadding: 2 },
      headStyles: { fillColor: [41, 128, 185], textColor: 255 },
      alternateRowStyles: { fillColor: [245, 245, 245] }
    })

    // Guardar el PDF
    doc.save('reporte-obras.pdf')
  }

  const handleMenuOpen = (event: React.MouseEvent<HTMLElement>, obra: Obra) => {
    event.stopPropagation()
    setAnchorEl(prev => ({
      ...prev,
      [obra.obraId]: event.currentTarget
    }))
    setSelectedObraForMenu(obra)
  }

  const handleMenuClose = () => {
    setAnchorEl({})
    setSelectedObraForMenu(null)
  }

  const handleDuplicate = async (obra: Obra) => {
    try {
      const response = await axios.post('/api/obras/duplicate', { obraId: obra.obraId })

      if (response.status === 201) {
        // Actualizar ambos estados inmediatamente
        const updatedData = [...data, response.data]

        setData(updatedData)
        setFilteredData(updatedData)

        toast.success('Obra duplicada exitosamente', {
          duration: 3000,
          position: 'top-right',
          style: {
            background: '#10B981',
            color: '#fff'
          }
        })
      }
    } catch (error) {
      console.error('Error duplicando obra:', error)
      toast.error('Error al duplicar la obra', {
        duration: 3000,
        position: 'top-right',
        style: {
          background: '#EF4444',
          color: '#fff'
        }
      })
    } finally {
      setDuplicateDialogOpen(false)
      setObraToDuplicate(null)
    }
  }

  const handleStatusChange = async (obraId: number, newStatus: string) => {
    try {
      const response = await axios.patch(`/api/obras/${obraId}/status`, { estado: newStatus })

      if (response.status === 200) {
        // Actualizar ambos estados inmediatamente
        const updatedData = data.map(obra => (obra.obraId === obraId ? { ...obra, estado: newStatus } : obra))

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
      setSelectedObraId(null)
    }
  }

  const handleContactClick = (contactos: ContactoObra[]) => {
    setSelectedContacts(contactos)
    setContactDialogOpen(true)
  }

  const handlePreview = (obra: Obra) => {
    setSelectedObra(obra)
    setPreviewDialogOpen(true)
  }

  const handleExportCSV = () => {
    try {
      // Definir las columnas del CSV
      const headers = [
        'Número Obra',
        'Nombre Obra',
        'Fecha Ingreso',
        'Estado',
        'RUT',
        'Nombre Cliente',
        'Dirección',
        'Región',
        'Comuna',
        'Razón Social',
        'Giro',
        'Teléfono Facturación',
        'Email Facturación',
        'Lista Precios'
      ]

      // Preparar los datos
      const csvData = data.map(obra => [
        obra.numeroObra,
        obra.nombreObra,
        new Date(obra.fechaIngreso).toLocaleDateString(),
        obra.estado,
        obra.rutCliente,
        obra.cliente,
        obra.direccion,
        obra.region,
        obra.comuna,
        obra.razonSocial || '',
        obra.giro || '',
        obra.telefonoFacturacion || '',
        obra.mailRecepcionFactura || '',
        obra.listaPrecios || ''
      ])

      // Convertir a formato CSV
      const csvContent = [headers.join(','), ...csvData.map(row => row.map(cell => `"${cell}"`).join(','))].join('\n')

      // Crear el blob y descargar
      const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' })
      const link = document.createElement('a')
      const url = URL.createObjectURL(blob)

      link.setAttribute('href', url)
      link.setAttribute('download', `obras_${new Date().toISOString().split('T')[0]}.csv`)
      link.style.visibility = 'hidden'

      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)

      toast.success('Archivo exportado correctamente')
    } catch (error) {
      console.error('Error al exportar:', error)
      toast.error('Error al exportar el archivo')
    }
  }

  const handleExportSingleObra = (obra: Obra) => {
    try {
      const headers = [
        'Número Obra',
        'Nombre Obra',
        'Fecha Ingreso',
        'Estado',
        'RUT',
        'Nombre Cliente',
        'Dirección',
        'Región',
        'Comuna',
        'Razón Social',
        'Giro',
        'Teléfono Facturación',
        'Email Facturación',
        'Lista Precios'
      ]

      const csvData = [
        [
          obra.numeroObra,
          obra.nombreObra,
          new Date(obra.fechaIngreso).toLocaleDateString(),
          obra.estado,
          obra.rutCliente,
          obra.cliente,
          obra.direccion,
          obra.region,
          obra.comuna,
          obra.razonSocial || '',
          obra.giro || '',
          obra.telefonoFacturacion || '',
          obra.mailRecepcionFactura || '',
          obra.listaPrecios || ''
        ]
      ]

      const csvContent = [headers.join(','), ...csvData.map(row => row.map(cell => `"${cell}"`).join(','))].join('\n')
      const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' })
      const link = document.createElement('a')
      const url = URL.createObjectURL(blob)

      link.setAttribute('href', url)
      link.setAttribute('download', `obra_${obra.numeroObra}_${new Date().toISOString().split('T')[0]}.csv`)
      link.style.visibility = 'hidden'

      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)

      toast.success('Obra exportada correctamente')
    } catch (error) {
      console.error('Error al exportar:', error)
      toast.error('Error al exportar la obra')
    }
  }

  const columns = useMemo(
    () => [
      // Columna de selección
      {
        id: 'select',
        header: ({ table }) => (
          <Checkbox
            {...{
              checked: table.getIsAllRowsSelected(),
              indeterminate: table.getIsSomeRowsSelected(),
              onChange: table.getToggleAllRowsSelectedHandler()
            }}
          />
        ),
        cell: ({ row }) => (
          <Checkbox
            {...{
              checked: row.getIsSelected(),
              disabled: !row.getCanSelect(),
              indeterminate: row.getIsSomeSelected(),
              onChange: row.getToggleSelectedHandler()
            }}
          />
        )
      },
      columnHelper.accessor('numeroObra', {
        header: 'OBRA',
        cell: ({ row }) => (
          <Typography variant='body2' className='text-[13px]'>
            {row.original.numeroObra}
          </Typography>
        )
      }),
      columnHelper.accessor('nombreObra', {
        header: 'NOMBRE OBRA',
        cell: ({ row }) => (
          <Typography variant='body2' className='text-[13px]'>
            {row.original.nombreObra}
          </Typography>
        )
      }),
      columnHelper.accessor('comuna', {
        header: 'COMUNA',
        cell: ({ row }) => (
          <Typography variant='body2' className='text-[13px]'>
            {row.original.comuna}
          </Typography>
        )
      }),
      columnHelper.accessor('rutCliente', {
        header: 'RUT CLIENTE',
        cell: ({ row }) => (
          <Typography variant='body2' className='text-[13px]'>
            {row.original.rutCliente}
          </Typography>
        )
      }),
      columnHelper.accessor('cliente', {
        header: 'CLIENTE',
        cell: ({ row }) => (
          <Typography variant='body2' className='text-[13px]'>
            {row.original.cliente}
          </Typography>
        )
      }),
      columnHelper.accessor('encargado', {
        header: 'ENCARGADO',
        cell: ({ row }) => {
          const encargado = row.original.contactos?.find(c => c.rol === 'encargado_obra')

          return (
            <Button
              variant='text'
              onClick={() => handleContactClick(row.original.contactos)}
              sx={{ textTransform: 'none' }}
            >
              {encargado?.nombre || '-'}
            </Button>
          )
        }
      }),
      columnHelper.accessor('estado', {
        header: 'ESTADO',
        cell: ({ row }) => (
          <Chip
            label={row.original.estado === 'activo' ? 'Activo' : 'Inactivo'}
            color={row.original.estado === 'activo' ? 'success' : 'error'}
            sx={{ height: 24, fontSize: '0.75rem' }}
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
              color='warning'
              onClick={() => {
                setObraToDuplicate(row.original)
                setDuplicateDialogOpen(true)
              }}
              sx={{
                '&:hover': {
                  backgroundColor: 'warning.light'
                }
              }}
            >
              <i className='ri-file-copy-line' style={{ fontSize: '1.25rem' }} />
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
                      setSelectedObraId(row.original.obraId)
                      setSelectedStatus(row.original.estado)
                      setChangeStatusOpen(true)
                    }
                  }
                },
                {
                  text: 'Eliminar',
                  icon: 'ri-delete-bin-line',
                  menuItemProps: {
                    onClick: () => handleDeleteClick(row.original.obraId)
                  }
                }
              ]}
            />
          </Box>
        )
      }
    ],
    [handleEdit, handlePreview, handleDeleteClick]
  )

  const table = useReactTable({
    data: filteredData as ObraType[],
    columns,
    filterFns: {
      fuzzy: fuzzyFilter
    },
    state: {
      rowSelection,
      globalFilter
    },
    initialState: {
      pagination: {
        pageSize: 10
      }
    },
    enableRowSelection: true, //enable row selection for all rows
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

  const getAvatar = (params: Pick<UsersType, 'avatar' | 'fullName'>) => {
    const { avatar, fullName } = params

    if (avatar) {
      return <CustomAvatar src={avatar} skin='light' size={34} />
    } else {
      return (
        <CustomAvatar skin='light' size={34}>
          {getInitials(fullName as string)}
        </CustomAvatar>
      )
    }
  }

  const renderClient = (row: ObraType) => {
    return (
      <div className='flex items-center'>
        {row.cliente ? getInitials(row.cliente) : ''}
        <div className='flex flex-col'>
          <Typography className='font-medium' color='text.primary'>
            {row.cliente}
          </Typography>
        </div>
      </div>
    )
  }

  return (
    <>
      <Card>
        <CardHeader
          title={<Typography variant='h6'>Obras</Typography>}
          action={
            <Button
              variant='contained'
              onClick={() => setAddObraOpen(true)}
              startIcon={<i className='ri-add-line' />}
              sx={{ borderRadius: '5px' }}
            >
              Nueva Obra
            </Button>
          }
        />

        <TableFilters workData={data} setFilteredData={setFilteredData} estados={ESTADOS_OBRA} />
        <Divider />
        <div className='flex justify-between p-5 gap-4 flex-col items-start sm:flex-row sm:items-center'>
          <Button
            variant='outlined'
            onClick={() => {
              const selectedRows = table.getSelectedRowModel().rows

              const dataToExport = selectedRows.length > 0 ? selectedRows.map(row => row.original) : data

              handleExportCSV(dataToExport)
            }}
            startIcon={<i className='ri-download-2-line' />}
          >
            Exportar CSV{' '}
            {table.getSelectedRowModel().rows.length > 0 ? `(${table.getSelectedRowModel().rows.length})` : ''}
          </Button>
          <div className='flex items-center gap-x-4 gap-4 flex-col max-sm:is-full sm:flex-row'>
            <DebouncedInput
              value={globalFilter ?? ''}
              onChange={value => setGlobalFilter(String(value))}
              placeholder='Buscar' // Ajusté el texto a "Buscar" como en la imagen
              style={{ width: '500px' }}
              className='max-sm:is-full min-is-[200px]'
              InputProps={{
                startAdornment: (
                  <InputAdornment position='start'>
                    <i className='ri-search-line' /> {/* Icono de búsqueda */}
                  </InputAdornment>
                ),
                sx: {
                  padding: '8px', // Ajustamos el relleno para hacerlo más amplio
                  borderRadius: '8px', // Borde redondeado similar a la imagen
                  border: '1px solid #E0E0E0' // Color suave para el borde
                }
              }}
            />
          </div>
        </div>
        {isLoading ? (
          <div className='flex justify-center p-5'>
            <CircularProgress />
          </div>
        ) : (
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
              {table.getFilteredRowModel().rows.length === 0 ? (
                <tbody>
                  <tr>
                    <td colSpan={table.getVisibleFlatColumns().length} className='text-center'>
                      No hay datos disponibles
                    </td>
                  </tr>
                </tbody>
              ) : (
                <tbody>
                  {table
                    .getRowModel()
                    .rows.slice(0, table.getState().pagination.pageSize)
                    .map(row => {
                      return (
                        <tr key={row.id} className={classnames({ selected: row.getIsSelected() })}>
                          {row.getVisibleCells().map(cell => (
                            <td key={cell.id}>{flexRender(cell.column.columnDef.cell, cell.getContext())}</td>
                          ))}
                        </tr>
                      )
                    })}
                </tbody>
              )}
            </table>
          </div>
        )}
        <TablePagination
          rowsPerPageOptions={[10, 25, 50]}
          component='div'
          className='border-bs'
          count={table.getFilteredRowModel().rows.length}
          rowsPerPage={table.getState().pagination.pageSize}
          page={table.getState().pagination.pageIndex}
          SelectProps={{
            inputProps: { 'aria-label': 'rows per page' }
          }}
          onPageChange={(_, page) => {
            table.setPageIndex(page)
          }}
          onRowsPerPageChange={e => table.setPageSize(Number(e.target.value))}
        />
      </Card>
      <AddWork
        open={addObraOpen}
        handleClose={() => setAddObraOpen(false)}
        setData={setData}
        setFilteredData={setFilteredData}
      />
      <EditWorksForm
        open={editObraOpen}
        handleClose={() => {
          setEditObraOpen(false)
          setSelectedObra(null)
        }}
        obraData={selectedObra}
        setData={setData}
      />
      <Dialog open={deleteDialogOpen} onClose={() => setDeleteDialogOpen(false)}>
        <DialogTitle>Confirmar eliminación</DialogTitle>
        <DialogContent>¿Está seguro que desea eliminar esta obra? Esta acción no se puede deshacer.</DialogContent>
        <DialogActions>
          <Button onClick={() => setDeleteDialogOpen(false)} color='primary'>
            Cancelar
          </Button>
          <Button onClick={handleDeleteConfirm} color='error' variant='contained'>
            Eliminar
          </Button>
        </DialogActions>
      </Dialog>
      <Dialog open={duplicateDialogOpen} onClose={() => setDuplicateDialogOpen(false)} maxWidth='sm' fullWidth>
        <DialogTitle>Duplicar Obra</DialogTitle>
        <DialogContent>¿Está seguro que desea duplicar la obra {obraToDuplicate?.nombreObra}?</DialogContent>
        <DialogActions>
          <Button variant='outlined' color='secondary' onClick={() => setDuplicateDialogOpen(false)}>
            Cancelar
          </Button>
          <Button variant='contained' onClick={() => obraToDuplicate && handleDuplicate(obraToDuplicate)}>
            Duplicar
          </Button>
        </DialogActions>
      </Dialog>
      <ViewContactsDialog
        open={viewContactsOpen}
        onClose={() => setViewContactsOpen(false)}
        contacts={selectedContacts}
      />
      <Dialog open={changeStatusOpen} onClose={() => setChangeStatusOpen(false)} maxWidth='xs' fullWidth>
        <DialogTitle>Editar Estado</DialogTitle>
        <DialogContent>
          <FormControl fullWidth sx={{ mt: 2 }}>
            <Select value={selectedStatus} onChange={e => setSelectedStatus(e.target.value)} displayEmpty>
              {ESTADOS_OBRA.map(estado => (
                <MenuItem key={estado} value={estado}>
                  {estado}
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
            onClick={() => selectedObraId && handleStatusChange(selectedObraId, selectedStatus)}
          >
            Aceptar
          </Button>
        </DialogActions>
      </Dialog>
      <Dialog open={previewDialogOpen} onClose={() => setPreviewDialogOpen(false)} maxWidth='lg' fullWidth>
        <DialogTitle>Detalles de la Obra</DialogTitle>
        <DialogContent>
          <WorkPreview obra={selectedObra} />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setPreviewDialogOpen(false)} variant='contained'>
            Cerrar
          </Button>
        </DialogActions>
      </Dialog>
      <Dialog open={contactDialogOpen} onClose={() => setContactDialogOpen(false)} maxWidth='md' fullWidth>
        <DialogTitle>Encargado de Obra</DialogTitle>
        <DialogContent>
          <table className='min-w-full divide-y divide-gray-200'>
            <thead>
              <tr>
                <th className='py-3 px-4 text-left text-xs font-normal text-gray-500'>NOMBRE</th>
                <th className='py-3 px-4 text-left text-xs font-normal text-gray-500'>CARGO</th>
                <th className='py-3 px-4 text-left text-xs font-normal text-gray-500'>EMAIL</th>
                <th className='py-3 px-4 text-left text-xs font-normal text-gray-500'>TELÉFONO</th>
              </tr>
            </thead>
            <tbody className='divide-y divide-gray-200'>
              {selectedContacts?.map(contact => (
                <tr key={contact.id} className='hover:bg-gray-50'>
                  <td className='py-3 px-4'>{contact.nombre}</td>
                  <td className='py-3 px-4'>{contact.rol}</td>
                  <td className='py-3 px-4'>{contact.email}</td>
                  <td className='py-3 px-4'>{contact.telefono1}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setContactDialogOpen(false)} variant='contained'>
            Cerrar
          </Button>
        </DialogActions>
      </Dialog>
    </>
  )
}

export default WorkListTable
