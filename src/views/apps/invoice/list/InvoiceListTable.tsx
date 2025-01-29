'use client'

// React Imports
import { useState, useEffect, useMemo } from 'react'

// Next Imports
import Link from 'next/link'
import { useParams } from 'next/navigation'

// MUI Imports

import VisibilityIcon from '@mui/icons-material/Visibility'
import AttachMoneyIcon from '@mui/icons-material/AttachMoney'
import EditIcon from '@mui/icons-material/Edit'
import MoreVertIcon from '@mui/icons-material/MoreVert'

import Card from '@mui/material/Card'
import CardContent from '@mui/material/CardContent'
import Button from '@mui/material/Button'
import Typography from '@mui/material/Typography'
import Checkbox from '@mui/material/Checkbox'
import Chip from '@mui/material/Chip'
import IconButton from '@mui/material/IconButton'
import TextField from '@mui/material/TextField'
import FormControl from '@mui/material/FormControl'
import InputLabel from '@mui/material/InputLabel'
import Select from '@mui/material/Select'
import MenuItem from '@mui/material/MenuItem'
import Tooltip from '@mui/material/Tooltip'
import TablePagination from '@mui/material/TablePagination'
import Grid from '@mui/material/Grid'
import type { TextFieldProps } from '@mui/material/TextField'
import TableContainer from '@mui/material/TableContainer'
import Table from '@mui/material/Table'
import TableHead from '@mui/material/TableHead'
import TableBody from '@mui/material/TableBody'
import TableRow from '@mui/material/TableRow'
import TableCell from '@mui/material/TableCell'
import Box from '@mui/material/Box'
import Dialog from '@mui/material/Dialog'
import DialogTitle from '@mui/material/DialogTitle'
import DialogContent from '@mui/material/DialogContent'
import DialogActions from '@mui/material/DialogActions'
import DialogContentText from '@mui/material/DialogContentText'

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
import type { InvoiceType } from '@/types/apps/invoiceTypes'
import type { Locale } from '@configs/i18n'

// Component Imports
import OptionMenu from '@core/components/option-menu'
import CustomAvatar from '@core/components/mui/Avatar'

// Util Imports
import { getInitials } from '@/utils/getInitials'
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

type InvoiceTypeWithAction = InvoiceType & {
  action?: string
}

type InvoiceStatusObj = {
  [key: string]: {
    icon: string
    color: ThemeColor
  }
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
  }, [value])

  return <TextField {...props} value={value} onChange={e => setValue(e.target.value)} size='small' />
}

// Vars
const invoiceStatusObj: InvoiceStatusObj = {
  Sent: { color: 'secondary', icon: 'ri-send-plane-2-line' },
  Paid: { color: 'success', icon: 'ri-check-line' },
  Draft: { color: 'primary', icon: 'ri-mail-line' },
  'Partial Payment': { color: 'warning', icon: 'ri-pie-chart-2-line' },
  'Past Due': { color: 'error', icon: 'ri-information-line' },
  Downloaded: { color: 'info', icon: 'ri-arrow-down-line' }
}

// Column Definitions
const columnHelper = createColumnHelper<InvoiceTypeWithAction>()

const InvoiceListTable = () => {
  const [cotizaciones, setCotizaciones] = useState([])
  const [loading, setLoading] = useState(true)
  const [selected, setSelected] = useState<number[]>([])
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false)
  const [cotizacionToDelete, setCotizacionToDelete] = useState<number | null>(null)

  // Handler para selección de todas las filas
  const handleSelectAll = (event: React.ChangeEvent<HTMLInputElement>) => {
    if (event.target.checked) {
      const newSelecteds = cotizaciones.map((n: any) => n.id)
      setSelected(newSelecteds)
      return
    }
    setSelected([])
  }

  // Handler para selección individual
  const handleSelect = (event: React.MouseEvent<HTMLButtonElement>, id: number) => {
    event.stopPropagation() // Prevenir la propagación del evento
    const selectedIndex = selected.indexOf(id)
    let newSelected: number[] = []

    if (selectedIndex === -1) {
      newSelected = newSelected.concat(selected, id)
    } else if (selectedIndex === 0) {
      newSelected = newSelected.concat(selected.slice(1))
    } else if (selectedIndex === selected.length - 1) {
      newSelected = newSelected.concat(selected.slice(0, -1))
    } else if (selectedIndex > 0) {
      newSelected = newSelected.concat(
        selected.slice(0, selectedIndex),
        selected.slice(selectedIndex + 1)
      )
    }

    setSelected(newSelected)
  }

  // Función para abrir el diálogo de confirmación
  const handleDeleteClick = (id: number) => {
    setCotizacionToDelete(id)
    setDeleteDialogOpen(true)
  }

  // Función para eliminar cotización
  const handleDelete = async () => {
    if (!cotizacionToDelete) return

    try {
      const response = await fetch(`/api/cotizaciones/${cotizacionToDelete}`, {
        method: 'DELETE'
      })

      if (!response.ok) {
        throw new Error('Error al eliminar la cotización')
      }

      // Actualizar la lista de cotizaciones
      setCotizaciones(cotizaciones.filter((c: any) => c.id !== cotizacionToDelete))

      // Remover de seleccionados si estaba seleccionado
      setSelected(selected.filter(s => s !== cotizacionToDelete))

      // Cerrar el diálogo
      setDeleteDialogOpen(false)
      setCotizacionToDelete(null)
    } catch (error) {
      console.error('Error:', error)
      alert('Error al eliminar la cotización')
    }
  }

  // Cargar datos al montar el componente
  useEffect(() => {
    const fetchCotizaciones = async () => {
      try {
        const response = await fetch('/api/cotizaciones')
        if (!response.ok) {
          throw new Error('Error al cargar cotizaciones')
        }
        const data = await response.json()
        console.log('Cotizaciones cargadas:', data)
        setCotizaciones(data)
      } catch (error) {
        console.error('Error:', error)
      } finally {
        setLoading(false)
      }
    }

    fetchCotizaciones()
  }, [])

  return (
    <>
      <Card>
        <TableContainer>
          <Table>
            <TableHead>
              <TableRow>
                <TableCell padding="checkbox">
                  <Checkbox
                    indeterminate={selected.length > 0 && selected.length < cotizaciones.length}
                    checked={cotizaciones.length > 0 && selected.length === cotizaciones.length}
                    onChange={handleSelectAll}
                    inputProps={{ 'aria-label': 'select all' }}
                  />
                </TableCell>
                <TableCell>N° COTIZACIÓN</TableCell>
                <TableCell>CLIENTE</TableCell>
                <TableCell>FECHA</TableCell>
                <TableCell>ESTADO</TableCell>
                <TableCell>ACCIONES</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {loading ? (
                <TableRow>
                  <TableCell colSpan={6} align="center">
                    Cargando...
                  </TableCell>
                </TableRow>
              ) : cotizaciones.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={6} align="center">
                    No hay cotizaciones disponibles
                  </TableCell>
                </TableRow>
              ) : (
                cotizaciones.map((cotizacion: any) => {
                  const isItemSelected = selected.includes(cotizacion.id)

                  return (
                    <TableRow
                      key={cotizacion.id}
                      hover
                      role="checkbox"
                      aria-checked={isItemSelected}
                      selected={isItemSelected}
                    >
                      <TableCell padding="checkbox">
                        <Checkbox
                          checked={isItemSelected}
                          onClick={(e) => handleSelect(e as any, cotizacion.id)}
                        />
                      </TableCell>
                      <TableCell>{cotizacion.numeroCotizacion}</TableCell>
                      <TableCell>{cotizacion.cliente}</TableCell>
                      <TableCell>{cotizacion.fecha}</TableCell>
                      <TableCell>
                        <Chip
                          label={cotizacion.estado}
                          color={cotizacion.estado === 'PENDIENTE' ? 'warning' : 'success'}
                          variant='outlined'
                        />
                      </TableCell>
                      <TableCell>
                        <Box sx={{ display: 'flex', gap: 2 }}>
                          <Tooltip title="Ver">
                            <IconButton
                              size="small"
                              href={`/apps/invoice/preview/${cotizacion.id}`}
                            >
                              <i className="ri-eye-line" />
                            </IconButton>
                          </Tooltip>
                          <Tooltip title="Editar">
                            <IconButton
                              size="small"
                              href={`/apps/invoice/edit/${cotizacion.id}`}
                            >
                              <i className="ri-pencil-line" />
                            </IconButton>
                          </Tooltip>
                          <Tooltip title="Eliminar">
                            <IconButton
                              size="small"
                              onClick={() => handleDeleteClick(cotizacion.id)}
                            >
                              <i className="ri-delete-bin-line" />
                            </IconButton>
                          </Tooltip>
                        </Box>
                      </TableCell>
                    </TableRow>
                  )
                })
              )}
            </TableBody>
          </Table>
        </TableContainer>
      </Card>

      {/* Diálogo de confirmación */}
      <Dialog
        open={deleteDialogOpen}
        onClose={() => setDeleteDialogOpen(false)}
        aria-labelledby="alert-dialog-title"
        aria-describedby="alert-dialog-description"
      >
        <DialogTitle id="alert-dialog-title">
          Confirmar eliminación
        </DialogTitle>
        <DialogContent>
          <DialogContentText id="alert-dialog-description">
            ¿Está seguro que desea eliminar esta cotización? Esta acción no se puede deshacer.
          </DialogContentText>
        </DialogContent>
        <DialogActions>
          <Button
            onClick={() => setDeleteDialogOpen(false)}
            color="primary"
            variant="outlined"
          >
            Cancelar
          </Button>
          <Button
            onClick={handleDelete}
            color="error"
            variant="contained"
            autoFocus
          >
            Eliminar
          </Button>
        </DialogActions>
      </Dialog>
    </>
  )
}

export default InvoiceListTable
