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
import Alert from '@mui/material/Alert'

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
const columnHelper = createColumnHelper<Obra>()

const WorkListTable = () => {
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [rowSelection, setRowSelection] = useState<Record<string, boolean>>({})
  const [data, setData] = useState<Obra[]>([])
  const [filteredData, setFilteredData] = useState<Obra[]>([])
  const [globalFilter, setGlobalFilter] = useState('')
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

  useEffect(() => {
    const fetchObras = async () => {
      try {
        setLoading(true)
        setError(null)

        const response = await fetch('/api/obras')

        if (!response.ok) throw new Error('Error al cargar las obras')

        const responseData = await response.json()

        console.log('Datos recibidos:', responseData)

        if (Array.isArray(responseData)) {
          setData(responseData)
          setFilteredData(responseData)
        } else {
          console.error('Respuesta inesperada:', responseData)
          setError('Error al cargar los datos')
        }
      } catch (error) {
        console.error('Error:', error)
        setError('Error al cargar las obras')
      } finally {
        setLoading(false)
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

  const exportToPDF = () => {
    try {
      const doc = new jsPDF('p', 'mm', 'a4')

      // Obtener las obras seleccionadas
      const selectedRows = table.getSelectedRowModel().rows
      const obrasToExport = selectedRows.length > 0 ? selectedRows.map(row => row.original) : [data[0]] // Si no hay selección, exportar la primera obra

      obrasToExport.forEach((obra, index) => {
        // Agregar nueva página para cada obra excepto la primera
        if (index > 0) {
          doc.addPage()
        }

        // Título de la obra
        doc.setFontSize(16)
        doc.text(`Obra: ${obra.nombreObra}`, 14, 20)

        // Información básica
        doc.setFontSize(12)
        doc.text('Información General', 14, 30)

        const infoGeneral = [
          ['Número de Obra', obra.numeroObra],
          ['Fecha Ingreso', new Date(obra.fechaIngreso).toLocaleDateString()],
          ['Estado', obra.estado],
          ['Sector', obra.sector || '-'],
          ['Georreferencia', obra.georreferencia || '-'],
          ['Referencia', obra.referencia || '-']
        ]

        doc.autoTable({
          startY: 35,
          head: [],
          body: infoGeneral,
          theme: 'plain',
          styles: { fontSize: 10 }
        })

        // Información del Cliente
        doc.text('Información del Cliente', 14, doc.lastAutoTable.finalY + 10)

        const infoCliente = [
          ['RUT', obra.rut],
          ['Razón Social', obra.razonSocial],
          ['Nombre Cliente', obra.nombreCliente],
          ['Dirección', obra.direccion],
          ['Región', obra.region],
          ['Comuna', obra.comuna]
        ]

        doc.autoTable({
          startY: doc.lastAutoTable.finalY + 15,
          head: [],
          body: infoCliente,
          theme: 'plain',
          styles: { fontSize: 10 }
        })

        // Facturación
        doc.text('Información de Facturación', 14, doc.lastAutoTable.finalY + 10)

        const infoFacturacion = [
          ['Dirección Comercial', obra.direccionComercial || '-'],
          ['Comuna Facturación', obra.comunaFacturacion || '-'],
          ['Teléfono', obra.telefonoFacturacion || '-'],
          ['Lista de Precios', obra.listaPrecios || '-'],
          ['Email Facturación', obra.mailRecepcionFactura || '-']
        ]

        doc.autoTable({
          startY: doc.lastAutoTable.finalY + 15,
          head: [],
          body: infoFacturacion,
          theme: 'plain',
          styles: { fontSize: 10 }
        })

        // Requisitos
        doc.text('Requisitos', 14, doc.lastAutoTable.finalY + 10)

        const requisitos = [
          ['Acreditación Personal', obra.acreditacionPersonal ? 'Sí' : 'No'],
          ['Especificaciones Técnicas', obra.especificacionesTecnicas ? 'Sí' : 'No'],
          ['Acreditación Equipos', obra.acreditacionEquipos ? 'Sí' : 'No'],
          ['Carta Compromiso', obra.cartaCompromiso ? 'Sí' : 'No'],
          ['Mandato SERVIU', obra.mandatoServiu ? 'Sí' : 'No'],
          ['Otros Requisitos', obra.otrosRequisitos || '-']
        ]

        doc.autoTable({
          startY: doc.lastAutoTable.finalY + 15,
          head: [],
          body: requisitos,
          theme: 'plain',
          styles: { fontSize: 10 }
        })

        // Contactos
        if (obra.contactos && obra.contactos.length > 0) {
          doc.text('Contactos', 14, doc.lastAutoTable.finalY + 10)
          const contactosHeaders = [['Rol', 'Nombre', 'Email', 'Teléfono']]

          const contactosData = obra.contactos.map(contacto => [
            contacto.rol,
            contacto.nombre,
            contacto.email || '-',
            contacto.telefono1 || '-'
          ])

          doc.autoTable({
            startY: doc.lastAutoTable.finalY + 15,
            head: contactosHeaders,
            body: contactosData,
            theme: 'striped',
            styles: { fontSize: 10 }
          })
        }
      })

      // Guardar el PDF
      doc.save(`obra-${obrasToExport[0].numeroObra}.pdf`)
      toast.success('PDF generado exitosamente')
    } catch (error) {
      console.error('Error al generar PDF:', error)
      toast.error('Error al generar el PDF')
    }
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

  const handleChangeStatusClick = (obra: Obra) => {
    setSelectedObra(obra)
    setSelectedStatus(obra.estado)
    setChangeStatusOpen(true)
  }

  const handleStatusChange = async () => {
    if (!selectedObra) return

    try {
      const response = await fetch(`/api/obras/${selectedObra.obraId}/status`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ estado: selectedStatus })
      })

      if (!response.ok) throw new Error('Error al actualizar el estado')

      // Actualizar el estado local de forma optimista
      const updatedData = data.map(obra =>
        obra.obraId === selectedObra.obraId
          ? {
              ...obra,
              estado: selectedStatus
            }
          : obra
      )

      setData(updatedData)
      setFilteredData(updatedData)

      toast.success('Estado actualizado correctamente')
    } catch (error) {
      console.error('Error:', error)
      toast.error('Error al actualizar el estado')
    } finally {
      setChangeStatusOpen(false)
      setSelectedObra(null)
      setSelectedStatus('')
    }
  }

  const handleContactClick = (contacts: ContactoObra[]) => {
    setSelectedContacts(contacts)
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

  const columns = useMemo<ColumnDef<Obra>[]>(
    () => [
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
        cell: ({ row }) => row.original.numeroObra
      }),
      columnHelper.accessor('nombreObra', {
        header: 'NOMBRE OBRA',
        cell: ({ row }) => row.original.nombreObra
      }),
      columnHelper.accessor('comuna', {
        header: 'COMUNA',
        cell: ({ row }) => row.original.comuna
      }),
      columnHelper.accessor('rutCliente', {
        header: 'RUT CLIENTE',
        cell: ({ row }) => row.original.rutCliente
      }),
      columnHelper.accessor('cliente', {
        header: 'CLIENTE',
        cell: ({ row }) => row.original.nombreCliente
      }),
      columnHelper.accessor(
        row => {
          const encargado = row.ContactoObra?.find(c => c.isPrincipal)

          return encargado?.nombre || '-'
        },
        {
          id: 'encargado',
          header: 'ENCARGADO',
          cell: ({ row }) => {
            const contactos = row.original.ContactoObra

            if (!contactos?.length) return '-'

            return (
              <div className='cursor-pointer hover:text-primary' onClick={() => handleContactClick(contactos)}>
                {contactos.find(c => c.isPrincipal)?.nombre || '-'}
              </div>
            )
          }
        }
      ),
      columnHelper.accessor('estado', {
        header: 'ESTADO',
        cell: ({ row }) => (
          <Chip
            label={row.original.estado}
            color={row.original.estado.toLowerCase() === 'activo' ? 'success' : 'error'}
            sx={{
              '& .MuiChip-label': { textTransform: 'capitalize' }
            }}
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
              sx={{ '&:hover': { backgroundColor: 'info.light' } }}
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
              sx={{ '&:hover': { backgroundColor: 'warning.light' } }}
            >
              <i className='ri-file-copy-line' style={{ fontSize: '1.25rem' }} />
            </IconButton>
            <IconButton
              size='small'
              color='primary'
              onClick={() => handleEdit(row.original)}
              sx={{ '&:hover': { backgroundColor: 'primary.light' } }}
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
                    onClick: () => handleChangeStatusClick(row.original)
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
    [handleEdit, handlePreview, handleDeleteClick, handleChangeStatusClick]
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
    enableRowSelection: true,
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

  const exportButton = () => {
    return (
      <Button
        color='secondary'
        variant='outlined'
        startIcon={<i className='ri-file-download-line' />}
        onClick={exportToPDF}
        disabled={!table.getSelectedRowModel().rows.length} // Deshabilitar si no hay filas seleccionadas
      >
        Exportar a PDF
      </Button>
    )
  }

  if (error) {
    return (
      <Alert severity='error' sx={{ mb: 4 }}>
        {error}
      </Alert>
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
          {exportButton()}
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
        {loading ? (
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
      <Dialog open={changeStatusOpen} onClose={() => setChangeStatusOpen(false)}>
        <DialogTitle>Cambiar Estado</DialogTitle>
        <DialogContent>
          <FormControl fullWidth sx={{ mt: 2 }}>
            <InputLabel>Estado</InputLabel>
            <Select value={selectedStatus} label='Estado' onChange={e => setSelectedStatus(e.target.value)}>
              <MenuItem value='activo'>Activo</MenuItem>
              <MenuItem value='inactivo'>Inactivo</MenuItem>
            </Select>
          </FormControl>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setChangeStatusOpen(false)}>Cancelar</Button>
          <Button onClick={handleStatusChange} variant='contained'>
            Guardar
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
