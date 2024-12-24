'use client'

// React Imports
import { useEffect, useState, useMemo } from 'react'
import { toast } from 'react-hot-toast'

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
import Dialog from '@mui/material/Dialog'
import DialogActions from '@mui/material/DialogActions'
import DialogContent from '@mui/material/DialogContent'
import DialogContentText from '@mui/material/DialogContentText'
import DialogTitle from '@mui/material/DialogTitle'
import type { TextFieldProps } from '@mui/material/TextField'
import InputAdornment from '@mui/material/InputAdornment'
import Box from '@mui/material/Box'
import EditIcon from '@mui/icons-material/Edit'
import DeleteIcon from '@mui/icons-material/Delete'

// DatePicker Imports
import 'react-datepicker/dist/react-datepicker.css'

// Third-party Imports
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

// Type Imports
import type { ThemeColor } from '@core/types'
import type { ContactType } from '@/types/apps/contactTypes'
import type { Locale } from '@configs/i18n'

// Component Imports
import AddContact from './AddContact'
import OptionMenu from '@core/components/option-menu'
import EditContact from '../edit/EditContact'

// Util Imports
import { getLocalizedUrl } from '@/utils/i18n'

// Style Imports
import tableStyles from '@core/styles/table.module.css'

declare module '@tanstack/table-core' {
  interface FilterFns {
    fuzzy: FilterFn<unknown>
  }
  interface FilterMeta {
    itemRank: RankingInfo
  }
}

type ContactTypeWithAction = ContactType & {
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

// Column Definitions
const columnHelper = createColumnHelper<ContactTypeWithAction>()

const ContactsListTable = () => {
  // States
  const [addUserOpen, setAddUserOpen] = useState(false)
  const [rowSelection, setRowSelection] = useState({})
  const [data, setData] = useState<ContactType[]>([])
  const [filteredData, setFilteredData] = useState(data)
  const [globalFilter, setGlobalFilter] = useState('')
  const [isDeleteLoading, setIsDeleteLoading] = useState(false)
  const [openDialog, setOpenDialog] = useState(false)
  const [selectedContact, setSelectedContact] = useState<ContactType | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [editContactOpen, setEditContactOpen] = useState(false)

  // Hooks
  const params = useParams()
  const locale = params?.lang as string || 'es'

  const handleClickOpenDialog = (contact: ContactTypeWithAction) => {
    setSelectedContact(contact)
    setOpenDialog(true)
  }

  const fetchContacts = async () => {
    try {
      setIsLoading(true)
      const response = await fetch('/api/contactos')
      if (!response.ok) throw new Error('Error al cargar contactos')
      const contacts = await response.json()
      setData(contacts)
      setFilteredData(contacts)
    } catch (error: any) {
      toast.error(error.message || 'Error al cargar contactos')
    } finally {
      setIsLoading(false)
    }
  }

  const handleDeleteContact = async () => {
    try {
      if (!selectedContact) return
      setIsDeleteLoading(true)
      
      const response = await fetch(`/api/contactos/${selectedContact.contactId}`, {
        method: 'DELETE'
      })

      if (!response.ok) throw new Error('Error al eliminar contacto')

      const newData = data.filter(contact => contact.contactId !== selectedContact.contactId)
      setData(newData)
      setFilteredData(newData)
      
      toast.success('Contacto eliminado exitosamente')
      handleCloseDialog()
    } catch (error: any) {
      toast.error(error.message || 'Error al eliminar contacto')
    } finally {
      setIsDeleteLoading(false)
    }
  }

  const handleCloseDialog = () => {
    setOpenDialog(false)
  }

  const handleEditContact = (contact: ContactType) => {
    setSelectedContact(contact)
    setEditContactOpen(true)
  }

  const handleExportContacts = () => {
    try {
      // Crear CSV
      const headers = ['NOMBRE', 'CARGO', 'EMAIL', 'TELÉFONO 1', 'TELÉFONO 2']
      const csvData = data.map(contact => [
        contact.nombre,
        contact.cargo,
        contact.email,
        contact.telefono1,
        contact.telefono2 || ''
      ])
      
      const csvContent = [
        headers.join(','),
        ...csvData.map(row => row.join(','))
      ].join('\n')

      // Crear y descargar el archivo
      const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' })
      const link = document.createElement('a')
      const url = URL.createObjectURL(blob)
      link.setAttribute('href', url)
      link.setAttribute('download', 'contactos.csv')
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)
    } catch (error) {
      toast.error('Error al exportar contactos')
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
      columnHelper.accessor('nombre', {
        header: 'NOMBRE',
        cell: ({ row }) => <Typography>{row.original.nombre}</Typography>
      }),
      columnHelper.accessor('cargo', {
        header: 'CARGO',
        cell: ({ row }) => <Typography>{row.original.cargo}</Typography>
      }),
      columnHelper.accessor('email', {
        header: 'EMAIL',
        cell: ({ row }) => <Typography>{row.original.email}</Typography>
      }),
      columnHelper.accessor('telefono1', {
        header: 'TELÉFONO 1',
        cell: ({ row }) => <Typography>{row.original.telefono1}</Typography>
      }),
      columnHelper.accessor('telefono2', {
        header: 'TELÉFONO 2',
        cell: ({ row }) => <Typography>{row.original.telefono2}</Typography>
      }),
      columnHelper.accessor('action', {
        header: 'ACCIÓN',
        cell: ({ row }) => (
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
            <IconButton
              color='primary'
              onClick={() => handleEditContact(row.original)}
            >
              <EditIcon />
            </IconButton>
            <IconButton
              color='error'
              onClick={() => handleClickOpenDialog(row.original)}
            >
              <DeleteIcon />
            </IconButton>
          </Box>
        ),
        enableSorting: false
      })
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

  return (
    <>
      <Card>
        <CardHeader
          title={<span className='text-xl'>Contactos</span>}
          action={
            <Button variant='contained' onClick={() => setAddUserOpen(!addUserOpen)} className='max-sm:is-full'>
              + Nuevo Contacto
            </Button>
          }
        />
        <Divider />
        <div className='flex justify-between p-5 gap-4 flex-col items-start sm:flex-row sm:items-center'>
          <Button
            color='secondary'
            variant='outlined'
            startIcon={<i className='ri-upload-2-line text-xl' />}
            className='max-sm:is-full'
            onClick={handleExportContacts}
          >
            Exportar
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
          <Card>
            <div className='flex items-center justify-center' style={{ minHeight: 'calc(100vh - 300px)' }}>
              <i className='ri-loader-4-line text-primary text-4xl animate-spin' />
            </div>
          </Card>
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
        userData={data}
        setData={setData}
        setFilteredData={setFilteredData}
      />
      <Dialog
        open={openDialog}
        onClose={handleCloseDialog}
        aria-labelledby='alert-dialog-title'
        aria-describedby='alert-dialog-description'
      >
        <DialogTitle id='alert-dialog-title'>Eliminar Contacto</DialogTitle>
        <DialogContent>
          <DialogContentText id='alert-dialog-description'>
            ¿Está seguro que desea eliminar este contacto?
          </DialogContentText>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseDialog} variant='outlined' color='secondary'>
            Cerrar
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
    </>
  )
}

export default ContactsListTable
