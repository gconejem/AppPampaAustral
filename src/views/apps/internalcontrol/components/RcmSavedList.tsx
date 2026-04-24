import React from 'react'
import {
    Box,
    Typography,
    Button,
    Chip,
    IconButton,
    Checkbox,
    Collapse,
    Divider,
    TextField,
    CircularProgress,
} from '@mui/material'
import { formatDateOnly } from '@/utils/dateUtils'
import AddIcon from '@mui/icons-material/Add'
import ContentCopyIcon from '@mui/icons-material/ContentCopy'
import ExpandMoreIcon from '@mui/icons-material/ExpandMore'
import MoreVertIcon from '@mui/icons-material/MoreVert'
import LayersIcon from '@mui/icons-material/Layers'
import AssignmentIcon from '@mui/icons-material/Assignment'
import CheckBoxOutlineBlankIcon from '@mui/icons-material/CheckBoxOutlineBlank'
import CheckBoxIcon from '@mui/icons-material/CheckBox'
import CloseIcon from '@mui/icons-material/Close'
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
    onCodigoUnoAUno: (rcmId: number) => void
    isCreatingCodigo: boolean
}

const RcmSavedList: React.FC<RcmSavedListProps> = ({
    rcmsCreados, rcmsAgrupados, showRcmCard,
    selectedRcmIds, expandedSavedRcms, actionBarRcmId,
    codigosAgrupadores, canAgrupar, savedRcms,
    onToggleSavedRcm, onToggleRcmSelection, onOpenRcmMenu,
    onNewRcmClick, onOpenCodigoPopup, onQuickDuplicate,
    onSetActionBarRcmId, onSetSelectedRcmIds, onCodigoUnoAUno, isCreatingCodigo,
}) => {

    const renderVencimientoPill = (rcm: RCMData) => {
        if (!rcm.tieneVencimiento || !rcm.submuestrasVencimiento || rcm.submuestrasVencimiento.length === 0) return null

        // Obtenemos las fechas únicas y válidas (vienen como YYYY-MM-DD)
        const fechasValidas = rcm.submuestrasVencimiento
            .map(sub => sub.fechaVencimiento)
            .filter(f => !!f)

        if (fechasValidas.length === 0) return null

        // Ordenado alfabético sobre ISO (YYYY-MM-DD) funciona correctamente
        const uniqueSortedFechas = [...new Set(fechasValidas)].sort()

        const label = uniqueSortedFechas.length === 1
            ? formatDateOnly(uniqueSortedFechas[0])
            : `${formatDateOnly(uniqueSortedFechas[0])} \u2192 ${formatDateOnly(uniqueSortedFechas[uniqueSortedFechas.length - 1])}`

        return (
            <Chip
                label={label}
                size='small'
                sx={{
                    fontWeight: 600,
                    bgcolor: '#FFF9C4',
                    color: '#7B6A00',
                    border: '1px solid #F9E21B',
                    fontSize: '0.75rem'
                }}
            />
        )
    }

    const renderRcmHeaderFields = (rcm: RCMData) => {
        if (rcm.rcmType === 'Muestra') {
            return (
                <>
                    {rcm.sede && <><Typography variant='body2' color='text.secondary'>|</Typography><Typography variant='body2'>{rcm.sede}</Typography></>}
                    {rcm.area && <><Typography variant='body2' color='text.secondary'>|</Typography><Typography variant='body2'>{rcm.area}</Typography></>}
                    {rcm.tipoServicio && <><Typography variant='body2' color='text.secondary'>|</Typography><Typography variant='body2'>{rcm.tipoServicio}</Typography></>}
                    {rcm.numeroTarjeta && (
                        <><Typography variant='body2' color='text.secondary'>|</Typography>
                            <Chip label={`T:${rcm.numeroTarjeta}`} size='small' sx={{ bgcolor: '#1976d2', color: '#ffffff', fontWeight: 600, fontSize: '0.75rem' }} /></>)
                    }
                    {rcm.tomaMuestra && <><Typography variant='body2' color='text.secondary'>|</Typography><Typography variant='body2'>#{rcm.tomaMuestra}</Typography></>}
                    {rcm.tipoMaterial && <><Typography variant='body2' color='text.secondary'>|</Typography><Typography variant='body2'>{rcm.tipoMaterial}</Typography></>}
                    {rcm.item && <><Typography variant='body2' color='text.secondary'>|</Typography><Typography variant='body2'>{rcm.item}</Typography></>}
                    {rcm.tieneVencimiento && rcm.submuestrasVencimiento && rcm.submuestrasVencimiento.length > 0 && (
                        <><Typography variant='body2' color='text.secondary'>|</Typography>{renderVencimientoPill(rcm)}</>
                    )}
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
                </>
            )
        }
        // Servicio
        return (
            <>
                {rcm.area && <><Typography variant='body2' color='text.secondary'>|</Typography><Typography variant='body2'>{rcm.area}</Typography></>}
                {rcm.tipoServicio && <><Typography variant='body2' color='text.secondary'>|</Typography><Typography variant='body2'>{rcm.tipoServicio}</Typography></>}
                <><Typography variant='body2' color='text.secondary'>|</Typography><Typography variant='body2'>{formatDateOnly(rcm.fechaServicio)}</Typography></>
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
                        <React.Fragment key={ensayo.id}>
                            {/* Fila del paquete o ensayo normal */}
                            <tr style={{
                                borderBottom: ensayo.esPaquete && ensayo.subProductos && ensayo.subProductos.length > 0 ? 'none' : '1px solid #E0E0E0',
                                backgroundColor: ensayo.esPaquete ? '#E3F2FD' : 'transparent'
                            }}>
                                <td style={{ padding: '12px' }}>
                                    <Typography variant='body2' sx={{ fontFamily: 'monospace', color: 'text.secondary' }}>{ensayo.sku}</Typography>
                                </td>
                                <td style={{ padding: '12px' }}>
                                    <Typography variant='body2' sx={{ fontWeight: 700, display: 'inline' }}>{ensayo.nombre}</Typography>
                                    {ensayo.norma && (
                                        <Typography variant='body2' color='text.secondary' sx={{ display: 'inline', ml: 1 }}>
                                            {ensayo.norma}
                                        </Typography>
                                    )}
                                    {ensayo.esPaquete && (
                                        <Chip
                                            label='Paquete'
                                            size='small'
                                            sx={{ ml: 1, height: '20px', fontSize: '0.7rem', fontWeight: 600, bgcolor: '#1976d2', color: 'white' }}
                                        />
                                    )}
                                </td>
                                <td style={{ padding: '12px', textAlign: 'center' }}>
                                    <Typography variant='body2' sx={{ fontWeight: 600 }}>{ensayo.cantidad}</Typography>
                                </td>
                                <td style={{ padding: '12px' }}>
                                    <Typography variant='body2' color='text.secondary'>{ensayo.observacion || '-'}</Typography>
                                </td>
                            </tr>
                            {/* Filas de subproductos si es un paquete */}
                            {ensayo.esPaquete && ensayo.subProductos && ensayo.subProductos.map((subProducto, index) => (
                                <tr
                                    key={`${ensayo.id}-sub-${subProducto.id}`}
                                    style={{
                                        borderBottom: index === ensayo.subProductos!.length - 1 ? '1px solid #E0E0E0' : 'none',
                                        backgroundColor: '#E3F2FD'
                                    }}
                                >
                                    <td style={{ padding: '12px', paddingLeft: '32px' }}>
                                        <Typography variant='body2' sx={{ fontFamily: 'monospace', color: 'text.secondary', fontSize: '0.85rem' }}>
                                            {subProducto.sku}
                                        </Typography>
                                    </td>
                                    <td style={{ padding: '12px', paddingLeft: '32px' }}>
                                        <Typography variant='body2' sx={{ fontWeight: 500, display: 'inline', fontSize: '0.85rem' }}>
                                            ↳ {subProducto.nombre}
                                        </Typography>
                                        {subProducto.norma && (
                                            <Typography variant='body2' color='text.secondary' sx={{ display: 'inline', ml: 1, fontSize: '0.85rem' }}>
                                                {subProducto.norma}
                                            </Typography>
                                        )}
                                    </td>
                                    <td style={{ padding: '12px', textAlign: 'center' }}>
                                        <Typography variant='body2' sx={{ fontWeight: 500, fontSize: '0.85rem' }}>{subProducto.cantidad}</Typography>
                                    </td>
                                    <td style={{ padding: '12px' }}>
                                        <Typography variant='body2' color='text.secondary' sx={{ fontSize: '0.85rem' }}>
                                            {subProducto.observacion || '-'}
                                        </Typography>
                                    </td>
                                </tr>
                            ))}
                        </React.Fragment>
                    ))}
                </tbody>
            </table>
        </Box>
    )

    // ── Compact submuestra chips (one line each) ──────────────────────────────
    const renderSubmuestrasPills = (submuestras: NonNullable<RCMData['submuestrasVencimiento']>) => {
        const totalUnidades = submuestras.reduce((s, sub) => s + sub.cantidad, 0)
        return (
            <Box sx={{ mt: 3 }}>
                <Typography variant='subtitle2' sx={{ fontWeight: 700, mb: 1 }}>
                    Detalle de Submuestras — {submuestras.length} grupo{submuestras.length !== 1 ? 's' : ''}, {totalUnidades} unidades en total
                </Typography>
                <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
                    {submuestras.map(sub => (
                        <Chip
                            key={sub.id}
                            label={
                                <>
                                    <strong>#{sub.numero}</strong>
                                    {' · '}{sub.dias}d
                                    {sub.fechaVencimiento ? ` · ${formatDateOnly(sub.fechaVencimiento)}` : ''}
                                    {' · ×'}{sub.cantidad}
                                </>
                            }
                            size='small'
                            sx={{ fontWeight: 500, fontSize: '0.8rem', bgcolor: '#FFF9C4', border: '1px solid #F9E21B', color: '#5a4a00' }}
                        />
                    ))}
                </Box>
            </Box>
        )
    }

    // ── Shared expanded body for Pendientes and Agrupados ─────────────────────
    const renderExpandedContent = (rcm: RCMData) => {
        const areaName = rcm.area?.toLowerCase() || ''
        const esHormigon = areaName === 'hormigón' || areaName === 'hormigon'
        const esElementosComponentes = areaName === 'elementos y componentes'
        const esAsfalto = areaName === 'asfalto'
        const esSuelo = areaName === 'suelo'
        const esOtros = areaName === 'otros'
        const tieneCamposDinamicos = esHormigon || esElementosComponentes || esAsfalto || esSuelo || esOtros

        // Helper: a single date-cell, always rendered
        const dateCell = (label: string, value?: string) => (
            <Box sx={{ minWidth: 120 }}>
                <Typography variant='caption' color='text.secondary' sx={{ fontWeight: 700, textTransform: 'uppercase', letterSpacing: 0.5, display: 'block' }}>{label}</Typography>
                <Typography variant='body2' sx={{ fontWeight: 600 }}>{value ? formatDateOnly(value) : '—'}</Typography>
            </Box>
        )

        // Helper: a single text-cell, always rendered
        const textCell = (label: string, value?: string) => (
            <Box sx={{ minWidth: 120 }}>
                <Typography variant='caption' color='text.secondary' sx={{ fontWeight: 700, textTransform: 'uppercase', letterSpacing: 0.5, display: 'block' }}>{label}</Typography>
                <Typography variant='body2'>{value || '—'}</Typography>
            </Box>
        )

        return (
            <Box sx={{ p: 3, bgcolor: 'white' }}>
                {/* ── FILA 1: FECHAS ─────────────────────────── */}
                <Box sx={{ display: 'grid', gridTemplateColumns: 'repeat(4, minmax(120px, 1fr))', gap: 2, mb: 2 }}>
                    {dateCell('Fecha Codificación', rcm.fechaCodificacion)}
                    {dateCell('Fecha Muestreo', rcm.fechaMuestreo)}
                    {dateCell('Fecha Ingreso', rcm.fechaIngreso)}
                    {dateCell('Fecha Entrega', rcm.fechaEntrega)}
                </Box>
                <Divider sx={{ mb: 2 }} />

                {/* ── FILA 2: PROCEDENCIA / UBICACIÓN / CANTIDAD / CHECKS ── */}
                <Box sx={{ display: 'grid', gridTemplateColumns: 'repeat(4, minmax(120px, 1fr))', gap: 2, mb: 2, alignItems: 'center' }}>
                    {textCell('Procedencia', rcm.procedencia)}
                    {textCell('Ubicación / Sector', rcm.ubicacionSector)}

                    {rcm.rcmType === 'Muestra' && rcm.cantidadMuestras
                        ? (
                            <Box sx={{ minWidth: 120 }}>
                                <Typography variant='caption' color='text.secondary' sx={{ fontWeight: 700, textTransform: 'uppercase', letterSpacing: 0.5, display: 'block' }}>Cantidad</Typography>
                                <Typography variant='body2' sx={{ fontWeight: 700 }}>×{rcm.cantidadMuestras}</Typography>
                            </Box>
                        )
                        : <Box />
                    }

                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                            {rcm.informeEnsayo ? <CheckBoxIcon fontSize='small' sx={{ color: '#1976d2' }} /> : <CheckBoxOutlineBlankIcon fontSize='small' sx={{ color: '#bdbdbd' }} />}
                            <Typography variant='body2' sx={{ color: rcm.informeEnsayo ? '#1976d2' : 'text.disabled' }}>Informe</Typography>
                        </Box>

                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                            {rcm.tieneVencimiento ? <CheckBoxIcon fontSize='small' sx={{ color: '#1976d2' }} /> : <CheckBoxOutlineBlankIcon fontSize='small' sx={{ color: '#bdbdbd' }} />}
                            <Typography variant='body2' sx={{ color: rcm.tieneVencimiento ? '#1976d2' : 'text.disabled' }}>Vencimiento</Typography>
                        </Box>
                    </Box>
                </Box>

                {/* ── FILA 3: CAMPOS DINÁMICOS (según área) ─── */}
                {tieneCamposDinamicos && (
                    <Box sx={{ mb: 2, p: 2, border: '1px solid #f3e5f5', borderRadius: 2, bgcolor: '#fdf6ff' }}>
                        <Typography variant='overline' sx={{ fontWeight: 800, letterSpacing: 2, color: '#e91e8c', display: 'block', mb: 1.5 }}>
                            Campos Dinámicos — {rcm.area}
                        </Typography>
                        <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 4 }}>
                            {/* Fecha Confección aparece para Hormigón, E&C, Asfalto y Otros */}
                            {(esHormigon || esElementosComponentes || esAsfalto || esOtros) && (
                                <Box sx={{ minWidth: 120 }}>
                                    <Typography variant='caption' color='text.secondary' sx={{ fontWeight: 700, textTransform: 'uppercase', letterSpacing: 0.5, display: 'block' }}>Fecha Confección</Typography>
                                    <Typography variant='body2'>{rcm.fechaConfeccion ? formatDateOnly(rcm.fechaConfeccion) : '—'}</Typography>
                                </Box>
                            )}
                            {/* Elemento aparece para Hormigón y E&C */}
                            {(esHormigon || esElementosComponentes) && (
                                <Box sx={{ minWidth: 120 }}>
                                    <Typography variant='caption' color='text.secondary' sx={{ fontWeight: 700, textTransform: 'uppercase', letterSpacing: 0.5, display: 'block' }}>Elemento</Typography>
                                    <Typography variant='body2'>{rcm.elemento || '—'}</Typography>
                                </Box>
                            )}
                            {/* Grado solo Hormigón */}
                            {esHormigon && (
                                <Box sx={{ minWidth: 80 }}>
                                    <Typography variant='caption' color='text.secondary' sx={{ fontWeight: 700, textTransform: 'uppercase', letterSpacing: 0.5, display: 'block' }}>Grado</Typography>
                                    <Typography variant='body2'>{rcm.grado || '—'}</Typography>
                                </Box>
                            )}
                            {/* Cotas solo Suelo */}
                            {esSuelo && (
                                <>
                                    <Box sx={{ minWidth: 80 }}>
                                        <Typography variant='caption' color='text.secondary' sx={{ fontWeight: 700, textTransform: 'uppercase', letterSpacing: 0.5, display: 'block' }}>Cota 1</Typography>
                                        <Typography variant='body2'>{rcm.cota1 || '—'}</Typography>
                                    </Box>
                                    <Box sx={{ minWidth: 80 }}>
                                        <Typography variant='caption' color='text.secondary' sx={{ fontWeight: 700, textTransform: 'uppercase', letterSpacing: 0.5, display: 'block' }}>Cota 2</Typography>
                                        <Typography variant='body2'>{rcm.cota2 || '—'}</Typography>
                                    </Box>
                                </>
                            )}
                        </Box>
                    </Box>
                )}

                {/* ── ENSAYOS Y SERVICIOS ASOCIADOS ──────────── */}
                <Typography variant='subtitle2' sx={{ fontWeight: 600, mb: 2 }}>
                    Ensayos y servicios asociados ({rcm.ensayos.length})
                </Typography>
                {renderEnsayosTable(rcm.ensayos)}

                {/* ── SUBMUESTRAS COMPACTAS ───────────────────── */}
                {rcm.submuestrasVencimiento && rcm.submuestrasVencimiento.length > 0 &&
                    renderSubmuestrasPills(rcm.submuestrasVencimiento)}

                {/* ── OBSERVACIONES GENERALES ────────────────── */}
                <Box sx={{ mt: 3 }}>
                    <Typography variant='subtitle2' sx={{ fontWeight: 600, mb: 1 }}>Observaciones</Typography>
                    <TextField
                        multiline rows={2} fullWidth size='small' disabled
                        value={rcm.observaciones || ''}
                        placeholder='Sin observaciones'
                    />
                </Box>
            </Box>
        )
    }

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
                    {rcmsCreados.map(rcm => {
                        const rcmBorderColor = rcm.rcmType === 'Muestra' ? '#0000b4' : rcm.rcmType === 'Control' ? '#FF0096' : '#3b3b3b'
                        return (
                            <Box key={rcm.id} sx={{ bgcolor: '#F5F5F5', borderRadius: '8px', overflow: 'hidden', mb: 2, border: `2px solid ${rcmBorderColor}` }}>
                                {/* Header */}
                                <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', p: 2, bgcolor: '#F5F5F5', cursor: 'pointer' }} onClick={() => onToggleSavedRcm(rcm.id)}>
                                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, flex: 1 }}>
                                        <Box onClick={(e) => e.stopPropagation()}>
                                            <Checkbox size='small' checked={selectedRcmIds.includes(rcm.id)} onChange={() => onToggleRcmSelection(rcm.id)} />
                                        </Box>
                                        <Chip label={rcm.rcmType.toUpperCase()} sx={{ fontWeight: 'bold', backgroundColor: rcm.rcmType === 'Muestra' ? '#0000b4' : rcm.rcmType === 'Control' ? '#FF0096' : '#3b3b3b', color: '#ffffff' }} />
                                        <Typography variant='body2' sx={{ fontWeight: 600 }}>
                                            {rcm.temporaryCode || (rcm.numeroRcm ? `RCM-${String(rcm.numeroRcm).padStart(3, '0')}` : '...')}
                                        </Typography>
                                        {!rcm.dbId && (
                                            <Chip label='No guardado' size='small' sx={{ fontWeight: 600, bgcolor: '#FFEBEE', color: '#C62828', border: '1px solid #EF5350' }} />
                                        )}
                                        <Chip label='Pendiente de agrupar' size='small' sx={{ fontWeight: 600, bgcolor: '#FFF3E0', color: '#E65100', border: '1px solid #FFB74D' }} />
                                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, flexWrap: 'wrap' }}>
                                            {renderRcmHeaderFields(rcm)}
                                        </Box>
                                    </Box>
                                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }} onClick={(e) => e.stopPropagation()}>
                                        <IconButton size='small' onClick={() => onToggleSavedRcm(rcm.id)}>
                                            <ExpandMoreIcon sx={{ transform: expandedSavedRcms[rcm.id] ? 'rotate(0deg)' : 'rotate(-90deg)', transition: 'transform 0.3s' }} />
                                        </IconButton>
                                        <IconButton size='small' onClick={(e) => onOpenRcmMenu(e, rcm.id)}>
                                            <MoreVertIcon />
                                        </IconButton>
                                    </Box>
                                </Box>

                                {/* Expandible content */}
                                <Collapse in={expandedSavedRcms[rcm.id]}>
                                    {renderExpandedContent(rcm)}
                                </Collapse>

                                {/* Action bar */}
                                {actionBarRcmId === rcm.id && !showRcmCard && (
                                    <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 1.5, px: 2, py: 1.5, bgcolor: '#EEEEEE', borderTop: '1px solid #E0E0E0' }}>
                                        {/* Left: saved label */}
                                        <Typography variant='body2' sx={{ fontWeight: 700, color: '#0D47A1', whiteSpace: 'nowrap', pl: '5px' }}>
                                            {rcm.temporaryCode || (rcm.numeroRcm ? `RCM-${String(rcm.numeroRcm).padStart(3, '0')}` : 'RCM')} {!rcm.dbId ? 'creado' : 'guardado'}
                                        </Typography>
                                        {/* Right: actions */}
                                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                                            <Button variant='contained' size='small' startIcon={<AddIcon />} onClick={onNewRcmClick}
                                                sx={{ textTransform: 'none', borderRadius: '6px', fontWeight: 600, fontSize: '0.8rem', bgcolor: '#1976D2', '&:hover': { bgcolor: '#1565C0' } }}>
                                                Nuevo RCM
                                            </Button>
                                            <Button variant='outlined' size='small' startIcon={<ContentCopyIcon />}
                                                onClick={() => onQuickDuplicate(rcm.id)}
                                                sx={{ textTransform: 'none', borderRadius: '6px', fontWeight: 600, fontSize: '0.8rem', borderColor: '#1976D2', color: '#1976D2', bgcolor: 'white', '&:hover': { bgcolor: '#E3F2FD', borderColor: '#1565C0' } }}>
                                                Duplicar
                                            </Button>
                                            <Button variant='outlined' size='small' startIcon={<LayersIcon />}
                                                onClick={(e) => { onSetSelectedRcmIds([rcm.id]); onOpenCodigoPopup(e) }}
                                                sx={{ textTransform: 'none', borderRadius: '6px', fontWeight: 600, fontSize: '0.8rem', borderColor: '#7B1FA2', color: '#7B1FA2', bgcolor: 'white', '&:hover': { bgcolor: '#F3E5F5', borderColor: '#6A1B9A' } }}>
                                                Agrupar
                                            </Button>
                                            {rcm.rcmType === 'Muestra' && (
                                                <Button variant='contained' size='small'
                                                    onClick={() => onCodigoUnoAUno(rcm.id)}
                                                    disabled={isCreatingCodigo}
                                                    startIcon={isCreatingCodigo ? <CircularProgress size={14} color='inherit' /> : undefined}
                                                    sx={{ textTransform: 'none', borderRadius: '6px', fontWeight: 700, fontSize: '0.8rem', bgcolor: '#2E7D32', color: 'white', '&:hover': { bgcolor: '#1B5E20' }, '&:disabled': { bgcolor: '#A5D6A7', color: 'white' } }}>
                                                    Código 1:1
                                                </Button>
                                            )}
                                            <IconButton size='small' onClick={() => onSetActionBarRcmId(null)}
                                                sx={{ color: '#666', '&:hover': { bgcolor: '#E0E0E0' } }}>
                                                <CloseIcon fontSize='small' />
                                            </IconButton>
                                        </Box>
                                    </Box>
                                )}
                            </Box>
                        )
                    })}
                </Box>
            )}

            {/* LISTADO 3: AGRUPADOS */}
            {rcmsAgrupados.length > 0 && (
                <Box sx={{ mt: 3 }}>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, mb: 2 }}>
                        <Typography variant='h6' sx={{ fontWeight: 600 }}>Agrupados</Typography>
                        <Chip label={rcmsAgrupados.length} size='small' sx={{ fontWeight: 700, bgcolor: '#E8F5E9', color: '#2E7D32', border: '1px solid #81C784', minWidth: 28 }} />
                    </Box>
                    {rcmsAgrupados.map(rcm => {
                        const rcmBorderColor = rcm.rcmType === 'Muestra' ? '#0000b4' : rcm.rcmType === 'Control' ? '#FF0096' : '#3b3b3b'
                        return (
                            <Box key={rcm.id} sx={{ bgcolor: '#F5F5F5', borderRadius: '8px', overflow: 'hidden', mb: 2, border: `2px solid ${rcmBorderColor}` }}>
                                <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', p: 2, bgcolor: '#F5F5F5', cursor: 'pointer' }} onClick={() => onToggleSavedRcm(rcm.id)}>
                                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, flex: 1 }}>
                                        <Chip label={rcm.rcmType.toUpperCase()} sx={{ fontWeight: 'bold', backgroundColor: rcm.rcmType === 'Muestra' ? '#0000b4' : rcm.rcmType === 'Control' ? '#FF0096' : '#3b3b3b', color: '#ffffff' }} />
                                        <Typography variant='body2' sx={{ fontWeight: 600 }}>
                                            {rcm.temporaryCode || (rcm.numeroRcm ? `RCM-${String(rcm.numeroRcm).padStart(3, '0')}` : '...')}
                                        </Typography>
                                        {!rcm.dbId && (
                                            <Chip label='No guardado' size='small' sx={{ fontWeight: 600, bgcolor: '#FFEBEE', color: '#C62828', border: '1px solid #EF5350' }} />
                                        )}
                                        <Chip label='Agrupado' size='small' sx={{ fontWeight: 600, bgcolor: '#C8E6C9', color: '#2E7D32', border: '1px solid #81C784' }} />
                                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, flexWrap: 'wrap' }}>
                                            {rcm.area && <><Typography variant='body2' color='text.secondary'>|</Typography><Typography variant='body2'>{rcm.area}</Typography></>}
                                            {rcm.tipoServicio && <><Typography variant='body2' color='text.secondary'>|</Typography><Typography variant='body2'>{rcm.tipoServicio}</Typography></>}
                                            {rcm.numeroTarjeta && (
                                                <><Typography variant='body2' color='text.secondary'>|</Typography>
                                                    <Chip label={`T:${rcm.numeroTarjeta}`} size='small' sx={{ bgcolor: '#1976d2', color: '#ffffff', fontWeight: 600, fontSize: '0.75rem' }} /></>
                                            )}
                                            {rcm.ensayos.length > 0 && <><Typography variant='body2' color='text.secondary'>|</Typography><Typography variant='body2'>{rcm.ensayos[0].nombre}</Typography></>}
                                            {rcm.tieneVencimiento && rcm.submuestrasVencimiento && rcm.submuestrasVencimiento.length > 0 && (
                                                <><Typography variant='body2' color='text.secondary'>|</Typography>{renderVencimientoPill(rcm)}</>
                                            )}
                                            {rcm.rcmType === 'Muestra' && rcm.cantidadMuestras && <><Typography variant='body2' color='text.secondary'>|</Typography><Typography variant='body2'>{rcm.cantidadMuestras}</Typography></>}
                                        </Box>
                                    </Box>
                                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }} onClick={(e) => e.stopPropagation()}>
                                        {rcm.tipoServicio?.toLowerCase() === 'dosificación' && (
                                            <Checkbox size='small' checked={selectedRcmIds.includes(rcm.id)} onChange={() => onToggleRcmSelection(rcm.id)} />
                                        )}
                                        <IconButton size='small' onClick={() => onToggleSavedRcm(rcm.id)}>
                                            <ExpandMoreIcon sx={{ transform: expandedSavedRcms[rcm.id] ? 'rotate(0deg)' : 'rotate(-90deg)', transition: 'transform 0.3s' }} />
                                        </IconButton>
                                        <IconButton size='small' onClick={(e) => onOpenRcmMenu(e, rcm.id)}>
                                            <MoreVertIcon />
                                        </IconButton>
                                    </Box>
                                </Box>
                                <Collapse in={expandedSavedRcms[rcm.id]}>
                                    {renderExpandedContent(rcm)}
                                </Collapse>
                            </Box>
                        )
                    })}
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
