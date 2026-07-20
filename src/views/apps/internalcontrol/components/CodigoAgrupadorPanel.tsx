import React from 'react'
import {
    Box,
    Typography,
    Button,
    Chip,
    IconButton,
    TextField,
} from '@mui/material'
import SearchIcon from '@mui/icons-material/Search'
import EditIcon from '@mui/icons-material/Edit'
import DeleteIcon from '@mui/icons-material/Delete'
import CheckCircleIcon from '@mui/icons-material/CheckCircle'
import type { CodigoAgrupador, RCMData } from '../types/rcm-types'

interface CodigoAgrupadorPanelProps {
    codigosAgrupadores: CodigoAgrupador[]
    savedRcms: RCMData[]
    cardRect: { left: number; width: number }
    isSaving: boolean
    onFinalizarCodificacion: () => void
    onOpenAgrupadorSearch: (event: React.MouseEvent<HTMLElement>, agrupadorId: string) => void
    onRemoveEnsayoFromAgrupador: (agrupadorId: string, productoId: number) => void
    onChangeDescripcion: (agrupadorId: string, value: string) => void
    onChangeFacturacion: (agrupadorId: string, facturacion: 'Unitario' | 'Fijo') => void
    onEditAgrupador: (agrupadorId: string) => void
    onDeleteAgrupador: (agrupadorId: string) => void
}

const CodigoAgrupadorPanel: React.FC<CodigoAgrupadorPanelProps> = ({
    codigosAgrupadores, savedRcms, cardRect,
    isSaving, onFinalizarCodificacion,
    onOpenAgrupadorSearch, onRemoveEnsayoFromAgrupador,
    onChangeDescripcion, onChangeFacturacion,
    onEditAgrupador,
    onDeleteAgrupador,
}) => {
    const isAgrupadorMuestra = (agrupador: CodigoAgrupador) =>
        agrupador.rcmsVinculados.some(rcm => {
            const fullRcm = savedRcms.find(savedRcm => savedRcm.id === rcm.id)
            return (fullRcm?.rcmType || rcm.rcmType) === 'Muestra'
        })

    return (
        <Box
            sx={{
                position: 'fixed',
                bottom: 0,
                left: `${cardRect.left}px`,
                width: `${cardRect.width}px`,
                zIndex: 1200,
                bgcolor: 'white',
                borderTop: '2px solid #E5E7EB',
                boxShadow: '0 -4px 20px rgba(0,0,0,0.1)',
                borderRadius: '0 0 8px 8px',
                ...(codigosAgrupadores.length === 0 && {
                    height: '12vh',
                    display: 'flex',
                    flexDirection: 'column',
                }),
            }}
        >
            {/* Título y botón Finalizar Codificación */}
            <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', px: 3, py: 1.5 }}>
                <Box sx={{ display: 'flex', alignItems: 'baseline', gap: 1.5 }}>
                    <Typography variant='subtitle1' sx={{ fontWeight: 700, lineHeight: 1.3, color: 'text.primary' }}>
                        Códigos Producto
                    </Typography>
                    <Typography variant='caption' color='text.secondary'>
                        Productos comerciales facturables generados
                    </Typography>
                </Box>
                {codigosAgrupadores.length > 0 && (
                    <Button
                        variant='contained'
                        startIcon={<CheckCircleIcon sx={{ color: 'white' }} />}
                        disabled={isSaving}
                        onClick={onFinalizarCodificacion}
                        sx={{
                            textTransform: 'none', borderRadius: '8px', fontWeight: 600, px: 3,
                            bgcolor: '#1976D2', '&:hover': { bgcolor: '#1565C0' }
                        }}
                    >
                        {isSaving ? 'Guardando...' : 'Finalizar Codificación'}
                    </Button>
                )}
            </Box>

            {/* Tabla de Códigos Agrupadores */}
            {codigosAgrupadores.length === 0 ? (
                <Box sx={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', px: 3 }}>
                    <Typography variant='body2' color='text.disabled' sx={{ fontStyle: 'italic' }}>
                        Sin Códigos Producto aún — selecciona RCMs tipo Muestra y presiona &quot;Agrupar&quot;
                    </Typography>
                </Box>
            ) : (
                <Box sx={{ overflowX: 'auto', maxHeight: '250px', overflowY: 'auto', px: 1 }}>
                    <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                        <thead>
                            <tr>
                                {['CÓDIGO ID', 'RCMS VINCULADOS', 'SKUS / ENSAYOS', 'DESCRIPCIÓN DEL SERVICIO', 'CANTIDAD', 'FACTURACIÓN', 'ACCIONES'].map((header, idx) => (
                                    <th
                                        key={header}
                                        style={{
                                            padding: '8px 16px',
                                            textAlign: idx >= 4 ? 'center' : 'left',
                                            fontWeight: 700, fontSize: '11px', textTransform: 'uppercase',
                                            color: '#6B7280', letterSpacing: '0.05em',
                                            borderBottom: '2px solid #E5E7EB',
                                            position: 'sticky', top: 0, background: 'white', zIndex: 1
                                        }}
                                    >
                                        {header}
                                    </th>
                                ))}
                            </tr>
                        </thead>
                        <tbody>
                            {codigosAgrupadores.map((agrupador) => (
                                <tr key={agrupador.id} style={{ borderBottom: '1px solid #F3F4F6' }}>
                                    {/* Código ID */}
                                    <td style={{ padding: '12px 16px', verticalAlign: 'top' }}>
                                        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 0.5 }}>
                                            <Typography variant='body2' sx={{ fontWeight: 700, color: '#1976D2', fontFamily: 'monospace' }}>
                                                {agrupador.temporaryCode || agrupador.codigoNombre || agrupador.id}
                                            </Typography>
                                        </Box>
                                    </td>

                                    {/* RCMs Vinculados */}
                                    <td style={{ padding: '12px 16px', verticalAlign: 'top' }}>
                                        <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
                                            {agrupador.rcmsVinculados.map((rcm, idx) => {
                                                const fullRcm = savedRcms.find(r => r.id === rcm.id)
                                                const rcmLabel = rcm.temporaryCode || fullRcm?.temporaryCode || (rcm.numeroRcm ? `RCM-${String(rcm.numeroRcm).padStart(3, '0')}` : (fullRcm?.numeroRcm ? `RCM-${String(fullRcm.numeroRcm).padStart(3, '0')}` : `RCM-${String(idx + 1).padStart(3, '0')}`))
                                                return (
                                                    <Chip
                                                        key={idx}
                                                        label={rcmLabel}
                                                        size='small'
                                                        sx={{ bgcolor: '#EEF2FF', color: '#4338CA', fontWeight: 600, fontSize: '0.75rem' }}
                                                    />
                                                )
                                            })}
                                        </Box>
                                    </td>

                                    {/* SKUs / Ensayos */}
                                    <td style={{ padding: '12px 16px', verticalAlign: 'top' }}>
                                        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
                                            {agrupador.ensayos.length > 0 && (
                                                <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
                                                    {agrupador.ensayos.map((ensayo, idx) => {
                                                        const label = isAgrupadorMuestra(agrupador)
                                                            ? `${ensayo.nombre} (${ensayo.sku}) x ${ensayo.cantidad ?? 1}`
                                                            : `${ensayo.nombre} (${ensayo.sku})`
                                                        return (
                                                            <Chip
                                                                key={idx}
                                                                label={label}
                                                                size='small'
                                                                onDelete={() => onRemoveEnsayoFromAgrupador(agrupador.id, ensayo.productoId)}
                                                                sx={{
                                                                    bgcolor: '#F0F7FF', color: '#1976D2', fontWeight: 500, fontSize: '0.7rem',
                                                                    '& .MuiChip-deleteIcon': { color: '#90CAF9', '&:hover': { color: '#1976D2' } }
                                                                }}
                                                            />
                                                        )
                                                    })}
                                                </Box>
                                            )}
                                            {false && (
                                                <Button
                                                    startIcon={<SearchIcon />}
                                                    size='small'
                                                    variant='outlined'
                                                    onClick={(e) => onOpenAgrupadorSearch(e, agrupador.id)}
                                                    sx={{
                                                        textTransform: 'none', borderRadius: '6px', fontSize: '0.75rem',
                                                        borderColor: '#E0E0E0', color: '#666',
                                                        '&:hover': { borderColor: '#1976D2', color: '#1976D2' }
                                                    }}
                                                >
                                                    Buscar ensayo
                                                </Button>
                                            )}
                                        </Box>
                                    </td>

                                    {/* Descripción del Servicio */}
                                    <td style={{ padding: '12px 16px', verticalAlign: 'top' }}>
                                        <TextField
                                            size='small'
                                            value={agrupador.descripcionServicio}
                                            onChange={(e) => onChangeDescripcion(agrupador.id, e.target.value)}
                                            sx={{ width: 180 }}
                                        />
                                    </td>

                                    {/* Cantidad */}
                                    <td style={{ padding: '12px 16px', textAlign: 'center', verticalAlign: 'top' }}>
                                        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 1 }}>
                                            <Typography variant='body2' sx={{ width: 70, fontWeight: 600, textAlign: 'center' }}>
                                                {agrupador.cantidad}
                                            </Typography>
                                            <Typography variant='body2' color='text.secondary'>
                                                {agrupador.unidad}
                                            </Typography>
                                        </Box>
                                    </td>

                                    {/* Facturación */}
                                    <td style={{ padding: '12px 16px', textAlign: 'center', verticalAlign: 'top' }}>
                                        <Chip
                                            label={agrupador.facturacion}
                                            size='small'
                                            sx={{
                                                fontWeight: 600,
                                                bgcolor: agrupador.facturacion === 'Unitario' ? '#EEF2FF' : '#F0FDF4',
                                                color: agrupador.facturacion === 'Unitario' ? '#4338CA' : '#16A34A',
                                            }}
                                        />
                                    </td>

                                    {/* Acciones */}
                                    <td style={{ padding: '12px 16px', textAlign: 'center', verticalAlign: 'top', minWidth: 96 }}>
                                        <Box sx={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'center', gap: 0.75, flexWrap: 'nowrap' }}>
                                            <IconButton
                                                size='small'
                                                onClick={() => onEditAgrupador(agrupador.id)}
                                                sx={{ color: '#1976D2', flexShrink: 0, '&:hover': { color: '#1565C0' } }}
                                            >
                                                <EditIcon fontSize='small' />
                                            </IconButton>
                                            <IconButton
                                                size='small'
                                                onClick={() => onDeleteAgrupador(agrupador.id)}
                                                sx={{ color: '#9CA3AF', flexShrink: 0, '&:hover': { color: '#EF4444' } }}
                                            >
                                                <DeleteIcon fontSize='small' />
                                            </IconButton>
                                        </Box>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </Box>
            )}
        </Box>
    )
}

export default CodigoAgrupadorPanel
