import React from 'react'
import {
    Box,
    Typography,
    Button,
    Chip,
    IconButton,
    Checkbox,
    Collapse,
} from '@mui/material'
import { formatDateOnly } from '@/utils/dateUtils'
import AddIcon from '@mui/icons-material/Add'
import ContentCopyIcon from '@mui/icons-material/ContentCopy'
import ExpandMoreIcon from '@mui/icons-material/ExpandMore'
import MoreVertIcon from '@mui/icons-material/MoreVert'
import LayersIcon from '@mui/icons-material/Layers'
import AssignmentIcon from '@mui/icons-material/Assignment'
import type { RCMData, CodigoAgrupador } from '../types/rcm-types'

interface RcmSavedListProps {
    rcmsCreados: RCMData[]
    rcmsAgrupados: RCMData[]
    showRcmCard: boolean
    selectedRcmIds: number[]
    expandedSavedRcms: Record<number, boolean>
    actionBarRcmId: number | null
    codigosAgrupadores: CodigoAgrupador[]
    canAgrupar: boolean
    savedRcms: RCMData[]
    // Handlers
    onToggleSavedRcm: (id: number) => void
    onToggleRcmSelection: (id: number) => void
    onOpenRcmMenu: (event: React.MouseEvent<HTMLElement>, rcmId: number) => void
    onNewRcmClick: (event: React.MouseEvent<HTMLElement>) => void
    onOpenCodigoPopup: (event: React.MouseEvent<HTMLElement>) => void
    onQuickDuplicate: (rcmId: number) => void
    onSetActionBarRcmId: (id: number | null) => void
    onSetSelectedRcmIds: (ids: number[]) => void
}

const RcmSavedList: React.FC<RcmSavedListProps> = ({
    rcmsCreados, rcmsAgrupados, showRcmCard,
    selectedRcmIds, expandedSavedRcms, actionBarRcmId,
    codigosAgrupadores, canAgrupar, savedRcms,
    onToggleSavedRcm, onToggleRcmSelection, onOpenRcmMenu,
    onNewRcmClick, onOpenCodigoPopup, onQuickDuplicate,
    onSetActionBarRcmId, onSetSelectedRcmIds,
}) => {

    const renderRcmHeaderFields = (rcm: RCMData) => {
        if (rcm.rcmType === 'Muestra') {
            return (
                <>
                    {rcm.sede && <><Typography variant='body2' color='text.secondary'>|</Typography><Typography variant='body2'>{rcm.sede}</Typography></>}
                    {rcm.area && <><Typography variant='body2' color='text.secondary'>|</Typography><Typography variant='body2'>{rcm.area}</Typography></>}
                    {rcm.tipoServicio && <><Typography variant='body2' color='text.secondary'>|</Typography><Typography variant='body2'>{rcm.tipoServicio}</Typography></>}
                    {rcm.numeroTarjeta && (
                        <><Typography variant='body2' color='text.secondary'>|</Typography>
                            <Chip label={`T:${rcm.numeroTarjeta}`} size='small' sx={{ bgcolor: '#1976d2', color: '#ffffff', fontWeight: 600, fontSize: '0.75rem' }} /></>
                    )}
                    {rcm.tomaMuestra && <><Typography variant='body2' color='text.secondary'>|</Typography><Typography variant='body2'>#{rcm.tomaMuestra}</Typography></>}
                    {rcm.tipoMaterial && <><Typography variant='body2' color='text.secondary'>|</Typography><Typography variant='body2'>{rcm.tipoMaterial}</Typography></>}
                    {rcm.item && <><Typography variant='body2' color='text.secondary'>|</Typography><Typography variant='body2'>{rcm.item}</Typography></>}
                    {rcm.procedencia && <><Typography variant='body2' color='text.secondary'>|</Typography><Typography variant='body2'>{rcm.procedencia}</Typography></>}
                    <>
                        <Typography variant='body2' color='text.secondary'>|</Typography>
                        <Typography variant='body2'>
                            {(() => {
                                const fechaMuestreo = rcm.fechaMuestreo ? formatDateOnly(rcm.fechaMuestreo) : formatDateOnly(rcm.fechaServicio)
                                if (rcm.tieneVencimiento && rcm.submuestrasVencimiento && rcm.submuestrasVencimiento.length > 0) {
                                    const fechas = rcm.submuestrasVencimiento.map(sub => sub.fechaVencimiento).filter(f => !!f).sort()
                                    if (fechas.length === 0) return fechaMuestreo
                                    if (fechas.length === 1) return `${fechaMuestreo} [vence ${formatDateOnly(fechas[0])}]`
                                    return `${fechaMuestreo} [vence ${formatDateOnly(fechas[0])} — ${formatDateOnly(fechas[fechas.length - 1])}]`
                                }
                                return fechaMuestreo
                            })()}
                        </Typography>
                    </>
                    {rcm.cantidadMuestras && <><Typography variant='body2' color='text.secondary'>|</Typography><Typography variant='body2'>×{rcm.cantidadMuestras}</Typography></>}
                </>
            )
        }
        if (rcm.rcmType === 'Control') {
            return (
                <>
                    {rcm.sede && <><Typography variant='body2' color='text.secondary'>|</Typography><Typography variant='body2'>{rcm.sede}</Typography></>}
                    {rcm.area && <><Typography variant='body2' color='text.secondary'>|</Typography><Typography variant='body2'>{rcm.area}</Typography></>}
                    {rcm.tipoServicio && <><Typography variant='body2' color='text.secondary'>|</Typography><Typography variant='body2'>{rcm.tipoServicio}</Typography></>}
                    <><Typography variant='body2' color='text.secondary'>|</Typography><Typography variant='body2'>{formatDateOnly(rcm.fechaServicio)}</Typography></>
                    {rcm.item && <><Typography variant='body2' color='text.secondary'>|</Typography><Typography variant='body2'>{rcm.item}</Typography></>}
                    {rcm.cantidadMuestras && <><Typography variant='body2' color='text.secondary'>|</Typography><Typography variant='body2'>×{rcm.cantidadMuestras}</Typography></>}
                </>
            )
        }
        // Servicio
        return (
            <>
                {rcm.area && <><Typography variant='body2' color='text.secondary'>|</Typography><Typography variant='body2'>{rcm.area}</Typography></>}
                {rcm.tipoServicio && <><Typography variant='body2' color='text.secondary'>|</Typography><Typography variant='body2'>{rcm.tipoServicio}</Typography></>}
                <><Typography variant='body2' color='text.secondary'>|</Typography><Typography variant='body2'>{formatDateOnly(rcm.fechaServicio)}</Typography></>
                {rcm.cantidadMuestras && <><Typography variant='body2' color='text.secondary'>|</Typography><Typography variant='body2'>×{rcm.cantidadMuestras}</Typography></>}
            </>
        )
    }

    const renderEnsayosTable = (ensayos: RCMData['ensayos']) => (
        <Box sx={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                <thead>
                    <tr style={{ backgroundColor: '#F5F5F5' }}>
                        <th style={{ padding: '12px', textAlign: 'left', fontWeight: 600, fontSize: '14px', borderBottom: '2px solid #E0E0E0' }}>SKU</th>
                        <th style={{ padding: '12px', textAlign: 'left', fontWeight: 600, fontSize: '14px', borderBottom: '2px solid #E0E0E0' }}>Nombre</th>
                        <th style={{ padding: '12px', textAlign: 'center', fontWeight: 600, fontSize: '14px', borderBottom: '2px solid #E0E0E0', width: '100px' }}>Cantidad</th>
                        <th style={{ padding: '12px', textAlign: 'left', fontWeight: 600, fontSize: '14px', borderBottom: '2px solid #E0E0E0' }}>Observación</th>
                    </tr>
                </thead>
                <tbody>
                    {ensayos.map(ensayo => (
                        <tr key={ensayo.id} style={{ borderBottom: '1px solid #E0E0E0' }}>
                            <td style={{ padding: '12px' }}>
                                <Typography variant='body2' sx={{ fontFamily: 'monospace', color: 'text.secondary' }}>{ensayo.sku}</Typography>
                            </td>
                            <td style={{ padding: '12px' }}>
                                <Typography variant='body2'>{ensayo.nombre}</Typography>
                                {ensayo.norma && <Typography variant='caption' color='text.secondary'>{ensayo.norma}</Typography>}
                            </td>
                            <td style={{ padding: '12px', textAlign: 'center' }}>
                                <Typography variant='body2' sx={{ fontWeight: 600 }}>{ensayo.cantidad}</Typography>
                            </td>
                            <td style={{ padding: '12px' }}>
                                <Typography variant='body2' color='text.secondary'>{ensayo.observacion || '-'}</Typography>
                            </td>
                        </tr>
                    ))}
                </tbody>
            </table>
        </Box>
    )

    const renderSubmuestrasTable = (submuestras: NonNullable<RCMData['submuestrasVencimiento']>) => (
        <>
            <Typography variant='subtitle2' sx={{ fontWeight: 600, mb: 2, mt: 4 }}>
                Submuestras con Vencimiento ({submuestras.length})
            </Typography>
            <Box sx={{ overflowX: 'auto' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                    <thead>
                        <tr style={{ backgroundColor: '#F5F5F5' }}>
                            <th style={{ padding: '12px', textAlign: 'center', fontWeight: 600, fontSize: '14px', borderBottom: '2px solid #E0E0E0', width: '80px' }}>N°</th>
                            <th style={{ padding: '12px', textAlign: 'center', fontWeight: 600, fontSize: '14px', borderBottom: '2px solid #E0E0E0', width: '120px' }}>Días</th>
                            <th style={{ padding: '12px', textAlign: 'center', fontWeight: 600, fontSize: '14px', borderBottom: '2px solid #E0E0E0', width: '200px' }}>Fecha Vencimiento</th>
                            <th style={{ padding: '12px', textAlign: 'center', fontWeight: 600, fontSize: '14px', borderBottom: '2px solid #E0E0E0', width: '120px' }}>Cantidad</th>
                        </tr>
                    </thead>
                    <tbody>
                        {submuestras.map((submuestra) => (
                            <tr key={submuestra.id} style={{ borderBottom: '1px solid #E0E0E0' }}>
                                <td style={{ padding: '12px', textAlign: 'center' }}><Typography variant='body2'>{submuestra.numero}</Typography></td>
                                <td style={{ padding: '12px', textAlign: 'center' }}><Typography variant='body2'>{submuestra.dias}</Typography></td>
                                <td style={{ padding: '12px', textAlign: 'center' }}><Typography variant='body2'>{formatDateOnly(submuestra.fechaVencimiento)}</Typography></td>
                                <td style={{ padding: '12px', textAlign: 'center' }}><Typography variant='body2'>{submuestra.cantidad}</Typography></td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </Box>
        </>
    )

    return (
        <>
            {/* Estado vacío */}
            {rcmsCreados.length === 0 && !showRcmCard && (
                <Box sx={{ mt: 6, textAlign: 'center', py: 8 }}>
                    <Box sx={{ mb: 3 }}><AssignmentIcon sx={{ fontSize: 64, color: 'text.disabled' }} /></Box>
                    <Typography variant='h6' sx={{ fontWeight: 600, mb: 1, color: 'text.primary' }}>No hay RCMs creados aún</Typography>
                    <Typography variant='body2' sx={{ color: 'text.secondary', mb: 2 }}>Presiona "+ Nuevo RCM" para comenzar.</Typography>
                    <Typography variant='body2' sx={{ color: 'text.secondary' }}>Puedes crear muestras, controles o servicios.</Typography>
                </Box>
            )}

            {/* LISTADO 2: CREADOS (Pendientes de Agrupar) */}
            {rcmsCreados.length > 0 && (
                <Box sx={{ mt: 3 }}>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, mb: 2 }}>
                        <Typography variant='h6' sx={{ fontWeight: 600 }}>Creados (Pendientes de Agrupar)</Typography>
                        <Chip label={rcmsCreados.length} size='small' sx={{ fontWeight: 700, bgcolor: '#FFF3E0', color: '#E65100', border: '1px solid #FFB74D', minWidth: 28 }} />
                    </Box>
                    {rcmsCreados.map(rcm => (
                        <Box key={rcm.id} sx={{ bgcolor: '#E3F2FD', borderRadius: '8px', overflow: 'hidden', mb: 2 }}>
                            {/* Header */}
                            <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', p: 2, bgcolor: '#E3F2FD', cursor: 'pointer' }} onClick={() => onToggleSavedRcm(rcm.id)}>
                                <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, flex: 1 }}>
                                    <Box onClick={(e) => e.stopPropagation()}>
                                        <Checkbox size='small' checked={selectedRcmIds.includes(rcm.id)} onChange={() => onToggleRcmSelection(rcm.id)} />
                                    </Box>
                                    <Chip label={rcm.rcmType.toUpperCase()} sx={{ fontWeight: 'bold', backgroundColor: rcm.rcmType === 'Muestra' ? '#0000b4' : rcm.rcmType === 'Control' ? '#FF0096' : '#3b3b3b', color: '#ffffff' }} />
                                    <Typography variant='body2' sx={{ fontWeight: 600 }}>
                                        {rcm.numeroRcm ? `RCM-${String(rcm.numeroRcm).padStart(3, '0')}` : '...'}
                                    </Typography>
                                    <Chip label='Pendiente de agrupar' size='small' sx={{ fontWeight: 600, bgcolor: '#FFF3E0', color: '#E65100', border: '1px solid #FFB74D' }} />
                                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, flexWrap: 'wrap' }}>
                                        {renderRcmHeaderFields(rcm)}
                                    </Box>
                                </Box>
                                <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }} onClick={(e) => e.stopPropagation()}>
                                    <IconButton size='small'>
                                        <ExpandMoreIcon sx={{ transform: expandedSavedRcms[rcm.id] ? 'rotate(0deg)' : 'rotate(-90deg)', transition: 'transform 0.3s' }} />
                                    </IconButton>
                                    <IconButton size='small' onClick={(e) => onOpenRcmMenu(e, rcm.id)}>
                                        <MoreVertIcon />
                                    </IconButton>
                                </Box>
                            </Box>

                            {/* Expandible content */}
                            <Collapse in={expandedSavedRcms[rcm.id]}>
                                <Box sx={{ p: 3, bgcolor: 'white' }}>
                                    <Typography variant='subtitle2' sx={{ fontWeight: 600, mb: 2 }}>
                                        Ensayos Asociados ({rcm.ensayos.length})
                                    </Typography>
                                    {renderEnsayosTable(rcm.ensayos)}
                                    {rcm.submuestrasVencimiento && rcm.submuestrasVencimiento.length > 0 && renderSubmuestrasTable(rcm.submuestrasVencimiento)}
                                </Box>
                            </Collapse>

                            {/* Action bar */}
                            {actionBarRcmId === rcm.id && !showRcmCard && (
                                <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: 1.5, px: 2, py: 1.5, bgcolor: '#BBDEFB', borderTop: '1px solid #90CAF9' }}>
                                    <Button variant='contained' size='small' startIcon={<AddIcon />} onClick={onNewRcmClick}
                                        sx={{ textTransform: 'none', borderRadius: '6px', fontWeight: 600, fontSize: '0.8rem', bgcolor: '#1976D2', '&:hover': { bgcolor: '#1565C0' } }}>
                                        Nuevo RCM
                                    </Button>
                                    <Button variant='outlined' size='small' startIcon={<ContentCopyIcon />}
                                        onClick={() => onQuickDuplicate(rcm.id)}
                                        sx={{ textTransform: 'none', borderRadius: '6px', fontWeight: 600, fontSize: '0.8rem', borderColor: '#1976D2', color: '#1976D2', bgcolor: 'white', '&:hover': { bgcolor: '#E3F2FD', borderColor: '#1565C0' } }}>
                                        Duplicar este
                                    </Button>
                                    <Button variant='outlined' size='small' startIcon={<LayersIcon />}
                                        onClick={(e) => { onSetSelectedRcmIds([rcm.id]); onOpenCodigoPopup(e) }}
                                        sx={{ textTransform: 'none', borderRadius: '6px', fontWeight: 600, fontSize: '0.8rem', borderColor: '#7B1FA2', color: '#7B1FA2', bgcolor: 'white', '&:hover': { bgcolor: '#F3E5F5', borderColor: '#6A1B9A' } }}>
                                        Asociar a Producto
                                    </Button>
                                    <Button variant='text' size='small' onClick={() => onSetActionBarRcmId(null)}
                                        sx={{ textTransform: 'none', borderRadius: '6px', fontWeight: 600, fontSize: '0.8rem', color: '#666', '&:hover': { bgcolor: '#E0E0E0' } }}>
                                        Cerrar
                                    </Button>
                                </Box>
                            )}
                        </Box>
                    ))}
                </Box>
            )}

            {/* LISTADO 3: AGRUPADOS */}
            {rcmsAgrupados.length > 0 && (
                <Box sx={{ mt: 3 }}>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, mb: 2 }}>
                        <Typography variant='h6' sx={{ fontWeight: 600 }}>Agrupados</Typography>
                        <Chip label={rcmsAgrupados.length} size='small' sx={{ fontWeight: 700, bgcolor: '#E8F5E9', color: '#2E7D32', border: '1px solid #81C784', minWidth: 28 }} />
                    </Box>
                    {rcmsAgrupados.map(rcm => (
                        <Box key={rcm.id} sx={{ bgcolor: '#E8F5E9', borderRadius: '8px', overflow: 'hidden', mb: 2 }}>
                            <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', p: 2, bgcolor: '#E8F5E9', cursor: 'pointer' }} onClick={() => onToggleSavedRcm(rcm.id)}>
                                <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, flex: 1 }}>
                                    <Chip label={rcm.rcmType.toUpperCase()} sx={{ fontWeight: 'bold', backgroundColor: rcm.rcmType === 'Muestra' ? '#0000b4' : rcm.rcmType === 'Control' ? '#FF0096' : '#3b3b3b', color: '#ffffff' }} />
                                    <Typography variant='body2' sx={{ fontWeight: 600 }}>
                                        {rcm.numeroRcm ? `RCM-${String(rcm.numeroRcm).padStart(3, '0')}` : '...'}
                                    </Typography>
                                    <Chip label='Agrupado' size='small' sx={{ fontWeight: 600, bgcolor: '#C8E6C9', color: '#2E7D32', border: '1px solid #81C784' }} />
                                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, flexWrap: 'wrap' }}>
                                        {rcm.area && <><Typography variant='body2' color='text.secondary'>|</Typography><Typography variant='body2'>{rcm.area}</Typography></>}
                                        {rcm.tipoServicio && <><Typography variant='body2' color='text.secondary'>|</Typography><Typography variant='body2'>{rcm.tipoServicio}</Typography></>}
                                        {rcm.numeroTarjeta && (
                                            <><Typography variant='body2' color='text.secondary'>|</Typography>
                                                <Chip label={`T:${rcm.numeroTarjeta}`} size='small' sx={{ bgcolor: '#1976d2', color: '#ffffff', fontWeight: 600, fontSize: '0.75rem' }} /></>
                                        )}
                                        {rcm.ensayos.length > 0 && <><Typography variant='body2' color='text.secondary'>|</Typography><Typography variant='body2'>{rcm.ensayos[0].nombre}</Typography></>}
                                        <>
                                            <Typography variant='body2' color='text.secondary'>|</Typography>
                                            <Typography variant='body2'>
                                                {(() => {
                                                    if (rcm.tieneVencimiento && rcm.submuestrasVencimiento && rcm.submuestrasVencimiento.length > 0) {
                                                        const fechas = rcm.submuestrasVencimiento.map(sub => sub.fechaVencimiento).filter(f => !!f).sort()
                                                        if (fechas.length === 0) return formatDateOnly(rcm.fechaServicio)
                                                        if (fechas.length === 1) return formatDateOnly(fechas[0])
                                                        return `${formatDateOnly(fechas[0])} - ${formatDateOnly(fechas[fechas.length - 1])}`
                                                    }
                                                    return formatDateOnly(rcm.fechaServicio)
                                                })()}
                                            </Typography>
                                        </>
                                        {rcm.cantidadMuestras && <><Typography variant='body2' color='text.secondary'>|</Typography><Typography variant='body2'>{rcm.cantidadMuestras}</Typography></>}
                                    </Box>
                                </Box>
                                <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }} onClick={(e) => e.stopPropagation()}>
                                    {rcm.tipoServicio?.toLowerCase() === 'dosificación' && (
                                        <Checkbox size='small' checked={selectedRcmIds.includes(rcm.id)} onChange={() => onToggleRcmSelection(rcm.id)} />
                                    )}
                                    <IconButton size='small'>
                                        <ExpandMoreIcon sx={{ transform: expandedSavedRcms[rcm.id] ? 'rotate(0deg)' : 'rotate(-90deg)', transition: 'transform 0.3s' }} />
                                    </IconButton>
                                    <IconButton size='small' onClick={(e) => onOpenRcmMenu(e, rcm.id)}>
                                        <MoreVertIcon />
                                    </IconButton>
                                </Box>
                            </Box>
                            <Collapse in={expandedSavedRcms[rcm.id]}>
                                <Box sx={{ p: 3, bgcolor: 'white' }}>
                                    <Typography variant='subtitle2' sx={{ fontWeight: 600, mb: 2 }}>Ensayos Asociados ({rcm.ensayos.length})</Typography>
                                    {renderEnsayosTable(rcm.ensayos)}
                                </Box>
                            </Collapse>
                        </Box>
                    ))}
                </Box>
            )}

            {/* Floating grouping button */}
            <Box
                sx={{
                    position: 'fixed', bottom: 32, left: '50%',
                    transform: canAgrupar ? 'translateX(-50%) translateY(0)' : 'translateX(-50%) translateY(120px)',
                    opacity: canAgrupar ? 1 : 0, pointerEvents: canAgrupar ? 'auto' : 'none',
                    transition: 'transform 0.35s cubic-bezier(0.34, 1.56, 0.64, 1), opacity 0.25s ease',
                    zIndex: 1300,
                }}
            >
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, bgcolor: '#1976D2', borderRadius: '8px', px: 3, py: 1.5, boxShadow: '0 8px 32px rgba(25, 118, 210, 0.45), 0 2px 8px rgba(0,0,0,0.2)' }}>
                    <Typography variant='body2' sx={{ fontWeight: 600, color: 'white', whiteSpace: 'nowrap' }}>
                        {selectedRcmIds.length} RCM{selectedRcmIds.length > 1 ? 's' : ''} seleccionado{selectedRcmIds.length > 1 ? 's' : ''}
                    </Typography>
                    <Button variant='contained' startIcon={<LayersIcon />} onClick={(e) => onOpenCodigoPopup(e)}
                        sx={{ textTransform: 'none', borderRadius: '6px', fontWeight: 700, fontSize: '0.9rem', px: 3, py: 1, bgcolor: 'white', color: '#1976D2', boxShadow: 'none', '&:hover': { bgcolor: '#E3F2FD', boxShadow: 'none' } }}>
                        Agrupar en Código Producto
                    </Button>
                </Box>
            </Box>

            {/* Spacer */}
            {codigosAgrupadores.length > 0 && <Box sx={{ height: '340px' }} />}
        </>
    )
}

export default RcmSavedList
