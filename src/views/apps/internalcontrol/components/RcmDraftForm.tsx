import React from 'react'
import {
    Box,
    Typography,
    Grid,
    TextField,
    Button,
    FormControl,
    InputLabel,
    Select,
    MenuItem,
    FormControlLabel,
    Checkbox,
    Chip,
    IconButton,
    Collapse,
    Divider,
    Alert,
    Tooltip,
} from '@mui/material'
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider'
import { DatePicker } from '@mui/x-date-pickers/DatePicker'
import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFns'
import { es } from 'date-fns/locale'
import ExpandMoreIcon from '@mui/icons-material/ExpandMore'
import MoreVertIcon from '@mui/icons-material/MoreVert'
import LayersIcon from '@mui/icons-material/Layers'
import SearchIcon from '@mui/icons-material/Search'
import AddIcon from '@mui/icons-material/Add'
import EditIcon from '@mui/icons-material/Edit'
import DeleteIcon from '@mui/icons-material/Delete'
import CloseIcon from '@mui/icons-material/Close'
import CheckCircleIcon from '@mui/icons-material/CheckCircle'
import InventoryIcon from '@mui/icons-material/Inventory'
import type { EnsayoAsociado, AreaType, FamiliaType, SubmuestraVencimiento, ProductoType } from '../types/rcm-types'
import ProductSearchInline from './ProductSearchInline'

// The form prop type matches the return of useRcmForm
interface FormState {
    fechaCodificacion: string
    fechaServicio: string; setFechaServicio: (v: string) => void
    fechaIngreso: string; setFechaIngreso: (v: string) => void
    fechaEntrega: string; setFechaEntrega: (v: string) => void
    fechaConfeccion: string; setFechaConfeccion: (v: string) => void
    expandedRcm: boolean; setExpandedRcm: (v: boolean) => void
    showRcmCard: boolean; setShowRcmCard: (v: boolean) => void
    rcmType: string; setRcmType: (v: string) => void
    sede: string; setSede: (v: string) => void
    customSede: string; setCustomSede: (v: string) => void
    area: number | ''; setArea: (v: number | '') => void
    tipoServicio: number | ''; setTipoServicio: (v: number | '') => void
    numeroTarjeta: string; setNumeroTarjeta: (v: string) => void
    tomaMuestra: string; setTomaMuestra: (v: string) => void
    tipoMaterial: string; setTipoMaterial: (v: string) => void
    customTipoMaterial: string; setCustomTipoMaterial: (v: string) => void
    item: string; setItem: (v: string) => void
    customItem: string; setCustomItem: (v: string) => void
    elemento: string; setElemento: (v: string) => void
    grado: string; setGrado: (v: string) => void
    customGrado: string; setCustomGrado: (v: string) => void
    cota1: string; setCota1: (v: string) => void
    cota2: string; setCota2: (v: string) => void
    procedencia: string; setProcedencia: (v: string) => void
    ubicacionSector: string; setUbicacionSector: (v: string) => void
    observacionItem: string; setObservacionItem: (v: string) => void
    cantidadMuestras: string; setCantidadMuestras: (v: string) => void
    informeEnsayo: boolean; setInformeEnsayo: (v: boolean) => void
    tieneVencimiento: boolean; setTieneVencimiento: (v: boolean) => void
    submuestrasVencimiento: SubmuestraVencimiento[]; setSubmuestrasVencimiento: (v: SubmuestraVencimiento[]) => void
    errorVencimiento: string; setErrorVencimiento: (v: string) => void
    getTodayDateForInput: () => string
}

interface EnsayoHandlers {
    ensayosPendientes: Set<number>
    lastEnsayoCantidadRef: React.RefObject<HTMLInputElement>
    handleDeleteEnsayo: (id: number) => void
    handleDeleteSubProducto: (ensayoId: number, subProductoId: number) => void
    handleToggleEditSubProducto: (ensayoId: number, subProductoId: number) => void
    handleChangeSubProductoCantidad: (ensayoId: number, subProductoId: number, cantidad: number) => void
    handleChangeSubProductoObservacion: (ensayoId: number, subProductoId: number, obs: string) => void
    handleToggleEditEnsayo: (id: number) => void
    handleConfirmEnsayo: (id: number) => void
    handleCancelEnsayo: (id: number) => void
    handleChangeCantidad: (id: number, cantidad: number) => void
    handleKeyPressQuantity: (e: React.KeyboardEvent, id: number) => void
    handleChangeObservacion: (id: number, obs: string) => void
}

interface RcmDraftFormProps {
    form: FormState
    ensayoHandlers: EnsayoHandlers
    ensayosAsociados: EnsayoAsociado[]
    areas: AreaType[]
    todasLasFamilias: FamiliaType[]
    isEditingRcm: boolean
    isSavingRcm: boolean
    onSaveRcm: () => void
    onCancelEdit: () => void
    // New search-related props for inline rendering
    searchTerm: string
    onSearchChange: (e: React.ChangeEvent<HTMLInputElement>) => void
    paginatedProductos: ProductoType[]
    totalProductos: number
    productsPage: number
    onPageChange: (page: number) => void
    showOnlyPaquetes: boolean
    onShowOnlyPaquetesChange: () => void
    onSelectProduct: (producto: ProductoType) => void
}

const RcmDraftForm: React.FC<RcmDraftFormProps> = ({
    form, ensayoHandlers, ensayosAsociados,
    areas, todasLasFamilias,
    isEditingRcm, isSavingRcm,
    onSaveRcm, onCancelEdit,
    searchTerm, onSearchChange, paginatedProductos,
    totalProductos, productsPage, onPageChange,
    showOnlyPaquetes, onShowOnlyPaquetesChange, onSelectProduct
}) => {

    const {
        fechaCodificacion, fechaServicio, setFechaServicio,
        fechaIngreso, setFechaIngreso, fechaEntrega, setFechaEntrega,
        fechaConfeccion, setFechaConfeccion,
        expandedRcm, setExpandedRcm,
        showRcmCard, rcmType,
        sede, setSede, customSede, setCustomSede,
        area, setArea, tipoServicio, setTipoServicio,
        numeroTarjeta, setNumeroTarjeta, tomaMuestra, setTomaMuestra,
        tipoMaterial, setTipoMaterial, customTipoMaterial, setCustomTipoMaterial,
        item, setItem, customItem, setCustomItem,
        elemento, setElemento, grado, setGrado, customGrado, setCustomGrado,
        cota1, setCota1, cota2, setCota2,
        procedencia, setProcedencia, ubicacionSector, setUbicacionSector,
        observacionItem, setObservacionItem,
        cantidadMuestras, setCantidadMuestras,
        informeEnsayo, setInformeEnsayo,
        tieneVencimiento, setTieneVencimiento,
        submuestrasVencimiento, setSubmuestrasVencimiento,
        errorVencimiento, setErrorVencimiento,
        getTodayDateForInput,
    } = form

    const {
        ensayosPendientes, lastEnsayoCantidadRef,
        handleDeleteEnsayo, handleDeleteSubProducto,
        handleToggleEditSubProducto, handleChangeSubProductoCantidad,
        handleChangeSubProductoObservacion, handleToggleEditEnsayo,
        handleConfirmEnsayo, handleCancelEnsayo,
        handleChangeCantidad, handleKeyPressQuantity, handleChangeObservacion,
    } = ensayoHandlers

    const [showSearch, setShowSearch] = React.useState(false)

    React.useEffect(() => {
        if (!area) {
            setShowSearch(false)
        }
    }, [area])

    // Recalculate fechaVencimiento for all submuestras when fechaConfeccion changes
    React.useEffect(() => {
        if (!tieneVencimiento || !fechaConfeccion || submuestrasVencimiento.length === 0) return
        const updated = submuestrasVencimiento.map(s => {
            if (s.dias <= 0) return s
            const fechaBase = new Date(fechaConfeccion + 'T00:00:00')
            fechaBase.setDate(fechaBase.getDate() + s.dias)
            const fechaVencimiento = `${fechaBase.getFullYear()}-${String(fechaBase.getMonth() + 1).padStart(2, '0')}-${String(fechaBase.getDate()).padStart(2, '0')}`
            return { ...s, fechaVencimiento }
        })
        setSubmuestrasVencimiento(updated)
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [fechaConfeccion])

    const handleToggleExpand = () => setExpandedRcm(!expandedRcm)

    if (!showRcmCard) return null

    // Shared Sede Select (for Muestra / Control / Servicio)
    const renderSedeSelect = (labelId: string) => (
        <Grid item xs={12} md={4}>
            <FormControl fullWidth>
                <InputLabel id={labelId}>Sede</InputLabel>
                <Select labelId={labelId} label='Sede' value={sede}
                    onChange={(e) => { setSede(e.target.value); if (e.target.value !== 'Otro') setCustomSede('') }}>
                    <MenuItem value='PA Chillán'>PA Chillán</MenuItem>
                    <MenuItem value='PA Concepción'>PA Concepción</MenuItem>
                    <MenuItem value='Cliente'>Cliente</MenuItem>
                    <MenuItem value='Otro'>Otro</MenuItem>
                </Select>
            </FormControl>
            {sede === 'Otro' && (
                <TextField label='Especificar Sede' value={customSede} onChange={(e) => setCustomSede(e.target.value)}
                    fullWidth required placeholder='Ingrese la sede' sx={{ mt: 2 }} />
            )}
        </Grid>
    )

    const renderAreaTipoServicio = (areaLabelId: string, tipoLabelId: string) => (
        <>
            <Grid item xs={12} md={4}>
                <FormControl fullWidth>
                    <InputLabel id={areaLabelId} shrink>Área</InputLabel>
                    <Select labelId={areaLabelId} label='Área' value={area} displayEmpty notched
                        onChange={(e) => { setArea(e.target.value as number | ''); setTipoServicio('') }}>
                        <MenuItem value='' disabled>Seleccionar área</MenuItem>
                        {areas.map((a) => <MenuItem key={a.id} value={a.id}>{a.nombre}</MenuItem>)}
                    </Select>
                </FormControl>
            </Grid>
            <Grid item xs={12} md={4}>
                <FormControl fullWidth>
                    <InputLabel id={tipoLabelId} shrink>Tipo Servicio</InputLabel>
                    <Select labelId={tipoLabelId} label='Tipo Servicio' value={tipoServicio} displayEmpty notched disabled={!area}
                        onChange={(e) => setTipoServicio(e.target.value as number | '')}>
                        <MenuItem value='' disabled>Seleccionar tipo de servicio</MenuItem>
                        {todasLasFamilias.filter(f => f.areaId === area).map((f) => <MenuItem key={f.id} value={f.id}>{f.nombre}</MenuItem>)}
                    </Select>
                </FormControl>
            </Grid>
        </>
    )

    const renderDatesRow = (fechaLabel: string) => (
        <Grid container spacing={3} sx={{ mt: 0 }}>
            <Grid item xs={12} md={3}>
                <TextField label='Fecha Codificación' type='date' value={fechaCodificacion} required fullWidth disabled
                    InputLabelProps={{ shrink: true }} InputProps={{ readOnly: true }} />
            </Grid>
            <Grid item xs={12} md={3}>
                <TextField label={fechaLabel} type='date' value={fechaServicio} onChange={(e) => setFechaServicio(e.target.value)}
                    required fullWidth InputLabelProps={{ shrink: true }} />
            </Grid>
            <Grid item xs={12} md={3}>
                <TextField label='Fecha de Ingreso' type='date' value={fechaIngreso} onChange={(e) => setFechaIngreso(e.target.value)}
                    required fullWidth InputLabelProps={{ shrink: true }} />
            </Grid>
            <Grid item xs={12} md={3}>
                <TextField label='Fecha de Entrega' type='date' value={fechaEntrega} onChange={(e) => setFechaEntrega(e.target.value)}
                    fullWidth InputLabelProps={{ shrink: true }} />
            </Grid>
        </Grid>
    )

    const areaName = areas.find(a => a.id === area)?.nombre?.toLowerCase() || ''

    return (
        <>
            {/* Borradores header */}
            <Box sx={{ mt: 3 }}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, mb: 2 }}>
                    <Typography variant='h6' sx={{ fontWeight: 600 }}>Borradores</Typography>
                    <Chip label='1' size='small' sx={{ fontWeight: 700, bgcolor: '#EEEEEE', color: '#616161', border: '1px solid #BDBDBD', minWidth: 28 }} />
                </Box>
            </Box>

            {/* RCM Card (Borrador) */}
            <Box sx={{ bgcolor: '#E3F2FD', borderRadius: '8px', overflow: 'hidden' }}>
                {/* Header del RCM */}
                <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', p: 2, bgcolor: '#E3F2FD' }}>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                        <IconButton size='small' onClick={handleToggleExpand}>
                            <ExpandMoreIcon sx={{ transform: expandedRcm ? 'rotate(0deg)' : 'rotate(-90deg)', transition: 'transform 0.3s' }} />
                        </IconButton>
                        <Chip label={rcmType.toUpperCase()}
                            sx={{ fontWeight: 'bold', backgroundColor: rcmType === 'Muestra' ? '#1976d2' : rcmType === 'Control' ? '#e91e63' : '#424242', color: '#ffffff' }} />
                        <Typography variant='body2' sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                            <span style={{ fontWeight: 700, fontSize: '0.95rem' }}>{isEditingRcm ? 'Editar RCM' : 'Nuevo RCM'}</span>
                            <span style={{ color: '#616161' }}>—</span>
                            <span style={{ color: '#616161', fontSize: '0.8rem' }}>{isEditingRcm ? 'modifica los datos y actualiza al finalizar' : 'completa los datos y guarda al finalizar'}</span>
                        </Typography>
                        {numeroTarjeta && <Typography variant='body1' sx={{ fontWeight: 600 }}>Tarjeta: {numeroTarjeta}</Typography>}
                        {(tipoMaterial || item) && (
                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, color: 'text.secondary' }}>
                                <LayersIcon fontSize='small' />
                                <Typography variant='body2'>
                                    {tipoMaterial && `Material: ${tipoMaterial}`}
                                    {tipoMaterial && item && ' • '}
                                    {item && `Ítem: ${item}`}
                                </Typography>
                            </Box>
                        )}
                    </Box>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                        {isEditingRcm && (
                            <>
                                <Checkbox />
                                <IconButton size='small'><MoreVertIcon /></IconButton>
                            </>
                        )}
                        <Button
                            variant='outlined'
                            size='small'
                            sx={{
                                textTransform: 'none',
                                px: 2,
                                bgcolor: 'white',
                                color: '#616161',
                                borderColor: '#BDBDBD',
                                '&:hover': { bgcolor: '#F5F5F5', borderColor: '#9E9E9E' },
                            }}
                            onClick={onCancelEdit}
                        >
                            Cancelar
                        </Button>
                    </Box>
                </Box>

                {/* Contenido colapsable del RCM */}
                <Collapse in={expandedRcm}>
                    <Box sx={{ p: 3, bgcolor: 'white' }}>
                        {/* ═══ TIPO MUESTRA ═══ */}
                        {rcmType === 'Muestra' ? (
                            <>
                                <Grid container spacing={3}>
                                    {renderAreaTipoServicio('area-label-muestra', 'tipo-servicio-label-muestra')}
                                    {renderSedeSelect('sede-label-muestra')}
                                </Grid>
                                {renderDatesRow('Fecha Muestreo')}

                                <Typography variant='subtitle1' sx={{ fontWeight: 700, mt: 4, mb: 1 }}>Descripción de la muestra</Typography>
                                <Divider sx={{ mb: 3 }} />

                                <Grid container spacing={3}>
                                    <Grid item xs={12} md={3}>
                                        <FormControl fullWidth>
                                            <InputLabel>Tipo Material</InputLabel>
                                            <Select label='Tipo Material' value={tipoMaterial} onChange={(e) => setTipoMaterial(e.target.value)}>
                                                <MenuItem value='Suelo granular'>Suelo granular</MenuItem>
                                                <MenuItem value='Suelo cohesivo'>Suelo cohesivo</MenuItem>
                                                <MenuItem value='Hormigón'>Hormigón</MenuItem>
                                                <MenuItem value='Asfalto'>Asfalto</MenuItem>
                                                <MenuItem value='Otro'>Otro</MenuItem>
                                            </Select>
                                        </FormControl>
                                        {tipoMaterial === 'Otro' && (
                                            <TextField label='Especificar Material' value={customTipoMaterial}
                                                onChange={(e) => setCustomTipoMaterial(e.target.value)} fullWidth required
                                                placeholder='Ingrese el tipo de material' sx={{ mt: 2 }} />
                                        )}
                                    </Grid>
                                    <Grid item xs={12} md={3}>
                                        <FormControl fullWidth required>
                                            <InputLabel>Ítem</InputLabel>
                                            <Select label='Ítem' value={item} onChange={(e) => setItem(e.target.value)}>
                                                <MenuItem value='Base'>Base</MenuItem>
                                                <MenuItem value='Subbase'>Subbase</MenuItem>
                                                <MenuItem value='Subrasante'>Subrasante</MenuItem>
                                                <MenuItem value='Terraplén'>Terraplén</MenuItem>
                                                <MenuItem value='Otro'>Otro</MenuItem>
                                            </Select>
                                        </FormControl>
                                        {item === 'Otro' && (
                                            <TextField label='Especificar Ítem' value={customItem}
                                                onChange={(e) => setCustomItem(e.target.value)} fullWidth required
                                                placeholder='Ingrese el ítem' sx={{ mt: 2 }} />
                                        )}
                                    </Grid>
                                    <Grid item xs={12} md={3}>
                                        <TextField label='Nº Tarjeta' value={numeroTarjeta} onChange={(e) => setNumeroTarjeta(e.target.value)} required fullWidth />
                                    </Grid>
                                    <Grid item xs={12} md={3}>
                                        <TextField label='Nº Muestra' value={tomaMuestra} onChange={(e) => setTomaMuestra(e.target.value)} fullWidth />
                                    </Grid>
                                </Grid>

                                <Grid container spacing={3} sx={{ mt: 0 }}>
                                    <Grid item xs={12} md={6}>
                                        <TextField label='Procedencia' value={procedencia} onChange={(e) => setProcedencia(e.target.value)} fullWidth />
                                    </Grid>
                                    <Grid item xs={12} md={6}>
                                        <TextField label='Ubicación/Sector' value={ubicacionSector} onChange={(e) => setUbicacionSector(e.target.value)} fullWidth />
                                    </Grid>
                                </Grid>

                                <Grid container spacing={3} sx={{ mt: 0 }} alignItems='center'>
                                    <Grid item xs={12} md={3}>
                                        <TextField label='Cantidad de Muestras' type='number' value={cantidadMuestras}
                                            onChange={(e) => { setErrorVencimiento(''); setCantidadMuestras(e.target.value) }} required fullWidth />
                                    </Grid>
                                    <Grid item xs={12} md={3}>
                                        <FormControlLabel control={<Checkbox checked={tieneVencimiento} onChange={(e) => setTieneVencimiento(e.target.checked)} />} label='Vencimiento (activa Submuestras)' />
                                    </Grid>
                                    <Grid item xs={12} md={3}>
                                        <FormControlLabel control={<Checkbox checked={informeEnsayo} onChange={(e) => setInformeEnsayo(e.target.checked)} />} label='Informe Ensayo' />
                                    </Grid>
                                </Grid>
                            </>
                        ) : rcmType === 'Control' ? (
                            /* ═══ TIPO CONTROL ═══ */
                            <>
                                <Grid container spacing={3}>
                                    {renderAreaTipoServicio('area-label-control', 'tipo-servicio-label-control')}
                                    {renderSedeSelect('sede-label-control')}
                                </Grid>
                                {renderDatesRow('Fecha de Servicio')}

                                <Typography variant='subtitle1' sx={{ fontWeight: 700, mt: 4, mb: 1 }}>Descripción del control</Typography>
                                <Divider sx={{ mb: 3 }} />

                                <Grid container spacing={3}>
                                    <Grid item xs={12} md={6}>
                                        <FormControl fullWidth required>
                                            <InputLabel>Ítem</InputLabel>
                                            <Select label='Ítem' value={item} onChange={(e) => setItem(e.target.value)}>
                                                <MenuItem value='Base'>Base</MenuItem>
                                                <MenuItem value='Subbase'>Subbase</MenuItem>
                                                <MenuItem value='Subrasante'>Subrasante</MenuItem>
                                                <MenuItem value='Terraplén'>Terraplén</MenuItem>
                                                <MenuItem value='Otro'>Otro</MenuItem>
                                            </Select>
                                        </FormControl>
                                    </Grid>
                                    <Grid item xs={12} md={6}>
                                        <TextField label='Observación al Ítem' value={observacionItem}
                                            onChange={(e) => setObservacionItem(e.target.value)} fullWidth placeholder='Ingrese observaciones sobre el ítem...' />
                                    </Grid>
                                </Grid>
                                {item === 'Otro' && (
                                    <Grid container spacing={3} sx={{ mt: 0 }}>
                                        <Grid item xs={12} md={6}>
                                            <TextField label='Especificar Ítem' value={customItem}
                                                onChange={(e) => setCustomItem(e.target.value)} fullWidth required placeholder='Ingrese el ítem' />
                                        </Grid>
                                    </Grid>
                                )}
                                <Grid container spacing={3} sx={{ mt: 0 }} alignItems='center'>
                                    <Grid item xs={12} md={6}>
                                        <TextField label='Ubicación/Sector' value={ubicacionSector} onChange={(e) => setUbicacionSector(e.target.value)} fullWidth />
                                    </Grid>
                                    <Grid item xs={12} md={3}>
                                        <FormControlLabel control={<Checkbox checked={informeEnsayo} onChange={(e) => setInformeEnsayo(e.target.checked)} />} label='Informe de Ensayo' />
                                    </Grid>
                                </Grid>
                            </>
                        ) : (
                            /* ═══ TIPO SERVICIO ═══ */
                            <>
                                <Grid container spacing={3}>
                                    {renderAreaTipoServicio('area-label-servicio', 'tipo-servicio-label-servicio')}
                                    {renderSedeSelect('sede-label-servicio')}
                                </Grid>
                                {renderDatesRow('Fecha de Servicio')}

                                <Typography variant='subtitle1' sx={{ fontWeight: 700, mt: 4, mb: 1 }}>Descripción del servicio</Typography>
                                <Divider sx={{ mb: 3 }} />

                                <Grid container spacing={3} alignItems='center'>
                                    <Grid item xs={12} md={8}>
                                        <TextField label='Descripción' value={observacionItem}
                                            onChange={(e) => setObservacionItem(e.target.value)} fullWidth multiline rows={3}
                                            placeholder='Ingrese una descripción del servicio...' />
                                    </Grid>
                                    <Grid item xs={12} md={4}>
                                        <FormControlLabel control={<Checkbox checked={informeEnsayo} onChange={(e) => setInformeEnsayo(e.target.checked)} />} label='Informe de Ensayo' />
                                    </Grid>
                                </Grid>
                            </>
                        )}

                        {/* Campos dinámicos Área Hormigón */}
                        {rcmType === 'Muestra' && (areaName === 'hormigón' || areaName === 'elementos y componentes') && (
                            <Box sx={{ mt: 4, p: 3, border: '1px solid #f3e5f5', borderRadius: 2, bgcolor: '#fdf6ff' }}>
                                <Typography variant='overline' sx={{ fontWeight: 800, letterSpacing: 2, color: '#e91e8c', display: 'block', mb: 2 }}>
                                    Campos Dinámicos — Área {areas.find(a => a.id === area)?.nombre}
                                </Typography>
                                <Grid container spacing={3}>
                                    <Grid item xs={12} md={3}>
                                        <TextField label='Fecha Confección' type='date' value={fechaConfeccion}
                                            onChange={(e) => setFechaConfeccion(e.target.value)} fullWidth InputLabelProps={{ shrink: true }} />
                                    </Grid>
                                    <Grid item xs={12} md={3}>
                                        <TextField label='Elemento' value={elemento} onChange={(e) => setElemento(e.target.value)} fullWidth />
                                    </Grid>
                                    {areaName !== 'elementos y componentes' && (
                                        <>
                                            <Grid item xs={12} md={3}>
                                                <FormControl fullWidth>
                                                    <InputLabel>Grado</InputLabel>
                                                    <Select label='Grado' value={grado} onChange={(e) => setGrado(e.target.value)}>
                                                        <MenuItem value=''>Seleccionar...</MenuItem>
                                                        {['G5', 'G10', 'G15', 'G20', 'G25', 'G30', 'G35', 'G40'].map(g =>
                                                            <MenuItem key={g} value={g}>{g}</MenuItem>)}
                                                        <MenuItem value='Otro'>Otro...</MenuItem>
                                                    </Select>
                                                </FormControl>
                                            </Grid>
                                            {grado === 'Otro' && (
                                                <Grid item xs={12} md={3}>
                                                    <TextField label='Especificar Grado' value={customGrado}
                                                        onChange={(e) => setCustomGrado(e.target.value)} fullWidth required placeholder='Ingrese el grado' />
                                                </Grid>
                                            )}
                                        </>
                                    )}
                                </Grid>
                            </Box>
                        )}

                        {/* Campos dinámicos Área Asfalto */}
                        {rcmType === 'Muestra' && areaName === 'asfalto' && (
                            <Box sx={{ mt: 4, p: 3, border: '1px solid #f3e5f5', borderRadius: 2, bgcolor: '#fdf6ff' }}>
                                <Typography variant='overline' sx={{ fontWeight: 800, letterSpacing: 2, color: '#e91e8c', display: 'block', mb: 2 }}>
                                    Campos Dinámicos — Área Asfalto
                                </Typography>
                                <Grid container spacing={3}>
                                    <Grid item xs={6} md={3}>
                                        <TextField label='Fecha Confección' type='date' value={fechaConfeccion}
                                            onChange={(e) => setFechaConfeccion(e.target.value)} fullWidth InputLabelProps={{ shrink: true }} />
                                    </Grid>
                                </Grid>
                            </Box>
                        )}

                        {/* Campos dinámicos Área Suelo */}
                        {rcmType === 'Muestra' && areaName === 'suelo' && (
                            <Box sx={{ mt: 4, p: 3, border: '1px solid #f3e5f5', borderRadius: 2, bgcolor: '#fdf6ff' }}>
                                <Typography variant='overline' sx={{ fontWeight: 800, letterSpacing: 2, color: '#e91e8c', display: 'block', mb: 2 }}>
                                    Campos Dinámicos — Área Suelo
                                </Typography>
                                <Grid container spacing={3}>
                                    <Grid item xs={6} md={3}>
                                        <TextField label='Cota 1' type='number' value={cota1}
                                            onChange={(e) => setCota1(e.target.value)} fullWidth placeholder='Ej: 0.0' />
                                    </Grid>
                                    <Grid item xs={6} md={3}>
                                        <TextField label='Cota 2' type='number' value={cota2}
                                            onChange={(e) => setCota2(e.target.value)} fullWidth placeholder='Ej: 1.5' />
                                    </Grid>
                                </Grid>
                            </Box>
                        )}

                        {/* ═══ Ensayos Asociados ═══ */}
                        <Box sx={{ mt: 4 }}>
                            <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 2 }}>
                                <Typography variant='h6' sx={{ fontWeight: 600 }}>Ensayos y servicios asociados</Typography>
                            </Box>

                            {ensayosAsociados.length === 0 ? (
                                <Box sx={{ p: 3, textAlign: 'center', bgcolor: '#F5F5F5', borderRadius: '8px' }}>
                                    <Typography variant='body2' color='text.secondary'>No hay ensayos asociados. Haz clic en "Buscar ensayo" para agregar.</Typography>
                                </Box>
                            ) : (
                                <Box sx={{ overflowX: 'auto' }}>
                                    <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                                        <thead>
                                            <tr style={{ backgroundColor: '#F5F5F5' }}>
                                                <th style={{ padding: '12px', textAlign: 'left', fontWeight: 600, fontSize: '14px', borderBottom: '2px solid #E0E0E0' }}>SKU</th>
                                                <th style={{ padding: '12px', textAlign: 'left', fontWeight: 600, fontSize: '14px', borderBottom: '2px solid #E0E0E0' }}>Nombre</th>
                                                <th style={{ padding: '12px', textAlign: 'center', fontWeight: 600, fontSize: '14px', borderBottom: '2px solid #E0E0E0', width: '100px' }}>Cantidad</th>
                                                <th style={{ padding: '12px', textAlign: 'left', fontWeight: 600, fontSize: '14px', borderBottom: '2px solid #E0E0E0', width: '200px' }}>Observación</th>
                                                <th style={{ padding: '12px', textAlign: 'center', fontWeight: 600, fontSize: '14px', borderBottom: '2px solid #E0E0E0', width: '80px' }}>Acciones</th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {ensayosAsociados.map((ensayo, index) =>
                                                ensayo.esPaquete ? (
                                                    <React.Fragment key={ensayo.id}>
                                                        <tr style={{ backgroundColor: '#E3F2FD', borderBottom: '1px solid #BBDEFB' }}>
                                                            <td style={{ padding: '12px' }}>
                                                                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                                                    <InventoryIcon sx={{ fontSize: 18, color: '#1565C0' }} />
                                                                    <Typography variant='body2' sx={{ fontFamily: 'monospace', fontWeight: 700, color: '#1565C0' }}>PAQUETE SKU {ensayo.sku}</Typography>
                                                                </Box>
                                                            </td>
                                                            <td style={{ padding: '12px' }}><Typography variant='body2' sx={{ fontWeight: 600 }}>{ensayo.nombre}</Typography></td>
                                                            <td colSpan={2} style={{ padding: '12px' }}>
                                                                <Alert severity='warning' sx={{ py: 0, px: 1, '& .MuiAlert-message': { fontSize: '12px' } }}>
                                                                    Puedes quitar ítems individuales; recuerda que ítems fuera de cotización pueden generar costos no previstos
                                                                </Alert>
                                                            </td>
                                                            <td style={{ padding: '12px', textAlign: 'right' }}>
                                                                <Button size='small' color='error' variant='outlined' startIcon={<CloseIcon />}
                                                                    onClick={() => handleDeleteEnsayo(ensayo.id)} sx={{ textTransform: 'none', fontSize: '12px' }}>
                                                                    Quitar paquete completo
                                                                </Button>
                                                            </td>
                                                        </tr>
                                                        {ensayo.subProductos?.map((sub) => (
                                                            <tr key={sub.id} style={{ borderBottom: '1px solid #E3F2FD', backgroundColor: '#F5F9FF' }}>
                                                                <td style={{ padding: '12px', paddingLeft: '36px' }}>
                                                                    <Typography variant='body2' sx={{ fontFamily: 'monospace', color: '#1976D2' }}>{sub.sku}</Typography>
                                                                </td>
                                                                <td style={{ padding: '12px' }}>
                                                                    <Typography variant='body2'>{sub.nombre}</Typography>
                                                                    {sub.norma && <Typography variant='caption' color='text.secondary'>{sub.norma}</Typography>}
                                                                </td>
                                                                <td style={{ padding: '12px', textAlign: 'center' }}>
                                                                    {sub.isEditing ? (
                                                                        <TextField size='small' value={sub.cantidad}
                                                                            onChange={(e) => handleChangeSubProductoCantidad(ensayo.id, sub.id, parseInt(e.target.value) || 0)}
                                                                            type='number' sx={{ width: '80px' }} inputProps={{ min: 1 }} />
                                                                    ) : (
                                                                        <Typography variant='body2'>{sub.cantidad}</Typography>
                                                                    )}
                                                                </td>
                                                                <td style={{ padding: '12px' }}>
                                                                    {sub.isEditing ? (
                                                                        <TextField size='small' fullWidth value={sub.observacion}
                                                                            onChange={(e) => handleChangeSubProductoObservacion(ensayo.id, sub.id, e.target.value)}
                                                                            placeholder='Observación...' />
                                                                    ) : (
                                                                        <Typography variant='body2' color='text.secondary'>{sub.observacion || '\u2014'}</Typography>
                                                                    )}
                                                                </td>
                                                                <td style={{ padding: '12px', textAlign: 'center' }}>
                                                                    <Box sx={{ display: 'flex', gap: 0.5, justifyContent: 'center' }}>
                                                                        <IconButton size='small' sx={{ color: '#FFA726' }}
                                                                            onClick={() => handleToggleEditSubProducto(ensayo.id, sub.id)}
                                                                            title={sub.isEditing ? 'Guardar cambios' : 'Modificar'}>
                                                                            {sub.isEditing ? <CheckCircleIcon fontSize='small' /> : <EditIcon fontSize='small' />}
                                                                        </IconButton>
                                                                        <IconButton size='small' color='error'
                                                                            onClick={() => handleDeleteSubProducto(ensayo.id, sub.id)} title='Quitar del paquete'>
                                                                            <DeleteIcon fontSize='small' />
                                                                        </IconButton>
                                                                    </Box>
                                                                </td>
                                                            </tr>
                                                        ))}
                                                    </React.Fragment>
                                                ) : (
                                                    <tr key={ensayo.id} style={{ borderBottom: '1px solid #E0E0E0' }}>
                                                        <td style={{ padding: '12px' }}>
                                                            <Typography variant='body2' sx={{ fontFamily: 'monospace', color: 'text.secondary' }}>{ensayo.sku}</Typography>
                                                        </td>
                                                        <td style={{ padding: '12px' }}>
                                                            <Typography variant='body2'>{ensayo.nombre}</Typography>
                                                            {ensayo.norma && <Typography variant='caption' color='text.secondary'>{ensayo.norma}</Typography>}
                                                        </td>
                                                        <td style={{ padding: '12px', textAlign: 'center' }}>
                                                            {ensayo.isEditing || ensayosPendientes.has(ensayo.id) ? (
                                                                <TextField
                                                                    ref={index === ensayosAsociados.length - 1 ? lastEnsayoCantidadRef : null}
                                                                    size='small' value={ensayo.cantidad}
                                                                    onChange={(e) => handleChangeCantidad(ensayo.id, parseInt(e.target.value) || 0)}
                                                                    onKeyPress={(e) => handleKeyPressQuantity(e, ensayo.id)}
                                                                    type='number' sx={{ width: '80px' }} inputProps={{ min: 1 }} />
                                                            ) : (
                                                                <Typography variant='body2'>{ensayo.cantidad}</Typography>
                                                            )}
                                                        </td>
                                                        <td style={{ padding: '12px' }}>
                                                            {ensayo.isEditing || ensayosPendientes.has(ensayo.id) ? (
                                                                <TextField size='small' fullWidth value={ensayo.observacion}
                                                                    onChange={(e) => handleChangeObservacion(ensayo.id, e.target.value)} placeholder='Observación...' />
                                                            ) : (
                                                                <Typography variant='body2' color='text.secondary'>{ensayo.observacion || '\u2014'}</Typography>
                                                            )}
                                                        </td>
                                                        <td style={{ padding: '12px', textAlign: 'center' }}>
                                                            {ensayosPendientes.has(ensayo.id) ? (
                                                                <Box sx={{ display: 'flex', gap: 1, justifyContent: 'center' }}>
                                                                    <IconButton size='small' color='success' onClick={() => handleConfirmEnsayo(ensayo.id)} title='Confirmar ensayo'>
                                                                        <CheckCircleIcon fontSize='small' />
                                                                    </IconButton>
                                                                    <IconButton size='small' color='error' onClick={() => handleCancelEnsayo(ensayo.id)} title='Cancelar ensayo'>
                                                                        <CloseIcon fontSize='small' />
                                                                    </IconButton>
                                                                </Box>
                                                            ) : (
                                                                <Box sx={{ display: 'flex', gap: 0.5, justifyContent: 'center' }}>
                                                                    <IconButton size='small' sx={{ color: '#FFA726' }}
                                                                        onClick={() => handleToggleEditEnsayo(ensayo.id)}
                                                                        title={ensayo.isEditing ? 'Guardar cambios' : 'Modificar'}>
                                                                        {ensayo.isEditing ? <CheckCircleIcon fontSize='small' /> : <EditIcon fontSize='small' />}
                                                                    </IconButton>
                                                                    <IconButton size='small' color='error' onClick={() => handleDeleteEnsayo(ensayo.id)} title='Eliminar ensayo'>
                                                                        <DeleteIcon fontSize='small' />
                                                                    </IconButton>
                                                                </Box>
                                                            )}
                                                        </td>
                                                    </tr>
                                                )
                                            )}
                                        </tbody>
                                    </table>
                                </Box>
                            )}

                            <Box sx={{ mt: 2, display: 'flex', justifyContent: 'flex-start', alignItems: 'center', gap: 2 }}>
                                <Tooltip title={!area ? 'Seleccione un Área para buscar ensayos' : ''}>
                                    <span>
                                        <Button
                                            variant='outlined'
                                            color={showSearch ? 'error' : 'primary'}
                                            startIcon={showSearch ? <CloseIcon /> : <SearchIcon />}
                                            onClick={() => setShowSearch(!showSearch)}
                                            sx={{ textTransform: 'none' }}
                                            disabled={!area}
                                        >
                                            {showSearch ? 'Cerrar buscador' : 'Buscar ensayo'}
                                        </Button>
                                    </span>
                                </Tooltip>
                                {!area ? (
                                    <Typography variant="caption" color="error">
                                        * Selecciona un Área para buscar ensayos.
                                    </Typography>
                                ) : (
                                    showSearch && (
                                        <Typography variant="caption" color="text.secondary">
                                            Explora y selecciona los ensayos para añadirlos a la tabla superior.
                                        </Typography>
                                    )
                                )}
                            </Box>

                            <Collapse in={showSearch} timeout="auto" unmountOnExit>
                                <ProductSearchInline
                                    searchTerm={searchTerm}
                                    onSearchChange={onSearchChange}
                                    paginatedProductos={paginatedProductos}
                                    totalProductos={totalProductos}
                                    productsPage={productsPage}
                                    onPageChange={onPageChange}
                                    areaName={areas.find(a => a.id === area)?.nombre}
                                    showOnlyPaquetes={showOnlyPaquetes}
                                    onShowOnlyPaquetesChange={onShowOnlyPaquetesChange}
                                    onSelectProduct={onSelectProduct}
                                />
                            </Collapse>
                        </Box>

                        {/* ═══ Submuestras con Vencimiento ═══ */}
                        {tieneVencimiento && (
                            <Box sx={{ mt: 4 }}>
                                <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 2 }}>
                                    <Box>
                                        <Typography variant='h6' sx={{ fontWeight: 600 }}>Submuestras con Vencimiento</Typography>
                                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mt: 1 }}>
                                            <Typography variant='body2' color='text.secondary'>Cantidad requerida: {cantidadMuestras}</Typography>
                                            <Typography variant='body2' sx={{
                                                color: submuestrasVencimiento.reduce((sum, sub) => sum + sub.cantidad, 0) === parseInt(cantidadMuestras || '0') ? 'success.main' : 'warning.main',
                                                fontWeight: 600
                                            }}>
                                                Suma actual: {submuestrasVencimiento.reduce((sum, sub) => sum + sub.cantidad, 0)}
                                            </Typography>
                                        </Box>
                                    </Box>
                                    <Button startIcon={<AddIcon />} variant='outlined' size='small' sx={{ textTransform: 'none' }}
                                        onClick={() => {
                                            setErrorVencimiento('')
                                            const newId = submuestrasVencimiento.length > 0 ? Math.max(...submuestrasVencimiento.map(s => s.id)) + 1 : 1
                                            const newNumero = submuestrasVencimiento.length + 1
                                            setSubmuestrasVencimiento([...submuestrasVencimiento, { id: newId, submuestra: `RCM - ${newNumero}`, numero: newNumero, dias: 0, fechaVencimiento: '', cantidad: 1 }])
                                        }}>
                                        Agregar Submuestra
                                    </Button>
                                </Box>

                                {submuestrasVencimiento.length === 0 ? (
                                    <Box sx={{ p: 3, textAlign: 'center', bgcolor: '#F5F5F5', borderRadius: '8px' }}>
                                        <Typography variant='body2' color='text.secondary'>No hay submuestras. Haz clic en "Agregar Submuestra" para añadir.</Typography>
                                    </Box>
                                ) : (
                                    <Box sx={{ overflowX: 'auto' }}>
                                        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                                            <thead>
                                                <tr style={{ backgroundColor: '#F5F5F5' }}>
                                                    <th style={{ padding: '12px', textAlign: 'center', fontWeight: 600, fontSize: '14px', borderBottom: '2px solid #E0E0E0', width: '80px' }}>N°</th>
                                                    <th style={{ padding: '12px', textAlign: 'center', fontWeight: 600, fontSize: '14px', borderBottom: '2px solid #E0E0E0', width: '120px' }}>Días</th>
                                                    <th style={{ padding: '12px', textAlign: 'center', fontWeight: 600, fontSize: '14px', borderBottom: '2px solid #E0E0E0', width: '200px' }}>Fecha Vencimiento</th>
                                                    <th style={{ padding: '12px', textAlign: 'center', fontWeight: 600, fontSize: '14px', borderBottom: '2px solid #E0E0E0', width: '120px' }}>Cantidad</th>
                                                    <th style={{ padding: '12px', textAlign: 'center', fontWeight: 600, fontSize: '14px', borderBottom: '2px solid #E0E0E0', width: '100px' }}>Acciones</th>
                                                </tr>
                                            </thead>
                                            <tbody>
                                                {submuestrasVencimiento.map((submuestra) => (
                                                    <tr key={submuestra.id} style={{ borderBottom: '1px solid #E0E0E0' }}>
                                                        <td style={{ padding: '12px', textAlign: 'center' }}>
                                                            <TextField size='small' type='number' value={submuestra.numero}
                                                                onChange={(e) => {
                                                                    const numero = parseInt(e.target.value) || 0
                                                                    setSubmuestrasVencimiento(submuestrasVencimiento.map(s => s.id === submuestra.id ? { ...s, numero } : s))
                                                                }} sx={{ width: '70px' }} inputProps={{ min: 1 }} />
                                                        </td>
                                                        <td style={{ padding: '12px', textAlign: 'center' }}>
                                                            <TextField size='small' type='number' value={submuestra.dias}
                                                                onChange={(e) => {
                                                                    const dias = parseInt(e.target.value) || 0
                                                                    const baseStr = fechaConfeccion || fechaCodificacion || getTodayDateForInput()
                                                                    const fechaBase = new Date(baseStr + 'T00:00:00')
                                                                    fechaBase.setDate(fechaBase.getDate() + dias)
                                                                    const fechaVenc = `${fechaBase.getFullYear()}-${String(fechaBase.getMonth() + 1).padStart(2, '0')}-${String(fechaBase.getDate()).padStart(2, '0')}`
                                                                    setSubmuestrasVencimiento(submuestrasVencimiento.map(s => s.id === submuestra.id ? { ...s, dias, fechaVencimiento: fechaVenc } : s))
                                                                }} sx={{ width: '100px' }} inputProps={{ min: 0 }} />
                                                        </td>
                                                        <td style={{ padding: '12px', textAlign: 'center' }}>
                                                            <LocalizationProvider dateAdapter={AdapterDateFns} adapterLocale={es}>
                                                                <DatePicker
                                                                    value={submuestra.fechaVencimiento ? new Date(submuestra.fechaVencimiento + 'T00:00:00') : null}
                                                                    minDate={fechaCodificacion ? new Date(fechaCodificacion + 'T00:00:00') : undefined}
                                                                    onChange={(newValue) => {
                                                                        const nuevaFecha = newValue ? `${newValue.getFullYear()}-${String(newValue.getMonth() + 1).padStart(2, '0')}-${String(newValue.getDate()).padStart(2, '0')}` : ''
                                                                        const fechaBase = new Date((fechaCodificacion || getTodayDateForInput()) + 'T00:00:00')
                                                                        const fechaVenc = new Date(nuevaFecha + 'T00:00:00')
                                                                        const diffTime = fechaVenc.getTime() - fechaBase.getTime()
                                                                        const diffDias = Math.round(diffTime / (1000 * 60 * 60 * 24))
                                                                        setSubmuestrasVencimiento(submuestrasVencimiento.map(s =>
                                                                            s.id === submuestra.id ? { ...s, fechaVencimiento: nuevaFecha, dias: diffDias >= 0 ? diffDias : 0 } : s
                                                                        ))
                                                                    }}
                                                                    slotProps={{ textField: { size: 'small', sx: { width: '170px' } } }}
                                                                />
                                                            </LocalizationProvider>
                                                        </td>
                                                        <td style={{ padding: '12px', textAlign: 'center' }}>
                                                            <TextField size='small' type='number' value={submuestra.cantidad}
                                                                onChange={(e) => {
                                                                    setErrorVencimiento('')
                                                                    const cantidad = parseInt(e.target.value) || 1
                                                                    setSubmuestrasVencimiento(submuestrasVencimiento.map(s => s.id === submuestra.id ? { ...s, cantidad } : s))
                                                                }} sx={{ width: '100px' }} inputProps={{ min: 1 }} />
                                                        </td>
                                                        <td style={{ padding: '12px', textAlign: 'center' }}>
                                                            <IconButton size='small' onClick={() => { /* TODO: edit */ }}><EditIcon fontSize='small' /></IconButton>
                                                            <IconButton size='small' color='error'
                                                                onClick={() => { setErrorVencimiento(''); setSubmuestrasVencimiento(submuestrasVencimiento.filter(s => s.id !== submuestra.id)) }}>
                                                                <DeleteIcon fontSize='small' />
                                                            </IconButton>
                                                        </td>
                                                    </tr>
                                                ))}
                                            </tbody>
                                        </table>
                                    </Box>
                                )}
                            </Box>
                        )}

                        {/* Observaciones */}
                        <Box sx={{ mt: 4 }}>
                            <Typography variant='subtitle2' sx={{ mb: 1, fontWeight: 600 }}>Observaciones</Typography>
                            <TextField multiline rows={3} fullWidth />
                        </Box>

                        {/* Botón Guardar / Cancelar */}
                        <Box sx={{ mt: 4, display: 'flex', justifyContent: 'space-between', gap: 2 }}>
                            <Button variant='outlined' sx={{ textTransform: 'none', px: 4, bgcolor: 'white', color: '#616161', borderColor: '#BDBDBD', '&:hover': { bgcolor: '#F5F5F5', borderColor: '#9E9E9E' } }} onClick={onCancelEdit}>Cancelar</Button>
                            <Button variant='contained' color='primary' sx={{ textTransform: 'none', px: 4 }} onClick={onSaveRcm} disabled={isSavingRcm}>
                                {isSavingRcm ? 'Guardando...' : isEditingRcm ? 'Actualizar RCM' : 'Guardar RCM'}
                            </Button>
                        </Box>
                    </Box>
                </Collapse>
            </Box>
        </>
    )
}

export default RcmDraftForm
