import React, { useState } from 'react'
import { useParams } from 'next/navigation'
import { Box, Typography, Button, Card, Chip, Collapse, Divider, Tooltip } from '@mui/material'
import HistoryIcon from '@mui/icons-material/History'
import VisibilityOutlinedIcon from '@mui/icons-material/VisibilityOutlined'
import VisibilityOffOutlinedIcon from '@mui/icons-material/VisibilityOffOutlined'
import AccountTreeOutlinedIcon from '@mui/icons-material/AccountTreeOutlined'
import KeyboardArrowRightIcon from '@mui/icons-material/KeyboardArrowRight'
import KeyboardArrowDownIcon from '@mui/icons-material/KeyboardArrowDown'

import { OPERATIONAL_STATES } from '@/constants/operationalStates'
import { formatDateOnly } from '@/utils/dateUtils'
import type { CodificacionExistenteData, CodigoProductoExistente, RcmResumenExistente } from '../types/rcm-types'

interface CodificacionExistenteBarProps {
    data: CodificacionExistenteData
    onReagrupar?: () => void
    reagrupando?: boolean
}

const SEP = ' · '

const fmtDate = (value?: string | null) => (value ? formatDateOnly(value) : '')

const normalizeArea = (area?: string | null) => (area ?? '').normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase().trim()

const joinParts = (parts: Array<string | null | undefined | false>) => parts.filter(Boolean).join(SEP)

const formatRcmLabel = (numeroRcm?: string) => (numeroRcm ? `RCM-${String(numeroRcm).padStart(3, '0')}` : 'RCM')

// Texto oscuro o claro según el color de fondo del estado
const isDarkColor = (hex: string) => {
    const clean = hex.replace('#', '').slice(0, 6)
    if (clean.length !== 6) return false
    const r = parseInt(clean.slice(0, 2), 16)
    const g = parseInt(clean.slice(2, 4), 16)
    const b = parseInt(clean.slice(4, 6), 16)
    return (0.299 * r + 0.587 * g + 0.114 * b) < 150
}

const getEstadoChip = (estado?: string | null) => {
    const value = String(estado ?? '').trim().toUpperCase()
    const found = OPERATIONAL_STATES.find(s => s.value === value)
    const bg = found?.color ?? '#f3f3f3'
    return { label: found?.label ?? (estado || 'Sin estado'), bg, color: isDarkColor(bg) ? '#fff' : '#424242' }
}

// Campos dinámicos según el área (solo RCM tipo Muestra)
const getCamposDinamicos = (rcm: RcmResumenExistente) => {
    const area = normalizeArea(rcm.area)
    const fechaConf = rcm.fechaConfeccion ? `F. Confección: ${fmtDate(rcm.fechaConfeccion)}` : null
    const elemento = rcm.elemento ? `Elemento: ${rcm.elemento}` : null
    const grado = rcm.grado ? `Grado: ${rcm.grado}` : null
    if (area === 'suelo') return [rcm.cota1 ? `Cota 1: ${rcm.cota1}` : null, rcm.cota2 ? `Cota 2: ${rcm.cota2}` : null]
    if (area === 'hormigon' || area === 'elementos y componentes') return [fechaConf, elemento, grado]
    if (area === 'asfalto' || area === 'otros') return [fechaConf]
    return []
}

const getRcmFilas = (rcm: RcmResumenExistente) => {
    if (rcm.rcmType === 'Muestra') {
        return {
            fila2: joinParts([
                rcm.fechaCodificacion && `F. Cod.: ${fmtDate(rcm.fechaCodificacion)}`,
                rcm.fechaMuestreo && `F. Muestreo: ${fmtDate(rcm.fechaMuestreo)}`,
                rcm.tipoServicio,
                rcm.numeroTarjeta && `T:${rcm.numeroTarjeta}`,
                rcm.tomaMuestra
            ]),
            fila3: joinParts([rcm.tipoMaterial, rcm.item, ...getCamposDinamicos(rcm)])
        }
    }
    return {
        fila2: joinParts([
            rcm.fechaCodificacion && `F. Cod.: ${fmtDate(rcm.fechaCodificacion)}`,
            rcm.fechaServicio && `F. Servicio: ${fmtDate(rcm.fechaServicio)}`,
            rcm.tipoServicio
        ]),
        fila3: joinParts([rcm.item, rcm.observacionItem && `Obs. ítem: ${rcm.observacionItem}`])
    }
}

const RcmRow = ({ rcm, onVer }: { rcm: RcmResumenExistente; onVer: (rcmId: number) => void }) => {
    const estado = getEstadoChip(rcm.estadoOperativo)
    const { fila2, fila3 } = getRcmFilas(rcm)
    return (
        <Box sx={{ py: 1.5 }}>
            <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 2 }}>
                <Box sx={{ display: 'flex', alignItems: 'baseline', gap: 1, minWidth: 0 }}>
                    <Typography variant='body1' sx={{ fontWeight: 600 }}>{formatRcmLabel(rcm.numeroRcm)}</Typography>
                    <Typography variant='body2' color='text.secondary'>{rcm.rcmType}</Typography>
                </Box>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, flexShrink: 0 }}>
                    <Typography variant='body2' color='text.secondary'>
                        {rcm.actividades} {rcm.actividades === 1 ? 'actividad' : 'actividades'}
                    </Typography>
                    <Chip size='small' label={estado.label} sx={{ bgcolor: estado.bg, color: estado.color, fontWeight: 600, borderRadius: '13px' }} />
                    <Button size='small' variant='outlined' onClick={() => onVer(rcm.id)}
                        sx={{ borderRadius: '16px', textTransform: 'none', minWidth: 0, px: 2, color: 'text.primary', borderColor: 'divider' }}>
                        Ver
                    </Button>
                </Box>
            </Box>
            {fila2 && <Typography variant='body2' sx={{ mt: 0.5 }}>{fila2}</Typography>}
            {fila3 && <Typography variant='body2' color='text.secondary' sx={{ mt: 0.25 }}>{fila3}</Typography>}
        </Box>
    )
}

const CodigoRow = ({ cp, expanded, onToggle, onVer }: { cp: CodigoProductoExistente; expanded: boolean; onToggle: () => void; onVer: (rcmId: number) => void }) => (
    <Box>
        <Box onClick={onToggle} sx={{ display: 'flex', alignItems: 'center', gap: 1.5, py: 1.25, cursor: 'pointer', '&:hover': { bgcolor: 'action.hover' }, borderRadius: 1, px: 0.5 }}>
            {expanded ? <KeyboardArrowDownIcon fontSize='small' /> : <KeyboardArrowRightIcon fontSize='small' />}
            <Typography variant='body1' sx={{ fontWeight: 600, flexShrink: 0 }}>{cp.codigoNombre}</Typography>
            {cp.area && <Typography variant='body2' color='text.secondary' sx={{ flexShrink: 0 }}>{cp.area}</Typography>}
            <Typography variant='body1' sx={{ flex: 1, minWidth: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }} title={cp.descripcionServicio ?? ''}>
                {cp.descripcionServicio || '—'}
            </Typography>
            <Typography variant='body2' color='text.secondary' sx={{ flexShrink: 0 }}>{cp.rcms.length} RCM</Typography>
        </Box>
        <Collapse in={expanded} unmountOnExit>
            <Box sx={{ pl: 4.5, pr: 0.5 }}>
                {cp.rcms.map((rcm, idx) => (
                    <React.Fragment key={rcm.id}>
                        {idx > 0 && <Divider />}
                        <RcmRow rcm={rcm} onVer={onVer} />
                    </React.Fragment>
                ))}
            </Box>
        </Collapse>
    </Box>
)

const CodificacionExistenteBar = ({ data, onReagrupar, reagrupando = false }: CodificacionExistenteBarProps) => {
    const params = useParams()
    const lang = params?.lang || 'es'
    const [showDetalle, setShowDetalle] = useState(false)
    const [expandedCps, setExpandedCps] = useState<Set<number>>(new Set())

    const { totales } = data
    const desglose = joinParts([
        totales.porTipo.Muestra > 0 && `${totales.porTipo.Muestra} Muestra`,
        totales.porTipo.Control > 0 && `${totales.porTipo.Control} Control`,
        totales.porTipo.Servicio > 0 && `${totales.porTipo.Servicio} Servicio`
    ])
    const resumen = `${totales.codigos} CP${SEP}${totales.rcms} RCM${desglose ? ` (${desglose})` : ''}`

    const toggleCp = (cpId: number) => {
        setExpandedCps(prev => {
            const next = new Set(prev)
            if (next.has(cpId)) next.delete(cpId)
            else next.add(cpId)
            return next
        })
    }

    // Abre el RCM en otra ventana, solo lectura
    const handleVerRcm = (rcmId: number) => {
        window.open(`/${lang}/apps/view-rcm/${rcmId}`, '_blank')
    }

    const buttonSx = { borderRadius: '16px', textTransform: 'none', px: 2, color: 'text.primary', borderColor: 'divider', '&:hover': { borderColor: 'text.primary' } }

    return (
        <Card>
            <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 2, px: 4, py: 2.5, flexWrap: 'wrap' }}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, minWidth: 0 }}>
                    <HistoryIcon sx={{ color: 'text.secondary' }} />
                    <Typography variant='h6' sx={{ fontWeight: 'bold' }}>Codificación existente</Typography>
                    <Typography variant='body2' color='text.secondary'>{resumen}</Typography>
                </Box>
                <Box sx={{ display: 'flex', gap: 1.5 }}>
                    <Button size='small' variant='outlined' onClick={() => setShowDetalle(prev => !prev)} sx={buttonSx}
                        startIcon={showDetalle ? <VisibilityOffOutlinedIcon /> : <VisibilityOutlinedIcon />}>
                        {showDetalle ? 'Ocultar detalle' : 'Ver detalle'}
                    </Button>
                    <Tooltip title={!onReagrupar ? 'Disponible próximamente' : reagrupando ? 'La codificación existente ya está cargada en el workbench' : 'Cargar los CP y RCM confirmados para reagruparlos'}>
                        <span>
                            <Button size='small' variant='outlined' onClick={onReagrupar} disabled={!onReagrupar || reagrupando} sx={buttonSx} startIcon={<AccountTreeOutlinedIcon />}>
                                {reagrupando ? 'Reagrupando…' : 'Reagrupar'}
                            </Button>
                        </span>
                    </Tooltip>
                </Box>
            </Box>
            <Collapse in={showDetalle} unmountOnExit>
                <Divider />
                <Box sx={{ px: 4, py: 1.5 }}>
                    {data.codigos.map(cp => (
                        <CodigoRow key={cp.id} cp={cp} expanded={expandedCps.has(cp.id)} onToggle={() => toggleCp(cp.id)} onVer={handleVerRcm} />
                    ))}
                </Box>
            </Collapse>
        </Card>
    )
}

export default CodificacionExistenteBar
