'use client'

// React Imports
import { useEffect, useState, useMemo } from 'react'

// MUI Imports
import Card from '@mui/material/Card'
import CardHeader from '@mui/material/CardHeader'
import Divider from '@mui/material/Divider'
import Button from '@mui/material/Button'
import TextField from '@mui/material/TextField'
import Typography from '@mui/material/Typography'
import Checkbox from '@mui/material/Checkbox'
import IconButton from '@mui/material/IconButton'
import TablePagination from '@mui/material/TablePagination'
import Dialog from '@mui/material/Dialog'
import DialogActions from '@mui/material/DialogActions'
import DialogContent from '@mui/material/DialogContent'
import DialogContentText from '@mui/material/DialogContentText'
import DialogTitle from '@mui/material/DialogTitle'
import InputAdornment from '@mui/material/InputAdornment'
import Box from '@mui/material/Box'

// Third-party Imports
import { toast } from 'react-hot-toast'
import classnames from 'classnames'
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
import { rankItem } from '@tanstack/match-sorter-utils'

// Type Imports
import type { ContactType } from '@/types/apps/contactTypes'

// Component Imports
import AddContact from './AddContact'
import EditContact from '../edit/EditContact'
import ContactPreview from '../preview/ContactPreview'

// Style Imports
import tableStyles from '@core/styles/table.module.css'

// Imports para permisos - NUEVO
import { usePermissions } from '@/hooks/usePermissions'
import { permisos } from '@/permisos/permisos'

type ContactTypeWithAction = ContactType & {
  action?: string
}

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

// Column Definitions
const columnHelper = createColumnHelper<ContactTypeWithAction>()

// Agregar los roles de contacto para mostrar el label legible
const ROLES_CONTACTO = [
  { value: 'encargado_obra', label: 'Encargado de Obra' },
  { value: 'dueno', label: 'Dueño' },
  { value: 'representante', label: 'Representante' },
  { value: 'jefe_obra_planta', label: 'Jefe de Obra / Planta' },
  { value: 'supervisor', label: 'Supervisor' },
  { value: 'administrador_obra', label: 'Administrador de Obra' },
  { value: 'encargado_calidad', label: 'Encargado de Calidad' },
  { value: 'autocontrol', label: 'Autocontrol' },
  { value: 'profesional', label: 'Profesional' },
  { value: 'laboratorista', label: 'Laboratorista' },
  { value: 'ejecutivo_comercial', label: 'Ejecutivo Comercial y Administración' },
  { value: 'otro', label: 'Otro' }
]

interface ContactListTableProps {
  data: ContactType[]
}

const ContactListTable = ({ data: initialData }: ContactListTableProps) => {
  // States
  const [addUserOpen, setAddUserOpen] = useState(false)
  const [rowSelection, setRowSelection] = useState({})
  const [data, setData] = useState<ContactType[]>(initialData)
  const [filteredData, setFilteredData] = useState(data)
  const [globalFilter, setGlobalFilter] = useState('')
  const [isDeleteLoading, setIsDeleteLoading] = useState(false)
  const [openDialog, setOpenDialog] = useState(false)
  const [selectedContact, setSelectedContact] = useState<ContactType | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [editContactOpen, setEditContactOpen] = useState(false)
  const [previewOpen, setPreviewOpen] = useState(false)
  const [selectedContactPreview, setSelectedContactPreview] = useState<ContactType | null>(null)
  const [dialogTitle, setDialogTitle] = useState('')
  const [dialogMessage, setDialogMessage] = useState('')
  const [dialogAction, setDialogAction] = useState<'activate' | 'deactivate'>('deactivate')
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false)
  const [contactToDelete, setContactToDelete] = useState<ContactType | null>(null)

  useEffect(() => {
    setData(initialData)
    setFilteredData(initialData)
  }, [initialData])

    // Hook de permisos
  const { hasPermission } = usePermissions()
  
  // Verificar si el usuario solo tiene permisos de lectura
  const soloLectura =
    hasPermission(permisos.empresa.ver) &&
    !hasPermission(permisos.empresa.crear) &&
    !hasPermission(permisos.empresa.editar) &&
    !hasPermission(permisos.empresa.eliminar)

  const handleToggleStatus = async () => {
    try {
      if (!selectedContact) return
      setIsDeleteLoading(true)

      const newStatus: 'ACTIVO' | 'INACTIVO' = selectedContact.estado === 'ACTIVO' ? 'INACTIVO' : 'ACTIVO'

      const response = await fetch(`/api/contacts/${selectedContact.contactId}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ estado: newStatus })
      })

      if (!response.ok) {
        const errorData = await response.text()

        console.error('Error response:', errorData)
        throw new Error('Error al actualizar el estado del contacto')
      }

      // Actualizar el estado en la tabla
      const newData = data.map(contact =>
        contact.contactId === selectedContact.contactId ? { ...contact, estado: newStatus } : contact
      )

      setData(newData)
      setFilteredData(newData)

      toast.success(`Contacto ${newStatus === 'ACTIVO' ? 'activado' : 'desactivado'} exitosamente`)
      handleCloseDialog()
    } catch (error: any) {
      console.error('Error completo:', error)
      toast.error(error.message || 'Error al actualizar el estado del contacto')
    } finally {
      setIsDeleteLoading(false)
    }
  }

  const handleClickOpenDialog = (contact: ContactType) => {
    setSelectedContact(contact)
    const isActive = contact.estado === 'ACTIVO'

    setDialogAction(isActive ? 'deactivate' : 'activate')
    setDialogTitle(isActive ? 'Desactivar Contacto' : 'Activar Contacto')
    setDialogMessage(`¿Está seguro que desea ${isActive ? 'desactivar' : 'activar'} este contacto?`)
    setOpenDialog(true)
  }

  const fetchContacts = async () => {
    try {
      setIsLoading(true)

      // Por ahora solo obtenemos contactos
      const contactosResponse = await fetch('/api/contacts?incluirInactivos=true')

      if (!contactosResponse.ok) {
        console.error('Status contactos:', contactosResponse.status)
        setData([])
        setFilteredData([])
        throw new Error('Error al cargar los datos')
      }

      const contactosDirectos = await contactosResponse.json()

      if (!Array.isArray(contactosDirectos)) {
        console.error('Formato de respuesta inválido:', { contactosDirectos })
        setData([])
        setFilteredData([])
        throw new Error('Formato de datos inválido')
      }

      // Por ahora no procesamos contactos de clientes
      setData(contactosDirectos)
      setFilteredData(contactosDirectos)
    } catch (error: any) {
      console.error('Error completo:', error)
      setData([])
      setFilteredData([])
      toast.error(error.message || 'Error al cargar contactos')
    } finally {
      setIsLoading(false)
    }
  }

  const handleCloseDialog = () => {
    setOpenDialog(false)
  }

  const handleEditContact = (contact: ContactType) => {
    setSelectedContact(contact)
    setEditContactOpen(true)
  }

  const handlePreviewContact = (contact: ContactType) => {
    setSelectedContactPreview(contact)
    setPreviewOpen(true)
  }

  const handleExportContacts = (contactsToExport: ContactType[]) => {
    try {
      const headers = ['NOMBRE', 'CARGO', 'EMAIL', 'TELÉFONO 1', 'TELÉFONO 2', 'ESTADO']

      const csvData = contactsToExport.map(contact => [
        contact.nombre,
        contact.cargo,
        contact.email,
        contact.telefono1,
        contact.telefono2 || '',
        contact.estado
      ])

      const csvContent = [headers.join(','), ...csvData.map(row => row.map(cell => `"${cell}"`).join(','))].join('\n')
      const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' })
      const link = document.createElement('a')
      const url = URL.createObjectURL(blob)

      link.setAttribute('href', url)
      link.setAttribute('download', `contactos_${new Date().toISOString().split('T')[0]}.csv`)
      link.style.visibility = 'hidden'

      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)

      toast.success('Contactos exportados correctamente')
    } catch (error) {
      console.error('Error al exportar:', error)
      toast.error('Error al exportar los contactos')
    }
  }

  const handleDeleteContact = async () => {
    if (!contactToDelete) return
    setIsDeleteLoading(true)

    try {
      const response = await fetch(`/api/contacts/${contactToDelete.contactId}`, {
        method: 'DELETE'
      })

      if (!response.ok) {
        throw new Error('Error al eliminar el contacto')
      }

      toast.success('Contacto eliminado correctamente')

      // Actualizar la tabla quitando el contacto eliminado
      const newData = data.filter(contact => contact.contactId !== contactToDelete.contactId) as ContactType[]

      setData(newData)
      setFilteredData(newData)
      setDeleteDialogOpen(false)
      setContactToDelete(null)
    } catch (error: any) {
      toast.error(error.message || 'Error al eliminar el contacto')
    } finally {
      setIsDeleteLoading(false)
    }
  }

  const columns = useMemo<ColumnDef<ContactType, any>[]>(
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
      columnHelper.accessor('contactId', {
        header: 'ID',
        cell: ({ row }: { row: any }) => <Typography>{row.original.contactId}</Typography>
      }),
      columnHelper.accessor('nombre', {
        header: 'NOMBRE',
        cell: ({ row }: { row: any }) => <Typography>{row.original.nombre}</Typography>
      }),
      columnHelper.accessor('cargo', {
        header: 'CARGO',
        cell: ({ row }: { row: any }) => {
          const cargoValue = row.original.cargo
          const cargoLabel = ROLES_CONTACTO.find(r => r.value === cargoValue)?.label || cargoValue || 'Sin cargo'

          return <Typography>{cargoLabel}</Typography>
        }
      }),
      columnHelper.accessor('email', {
        header: 'EMAIL',
        cell: ({ row }: { row: any }) => <Typography>{row.original.email}</Typography>
      }),
      columnHelper.accessor('telefono1', {
        header: 'TELÉFONO 1',
        cell: ({ row }: { row: any }) => <Typography>{row.original.telefono1}</Typography>
      }),
      columnHelper.accessor('telefono2', {
        header: 'TELÉFONO 2',
        cell: ({ row }: { row: any }) => <Typography>{row.original.telefono2}</Typography>
      }),
      columnHelper.accessor('estado', {
        header: 'ESTADO',
        cell: ({ row }) => (
          <Box
            sx={{
              backgroundColor: row.original.estado === 'ACTIVO' ? 'success.main' : 'error.main',
              color: 'white',
              px: 2,
              py: 0.5,
              borderRadius: 1,
              display: 'inline-block',
              fontSize: '0.875rem'
            }}
          >
            {row.original.estado}
          </Box>
        )
      }),
      {
        id: 'actions',
        header: 'ACCIONES',
        cell: ({ row }: { row: any }) => (
          <Box sx={{ display: 'flex', gap: 2, alignItems: 'center' , disabled: soloLectura }}>
            <IconButton disabled={soloLectura} color='info' onClick={() => handlePreviewContact(row.original)}>
              <i className='ri-eye-line' />
            </IconButton>
            <IconButton disabled={soloLectura} color='primary' onClick={() => handleEditContact(row.original)}>
              <i className='ri-edit-line' />
            </IconButton>
            <IconButton
              disabled={soloLectura}
              color={row.original.estado === 'ACTIVO' ? 'error' : 'success'}
              onClick={() => handleClickOpenDialog(row.original)}
            >
              <i className={row.original.estado === 'ACTIVO' ? 'ri-close-circle-line' : 'ri-checkbox-circle-line'} />
            </IconButton>
            {/* <IconButton
              color='error'
              onClick={() => {
                setContactToDelete(row.original)
                setDeleteDialogOpen(true)
              }}
            >
              <i className='ri-delete-bin-line' />
            </IconButton> */}
          </Box>
        )
      }
    ],
    []
  )

  useEffect(() => {
    fetchContacts()
  }, [])

  const table = useReactTable({
    data: filteredData as ContactType[],
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
      },
      sorting: [
        {
          id: 'contactId',
          desc: true
        }
      ]
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

  return (
    <>
      <Card>
        <CardHeader
          title={<span className='text-xl'>Contactos</span>}
          action={
            <Button disabled={soloLectura} variant='contained' onClick={() => setAddUserOpen(!addUserOpen)} className='max-sm:is-full'>
              + Nuevo Contacto
            </Button>
          }
        />
        <Divider />
        <div className='flex justify-between p-5 gap-4 flex-col items-start sm:flex-row sm:items-center'>
          <Button
            disabled={soloLectura}
            color='secondary'
            variant='outlined'
            startIcon={<i className='ri-upload-2-line text-xl' />}
            className='max-sm:is-full'
            onClick={() => {
              const selectedRows = table.getSelectedRowModel().rows

              const dataToExport = selectedRows.length > 0 ? selectedRows.map(row => row.original) : data

              handleExportContacts(dataToExport)
            }}
          >
            Exportar CSV{' '}
            {table.getSelectedRowModel().rows.length > 0 ? `(${table.getSelectedRowModel().rows.length})` : ''}
          </Button>
          <div className='flex items-center gap-x-4 gap-4 flex-col max-sm:is-full sm:flex-row'>
            <TextField
              size='small'
              value={globalFilter ?? ''}
              onChange={e => setGlobalFilter(String(e.target.value))}
              placeholder='Buscar Contacto'
              style={{ width: '250px' }}
              className='max-sm:is-full min-is-[200px]'
              InputProps={{
                startAdornment: (
                  <InputAdornment position='start'>
                    <i className='ri-search-line text-xl' />
                  </InputAdornment>
                )
              }}
            />
          </div>
        </div>
        {isLoading ? (
          <div className='flex items-center justify-center' style={{ minHeight: '400px' }}>
            <i className='ri-loader-4-line text-primary text-4xl animate-spin' />
          </div>
        ) : filteredData.length === 0 ? (
          <div className='flex items-center justify-center' style={{ minHeight: '400px' }}>
            <Typography color='textSecondary'>No hay datos disponibles</Typography>
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
                      No data available
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
          className='border-t'
          count={table.getFilteredRowModel().rows.length}
          rowsPerPage={table.getState().pagination.pageSize}
          page={table.getState().pagination.pageIndex}
          SelectProps={{
            inputProps: { 'aria-label': 'rows per page' }
          }}
          onPageChange={(_, page) => table.setPageIndex(page)}
          onRowsPerPageChange={e => table.setPageSize(Number(e.target.value))}
        />
      </Card>
      <AddContact
        open={addUserOpen}
        handleClose={() => setAddUserOpen(!addUserOpen)}
        onContactCreated={(newContact) => {
          const updatedData = [...data, newContact]
          setData(updatedData)
          setFilteredData(updatedData)
        }}
      />
      <Dialog
        open={openDialog}
        onClose={handleCloseDialog}
        aria-labelledby='alert-dialog-title'
        aria-describedby='alert-dialog-description'
      >
        <DialogTitle id='alert-dialog-title'>{dialogTitle}</DialogTitle>
        <DialogContent>
          <DialogContentText id='alert-dialog-description'>{dialogMessage}</DialogContentText>
        </DialogContent>
        <DialogActions>
          <Button disabled={soloLectura} onClick={handleCloseDialog} variant='outlined' color='secondary'>
            Cancelar
          </Button>
          <Button
            onClick={handleToggleStatus}
            variant='contained'
            color={dialogAction === 'activate' ? 'success' : 'error'}
            autoFocus
            disabled={isDeleteLoading || soloLectura}
            startIcon={isDeleteLoading && <i className='ri-loader-4-line animate-spin' />}
          >
            {dialogAction === 'activate' ? 'Activar' : 'Desactivar'}
          </Button>
        </DialogActions>
      </Dialog>
      <EditContact
        open={editContactOpen}
        contact={selectedContact}
        handleClose={() => {
          setEditContactOpen(false)
          setSelectedContact(null)
        }}
        setData={setData}
        setFilteredData={setFilteredData}
      />
      <ContactPreview
        open={previewOpen}
        contact={selectedContactPreview}
        handleClose={() => {
          setPreviewOpen(false)
          setSelectedContactPreview(null)
        }}
      />
      {/* <Dialog
        open={deleteDialogOpen}
        onClose={() => setDeleteDialogOpen(false)}
        aria-labelledby='delete-dialog-title'
        aria-describedby='delete-dialog-description'
      >
        <DialogTitle id='delete-dialog-title'>Eliminar Contacto</DialogTitle>
        <DialogContent>
          <DialogContentText id='delete-dialog-description'>
            ¿Está seguro que desea eliminar este contacto? Esta acción no se puede deshacer.
          </DialogContentText>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDeleteDialogOpen(false)} variant='outlined' color='secondary'>
            Cancelar
          </Button>
          <Button
            onClick={handleDeleteContact}
            variant='contained'
            color='error'
            autoFocus
            disabled={isDeleteLoading}
            startIcon={isDeleteLoading && <i className='ri-loader-4-line animate-spin' />}
          >
            Eliminar
          </Button>
        </DialogActions>
      </Dialog> */}
    </>
  )
}

export default ContactListTable
