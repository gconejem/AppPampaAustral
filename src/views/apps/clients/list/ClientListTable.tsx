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

// Third-party Imports
import classnames from 'classnames'
import { rankItem } from '@tanstack/match-sorter-utils'
import { toast } from 'react-hot-toast'
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
  Table,
  Row
} from '@tanstack/react-table'

// Type Imports
import type { Cliente } from '@/types/forms/cliente'

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
const ContactsModal = ({ open, handleClose, contacts }: { 
  open: boolean
  handleClose: () => void
  contacts: any[]
}) => {
  return (
    <Dialog open={open} onClose={handleClose} maxWidth="sm" fullWidth>
      <DialogTitle>Contactos del Cliente</DialogTitle>
      <DialogContent>
        {contacts.map((contact, index) => (
          <div key={index} className="mb-4 p-4 border rounded-lg">
            <div className="flex items-center gap-2 mb-2">
              <i className="ri-user-line text-primary" />
              <Typography variant="subtitle1">{contact.contacto.nombre}</Typography>
              {contact.isPrincipal && (
                <Chip label="Principal" size="small" color="primary" />
              )}
            </div>
            <div className="grid grid-cols-2 gap-2">
              <div className="flex items-center gap-2">
                <i className="ri-briefcase-line text-textSecondary" />
                <Typography>{contact.contacto.cargo}</Typography>
              </div>
              <div className="flex items-center gap-2">
                <i className="ri-mail-line text-textSecondary" />
                <Typography>{contact.contacto.email}</Typography>
              </div>
              <div className="flex items-center gap-2">
                <i className="ri-phone-line text-textSecondary" />
                <Typography>{contact.contacto.telefono1}</Typography>
              </div>
              {contact.contacto.telefono2 && (
                <div className="flex items-center gap-2">
                  <i className="ri-phone-line text-textSecondary" />
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
  const [filteredData, setFilteredData] = useState<Cliente[]>(safeUserData)
  const [openDialog, setOpenDialog] = useState(false)
  const [contactsModalOpen, setContactsModalOpen] = useState(false)
  const [selectedContacts, setSelectedContacts] = useState<any[]>([])

  useEffect(() => {
    setFilteredData(safeUserData)
  }, [safeUserData])

  const handleDelete = async (id: number) => {
    try {
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/clientes/${id}`, {
        method: 'DELETE'
      })

      if (response.ok) {
        // Actualizar la lista local
        const updatedData = userData.filter(client => client.clienteId !== id)
        setData(updatedData)
        setFilteredData(updatedData)
        toast.success('Cliente eliminado exitosamente')
        handleCloseDialog()
      } else {
        throw new Error('Error al eliminar el cliente')
      }
    } catch (error) {
      console.error('Error:', error)
      toast.error('Error al eliminar el cliente')
    }
  }

  const handleCloseDialog = () => {
    setOpenDialog(false)
  }

  const handleClickOpenDialog = (client: Cliente) => {
    setSelectedUser(client)
    setOpenDialog(true)
  }

  const handleEditClick = (client: Cliente) => {
    console.log('Edit clicked for client:', client)
    setSelectedUser(client)
    setEditUserOpen(true)
  }

  const columns = useMemo(() => [
    {
      id: 'select',
      header: ({ table }: { table: Table<Cliente> }) => (
        <Checkbox
          checked={table.getIsAllRowsSelected()}
          onChange={table.getToggleAllRowsSelectedHandler()}
        />
      ),
      cell: ({ row }: { row: Row<Cliente> }) => (
        <Checkbox
          checked={row.getIsSelected()}
          onChange={row.getToggleSelectedHandler()}
        />
      )
    },
    columnHelper.accessor('rut', {
      header: 'RUT',
      cell: ({ row }: { row: Row<Cliente> }) => <Typography>{row.original.rut}</Typography>
    }),
    columnHelper.accessor('razonSocial', {
      header: 'NOMBRE COMERCIAL',
      cell: ({ row }: { row: Row<Cliente> }) => (
        <Typography>{row.original.nombreCliente || row.original.razonSocial}</Typography>
      )
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
          <div className="flex items-center gap-2">
            <div 
              className={`w-2 h-2 rounded-full ${
                hasContacts ? 'bg-success' : 'bg-error'
              }`} 
            />
            <Button
              variant="text"
              size="small"
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
          size="small"
        />
      )
    }),
    {
      id: 'actions',
      header: 'ACCIONES',
      cell: ({ row }: { row: Row<Cliente> }) => (
        <div className='flex items-center'>
          <IconButton 
            onClick={() => handleEditClick(row.original)}
            size="small"
          >
            <i className="ri-pencil-line text-[16px] text-[#3366FF]" />
          </IconButton>
          <IconButton 
            onClick={() => handleClickOpenDialog(row.original)}
            size="small"
            sx={{ '&:hover': { color: '#FF4C51' } }}
          >
            <i className="ri-delete-bin-6-line text-[16px] text-[#FF4C51]" />
          </IconButton>
        </div>
      )
    }
  ], [])

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

  return (
    <>
      <Card>
        <CardHeader
          title={<span className='text-xl'>Clientes</span>}
        />

        <TableFilters 
          setData={setFilteredData} 
          data={safeUserData}
          toggleAddUserDrawer={() => setAddUserOpen(!addUserOpen)}
        />
        <Divider />
        
        {/* Tabla con el mismo estilo que WorkListTable */}
        <div className='overflow-x-auto'>
          <table className={tableStyles.table}>
            <thead>
              {table.getHeaderGroups().map(headerGroup => (
                <tr key={headerGroup.id}>
                  {headerGroup.headers.map(header => (
                    <th key={header.id}>
                      {flexRender(header.column.columnDef.header, header.getContext())}
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
                      <td key={cell.id}>
                        {flexRender(cell.column.columnDef.cell, cell.getContext())}
                      </td>
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

        <AddClient
          open={addUserOpen}
          handleClose={() => setAddUserOpen(false)}
          userData={userData}
          setData={setData}
        />

        {selectedUser && (
          <>
            {console.log('Rendering EditClientForm with selectedUser:', selectedUser)}
            <EditClientForm
              open={editUserOpen}
              handleClose={() => setEditUserOpen(false)}
              userData={userData}
              setData={setData}
              currentUser={selectedUser}
            />
          </>
        )}
      </Card>
      {/* Diálogo de confirmación para eliminar */}
      <Dialog open={openDialog} onClose={handleCloseDialog}>
        <DialogTitle>Confirmar eliminación</DialogTitle>
        <DialogContent>
          <DialogContentText>
            ¿Está seguro que desea eliminar este cliente?
          </DialogContentText>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseDialog} color='primary'>
            Cancelar
          </Button>
          <Button 
            onClick={() => selectedUser?.clienteId && handleDelete(selectedUser.clienteId)} 
            color='error' 
            variant='contained'
          >
            Eliminar
          </Button>
        </DialogActions>
      </Dialog>
      
      <ContactsModal 
        open={contactsModalOpen}
        handleClose={() => setContactsModalOpen(false)}
        contacts={selectedContacts}
      />
    </>
  )
}

export default ClientListTable
