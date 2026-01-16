// MUI Imports
import { useState, useEffect } from 'react'
import {
    Box,
    Typography,
    Button,
    Card,
    TextField,
    Chip,
    IconButton,
    Checkbox,
    Grid,
    Collapse,
    Popover,
    List,
    ListItem,
    ListItemText,
    InputAdornment,
    FormControl,
    InputLabel,
    Select,
    MenuItem,
    FormControlLabel,
    Switch
} from '@mui/material'
import AddIcon from '@mui/icons-material/Add'
import ContentCopyIcon from '@mui/icons-material/ContentCopy'
import ExpandMoreIcon from '@mui/icons-material/ExpandMore'
import MoreVertIcon from '@mui/icons-material/MoreVert'
import EditIcon from '@mui/icons-material/Edit'
import DeleteIcon from '@mui/icons-material/Delete'
import SearchIcon from '@mui/icons-material/Search'
import LayersIcon from '@mui/icons-material/Layers'

const ITEMS_PER_PAGE = 10

interface ProductoType {
    id: number
    sku: string
    nombre: string
    precio: number
    area?: string
    familia?: string
    tipo?: string
    descripcion?: string
    esPaquete?: boolean
    norma?: string
}

interface EnsayoAsociado {
    id: number
    productoId: number
    nombre: string
    norma?: string
    cantidad: number
}

interface Step2CreateRcmsProps {
    ensayosAsociados: EnsayoAsociado[]
    setEnsayosAsociados: React.Dispatch<React.SetStateAction<EnsayoAsociado[]>>
}

const Step2CreateRcms = ({ ensayosAsociados, setEnsayosAsociados }: Step2CreateRcmsProps) => {
    const [expandedRcm, setExpandedRcm] = useState(true)

    // Estados para el popover de búsqueda de productos
    const [anchorEl, setAnchorEl] = useState<HTMLElement | null>(null)
    const [searchTerm, setSearchTerm] = useState('')
    const [productsPage, setProductsPage] = useState(0)
    const [allProductos, setAllProductos] = useState<ProductoType[]>([]) // Todos los productos
    const [areas, setAreas] = useState<Array<{ id: number; nombre: string }>>([])
    const [familias, setFamilias] = useState<Array<{ id: number; nombre: string }>>([])
    const [tipos, setTipos] = useState<string[]>([])
    const [selectedAreaId, setSelectedAreaId] = useState<number | null>(null)
    const [selectedTipo, setSelectedTipo] = useState('')
    const [selectedFamilia, setSelectedFamilia] = useState('')
    const [showOnlyPaquetes, setShowOnlyPaquetes] = useState(false)
    const [totalProductos, setTotalProductos] = useState(0)
    const [paginatedProductos, setPaginatedProductos] = useState<ProductoType[]>([]) // Productos de la página actual
    const [filterResetKey, setFilterResetKey] = useState(0)

    const handleDuplicateLastRcm = () => {
        // TODO: Implementar lógica para duplicar último RCM
        console.log('Duplicar último RCM')
    }

    const handleNewRcm = () => {
        // TODO: Implementar lógica para crear nuevo RCM
        console.log('Nuevo RCM')
    }

    const handleToggleExpand = () => {
        setExpandedRcm(!expandedRcm)
    }

    const handleOpenSearchPopover = (event: React.MouseEvent<HTMLElement>) => {
        setAnchorEl(event.currentTarget)
    }

    const handleCloseSearchPopover = () => {
        setAnchorEl(null)
        setSearchTerm('')
        setProductsPage(0)
    }

    const handleSearchChange = (event: React.ChangeEvent<HTMLInputElement>) => {
        setSearchTerm(event.target.value)
        setProductsPage(0)
    }

    const handleAreaChange = (event: any) => {
        const areaId = event.target.value ? Number(event.target.value) : null
        setSelectedAreaId(areaId)
        setSelectedTipo('')
        setSelectedFamilia('')
        setProductsPage(0)
    }

    const handleTipoChange = (event: any) => {
        setSelectedTipo(event.target.value)
        setProductsPage(0)
    }

    const handleFamiliaChange = (event: any) => {
        setSelectedFamilia(event.target.value)
        setProductsPage(0)
    }

    const handleShowOnlyPaquetesChange = () => {
        setShowOnlyPaquetes(!showOnlyPaquetes)
        setProductsPage(0)
    }

    const handleClearFilters = () => {
        setSelectedAreaId(null)
        setSelectedTipo('')
        setSelectedFamilia('')
        setSearchTerm('')
        setProductsPage(0)
        setFilterResetKey(prev => prev + 1)
    }

    const handleSelectProduct = (producto: ProductoType) => {
        console.log('=== handleSelectProduct ===')
        console.log('Producto seleccionado:', producto)

        // Usar productoId o id según lo que tenga el producto
        const idProducto = (producto as any).productoId || producto.id
        console.log('ID del producto:', idProducto)

        setEnsayosAsociados(prev => {
            console.log('Estado anterior ensayos:', prev)

            // Verificar si el producto ya está en la lista
            const yaExiste = prev.some(e => e.productoId === idProducto)
            if (yaExiste) {
                console.log('El ensayo ya está agregado, no se agrega')
                return prev
            }

            // Agregar el producto a la lista de ensayos
            const nuevoEnsayo: EnsayoAsociado = {
                id: Date.now(), // ID temporal
                productoId: idProducto,
                nombre: producto.nombre,
                norma: producto.norma,
                cantidad: 1
            }

            const nuevaLista = [...prev, nuevoEnsayo]
            console.log('Nueva lista de ensayos:', nuevaLista)
            return nuevaLista
        })

        handleCloseSearchPopover()
    }

    const handleDeleteEnsayo = (ensayoId: number) => {
        setEnsayosAsociados(ensayosAsociados.filter(e => e.id !== ensayoId))
    }

    const handleChangeCantidad = (ensayoId: number, cantidad: number) => {
        setEnsayosAsociados(ensayosAsociados.map(e =>
            e.id === ensayoId ? { ...e, cantidad } : e
        ))
    }

    // Cargar áreas
    useEffect(() => {
        const fetchAreas = async () => {
            try {
                const response = await fetch('/api/areas')
                if (response.ok) {
                    const data = await response.json()
                    setAreas(data)
                }
            } catch (error) {
                console.error('Error al cargar áreas:', error)
            }
        }
        fetchAreas()
    }, [])

    // Cargar familias cuando cambia el área
    useEffect(() => {
        if (!selectedAreaId) {
            setFamilias([])
            return
        }

        const fetchFamilias = async () => {
            try {
                const response = await fetch(`/api/familias?areaId=${selectedAreaId}`)
                if (response.ok) {
                    const data = await response.json()
                    setFamilias(data)
                }
            } catch (error) {
                console.error('Error al cargar familias:', error)
            }
        }
        fetchFamilias()
    }, [selectedAreaId])

    // Cargar productos con filtros
    useEffect(() => {
        if (!anchorEl) return

        const fetchProductos = async () => {
            try {
                const params = new URLSearchParams({
                    page: productsPage.toString(),
                    limit: ITEMS_PER_PAGE.toString()
                })

                if (searchTerm) params.append('q', searchTerm)
                if (selectedAreaId) params.append('areaId', selectedAreaId.toString())
                if (selectedTipo) params.append('tipo', selectedTipo)
                if (selectedFamilia) params.append('familia', selectedFamilia)
                if (showOnlyPaquetes) params.append('esPaquete', 'true')

                console.log('Cargando productos con params:', params.toString())
                const response = await fetch(`/api/productos/search?${params.toString()}`)

                if (response.ok) {
                    const data = await response.json()
                    console.log('Productos cargados:', data)

                    // La API devuelve directamente el array o un objeto con productos
                    const productosArray = Array.isArray(data) ? data : (data.productos || [])

                    console.log('Array de productos:', productosArray)
                    console.log('Cantidad de productos:', productosArray.length)

                    setAllProductos(productosArray)
                    setTotalProductos(productosArray.length)
                } else {
                    console.error('Error en la respuesta:', response.status)
                }
            } catch (error) {
                console.error('Error al cargar productos:', error)
            }
        }

        fetchProductos()
    }, [anchorEl, searchTerm, selectedAreaId, selectedTipo, selectedFamilia, showOnlyPaquetes])

    // Aplicar paginación local
    useEffect(() => {
        const startIndex = productsPage * ITEMS_PER_PAGE
        const endIndex = startIndex + ITEMS_PER_PAGE
        const paginated = allProductos.slice(startIndex, endIndex)
        setPaginatedProductos(paginated)
    }, [allProductos, productsPage])

    return (
        <Card>
            <Box sx={{ p: 6 }}>
                {/* Fila superior: Título y Botones */}
                <Box sx={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', mb: 4 }}>
                    {/* Título y subtítulo */}
                    <Box>
                        <Typography variant='h5' sx={{ fontWeight: 'bold', mb: 1 }}>
                            Paso 2: Crear RCMs (Registro de Control de Muestras)
                        </Typography>
                        <Typography variant='body2' sx={{ color: 'text.secondary' }}>
                            Registre las muestras, controles o servicios recolectados en terreno
                        </Typography>
                    </Box>

                    {/* Botones */}
                    <Box sx={{ display: 'flex', gap: 2 }}>
                        <Button
                            variant='outlined'
                            startIcon={<ContentCopyIcon />}
                            onClick={handleDuplicateLastRcm}
                            sx={{
                                borderRadius: '8px',
                                textTransform: 'none',
                                px: 3,
                                color: '#9C27B0',
                                borderColor: '#9C27B0',
                                '&:hover': {
                                    borderColor: '#7B1FA2',
                                    bgcolor: 'rgba(156, 39, 176, 0.04)'
                                }
                            }}
                        >
                            Duplicar último RCM
                        </Button>
                        <Button
                            variant='contained'
                            color='primary'
                            startIcon={<AddIcon />}
                            onClick={handleNewRcm}
                            sx={{ borderRadius: '8px', textTransform: 'none', px: 3 }}
                        >
                            Nuevo RCM
                        </Button>
                    </Box>
                </Box>

                {/* RCM Card */}
                <Box
                    sx={{
                        bgcolor: '#E3F2FD',
                        borderRadius: '8px',
                        overflow: 'hidden'
                    }}
                >
                    {/* Header del RCM */}
                    <Box
                        sx={{
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'space-between',
                            p: 2,
                            bgcolor: '#E3F2FD'
                        }}
                    >
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                            <IconButton size='small' onClick={handleToggleExpand}>
                                <ExpandMoreIcon
                                    sx={{
                                        transform: expandedRcm ? 'rotate(0deg)' : 'rotate(-90deg)',
                                        transition: 'transform 0.3s'
                                    }}
                                />
                            </IconButton>
                            <Chip label='MUESTRA' color='primary' sx={{ fontWeight: 'bold' }} />
                            <Typography variant='body1' sx={{ fontWeight: 600 }}>
                                Tarjeta: LEO-2026-001
                            </Typography>
                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, color: 'text.secondary' }}>
                                <LayersIcon fontSize='small' />
                                <Typography variant='body2'>Material: Suelo granular • Ítem: Base</Typography>
                            </Box>
                        </Box>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                            <Checkbox />
                            <IconButton size='small'>
                                <MoreVertIcon />
                            </IconButton>
                        </Box>
                    </Box>

                    {/* Contenido colapsable del RCM */}
                    <Collapse in={expandedRcm}>
                        <Box sx={{ p: 3, bgcolor: 'white' }}>
                            {/* Campos principales */}
                            <Grid container spacing={3}>
                                <Grid item xs={12} md={3}>
                                    <TextField
                                        label='Fecha Codificación'
                                        type='date'
                                        defaultValue={new Date().toISOString().split('T')[0]}
                                        required
                                        fullWidth
                                        InputLabelProps={{ shrink: true }}
                                    />
                                </Grid>
                                <Grid item xs={12} md={3}>
                                    <TextField
                                        label='Fecha de Muestreo'
                                        type='date'
                                        required
                                        fullWidth
                                        InputLabelProps={{ shrink: true }}
                                    />
                                </Grid>
                                <Grid item xs={12} md={3}>
                                    <TextField
                                        label='Fecha de Ingreso'
                                        type='date'
                                        defaultValue={new Date().toISOString().split('T')[0]}
                                        required
                                        fullWidth
                                        InputLabelProps={{ shrink: true }}
                                    />
                                </Grid>
                                <Grid item xs={12} md={3}>
                                    <TextField
                                        label='Fecha de Entrega'
                                        type='date'
                                        fullWidth
                                        InputLabelProps={{ shrink: true }}
                                    />
                                </Grid>
                                <Grid item xs={12} md={4}>
                                    <FormControl fullWidth>
                                        <InputLabel>Área</InputLabel>
                                        <Select label='Área'>
                                            <MenuItem value='suelos'>Suelos</MenuItem>
                                            <MenuItem value='hormigon'>Hormigón</MenuItem>
                                            <MenuItem value='asfalto'>Asfalto</MenuItem>
                                        </Select>
                                    </FormControl>
                                </Grid>
                                <Grid item xs={12} md={4}>
                                    <FormControl fullWidth>
                                        <InputLabel>Tipo Servicio</InputLabel>
                                        <Select label='Tipo Servicio'>
                                            <MenuItem value='ensayo'>Ensayo</MenuItem>
                                            <MenuItem value='muestreo'>Muestreo</MenuItem>
                                            <MenuItem value='inspeccion'>Inspección</MenuItem>
                                        </Select>
                                    </FormControl>
                                </Grid>
                                <Grid item xs={12} md={4}>
                                    <FormControl fullWidth>
                                        <InputLabel>Tipo de muestra</InputLabel>
                                        <Select label='Tipo de muestra'>
                                            <MenuItem value='muestra'>Muestra</MenuItem>
                                            <MenuItem value='control'>Control</MenuItem>
                                        </Select>
                                    </FormControl>
                                </Grid>
                                <Grid item xs={12} md={3}>
                                    <TextField
                                        label='Nº Tarjeta'
                                        type='number'
                                        defaultValue='LEO-2026-001'
                                        fullWidth
                                    />
                                </Grid>
                                <Grid item xs={12} md={3}>
                                    <FormControl fullWidth>
                                        <InputLabel>Tipo Material</InputLabel>
                                        <Select label='Tipo Material'>
                                            <MenuItem value='suelo_granular'>Suelo granular</MenuItem>
                                            <MenuItem value='suelo_cohesivo'>Suelo cohesivo</MenuItem>
                                            <MenuItem value='hormigon'>Hormigón</MenuItem>
                                            <MenuItem value='asfalto'>Asfalto</MenuItem>
                                        </Select>
                                    </FormControl>
                                </Grid>
                                <Grid item xs={12} md={3}>
                                    <FormControl fullWidth required>
                                        <InputLabel>Ítem</InputLabel>
                                        <Select label='Ítem'>
                                            <MenuItem value='base'>Base</MenuItem>
                                            <MenuItem value='subbase'>Subbase</MenuItem>
                                            <MenuItem value='subrasante'>Subrasante</MenuItem>
                                            <MenuItem value='terraplen'>Terraplén</MenuItem>
                                        </Select>
                                    </FormControl>
                                </Grid>
                                <Grid item xs={12} md={3}>
                                    <TextField
                                        label='Elemento'
                                        fullWidth
                                    />
                                </Grid>
                                <Grid item xs={12} md={3}>
                                    <FormControl fullWidth>
                                        <InputLabel>Grado</InputLabel>
                                        <Select label='Grado'>
                                            <MenuItem value='1'>Grado 1</MenuItem>
                                            <MenuItem value='2'>Grado 2</MenuItem>
                                            <MenuItem value='3'>Grado 3</MenuItem>
                                            <MenuItem value='4'>Grado 4</MenuItem>
                                        </Select>
                                    </FormControl>
                                </Grid>
                                <Grid item xs={12} md={3}>
                                    <TextField
                                        label='Cota 1'
                                        type='number'
                                        fullWidth
                                    />
                                </Grid>
                                <Grid item xs={12} md={3}>
                                    <TextField
                                        label='Cota 2'
                                        type='number'
                                        fullWidth
                                    />
                                </Grid>
                                <Grid item xs={12} md={3}>
                                    <TextField
                                        label='Cantidad de Muestras'
                                        type='number'
                                        defaultValue='1'
                                        required
                                        fullWidth
                                    />
                                </Grid>
                                <Grid item xs={12} md={4}>
                                    <TextField
                                        label='Procedencia'
                                        fullWidth
                                    />
                                </Grid>
                                <Grid item xs={12} md={4}>
                                    <TextField
                                        label='Ubicación/Sector'
                                        fullWidth
                                    />
                                </Grid>
                                <Grid item xs={12} md={4}>
                                    <FormControl fullWidth>
                                        <InputLabel>Estado</InputLabel>
                                        <Select label='Estado' defaultValue='codificado'>
                                            <MenuItem value='codificado'>Codificado</MenuItem>
                                            <MenuItem value='en_proceso'>En Proceso</MenuItem>
                                            <MenuItem value='ensayado'>Ensayado</MenuItem>
                                        </Select>
                                    </FormControl>
                                </Grid>
                                <Grid item xs={12} md={4}>
                                    <FormControlLabel
                                        control={<Checkbox />}
                                        label='Vencimiento'
                                    />
                                </Grid>
                            </Grid>

                            {/* Ensayos Asociados */}
                            <Box sx={{ mt: 4 }}>
                                <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 2 }}>
                                    <Typography variant='h6' sx={{ fontWeight: 600 }}>
                                        Ensayos Asociados
                                    </Typography>
                                    <Button
                                        startIcon={<SearchIcon />}
                                        variant='outlined'
                                        sx={{ textTransform: 'none' }}
                                        onClick={handleOpenSearchPopover}
                                    >
                                        Buscar ensayo
                                    </Button>
                                </Box>

                                {/* Lista de ensayos */}
                                <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                                    {ensayosAsociados.length === 0 ? (
                                        <Box sx={{ p: 3, textAlign: 'center', bgcolor: '#F5F5F5', borderRadius: '8px' }}>
                                            <Typography variant='body2' color='text.secondary'>
                                                No hay ensayos asociados. Haz clic en "Buscar ensayo" para agregar.
                                            </Typography>
                                        </Box>
                                    ) : (
                                        ensayosAsociados.map(ensayo => (
                                            <Box
                                                key={ensayo.id}
                                                sx={{
                                                    display: 'flex',
                                                    alignItems: 'center',
                                                    justifyContent: 'space-between',
                                                    p: 2,
                                                    bgcolor: '#F5F5F5',
                                                    borderRadius: '8px'
                                                }}
                                            >
                                                <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                                                    <IconButton size='small'>
                                                        <EditIcon fontSize='small' />
                                                    </IconButton>
                                                    <Typography variant='body2'>
                                                        {ensayo.nombre}
                                                        {ensayo.norma && ` (${ensayo.norma})`}
                                                    </Typography>
                                                </Box>
                                                <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                                                    <TextField
                                                        size='small'
                                                        value={ensayo.cantidad}
                                                        onChange={(e) => handleChangeCantidad(ensayo.id, parseInt(e.target.value) || 0)}
                                                        type='number'
                                                        sx={{ width: '80px' }}
                                                        inputProps={{ min: 1 }}
                                                    />
                                                    <IconButton
                                                        size='small'
                                                        color='error'
                                                        onClick={() => handleDeleteEnsayo(ensayo.id)}
                                                    >
                                                        <DeleteIcon fontSize='small' />
                                                    </IconButton>
                                                </Box>
                                            </Box>
                                        ))
                                    )}
                                </Box>
                            </Box>

                            {/* Observaciones */}
                            <Box sx={{ mt: 4 }}>
                                <Typography variant='subtitle2' sx={{ mb: 1, fontWeight: 600 }}>
                                    Observaciones
                                </Typography>
                                <TextField
                                    multiline
                                    rows={3}
                                    fullWidth
                                />
                            </Box>
                        </Box>
                    </Collapse>
                </Box>

                {/* Popover de búsqueda de ensayos */}
                <Popover
                    open={Boolean(anchorEl)}
                    anchorEl={anchorEl}
                    onClose={handleCloseSearchPopover}
                    anchorOrigin={{
                        vertical: 'bottom',
                        horizontal: 'left'
                    }}
                    transformOrigin={{
                        vertical: 'top',
                        horizontal: 'left'
                    }}
                    PaperProps={{
                        sx: {
                            width: '100%',
                            maxWidth: '500px',
                            maxHeight: '400px',
                            overflow: 'auto',
                            zIndex: 1300
                        }
                    }}
                >
                    <Box sx={{ p: 2 }}>
                        <TextField
                            fullWidth
                            size='small'
                            placeholder='Buscar por nombre, descripción o norma...'
                            value={searchTerm}
                            onChange={handleSearchChange}
                            InputProps={{
                                startAdornment: (
                                    <InputAdornment position='start'>
                                        <SearchIcon />
                                    </InputAdornment>
                                )
                            }}
                        />
                        <Box sx={{ mt: 2, display: 'flex', gap: 1 }}>
                            <FormControl size='small' fullWidth>
                                <InputLabel shrink>Área</InputLabel>
                                <Select
                                    key={`area-${filterResetKey}`}
                                    value={selectedAreaId?.toString() || ''}
                                    label='Área'
                                    onChange={handleAreaChange}
                                    displayEmpty
                                    renderValue={selected => selected === '' ? 'Todas' : areas.find(a => a.id.toString() === selected)?.nombre || ''}
                                >
                                    <MenuItem value=''>Todas</MenuItem>
                                    {areas.map(area => (
                                        <MenuItem key={area.id} value={area.id}>
                                            {area.nombre}
                                        </MenuItem>
                                    ))}
                                </Select>
                            </FormControl>
                            <FormControl size='small' fullWidth>
                                <InputLabel shrink>Familia</InputLabel>
                                <Select
                                    key={`familia-${filterResetKey}`}
                                    value={selectedFamilia}
                                    label='Familia'
                                    onChange={handleFamiliaChange}
                                    displayEmpty
                                    renderValue={selected => selected === '' ? 'Todas' : selected}
                                    disabled={!selectedAreaId}
                                >
                                    <MenuItem value=''>Todas</MenuItem>
                                    {familias.map(familia => (
                                        <MenuItem key={familia.id} value={familia.nombre}>
                                            {familia.nombre}
                                        </MenuItem>
                                    ))}
                                </Select>
                            </FormControl>
                        </Box>
                        <Box sx={{ mt: 2, display: 'flex', alignItems: 'center', gap: 2 }}>
                            <FormControlLabel
                                control={
                                    <Switch checked={showOnlyPaquetes} onChange={handleShowOnlyPaquetesChange} size='small' />
                                }
                                label='Solo Paquetes'
                            />
                            <Button
                                size='small'
                                onClick={() => {
                                    handleClearFilters()
                                    setShowOnlyPaquetes(false)
                                }}
                                startIcon={<i className='ri-filter-off-line' />}
                            >
                                Limpiar filtros
                            </Button>
                        </Box>
                    </Box>
                    <List sx={{ pt: 0 }}>
                        {paginatedProductos.length === 0 ? (
                            <Box sx={{ p: 3, textAlign: 'center' }}>
                                <Typography variant='body2' color='text.secondary'>
                                    No se encontraron ensayos
                                </Typography>
                            </Box>
                        ) : (
                            paginatedProductos.map(producto => (
                                <ListItem
                                    key={producto.id}
                                    onClick={() => handleSelectProduct(producto)}
                                    sx={{
                                        cursor: 'pointer',
                                        '&:hover': {
                                            backgroundColor: 'action.hover'
                                        },
                                        flexDirection: 'column',
                                        alignItems: 'flex-start'
                                    }}
                                >
                                    <ListItemText
                                        primary={
                                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                                <Typography variant='body1'>
                                                    {producto.nombre}
                                                    {producto.norma && (
                                                        <Typography component='span' color='text.secondary'>
                                                            {' '}
                                                            - {producto.norma}
                                                        </Typography>
                                                    )}
                                                </Typography>
                                                {producto.esPaquete && (
                                                    <Typography
                                                        variant='caption'
                                                        sx={{
                                                            backgroundColor: 'primary.main',
                                                            color: 'white',
                                                            px: 1,
                                                            py: 0.5,
                                                            borderRadius: 1,
                                                            ml: 1
                                                        }}
                                                    >
                                                        Paquete
                                                    </Typography>
                                                )}
                                            </Box>
                                        }
                                        secondary={
                                            <Box>
                                                <Typography variant='caption' color='text.secondary'>
                                                    {producto.area} {producto.tipo && `- ${producto.tipo}`} {producto.familia && `- ${producto.familia}`}
                                                </Typography>
                                            </Box>
                                        }
                                    />
                                </ListItem>
                            ))
                        )}
                    </List>
                    <Box sx={{ p: 1, borderTop: '1px solid #e0e0e0', display: 'flex', justifyContent: 'center', gap: 1 }}>
                        <Button
                            size='small'
                            onClick={() => setProductsPage(prev => Math.max(0, prev - 1))}
                            disabled={productsPage === 0}
                        >
                            Anterior
                        </Button>
                        <Typography variant='body2' sx={{ alignSelf: 'center' }}>
                            Página {productsPage + 1} de {Math.max(1, Math.ceil(totalProductos / ITEMS_PER_PAGE))}
                        </Typography>
                        <Button
                            size='small'
                            onClick={() => setProductsPage(prev => prev + 1)}
                            disabled={(productsPage + 1) * ITEMS_PER_PAGE >= totalProductos}
                        >
                            Siguiente
                        </Button>
                    </Box>
                </Popover>
            </Box>
        </Card>
    )
}

export default Step2CreateRcms
