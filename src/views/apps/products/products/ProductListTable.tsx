'use client'

// React Imports
import { useEffect, useMemo, useState, useCallback } from 'react'

// Next Imports
import Link from 'next/link'
import { useParams } from 'next/navigation'

// MUI Imports
import SearchIcon from '@mui/icons-material/Search'
import InputAdornment from '@mui/material/InputAdornment'
import Grid from '@mui/material/Grid'
import ArrowForwardIcon from '@mui/icons-material/ArrowForward'
import ArrowBackIcon from '@mui/icons-material/ArrowBack'
import Card from '@mui/material/Card'
import CardHeader from '@mui/material/CardHeader'
import Button from '@mui/material/Button'
import Chip from '@mui/material/Chip'
import Checkbox from '@mui/material/Checkbox'
import Divider from '@mui/material/Divider'
import IconButton from '@mui/material/IconButton'
import Switch from '@mui/material/Switch'
import TablePagination from '@mui/material/TablePagination'
import TextField from '@mui/material/TextField'
import Typography from '@mui/material/Typography'
import Modal from '@mui/material/Modal'
import Box from '@mui/material/Box'
import type { TextFieldProps } from '@mui/material/TextField'
import TableContainer from '@mui/material/TableContainer'
import Table from '@mui/material/Table'
import TableHead from '@mui/material/TableHead'
import TableBody from '@mui/material/TableBody'
import TableRow from '@mui/material/TableRow'
import TableCell from '@mui/material/TableCell'
import MenuItem from '@mui/material/MenuItem'
import FormControl from '@mui/material/FormControl'
import InputLabel from '@mui/material/InputLabel'
import Select from '@mui/material/Select'
import Menu from '@mui/material/Menu'

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
import { Toaster, toast } from 'react-hot-toast'

// Type Imports
import type { ThemeColor } from '@core/types'

// Component Imports
import TableFilters from './TableFilters'
import CustomAvatar from '@core/components/mui/Avatar'
import OptionMenu from '@core/components/option-menu'
import EditProductForm from '../edit/EditProductForm'
import CreatePackageModal from './CreatePackageModal'
import EditPackageModal from '../edit/EditPackageModal'
import PreviewProductForm from '../preview/PreviewProductForm'
import PreviewPackageForm from '../preview/PreviewPackageForm'

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

type ProductCategoryType = {
  [key: string]: {
    icon: string
    color: ThemeColor
  }
}

type productStatusType = {
  [key: string]: {
    title: string
    color: ThemeColor
  }
}

const fuzzyFilter: FilterFn<any> = (row, columnId, value, addMeta) => {
  const itemRank = rankItem(row.getValue(columnId), value)

  addMeta({
    itemRank
  })

  return itemRank.passed
}

const style = {
  position: 'absolute',
  top: '50%',
  left: '50%',
  transform: 'translate(-50%, -50%)',
  width: 1100,
  height: 'auto',
  maxHeight: '90vh',
  bgcolor: 'background.paper',
  borderRadius: 1,
  boxShadow: 24,
  p: 4,
  overflow: 'auto'
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

const productCategoryObj: ProductCategoryType = {
  Accessories: { icon: 'ri-headphone-line', color: 'error' },
  'Home Decor': { icon: 'ri-home-6-line', color: 'info' },
  Electronics: { icon: 'ri-computer-line', color: 'primary' },
  Shoes: { icon: 'ri-footprint-line', color: 'success' },
  Office: { icon: 'ri-briefcase-line', color: 'warning' },
  Games: { icon: 'ri-gamepad-line', color: 'secondary' }
}

const productStatusObj: productStatusType = {
  Scheduled: { title: 'Scheduled', color: 'warning' },
  Published: { title: 'Publish', color: 'success' },
  Inactive: { title: 'Inactive', color: 'error' }
}

export interface Producto {
  productoId: number
  sku: string
  nombre: string
  descripcion?: string
  area: string
  familia: string
  tipo: string
  estado: string
  esPaquete: boolean
  norma?: string
  aplicaImpuesto: boolean
  category?: string
  status?: string
  stock?: boolean
  precio?: number // Añadir para compatibilidad con EditProductForm
  listasPrecios?: {
    precio: number
    listaPrecio: {
      id: number
      nombre: string
    }
  }[]
  productosEnPaquete?: Producto[]
}

interface ProductoListItem {
  id: string
  nombre: string
}

const columnHelper = createColumnHelper<Producto>()

const ProductListTable = () => {
  // Estados para la tabla
  const [rowSelection, setRowSelection] = useState({})
  const [productos, setProductos] = useState<Producto[]>([])
  const [filteredProductos, setFilteredProductos] = useState<Producto[]>([])
  const [loading, setLoading] = useState(true)
  const [globalFilter, setGlobalFilter] = useState('')
  const [page, setPage] = useState(0)
  const [rowsPerPage, setRowsPerPage] = useState(10)
  const [totalProductos, setTotalProductos] = useState(0)
  const [areas, setAreas] = useState<string[]>([])
  const [familias, setFamilias] = useState<string[]>([])
  const [tipos, setTipos] = useState(['Controles', 'Ensayos', 'Servicios', 'Terreno'])
  const [listasPrecios, setListasPrecios] = useState([])
  const [allProductos, setAllProductos] = useState<Producto[]>([]) // Nuevo estado para almacenar todos los productos

  // Estados para el modal de paquetes
  const [open, setOpen] = useState(false)
  const [nombre, setNombre] = useState('')
  const [sku, setSku] = useState('')
  const [norma, setNorma] = useState('')
  const [listaPrecios, setListaPrecios] = useState('')
  const [precio, setPrecio] = useState('')
  const [aplicaImpuesto, setAplicaImpuesto] = useState(false)
  const [buscarPaquete, setBuscarPaquete] = useState('')
  const [buscarProductos, setBuscarProductos] = useState('')
  const [paqueteList, setPaqueteList] = useState<ProductoListItem[]>([])
  const [productosList, setProductosList] = useState<ProductoListItem[]>([])
  const [selectedProductos, setSelectedProductos] = useState<string[]>([])
  const [selectedPaquetes, setSelectedPaquetes] = useState<string[]>([])

  // Agregar nuevo estado para el modal de edición
  const [editModalOpen, setEditModalOpen] = useState(false)
  const [editingProduct, setEditingProduct] = useState<Producto | null>(null)

  // Agregar este estado para las listas de precios
  const [listaPreciosOptions, setListaPreciosOptions] = useState<Array<{ id: number; nombre: string; precio: number }>>(
    []
  )

  const [openPackageModal, setOpenPackageModal] = useState(false)

  const [editPackageModalOpen, setEditPackageModalOpen] = useState(false)

  // Agregar estado para el modal de preview
  const [previewModalOpen, setPreviewModalOpen] = useState(false)
  const [previewProduct, setPreviewProduct] = useState<Producto | null>(null)
  const [previewPackageModalOpen, setPreviewPackageModalOpen] = useState(false)
  const [previewPackage, setPreviewPackage] = useState<any | null>(null)

  const params = useParams()
  const locale = params?.lang || 'es'

  // Cargar datos iniciales
  useEffect(() => {
    const fetchData = async () => {
      try {
        // Cargar productos
        const response = await fetch('/api/debug')
        const data = await response.json()

        console.log('Datos cargados:', data)

        if (data) {
          setProductos(data.productos || [])
          setAllProductos(data.productos || []) // Guardar todos los productos
          // No establecer filteredProductos aquí - dejar que el useEffect maneje el filtrado
          setTipos(data.tipos || [])
        }

        // Cargar áreas
        const areasResponse = await fetch('/api/areas')
        const areasData = await areasResponse.json()
        setAreas(areasData.map((area: any) => area.nombre))

        // Cargar familias
        const familiasResponse = await fetch('/api/familias')
        const familiasData = await familiasResponse.json()
        setFamilias(familiasData.map((familia: any) => familia.nombre))
      } catch (error) {
        console.error('Error cargando datos:', error)
        toast.error('Error al cargar los datos')
      }
    }

    fetchData()
  }, [])

  // Función para cargar productos (ahora solo se llama al inicio)
  const cargarProductos = async () => {
    try {
      setLoading(true)
      const response = await fetch(`/api/productos`)
      const data = await response.json()

      console.log('DATOS:', data)

      if (data.productos) {
        const productosFormateados = data.productos.map(p => ({
          ...p,
          // Asegurarse de que listasPrecios sea un array
          listasPrecios: Array.isArray(p.listasPrecios) ? p.listasPrecios : []
        }))

        setProductos(productosFormateados)
        setAllProductos(productosFormateados) // Guardar todos los productos
        // No establecer filteredProductos aquí - dejar que el useEffect maneje el filtrado
        setTotalProductos(productosFormateados.length)
      }
    } catch (error) {
      console.error('Error al cargar productos:', error)
      toast.error('Error al cargar los productos')
    } finally {
      setLoading(false)
    }
  }

  // Función para buscar productos (ahora busca en los datos locales)
  const buscarProducto = (query: string) => {
    if (!query) {
      setFilteredProductos(allProductos)
      setPage(0) // Reiniciar la página al limpiar la búsqueda
      return
    }

    const lowercaseQuery = query.toLowerCase()
    const resultados = allProductos.filter(producto =>
      producto.nombre.toLowerCase().includes(lowercaseQuery) ||
      producto.sku.toLowerCase().includes(lowercaseQuery) ||
      producto.area.toLowerCase().includes(lowercaseQuery) ||
      producto.familia.toLowerCase().includes(lowercaseQuery) ||
      producto.tipo.toLowerCase().includes(lowercaseQuery)
    )

    setFilteredProductos(resultados)
    setPage(0) // Reiniciar la página al aplicar una búsqueda
  }

  // Función para eliminar producto
  const eliminarProducto = async (productoId: number) => {
    try {
      const response = await fetch(`/api/productos/${productoId}`, {
        method: 'DELETE'
      })

      if (!response.ok) {
        throw new Error('Error al eliminar el producto')
      }

      // Actualizar el estado local eliminando el producto
      setProductos(prevProductos => prevProductos.filter(producto => producto.productoId !== productoId))

      // Actualizar también los productos filtrados
      setFilteredProductos(prevProductos => prevProductos.filter(producto => producto.productoId !== productoId))

      // Mostrar notificación de éxito
      toast.success('Producto eliminado correctamente')
    } catch (error) {
      console.error('Error al eliminar producto:', error)
      toast.error('Error al eliminar el producto')
    }
  }

  // Función para crear paquete
  const handleSave = async () => {
    try {
      // Validar campos requeridos
      if (!nombre || !sku || !listaPrecios || !precio) {
        // Mostrar error
        return
      }

      const response = await fetch('/api/productos', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          nombre,
          sku,
          norma,
          listaPrecioId: parseInt(listaPrecios),
          precio: parseFloat(precio),
          aplicaImpuesto,
          tipo: 'Paquete', // Asegurarnos de que se cree como tipo Paquete
          esPaquete: true, // También marcarlo como paquete
          productos: paqueteList.map(item => item.id) // IDs de los productos incluidos en el paquete
        })
      })

      if (!response.ok) {
        throw new Error('Error al crear el paquete')
      }

      // Limpiar el formulario
      setNombre('')
      setSku('')
      setNorma('')
      setListaPrecios('')
      setPrecio('')
      setAplicaImpuesto(false)
      setPaqueteList([])
      setProductosList([])

      // Cerrar el modal
      handleClose()

      // Recargar la lista de productos
      cargarProductos()
    } catch (error) {
      console.error('Error:', error)

      // Mostrar mensaje de error al usuario
    }
  }

  const handleOpen = () => setOpen(true)

  const handleClose = () => {
    setOpen(false)

    // Limpiar estados del modal
    setNombre('')
    setSku('')
    setNorma('')
    setListaPrecios('')
    setPrecio('')
    setAplicaImpuesto(false)
    setPaqueteList([])
    setSelectedProductos([])
    setSelectedPaquetes([])
  }

  // Funciones para manejar la selección de productos
  const handleSelectProducto = (item: ProductoListItem) => {
    setSelectedProductos(prev => (prev.includes(item.id) ? prev.filter(i => i !== item.id) : [...prev, item.id]))
  }

  const handleSelectPaquete = (item: ProductoListItem) => {
    setSelectedPaquetes(prev => (prev.includes(item.id) ? prev.filter(i => i !== item.id) : [...prev, item.id]))
  }

  // Funciones para mover productos entre listas
  const handleMoveToPaquete = () => {
    const productosAMover = productosList.filter(item => selectedProductos.includes(item.id))

    setPaqueteList(prev => [...prev, ...productosAMover])
    setProductosList(prev => prev.filter(item => !selectedProductos.includes(item.id)))
    setSelectedProductos([])
  }

  const handleMoveToProductos = () => {
    const productosAMover = paqueteList.filter(item => selectedPaquetes.includes(item.id))

    setProductosList(prev => [...prev, ...productosAMover])
    setPaqueteList(prev => prev.filter(item => !selectedPaquetes.includes(item.id)))
    setSelectedPaquetes([])
  }

  // Cargar productos disponibles para el paquete
  const cargarProductosDisponibles = async () => {
    try {
      const response = await fetch('/api/productos?esPaquete=false')
      const data = await response.json()

      if (data.productos) {
        const productosFormateados = data.productos.map((p: Producto) => ({
          id: p.productoId.toString(),
          nombre: p.nombre
        }))

        setProductosList(productosFormateados)
      }
    } catch (error) {
      console.error('Error al cargar productos disponibles:', error)
    }
  }

  // Agregar esta función para cargar las listas de precios
  const cargarListasPrecios = async () => {
    try {
      const response = await fetch('/api/lista-precios')
      const data = await response.json()

      console.log('Listas de precios cargadas:', data)
      setListaPreciosOptions(data)
    } catch (error) {
      console.error('Error al cargar listas de precios:', error)
    }
  }

  useEffect(() => {
    cargarProductos()
  }, []) // Ahora solo se cargan los productos al inicio

  // Efecto principal para manejar filtrado
  useEffect(() => {
    console.log('🔍 Aplicando filtros:', {
      globalFilter,
      allProductosLength: allProductos.length,
      filteredProductosLength: filteredProductos.length
    })

    if (globalFilter && allProductos.length > 0) {
      console.log('📝 Aplicando búsqueda global...')
      buscarProducto(globalFilter)
    } else if (!globalFilter && allProductos.length > 0) {
      console.log('🔄 Sin filtro global, mostrando todos los productos')
      setFilteredProductos(allProductos)
      setPage(0)
    }
  }, [globalFilter, allProductos])

  useEffect(() => {
    if (open) {
      cargarProductosDisponibles()
      cargarListasPrecios()
    }
  }, [open])

  // Actualizar la función renderCellContent para manejar los precios
  const renderCellContent = (value: any, producto?: Producto): string => {
    if (value === null || value === undefined) return ''

    if (producto && 'listasPrecios' in producto) {
      const firstPrice = producto.listasPrecios?.[0]

      if (firstPrice?.precio !== undefined) {
        return new Intl.NumberFormat('es-CL', {
          style: 'currency',
          currency: 'CLP'
        }).format(firstPrice.precio)
      }
    }

    if (typeof value === 'boolean') return value ? 'Sí' : 'No'
    if (typeof value === 'number') return value.toString()
    if (typeof value === 'string') return value

    return ''
  }

  // Función para abrir el modal correcto según el tipo
  const handleEditOpen = async (producto: Producto) => {

    if (producto.esPaquete) {
      try {
        // Obtener toda la información del paquete desde el backend
        const response = await fetch(`/api/productos/${producto.productoId}/productos`)
        const data = await response.json()

        console.log('handleEditOpen data:', data)

        if (response.ok) {
          // Combinar la información del paquete con los productos incluidos
          const paqueteCompleto = {
            ...producto,
            productosEnPaquete: data.productos || []
          }
          console.log('handleEditOpen paqueteCompleto:', paqueteCompleto)


          setEditingProduct(paqueteCompleto)
          setEditPackageModalOpen(true)
        } else {
          console.error('Error al obtener información del paquete:', data)
          toast.error('Error al cargar la información del paquete')
          // Si falla, usar el producto original
          setEditingProduct(producto)
          setEditPackageModalOpen(true)
        }
      } catch (error) {
        console.error('Error al obtener información del paquete:', error)
        toast.error('Error al cargar la información del paquete')
        // Si falla, usar el producto original
        setEditingProduct(producto)
        setEditPackageModalOpen(true)
      }
    } else {
      setEditingProduct(producto)
      setEditModalOpen(true)
    }
  }

  // Agregar función para guardar los cambios
  const handleEditSave = (updatedProduct: any) => {
    console.log('💾 Guardando producto editado:', updatedProduct)

    // Actualizar allProductos (fuente principal) con el producto actualizado
    setAllProductos(prevProductos =>
      prevProductos.map(producto =>
        producto.productoId === updatedProduct.productoId ? updatedProduct : producto
      )
    )

    // También actualizar productos para compatibilidad
    setProductos(prevProductos =>
      prevProductos.map(producto =>
        producto.productoId === updatedProduct.productoId ? updatedProduct : producto
      )
    )

    // Cerrar el modal
    if (editingProduct && editingProduct.esPaquete) {
      setEditPackageModalOpen(false)
    } else {
      setEditModalOpen(false)
    }

    // NO llamar cargarProductos() aquí para preservar el filtrado
    // Los useEffect se encargarán de actualizar filteredProductos automáticamente
    console.log('✅ Producto actualizado, filtros se mantendrán')
  }

  // Función para duplicar producto
  const duplicarProducto = async (producto: Producto) => {
    try {
      // Crear una copia del producto omitiendo campos que no queremos duplicar
      const { productoId, createdAt, updatedAt, listasPrecios, ...productData } = producto

      // Preparar los datos para el nuevo producto
      const nuevoProducto = {
        ...productData,
        sku: `${productData.sku}-copy`,

        // Si el producto original tiene listas de precios, las incluimos
        listaPreciosData: producto.listasPrecios?.map(lp => ({
          listaPrecioId: lp.listaPrecio.id,
          precio: lp.precio,
          activo: lp.activo
        }))
      }

      const response = await fetch('/api/productos', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(nuevoProducto)
      })

      if (!response.ok) {
        throw new Error('Error al duplicar el producto')
      }

      const nuevoproducto = await response.json()

      // Actualizar el estado local agregando el nuevo producto
      setProductos(prevProductos => [...prevProductos, nuevoproducto])
      setFilteredProductos(prevProductos => [...prevProductos, nuevoproducto])

      // Mostrar notificación de éxito
      toast.success('Producto duplicado correctamente')
    } catch (error) {
      console.error('Error al duplicar producto:', error)
      toast.error('Error al duplicar el producto')
    }
  }

  // Función para cambiar el estado de un producto (ACTIVO/INACTIVO)
  const handleToggleStatus = async (producto: Producto) => {
    try {
      // Determinar el nuevo estado (opuesto al actual)
      const nuevoEstado = producto.estado === 'ACTIVO' ? 'INACTIVO' : 'ACTIVO'

      // Llamar al endpoint para actualizar el estado
      const response = await fetch(`/api/productos/${producto.productoId}/estado`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ estado: nuevoEstado })
      })

      if (!response.ok) {
        throw new Error('Error al cambiar el estado del producto')
      }

      const data = await response.json()

      // Actualizar el estado local
      setProductos(prevProductos =>
        prevProductos.map(p =>
          p.productoId === producto.productoId ? { ...p, estado: nuevoEstado } : p
        )
      )

      // Actualizar también en la lista filtrada
      setFilteredProductos(prevProductos =>
        prevProductos.map(p =>
          p.productoId === producto.productoId ? { ...p, estado: nuevoEstado } : p
        )
      )

      // Actualizar en la lista completa
      setAllProductos(prevProductos =>
        prevProductos.map(p =>
          p.productoId === producto.productoId ? { ...p, estado: nuevoEstado } : p
        )
      )

      toast.success(data.message)
    } catch (error) {
      console.error('Error al cambiar estado:', error)
      toast.error('Error al cambiar el estado del producto')
    }
  }

  // Función para abrir el preview
  const handlePreviewOpen = async (producto: Producto) => {
    if (producto.esPaquete) {
      try {
        // Obtener los productos completos del paquete
        const response = await fetch(`/api/productos/${producto.productoId}/productos`)
        const data = await response.json()

        // data.productos debe ser un array de productos completos
        setPreviewPackage({ ...producto, productosEnPaquete: data.productos || [] })
        setPreviewPackageModalOpen(true)
      } catch (error) {
        setPreviewPackage(producto)
        setPreviewPackageModalOpen(true)
      }
    } else {
      setPreviewProduct(producto)
      setPreviewModalOpen(true)
    }
  }

  const columns = useMemo(
    () => [
      {
        id: 'select',
        header: ({ table }: any) => (
          <Checkbox
            {...{
              checked: table.getIsAllRowsSelected(),
              indeterminate: table.getIsSomeRowsSelected(),
              onChange: table.getToggleAllRowsSelectedHandler()
            }}
          />
        ),
        cell: ({ row }: any) => (
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
      columnHelper.accessor('sku', {
        header: 'SKU',
        cell: ({ row }) => renderCellContent(row.original.sku)
      }),
      columnHelper.accessor('nombre', {
        header: 'Ensayos/Servicio',
        cell: ({ row }) => (
          <Typography className='font-medium' color='text.primary'>
            {renderCellContent(row.original.nombre)}
          </Typography>
        )
      }),
      columnHelper.accessor('area', {
        header: 'ÁREA',
        cell: ({ row }) => renderCellContent(row.original.area)
      }),
      columnHelper.accessor('familia', {
        header: 'FAMILIA',
        cell: ({ row }) => renderCellContent(row.original.familia)
      }),
      columnHelper.accessor('esPaquete', {
        header: 'PAQUETE',
        cell: ({ row }) => <Switch checked={row.original.esPaquete} readOnly />,
        enableSorting: false
      }),
      columnHelper.accessor('tipo', {
        header: 'TIPO',
        cell: ({ row }) => renderCellContent(row.original.tipo)
      }),
      columnHelper.accessor('estado', {
        header: 'ESTADO',
        cell: ({ row }) => <Switch checked={row.original.estado === 'ACTIVO'} readOnly />,
        enableSorting: false
      }),
      {
        id: 'actions',
        header: 'Acciones',
        cell: ({ row }: any) => (
          <div className='flex items-center'>
            <IconButton size='small' onClick={() => handlePreviewOpen(row.original)}>
              <i className='ri-eye-line text-[22px] text-textSecondary' />
            </IconButton>
            <IconButton size='small' onClick={() => handleEditOpen(row.original)}>
              <i className='ri-edit-box-line text-[22px] text-textSecondary' />
            </IconButton>
            <OptionMenu
              iconButtonProps={{ size: 'medium' }}
              iconClassName='text-textSecondary text-[22px]'
              options={[
                {
                  text: row.original.estado === 'ACTIVO' ? 'Desactivar' : 'Activar',
                  icon: <Switch checked={row.original.estado === 'ACTIVO'} size='small' />,
                  menuItemProps: {
                    className: 'gap-2',
                    onClick: () => handleToggleStatus(row.original)
                  }
                },
                {
                  text: 'Duplicar',
                  icon: 'ri-file-copy-line',
                  menuItemProps: {
                    className: 'gap-2',
                    onClick: () => duplicarProducto(row.original)
                  }
                },
                {
                  text: 'Eliminar',
                  icon: 'ri-delete-bin-7-line',
                  menuItemProps: {
                    className: 'gap-2',
                    onClick: () => eliminarProducto(row.original.productoId)
                  }
                }
              ]}
            />
          </div>
        ),
        enableSorting: false
      }
    ],
    []
  )

  // Actualizar el manejo del cambio en el filtro global
  const handleGlobalFilterChange = (value: string | number) => {
    setGlobalFilter(String(value))
    if (value === '') {
      setPage(0) // Reiniciar la página cuando se limpia el filtro
    }
  }

  const table = useReactTable({
    data: filteredProductos,
    columns,
    filterFns: {
      fuzzy: fuzzyFilter
    },
    state: {
      rowSelection,
      globalFilter,
      pagination: {
        pageIndex: page,
        pageSize: rowsPerPage
      }
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
    getFacetedMinMaxValues: getFacetedMinMaxValues(),
    manualPagination: false // Cambiado a false para usar paginación del lado del cliente
  })

  // Función para reiniciar la página (ahora definida después de la tabla)
  const resetPage = useCallback(() => {
    setPage(0)
    table.setPageIndex(0)
  }, [table])

  // Manejadores para el modal
  const handleOpenPackageModal = () => setOpenPackageModal(true)
  const handleClosePackageModal = () => setOpenPackageModal(false)

  return (
    <>
      <Toaster
        position='top-center'
        toastOptions={{
          success: {
            style: {
              background: '#4CAF50',
              color: 'white'
            }
          },
          error: {
            style: {
              background: '#EF5350',
              color: 'white'
            }
          },
          duration: 3000
        }}
      />

      <Card>
        <CardHeader title='Productos' className='pbe-4' />
        <TableFilters
          productData={allProductos}
          setFilteredData={setFilteredProductos}
          areas={areas}
          familias={familias}
          tipos={tipos}
          resetPage={resetPage} // Pasar la función resetPage a TableFilters
        />
        <Divider />
        <div className='flex justify-between flex-col items-start sm:flex-row sm:items-center gap-y-4 p-5'>
          <DebouncedInput
            value={globalFilter ?? ''}
            onChange={handleGlobalFilterChange} // Usar la nueva función de manejo
            placeholder='Buscar Ensayo/Servicio'
            className='max-sm:is-full'
          />
          <div className='flex items-center max-sm:flex-col gap-4 max-sm:is-full is-auto'>
            <Button
              variant='contained'
              onClick={handleOpenPackageModal}
              startIcon={<i className='ri-package-line text-[22px] text-textSecondary' />}
            >
              Crear Paquete
            </Button>
            <Button
              variant='contained'
              component={Link}
              href={`/${locale}/apps/products/add`}
              startIcon={<i className='ri-add-line' />}
              className='max-sm:is-full is-auto'
            >
              Agregar Ensayo
            </Button>
          </div>
        </div>
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
            {table.getRowModel().rows.length === 0 ? (
              <tbody>
                <tr>
                  <td colSpan={table.getVisibleFlatColumns().length} className='text-center'>
                    No data available
                  </td>
                </tr>
              </tbody>
            ) : (
              <tbody>
                {table.getRowModel().rows.map(row => (
                  <tr key={row.id} className={classnames({ selected: row.getIsSelected() })}>
                    {row.getVisibleCells().map(cell => (
                      <td key={cell.id}>{flexRender(cell.column.columnDef.cell, cell.getContext())}</td>
                    ))}
                  </tr>
                ))}
              </tbody>
            )}
          </table>
        </div>
        <TablePagination
          rowsPerPageOptions={[10, 25, 50]}
          component='div'
          className='border-bs'
          count={filteredProductos.length}
          rowsPerPage={rowsPerPage}
          page={page}
          onPageChange={(_, newPage) => {
            setPage(newPage)
            table.setPageIndex(newPage)
          }}
          onRowsPerPageChange={e => {
            const newRowsPerPage = Number(e.target.value)
            setRowsPerPage(newRowsPerPage)
            setPage(0)
            table.setPageSize(newRowsPerPage)
          }}
        />
        <CreatePackageModal open={openPackageModal} handleClose={handleClosePackageModal} />
        <PreviewProductForm
          open={previewModalOpen}
          onClose={() => setPreviewModalOpen(false)}
          product={previewProduct}
        />
        <PreviewPackageForm
          open={previewPackageModalOpen}
          onClose={() => setPreviewPackageModalOpen(false)}
          paquete={previewPackage}
        />
        <EditProductForm
          open={editModalOpen}
          onClose={() => setEditModalOpen(false)}
          product={editingProduct}
          onSave={handleEditSave}
          areas={areas}
          familias={familias}
        />
        <EditPackageModal
          open={editPackageModalOpen}
          onClose={() => setEditPackageModalOpen(false)}
          paquete={editingProduct}
          onSave={handleEditSave}
        />
      </Card>
    </>
  )
}

export default ProductListTable
