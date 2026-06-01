'use client'

import { useEffect, useRef, useState } from 'react'
import { useParams } from 'next/navigation'
import {
    Box,
    Card,
    CardContent,
    Chip,
    Divider,
    Grid,
    Skeleton,
    Typography,
    Button,
    TextField,
} from '@mui/material'
import CheckBoxIcon from '@mui/icons-material/CheckBox'
import CheckBoxOutlineBlankIcon from '@mui/icons-material/CheckBoxOutlineBlank'
import { formatDateOnly } from '@/utils/dateUtils'

/* ── types (mirroring RCMData from internalcontrol) ─────────────────── */
interface EnsayoView {
    id: number
    sku: string
    nombre: string
    norma?: string
    cantidad: number
    observacion: string
}

interface SubmuestraView {
    id: number
    numero: number
    dias: number
    fechaVencimiento: string
    cantidad: number
}

interface RcmView {
    id: number
    numeroRcm?: string
    rcmType?: string
    sede?: string
    area?: string
    tipoServicio?: string
    numeroTarjeta?: string
    tomaMuestra?: string
    tipoMaterial?: string
    item?: string
    procedencia?: string
    ubicacionSector?: string
    elemento?: string
    grado?: string
    cota1?: string
    cota2?: string
    observaciones?: string
    informeEnsayo?: boolean
    fechaCodificacion?: string
    fechaMuestreo?: string
    fechaIngreso?: string
    fechaEntrega?: string
    fechaServicio?: string
    fechaConfeccion?: string
    cantidadMuestras?: string
    tieneVencimiento?: boolean
    ensayos: EnsayoView[]
    submuestrasVencimiento: SubmuestraView[]
    estadoOperativo?: string
    estadoAdministrativo?: string
    /* OT info for header */
    otClave?: string
    otNumeroObra?: string
}

/* ── helpers ────────────────────────────────────────────────────────── */
const fmtDate = (v?: string | null) => (v ? formatDateOnly(v) : '—')

const dateCell = (label: string, value?: string | null) => (
    <Box sx={{ minWidth: 120 }}>
        <Typography variant='caption' color='text.secondary' sx={{ fontWeight: 700, textTransform: 'uppercase', letterSpacing: 0.5, display: 'block' }}>{label}</Typography>
        <Typography variant='body2' sx={{ fontWeight: 600 }}>{fmtDate(value)}</Typography>
    </Box>
)

const textCell = (label: string, value?: string | null) => (
    <Box sx={{ minWidth: 120 }}>
        <Typography variant='caption' color='text.secondary' sx={{ fontWeight: 700, textTransform: 'uppercase', letterSpacing: 0.5, display: 'block' }}>{label}</Typography>
        <Typography variant='body2'>{value || '—'}</Typography>
    </Box>
)

/* ── mapApiToView: API → RcmView ───────────────────────────────────── */
function mapApiToView(data: any): RcmView {
    const ensayos: EnsayoView[] = (data.servicios ?? []).map((s: any, idx: number) => ({
        id: s.id ?? idx,
        sku: s.producto?.sku ?? s.sku ?? '',
        nombre: s.producto?.nombre ?? s.nombre ?? '',
        norma: s.producto?.norma ?? s.norma ?? '',
        cantidad: s.cantidad ?? 1,
        observacion: s.observacion ?? '',
    }))

    const submuestrasVencimiento: SubmuestraView[] = (data.muestras ?? []).flatMap((m: any) =>
        (m.probetas ?? []).map((p: any) => ({
            id: p.id,
            numero: p.numero ?? 0,
            dias: p.dias ?? 0,
            fechaVencimiento: p.fechaVencimiento ? new Date(p.fechaVencimiento).toISOString().split('T')[0] : '',
            cantidad: p.cantidad ?? 1,
        }))
    )

    const tieneVencimiento = submuestrasVencimiento.length > 0

    return {
        id: data.id,
        numeroRcm: data.numeroRcm,
        rcmType: data.rcmType ?? 'Muestra',
        sede: data.sede,
        area: data.area?.nombre ?? data.area,
        tipoServicio: data.familia?.nombre ?? data.tipoServicio,
        numeroTarjeta: data.numeroTarjeta,
        tomaMuestra: data.tomaMuestra,
        tipoMaterial: data.tipoMaterial,
        item: data.item,
        procedencia: data.procedencia,
        ubicacionSector: data.ubicacionSector,
        elemento: data.elemento,
        grado: data.grado,
        cota1: data.cota1,
        cota2: data.cota2,
        observaciones: data.observaciones,
        informeEnsayo: data.informeEnsayo ?? false,
        fechaCodificacion: data.fechaCodificacion,
        fechaMuestreo: data.fechaMuestreo,
        fechaIngreso: data.fechaIngreso,
        fechaEntrega: data.fechaEntrega,
        fechaServicio: data.fechaServicio,
        fechaConfeccion: data.fechaConfeccion,
        cantidadMuestras: data.cantidadMuestras?.toString(),
        tieneVencimiento,
        ensayos,
        submuestrasVencimiento,
        estadoOperativo: data.estadoOperativo,
        estadoAdministrativo: data.estadoAdministrativo,
        otClave: data.ordenTrabajo?.clave,
        otNumeroObra: data.ordenTrabajo?.agenda?.obra?.numeroObra,
    }
}

/* ── page component ────────────────────────────────────────────────── */
export default function ViewRCMPage() {
    const params = useParams()
    const rcmId = (params?.id as string) || ''
    const [rcm, setRcm] = useState<RcmView | null>(null)
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState<string | null>(null)
    const fetched = useRef(false)

    useEffect(() => {
        if (!rcmId || fetched.current) return
        fetched.current = true
        fetch(`/api/rcm/${rcmId}`)
            .then(r => { if (!r.ok) throw new Error('RCM no encontrado'); return r.json() })
            .then(data => { setRcm(mapApiToView(data)); setLoading(false) })
            .catch(e => { setError(e.message); setLoading(false) })
    }, [rcmId])

    /* loading skeleton */
    if (loading) {
        return (
            <Grid container spacing={4}>
                <Grid item xs={12}><Card><CardContent><Skeleton variant='rectangular' height={60} /></CardContent></Card></Grid>
                <Grid item xs={12}><Card><CardContent><Skeleton variant='rectangular' height={300} /></CardContent></Card></Grid>
            </Grid>
        )
    }

    /* error */
    if (error || !rcm) {
        return (
            <Card sx={{ p: 4 }}>
                <CardContent>
                    <Typography color='error' textAlign='center'>{error ?? 'No se pudo cargar el RCM.'}</Typography>
                </CardContent>
            </Card>
        )
    }

    const rcmLabel = rcm.numeroRcm ? `RCM-${String(rcm.numeroRcm).padStart(3, '0')}` : `RCM #${rcm.id}`
    const rcmBorderColor = rcm.rcmType === 'Muestra' ? '#0000b4' : rcm.rcmType === 'Control' ? '#FF0096' : '#3b3b3b'

    const areaName = rcm.area?.toLowerCase() ?? ''
    const esHormigon = areaName === 'hormigón' || areaName === 'hormigon'
    const esElementosComponentes = areaName === 'elementos y componentes'
    const esAsfalto = areaName === 'asfalto'
    const esSuelo = areaName === 'suelo'
    const esServicio = rcm.rcmType === 'Servicio'
    const tieneCamposDinamicos = esHormigon || esElementosComponentes || esAsfalto || esSuelo

    return (
        <Grid container spacing={4}>
            {/* ── HEADER ──────────────────────────────────────────── */}
            <Grid item xs={12}>
                <Card sx={{ p: 2 }}>
                    <CardContent>
                        <Grid container spacing={2} alignItems='center'>
                            <Grid item xs={10}>
                                <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, flexWrap: 'wrap' }}>
                                    <Typography variant='h6' sx={{ fontWeight: 'bold' }}>
                                        {rcmLabel}
                                    </Typography>
                                    <Chip
                                        label={(rcm.rcmType ?? 'MUESTRA').toUpperCase()}
                                        sx={{ fontWeight: 'bold', bgcolor: rcmBorderColor, color: '#fff' }}
                                    />
                                    {rcm.estadoOperativo && (
                                        <Chip label={rcm.estadoOperativo} sx={{ fontWeight: 'bold', bgcolor: '#e0e0e0', color: '#424242' }} />
                                    )}
                                    {rcm.otClave && (
                                        <Chip label={`OT: ${rcm.otClave.substring(0, 7)}`} sx={{ bgcolor: '#f5f5f5', color: '#424242', fontWeight: 'bold' }} />
                                    )}
                                    {rcm.otNumeroObra && (
                                        <Chip label={`Obra: ${rcm.otNumeroObra}`} sx={{ bgcolor: '#f5f5f5', color: '#424242', fontWeight: 'bold' }} />
                                    )}
                                    {rcm.area && (
                                        <Chip label={`Área: ${rcm.area}`} sx={{ bgcolor: '#f5f5f5', color: '#424242', fontWeight: 'bold' }} />
                                    )}
                                    {rcm.tipoServicio && (
                                        <Chip label={`Servicio: ${rcm.tipoServicio}`} sx={{ bgcolor: '#f5f5f5', color: '#424242', fontWeight: 'bold' }} />
                                    )}
                                </Box>
                            </Grid>
                            <Grid item xs={2} display='flex' justifyContent='flex-end'>
                                <Button variant='outlined' color='secondary' sx={{ fontWeight: 'bold', textTransform: 'none' }} onClick={() => window.close()}>
                                    Cerrar
                                </Button>
                            </Grid>
                        </Grid>
                    </CardContent>
                </Card>
            </Grid>

            {/* ── BODY ────────────────────────────────────────────── */}
            <Grid item xs={12}>
                <Card sx={{ border: `2px solid ${rcmBorderColor}`, borderRadius: '8px', overflow: 'hidden' }}>
                    {/* Card header row (same style as RcmSavedList) */}
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, p: 2, bgcolor: '#F5F5F5', flexWrap: 'wrap' }}>
                        <Chip label={(rcm.rcmType ?? 'MUESTRA').toUpperCase()} sx={{ fontWeight: 'bold', bgcolor: rcmBorderColor, color: '#fff' }} />
                        <Typography variant='body2' sx={{ fontWeight: 600 }}>{rcmLabel}</Typography>
                        {rcm.sede && <><Typography variant='body2' color='text.secondary'>|</Typography><Typography variant='body2'>{rcm.sede}</Typography></>}
                        {rcm.area && <><Typography variant='body2' color='text.secondary'>|</Typography><Typography variant='body2'>{rcm.area}</Typography></>}
                        {rcm.tipoServicio && <><Typography variant='body2' color='text.secondary'>|</Typography><Typography variant='body2'>{rcm.tipoServicio}</Typography></>}
                        {rcm.numeroTarjeta && <><Typography variant='body2' color='text.secondary'>|</Typography><Chip label={`T:${rcm.numeroTarjeta}`} size='small' sx={{ bgcolor: '#1976d2', color: '#fff', fontWeight: 600, fontSize: '0.75rem' }} /></>}
                        {rcm.tomaMuestra && <><Typography variant='body2' color='text.secondary'>|</Typography><Typography variant='body2'>#{rcm.tomaMuestra}</Typography></>}
                        {rcm.tipoMaterial && <><Typography variant='body2' color='text.secondary'>|</Typography><Typography variant='body2'>{rcm.tipoMaterial}</Typography></>}
                        {rcm.item && <><Typography variant='body2' color='text.secondary'>|</Typography><Typography variant='body2'>{rcm.item}</Typography></>}
                        {rcm.cantidadMuestras && <><Typography variant='body2' color='text.secondary'>|</Typography><Typography variant='body2'>×{rcm.cantidadMuestras}</Typography></>}
                    </Box>

                    <Box sx={{ p: 3, bgcolor: 'white' }}>
                        {/* ── FILA 1: FECHAS ─────────────────────────── */}
                        <Box sx={{ display: 'grid', gridTemplateColumns: 'repeat(4, minmax(120px, 1fr))', gap: 2, mb: 2 }}>
                            {dateCell('Fecha Codificación', rcm.fechaCodificacion)}
                            {dateCell('Fecha Muestreo', rcm.fechaMuestreo)}
                            {dateCell('Fecha Ingreso', rcm.fechaIngreso)}
                            {dateCell('Fecha Entrega', rcm.fechaEntrega)}
                        </Box>
                        <Divider sx={{ mb: 2 }} />

                        {/* ── FILA 2: CAMPOS SEGÚN TIPO ── */}
                        {esServicio ? (
                            <Box sx={{ display: 'grid', gridTemplateColumns: 'repeat(2, minmax(120px, 1fr))', gap: 2, mb: 2, alignItems: 'center' }}>
                                {textCell('Ubicación / Sector', rcm.ubicacionSector)}
                                <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                                    {rcm.informeEnsayo ? <CheckBoxIcon fontSize='small' sx={{ color: '#1976d2' }} /> : <CheckBoxOutlineBlankIcon fontSize='small' sx={{ color: '#bdbdbd' }} />}
                                    <Typography variant='body2' sx={{ color: rcm.informeEnsayo ? '#1976d2' : 'text.disabled' }}>Informe</Typography>
                                </Box>
                            </Box>
                        ) : (
                            <Box sx={{ display: 'grid', gridTemplateColumns: 'repeat(4, minmax(120px, 1fr))', gap: 2, mb: 2, alignItems: 'center' }}>
                                {textCell('Procedencia', rcm.procedencia)}
                                {textCell('Ubicación / Sector', rcm.ubicacionSector)}

                                {rcm.cantidadMuestras ? (
                                    <Box sx={{ minWidth: 120 }}>
                                        <Typography variant='caption' color='text.secondary' sx={{ fontWeight: 700, textTransform: 'uppercase', letterSpacing: 0.5, display: 'block' }}>Cantidad</Typography>
                                        <Typography variant='body2' sx={{ fontWeight: 700 }}>×{rcm.cantidadMuestras}</Typography>
                                    </Box>
                                ) : <Box />}

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
                        )}

                        {/* ── FILA 3: CAMPOS DINÁMICOS (según área) ─── */}
                        {!esServicio && tieneCamposDinamicos && (
                            <Box sx={{ mb: 2, p: 2, border: '1px solid #f3e5f5', borderRadius: 2, bgcolor: '#fdf6ff' }}>
                                <Typography variant='overline' sx={{ fontWeight: 800, letterSpacing: 2, color: '#e91e8c', display: 'block', mb: 1.5 }}>
                                    Campos Dinámicos — {rcm.area}
                                </Typography>
                                <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 4 }}>
                                    {(esHormigon || esElementosComponentes || esAsfalto) && (
                                        <Box sx={{ minWidth: 120 }}>
                                            <Typography variant='caption' color='text.secondary' sx={{ fontWeight: 700, textTransform: 'uppercase', letterSpacing: 0.5, display: 'block' }}>Fecha Confección</Typography>
                                            <Typography variant='body2'>{fmtDate(rcm.fechaConfeccion)}</Typography>
                                        </Box>
                                    )}
                                    {(esHormigon || esElementosComponentes) && (
                                        <Box sx={{ minWidth: 120 }}>
                                            <Typography variant='caption' color='text.secondary' sx={{ fontWeight: 700, textTransform: 'uppercase', letterSpacing: 0.5, display: 'block' }}>Elemento</Typography>
                                            <Typography variant='body2'>{rcm.elemento || '—'}</Typography>
                                        </Box>
                                    )}
                                    {esHormigon && (
                                        <Box sx={{ minWidth: 80 }}>
                                            <Typography variant='caption' color='text.secondary' sx={{ fontWeight: 700, textTransform: 'uppercase', letterSpacing: 0.5, display: 'block' }}>Grado</Typography>
                                            <Typography variant='body2'>{rcm.grado || '—'}</Typography>
                                        </Box>
                                    )}
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

                        {!esServicio && (
                            <>
                                {/* ── ENSAYOS Y SERVICIOS ASOCIADOS ──────────── */}
                                <Typography variant='subtitle2' sx={{ fontWeight: 600, mb: 2 }}>
                                    Ensayos y servicios asociados ({rcm.ensayos.length})
                                </Typography>
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
                                            {rcm.ensayos.map(ensayo => (
                                                <tr key={ensayo.id} style={{ borderBottom: '1px solid #E0E0E0' }}>
                                                    <td style={{ padding: '12px' }}>
                                                        <Typography variant='body2' sx={{ fontFamily: 'monospace', color: 'text.secondary' }}>{ensayo.sku}</Typography>
                                                    </td>
                                                    <td style={{ padding: '12px' }}>
                                                        <Typography variant='body2' sx={{ fontWeight: 700, display: 'inline' }}>{ensayo.nombre}</Typography>
                                                        {ensayo.norma && (
                                                            <Typography variant='body2' color='text.secondary' sx={{ display: 'inline', ml: 1 }}>{ensayo.norma}</Typography>
                                                        )}
                                                    </td>
                                                    <td style={{ padding: '12px', textAlign: 'center' }}>
                                                        <Typography variant='body2' sx={{ fontWeight: 600 }}>{ensayo.cantidad}</Typography>
                                                    </td>
                                                    <td style={{ padding: '12px' }}>
                                                        <Typography variant='body2' color='text.secondary'>{ensayo.observacion || '-'}</Typography>
                                                    </td>
                                                </tr>
                                            ))}
                                            {rcm.ensayos.length === 0 && (
                                                <tr><td colSpan={4} style={{ padding: '12px', textAlign: 'center' }}>
                                                    <Typography variant='body2' color='text.secondary'>Sin ensayos registrados</Typography>
                                                </td></tr>
                                            )}
                                        </tbody>
                                    </table>
                                </Box>

                                {/* ── SUBMUESTRAS ─────────────────────────────── */}
                                {rcm.submuestrasVencimiento.length > 0 && (
                                    <Box sx={{ mt: 3 }}>
                                        <Typography variant='subtitle2' sx={{ fontWeight: 700, mb: 1 }}>
                                            Detalle de Submuestras — {rcm.submuestrasVencimiento.length} grupo{rcm.submuestrasVencimiento.length !== 1 ? 's' : ''}, {rcm.submuestrasVencimiento.reduce((s, sub) => s + sub.cantidad, 0)} unidades en total
                                        </Typography>
                                        <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
                                            {rcm.submuestrasVencimiento.map(sub => (
                                                <Chip
                                                    key={sub.id}
                                                    label={<><strong>#{sub.numero}</strong>{' · '}{sub.dias}d{sub.fechaVencimiento ? ` · ${formatDateOnly(sub.fechaVencimiento)}` : ''}{' · ×'}{sub.cantidad}</>}
                                                    size='small'
                                                    sx={{ fontWeight: 500, fontSize: '0.8rem', bgcolor: '#FFF9C4', border: '1px solid #F9E21B', color: '#5a4a00' }}
                                                />
                                            ))}
                                        </Box>
                                    </Box>
                                )}
                            </>
                        )}

                        {/* ── OBSERVACIONES ───────────────────────────── */}
                        {!esServicio && (
                            <Box sx={{ mt: 3 }}>
                                <Typography variant='subtitle2' sx={{ fontWeight: 600, mb: 1 }}>Observaciones</Typography>
                                <TextField
                                    multiline rows={2} fullWidth size='small' disabled
                                    value={rcm.observaciones || ''}
                                    placeholder='Sin observaciones'
                                />
                            </Box>
                        )}
                    </Box>
                </Card>
            </Grid>
        </Grid>
    )
}
