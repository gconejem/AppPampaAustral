'use client'

import { useEffect, useMemo, useState } from 'react'

import Box from '@mui/material/Box'
import Card from '@mui/material/Card'
import CardHeader from '@mui/material/CardHeader'
import Chip from '@mui/material/Chip'
import Divider from '@mui/material/Divider'
import Dialog from '@mui/material/Dialog'
import IconButton from '@mui/material/IconButton'
import LinearProgress from '@mui/material/LinearProgress'
import Tab from '@mui/material/Tab'
import Tabs from '@mui/material/Tabs'
import Typography from '@mui/material/Typography'
import Button from '@mui/material/Button'
import Paper from '@mui/material/Paper'
import { alpha } from '@mui/material/styles'

import CloseIcon from '@mui/icons-material/Close'
import VisibilityIcon from '@mui/icons-material/Visibility'
import EditIcon from '@mui/icons-material/Edit'
import DescriptionOutlinedIcon from '@mui/icons-material/DescriptionOutlined'

import { OPERATIONAL_STATES } from '@/constants/operationalStates'
import ADMINISTRATIVE_STATES from '@/constants/administrativeStates'

import tableStyles from '@core/styles/table.module.css'

type Servicio = {
  cantidad?: number | null
  estadoOperativo?: string | null
  estado?: string | null
  codigo?: string | null
  nombre?: string | null
  norma?: string | null
  producto?: { sku?: string | null; nombre?: string | null; norma?: string | null } | null
}

type HistoryEntry = {
  estNuevo?: string | null
  motivo?: string | null
  observacion?: string | null
  createdAt?: string | null
  fechaAccion?: string | null
  tipo?: string | null
  tipoEstado?: string | null
}

type RcmRow = {
  id: number
  numeroRcm?: string | null
  fechaMuestreo?: string | null
  fechaServicio?: string | null
  numeroTarjeta?: string | null
  rcmType?: string | null
  estadoOperativo?: string | null
  estadoAdministrativo?: string | null
  sede?: string | null
  vencimiento?: boolean | null
  cantidadMuestras?: number | null
  cliente?: { razonSocial?: string | null; nombreCliente?: string | null } | null
  obra?: { numeroObra?: string | null; nombreObra?: string | null; comuna?: string | null } | null
  tipoMaterial?: string | null
  item?: string | null
  tomaMuestra?: string | null
  procedencia?: string | null
  ubicacionSector?: string | null
  area?: { nombre?: string | null } | null
  familia?: { nombre?: string | null } | null
  servicios?: Servicio[]
  RCMHistory?: HistoryEntry[]
  ordenTrabajoId?: string | null
  ordenTrabajo?: { id?: string | null; clave?: string | null; correlativ?: string | null } | null
  codigoAgrupador?: { id?: number | null; codigoNombre?: string | null; descripcionServicio?: string | null } | null
}

type AgrupadorDetalle = {
  id: number
  codigoNombre: string
  descripcionServicio?: string | null
  ordenTrabajo?: { clave?: string | null; correlativ?: string | null } | null
  rcms: RcmRow[]
}

const normalizeStateKey = (raw?: string | null) => {
  const s = String(raw ?? '').trim()
  if (!s) return null
  if (s.includes('_')) return s.toUpperCase()

  return s.toUpperCase().replace(/\s+/g, '_')
}

const isEventoAbierto = (h: Pick<HistoryEntry, 'tipo' | 'tipoEstado'> | null | undefined) => {
  const tipo = String(h?.tipo ?? '').trim()
  const tipoEstado = String(h?.tipoEstado ?? '').trim().toUpperCase()
  return tipo === 'Evento Abierto' || tipoEstado === 'EVENTO'
}

const isEventoCerrado = (h: Pick<HistoryEntry, 'tipo' | 'tipoEstado'> | null | undefined) => {
  const tipo = String(h?.tipo ?? '').trim()
  const tipoEstado = String(h?.tipoEstado ?? '').trim().toUpperCase()
  return tipo === 'Evento Cerrado' || tipoEstado === 'EVENTO_CERRADO'
}

// Evento activo: existe "Evento Abierto" posterior al último "Evento Cerrado".
// Historial viene ordenado DESC desde API.
const findEventoActivo = (history: HistoryEntry[] | null | undefined) => {
  for (const h of history ?? []) {
    if (isEventoCerrado(h)) return null
    if (isEventoAbierto(h)) return h
  }
  return null
}

const formatRcmLabel = (numeroRcm?: string | null) => {
  const raw = String(numeroRcm ?? '').trim()
  if (!raw) return '-'

  // Si viene como número ("1"), pad a 3. Si ya viene "001" se respeta.
  if (/^\d+$/.test(raw)) return `RCM-${raw.padStart(3, '0')}`

  // Si viene "RCM-001" no duplicar
  if (/^RCM-\d+/i.test(raw)) return raw

  return raw
}

const formatMaterialItemToma = (r: RcmRow) => {
  const parts = [r.tipoMaterial, r.procedencia ?? r.item, r.tomaMuestra ?? r.ubicacionSector]
    .map(v => String(v ?? '').trim())
    .filter(Boolean)

  return parts.length ? parts.join(' - ') : '-'
}

const computeEnsayos = (servicios?: Servicio[]) => {
  let total = 0
  let ensayados = 0

  for (const s of servicios ?? []) {
    const qty = Number(s.cantidad ?? 0)
    total += qty
    if (String(s.estadoOperativo ?? '').trim().toUpperCase() === 'ENSAYADO') ensayados += qty
  }

  return { total, ensayados }
}

const computeEnsayoStateKey = (servicios?: Servicio[]) => {
  const { total, ensayados } = computeEnsayos(servicios)
  if (total <= 0) return null
  if (ensayados >= total) return 'ENSAYADO'
  if (ensayados > 0) return 'EN_PROCESO'
  return 'CODIFICADO'
}

const getOperationalLabel = (raw?: string | null) => {
  const key = normalizeStateKey(raw)
  if (!key) return '-'
  if (key === 'ENVIADO_DIGITACION') return 'Env. Digitación'
  return OPERATIONAL_STATES.find(s => s.value === key)?.label ?? key
}

const normalizeHex6 = (hex: string) => {
  const h = String(hex ?? '').trim()
  // Algunos colores vienen como #RRGGBBAA. Quitamos el alfa porque lo manejamos con `alpha()`.
  if (h.startsWith('#') && h.length === 9) return h.slice(0, 7)
  return h
}

const getOperativeChipSx = (state?: string | null) => {
  const key = normalizeStateKey(state)
  const st = OPERATIONAL_STATES.find(item => item.value === key || String(item.label ?? '').toUpperCase() === String(key))
  const hex = st?.color

  if (!hex) {
    return {
      bgcolor: 'action.hover',
      color: 'text.secondary',
      border: '1px solid',
      borderColor: 'divider',
      textTransform: 'uppercase',
      fontWeight: 800,
      fontSize: '0.72rem'
    } as const
  }

  const base = normalizeHex6(hex)

  return {
    bgcolor: alpha(base, 0.18),
    color: '#7c7778',
    border: '1px solid',
    borderColor: alpha(base, 0.32),
    textTransform: 'uppercase',
    fontWeight: 800,
    fontSize: '0.72rem'
  } as const
}

const getAdministrativeChipSx = (state?: string | null) => {
  const key = normalizeStateKey(state)
  const st = ADMINISTRATIVE_STATES.find(item => item.value === key || String(item.label ?? '').toUpperCase() === String(key))
  const hex = st?.color

  // SIN_INICIO (muy claro) -> estilo neutro
  if (!hex || key === 'SIN_INICIO') {
    return {
      bgcolor: 'action.hover',
      color: 'text.secondary',
      border: '1px solid',
      borderColor: 'divider',
      fontWeight: 800,
      fontSize: '0.72rem'
    } as const
  }

  const base = normalizeHex6(hex)

  return {
    bgcolor: alpha(base, 0.18),
    color: '#7c7778',
    border: '1px solid',
    borderColor: alpha(base, 0.32),
    fontWeight: 800,
    fontSize: '0.72rem'
  } as const
}

const formatDateDDMMYYYYDash = (v: any) => {
  if (!v) return '-'
  const d = v instanceof Date ? v : new Date(v)
  if (isNaN(d.getTime())) return '-'
  const dd = String(d.getDate()).padStart(2, '0')
  const mm = String(d.getMonth() + 1).padStart(2, '0')
  const yyyy = d.getFullYear()
  return `${dd}-${mm}-${yyyy}`
}

const pickStateFromCounts = (counts: Record<string, number>, priority: string[]) => {
  for (const p of priority) {
    if (Number(counts[p] ?? 0) > 0) return p
  }
  const entries = Object.entries(counts).filter(([, v]) => Number(v) > 0)
  if (!entries.length) return null
  entries.sort((a, b) => Number(b[1]) - Number(a[1]))
  return entries[0][0]
}

const findStateSince = (rcms: RcmRow[], stateKey: string) => {
  let best: Date | null = null

  for (const r of rcms ?? []) {
    for (const h of r.RCMHistory ?? []) {
      const k1 = normalizeStateKey(h.tipoEstado)
      const k2 = normalizeStateKey(h.estNuevo)
      if (k1 !== stateKey && k2 !== stateKey) continue

      const raw = String(h.fechaAccion ?? h.createdAt ?? '').trim()
      if (!raw) continue
      const d = new Date(raw)
      if (isNaN(d.getTime())) continue
      if (!best || d > best) best = d
    }
  }

  return best
}

export default function CodigoProductoDetallePanel({
  codigoAgrupadorId,
  onClose,
  onResolveEvento
}: {
  codigoAgrupadorId: number | null
  onClose?: () => void
  onResolveEvento?: (rcmId: number) => void
}) {
  // objetivo: en md+ quepan 3 RCM “completos” sin scroll vertical
  const detailBodyHeight = { xs: 220, sm: 260, md: 260 } as const
  const [tab, setTab] = useState<'rcms' | 'eventos'>('rcms')
  const [loading, setLoading] = useState(false)
  const [data, setData] = useState<AgrupadorDetalle | null>(null)
  const [refreshTick, setRefreshTick] = useState(0)

  const [rcmDialogOpen, setRcmDialogOpen] = useState(false)
  const [rcmDialogLoading, setRcmDialogLoading] = useState(false)
  const [rcmDialogError, setRcmDialogError] = useState<string | null>(null)
  const [rcmDialogData, setRcmDialogData] = useState<RcmRow | null>(null)
  const [rcmDialogCpMeta, setRcmDialogCpMeta] = useState<any | null>(null)
  const [rcmDialogHistory, setRcmDialogHistory] = useState<any[] | null>(null)

  useEffect(() => {
    const onRefresh = () => {
      if (!codigoAgrupadorId) return
      setRefreshTick(t => t + 1)
    }

    window.addEventListener('rcmnavigator:codigo-detalle-refresh', onRefresh as any)
    return () => window.removeEventListener('rcmnavigator:codigo-detalle-refresh', onRefresh as any)
  }, [codigoAgrupadorId])

  useEffect(() => {
    if (!codigoAgrupadorId) {
      setData(null)
      setRcmDialogCpMeta(null)
      return
    }

    let cancelled = false

    const run = async () => {
      setLoading(true)

      try {
        // Evitar respuestas cacheadas luego de acciones (p.ej. cerrar evento)
        const res = await fetch(`/api/codigo-agrupador/${codigoAgrupadorId}?t=${refreshTick}`, { cache: 'no-store' })
        const json = await res.json()
        if (cancelled) return

        setData(json as AgrupadorDetalle)
      } catch (e) {
        // eslint-disable-next-line no-console
        console.error('Error loading codigo agrupador detail:', e)
        if (!cancelled) setData(null)
      } finally {
        if (!cancelled) setLoading(false)
      }
    }

    run()

    return () => {
      cancelled = true
    }
  }, [codigoAgrupadorId, refreshTick])

  const rcms = data?.rcms ?? []

  const headerMeta = useMemo(() => {
    const count = (items: Array<string | null | undefined>) => {
      const map = new Map<string, number>()
      for (const raw of items) {
        const v = String(raw ?? '').trim()
        if (!v) continue
        map.set(v, (map.get(v) ?? 0) + 1)
      }
      let best: string | null = null
      let bestN = -1
      for (const [k, n] of map.entries()) {
        if (n > bestN) {
          best = k
          bestN = n
        }
      }
      return best
    }

    const area = count(rcms.map(r => r.area?.nombre))
    const tipoServicio = count(rcms.map(r => r.familia?.nombre))
    const descripcion = String(data?.descripcionServicio ?? '').trim() || null

    return { area, tipoServicio, descripcion }
  }, [data?.descripcionServicio, rcms])

  const headerStates = useMemo(() => {
    const opCounts: Record<string, number> = {}
    const adCounts: Record<string, number> = {}

    for (const r of rcms ?? []) {
      const opKey = normalizeStateKey(r.estadoOperativo)
      if (opKey) opCounts[opKey] = (opCounts[opKey] ?? 0) + 1

      const adKey = normalizeStateKey(r.estadoAdministrativo)
      if (adKey) adCounts[adKey] = (adCounts[adKey] ?? 0) + 1
    }

    const opMain = pickStateFromCounts(opCounts, [
      'EVENTO',
      'EN_PROCESO',
      'CODIFICADO',
      'ENSAYADO',
      'ENVIADO_DIGITACION',
      'DIGITADO',
      'REVISADO',
      'FIRMADO',
      'ENVIADO'
    ])

    const adMain = pickStateFromCounts(adCounts, ['SIN_INICIO', 'PAGADO', 'PENDIENTE', 'FACTURADO', 'ENVIADO'])

    const opSince = opMain ? findStateSince(rcms, opMain) : null

    return { opMain, adMain, opSince }
  }, [rcms])

  const eventos = useMemo(() => {
    return rcms
      .map(r => {
        const active = findEventoActivo(r.RCMHistory)
        if (!active) return null
        return { rcm: r, last: active }
      })
      .filter(Boolean) as Array<{ rcm: RcmRow; last: HistoryEntry }>
  }, [rcms])

  const counts = useMemo(() => {
    const totalRcms = rcms.length
    const ev = eventos.length

    return { totalRcms, ev }
  }, [rcms.length, eventos.length])

  const openRcmDialog = async (rcmId: number) => {
    setRcmDialogOpen(true)
    setRcmDialogLoading(true)
    setRcmDialogError(null)
    setRcmDialogData(null)
    setRcmDialogCpMeta(null)
    setRcmDialogHistory(null)

    try {
      const cpId = Number(codigoAgrupadorId ?? 0)
      if (cpId > 0) {
        fetch(`/api/codigo-agrupador/seguimiento?id=${cpId}&ts=${Date.now()}`, { cache: 'no-store' })
          .then(r => (r.ok ? r.json().catch(() => null) : null))
          .then(json => {
            const row = Array.isArray(json) ? json[0] : null
            setRcmDialogCpMeta(row)
          })
          .catch(() => {
            setRcmDialogCpMeta(null)
          })
      }

      fetch(`/api/rcm/${rcmId}/history?take=80`, { cache: 'no-store' })
        .then(r => (r.ok ? r.json().catch(() => null) : null))
        .then(json => {
          setRcmDialogHistory(Array.isArray(json) ? json : null)
        })
        .catch(() => {
          setRcmDialogHistory(null)
        })

      const res = await fetch(`/api/rcm/${rcmId}`, { cache: 'no-store' })
      if (!res.ok) throw new Error('No se pudo cargar el RCM')
      const json = await res.json().catch(() => null)
      setRcmDialogData(json as any)
    } catch (e) {
      setRcmDialogError(e instanceof Error ? e.message : 'No se pudo cargar el RCM')
    } finally {
      setRcmDialogLoading(false)
    }
  }

  const closeRcmDialog = () => {
    if (rcmDialogLoading) return
    setRcmDialogOpen(false)
    setRcmDialogError(null)
    setRcmDialogData(null)
    setRcmDialogHistory(null)
  }

  const handleEditRcm = (rcmId: number) => {
    if (typeof window === 'undefined') return
    const parts = window.location.pathname.split('/').filter(Boolean)
    const lang = parts[0] || 'en'
    const url = `${window.location.origin}/${lang}/apps/rcm-edit/${rcmId}`
    window.open(url, '_blank')
  }

  if (!codigoAgrupadorId) {
    return (
      <Card data-rcmnav-detail sx={{ mt: 4, minHeight: 260, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <Typography variant="h6" color="text.secondary" sx={{ textAlign: 'center', width: '100%' }}>
          Selecciona un Código Producto para ver el detalle
        </Typography>
      </Card>
    )
  }

  return (
    <Card data-rcmnav-detail sx={{ mt: 4 }}>
      <CardHeader
        title={
          <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 2, flexWrap: 'nowrap' }}>
            {/* Izquierda: ID + Área + Tipo + Descripción (1 línea) */}
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, minWidth: 0, flex: 1, overflow: 'hidden' }}>
              <Chip
                size='small'
                label={data?.codigoNombre ?? `Código #${codigoAgrupadorId}`}
                sx={{ bgcolor: 'primary.main', color: 'primary.contrastText', fontWeight: 900 }}
              />

              {headerMeta.area ? (
                <Chip size='small' label={headerMeta.area} variant='outlined' sx={{ fontWeight: 800 }} />
              ) : null}

              {headerMeta.tipoServicio ? (
                <Chip size='small' label={headerMeta.tipoServicio} variant='outlined' sx={{ fontWeight: 800 }} />
              ) : null}

              {headerMeta.descripcion ? (
                <Typography
                  variant='body2'
                  color='text.secondary'
                  sx={{
                    minWidth: 0,
                    overflow: 'hidden',
                    textOverflow: 'ellipsis',
                    whiteSpace: 'nowrap'
                  }}
                  title={headerMeta.descripcion}
                >
                  {headerMeta.descripcion}
                </Typography>
              ) : null}
            </Box>

            {/* Derecha: Estados (mismo tamaño/tipografía) */}
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, flexShrink: 0 }}>
              {loading ? <Chip size='small' label='Cargando…' variant='outlined' sx={{ fontWeight: 800 }} /> : null}

              {headerStates.opMain ? (
                <Chip
                  size='small'
                  label={OPERATIONAL_STATES.find(s => s.value === headerStates.opMain)?.label ?? headerStates.opMain}
                  sx={getOperativeChipSx(headerStates.opMain)}
                />
              ) : null}

              {headerStates.adMain ? (
                <Chip
                  size='small'
                  label={ADMINISTRATIVE_STATES.find(s => s.value === headerStates.adMain)?.label ?? headerStates.adMain}
                  sx={getAdministrativeChipSx(headerStates.adMain)}
                />
              ) : null}

              {onClose ? (
                <IconButton size='small' aria-label='Cerrar' onClick={onClose}>
                  <CloseIcon fontSize='small' />
                </IconButton>
              ) : null}
            </Box>
          </Box>
        }
      />

      <Divider />

      <Box sx={{ px: 2, pt: 1 }}>
        <Tabs
          value={tab}
          onChange={(_, v) => setTab(v)}
          sx={{ minHeight: 36 }}
        >
          <Tab value='rcms' label={`RCMs (${counts.totalRcms})`} sx={{ minHeight: 36, textTransform: 'none', fontWeight: 700 }} />
          <Tab value='eventos' label={`Eventos (${counts.ev})`} sx={{ minHeight: 36, textTransform: 'none', fontWeight: 700 }} />
        </Tabs>
      </Box>

      <Divider />

      {tab === 'rcms' ? (
        <Box sx={{ p: 2, height: detailBodyHeight, overflow: 'hidden' }}>
          <Box
            sx={{
              height: '100%',
              overflowX: 'auto',
              overflowY: 'auto',
              // El CSS base de la app fija las filas a 50px; aquí necesitamos permitir 2 líneas (RCM + Sede)
              '& table tbody td, & table tbody th': {
                blockSize: 64
              }
            }}
          >
            <table className={tableStyles.table}>
              <thead>
                <tr>
                  <th style={{ textAlign: 'left' }}>#</th>
                  <th style={{ textAlign: 'center' }}>TARJETA</th>
                  <th style={{ textAlign: 'center' }}>TIPO</th>
                  <th style={{ textAlign: 'center' }}>ESTADO</th>
                  <th style={{ textAlign: 'center' }}>ÁREA / SERVICIO</th>
                  <th style={{ textAlign: 'left' }}>MATERIAL · ÍTEM · TOMA</th>
                  <th style={{ textAlign: 'center' }}>F. Muest. / Serv</th>
                  <th style={{ textAlign: 'center' }}>ENS</th>
                  <th style={{ textAlign: 'center' }}>SUB</th>
                  <th style={{ textAlign: 'center' }} />
                </tr>
              </thead>
              <tbody>
                {rcms.map(r => {
                  const ens = computeEnsayos(r.servicios)
                  const fecha = r.fechaServicio ?? r.fechaMuestreo
                  const sub = r.vencimiento ? Number(r.cantidadMuestras ?? 0) : 0
                  const serviceName =
                    String(r.familia?.nombre ?? '').trim() ||
                    (r.servicios ?? [])
                      .map(s => String(s?.nombre ?? '').trim())
                      .find(Boolean) ||
                    ''

                  return (
                    <tr key={r.id}>
                      <td>
                        <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-start' }}>
                          <Typography variant='body2' sx={{ fontWeight: 900, color: 'primary.main' }}>
                            {(() => {
                              const raw = String(r.numeroRcm ?? '').trim()
                              const num = raw.replace(/^RCM[-\s]?/i, '').trim()
                              return `RCM — ${num || raw || '-'}`
                            })()}
                          </Typography>
                          <Typography variant='caption' color='text.secondary' sx={{ lineHeight: 1.2 }}>
                            {(() => {
                              const sede = String(r.sede ?? '').trim()
                              return sede || ' '
                            })()}
                          </Typography>
                        </Box>
                      </td>
                      <td style={{ textAlign: 'center' }}>
                        {r.numeroTarjeta ? (
                          <Chip size='small' label={`T:${r.numeroTarjeta}`} variant='outlined' sx={{ fontWeight: 700 }} />
                        ) : (
                          <Typography variant='body2'>-</Typography>
                        )}
                      </td>
                      <td style={{ textAlign: 'center' }}>
                        <Chip
                          size='small'
                          label={(r.rcmType ?? 'MUESTRA').toUpperCase()}
                          sx={{ bgcolor: 'primary.main', color: 'primary.contrastText', fontWeight: 800, fontSize: '0.72rem' }}
                        />
                      </td>
                      <td style={{ textAlign: 'center' }}>
                        {(() => {
                          // El estado aquí representa el avance de ensayos (ServicioRCM.estadoOperativo), no el estado operativo del RCM.
                          if (ens.total <= 0) {
                            return (
                              <Chip size='small' label='-' variant='outlined' sx={{ fontWeight: 800, fontSize: '0.72rem' }} />
                            )
                          }

                          const ensayoState = ens.ensayados >= ens.total ? 'ENSAYADO' : ens.ensayados > 0 ? 'EN_PROCESO' : 'CODIFICADO'
                          const label = OPERATIONAL_STATES.find(s => s.value === ensayoState)?.label ?? ensayoState

                          return <Chip size='small' label={label} sx={getOperativeChipSx(ensayoState)} />
                        })()}
                      </td>
                      <td style={{ textAlign: 'center' }}>
                        <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', lineHeight: 1.2 }}>
                          <Typography variant='body2' sx={{ fontWeight: 700 }}>
                            {r.area?.nombre ?? '-'}
                          </Typography>
                          <Typography variant='caption' color='text.secondary' sx={{ fontWeight: 700 }}>
                            {serviceName || ' '}
                          </Typography>
                        </Box>
                      </td>
                      <td>{formatMaterialItemToma(r)}</td>
                      <td style={{ textAlign: 'center' }}>
                        <Typography variant='body2'>
                          {fecha ? formatDateDDMMYYYYDash(fecha) : '-'}
                        </Typography>
                      </td>
                      <td style={{ textAlign: 'center', minWidth: 56 }}>
                        <Typography variant='body2' sx={{ fontWeight: 800 }}>
                          {ens.total > 0 ? `${ens.ensayados}/${ens.total}` : '-'}
                        </Typography>
                      </td>
                      <td style={{ textAlign: 'center', minWidth: 48 }}>
                        <Typography variant='body2' sx={{ fontWeight: 800 }}>
                          {sub > 0 ? String(sub) : ''}
                        </Typography>
                      </td>
                      <td style={{ textAlign: 'center' }}>
                        <Box sx={{ display: 'inline-flex', alignItems: 'center', gap: 1 }}>
                          <IconButton
                            size='small'
                            aria-label='Ver'
                            title='Ver'
                            onClick={() => openRcmDialog(r.id)}
                            sx={theme => ({
                              width: 28,
                              height: 28,
                              borderRadius: 1,
                              border: `1px solid ${theme.palette.divider}`,
                              bgcolor: theme.palette.background.paper,
                              '&:hover': { bgcolor: alpha(theme.palette.action.hover, 0.9) }
                            })}
                          >
                            <VisibilityIcon fontSize='small' />
                          </IconButton>

                          <IconButton
                            size='small'
                            aria-label='Editar'
                            title='Editar'
                            onClick={() => handleEditRcm(r.id)}
                            sx={theme => ({
                              width: 28,
                              height: 28,
                              borderRadius: 1,
                              border: `1px solid ${theme.palette.divider}`,
                              bgcolor: theme.palette.background.paper,
                              color: theme.palette.warning.main,
                              '&:hover': { bgcolor: alpha(theme.palette.action.hover, 0.9) }
                            })}
                          >
                            <EditIcon fontSize='small' />
                          </IconButton>

                          <IconButton
                            size='small'
                            aria-label='(sin acción)'
                            title='(sin acción)'
                            onClick={e => {
                              e.preventDefault()
                              e.stopPropagation()
                            }}
                            sx={theme => ({
                              width: 28,
                              height: 28,
                              borderRadius: 1,
                              border: `1px solid ${theme.palette.divider}`,
                              bgcolor: theme.palette.background.paper,
                              color: theme.palette.success.main,
                              '&:hover': { bgcolor: alpha(theme.palette.action.hover, 0.9) }
                            })}
                          >
                            <EditIcon fontSize='small' />
                          </IconButton>
                        </Box>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </Box>
        </Box>
      ) : (
        <Box sx={{ p: 2, height: detailBodyHeight, overflowY: 'auto' }}>
          {eventos.length === 0 ? (
            <Typography variant='body2' color='text.secondary'>
              Sin eventos para este código.
            </Typography>
          ) : (
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1.25 }}>
              {eventos.map(({ rcm, last }) => {
                const when = String(last.fechaAccion ?? last.createdAt ?? '').trim() || null

                const motivo = String(last.motivo ?? '').trim()
                const [head, ...rest] = motivo.split(' - ')
                const evTipo = (head || 'Evento').trim()
                const evMotivo = (rest.join(' - ') || '').trim()

                const obs = String(last.observacion ?? '').trim()
                const obsLine = obs ? (obs.split(/\r?\n/).find(l => String(l).trim()) ?? '') : ''

                return (
                  <Paper
                    key={rcm.id}
                    variant='outlined'
                    sx={theme => ({
                      p: 1.25,
                      borderRadius: 2,
                      borderColor: alpha(theme.palette.error.main, 0.35),
                      bgcolor: alpha(theme.palette.error.main, 0.06)
                    })}
                  >
                    <Box sx={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 2 }}>
                      <Box sx={{ minWidth: 0 }}>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 0.5, flexWrap: 'wrap' }}>
                          <Chip
                            size='small'
                            label={evTipo}
                            sx={theme => ({
                              fontWeight: 900,
                              borderRadius: 999,
                              bgcolor: alpha(theme.palette.error.main, 0.16),
                              color: theme.palette.error.main
                            })}
                          />
                          <Typography variant='caption' color='text.secondary' sx={{ fontWeight: 800 }}>
                            {formatRcmLabel(rcm.numeroRcm)}
                          </Typography>
                          {when ? (
                            <Typography variant='caption' color='text.secondary'>
                              {new Date(when).toLocaleDateString()}
                            </Typography>
                          ) : null}
                        </Box>

                        {evMotivo ? (
                          <Typography variant='body2' sx={{ fontWeight: 700 }}>
                            {evMotivo}
                          </Typography>
                        ) : null}

                        {obsLine ? (
                          <Typography variant='caption' color='text.secondary' sx={{ display: 'block' }}>
                            {obsLine}
                          </Typography>
                        ) : null}
                      </Box>

                      <Button
                        size='small'
                        variant='outlined'
                        color='success'
                        onClick={() => onResolveEvento?.(rcm.id)}
                        sx={{ textTransform: 'none', borderRadius: 999, whiteSpace: 'nowrap' }}
                      >
                        Resolver
                      </Button>
                    </Box>
                  </Paper>
                )
              })}
            </Box>
          )}
        </Box>
      )}

      {/* Popup: Ver RCM */}
      <Dialog
        open={rcmDialogOpen}
        onClose={closeRcmDialog}
        fullWidth
        maxWidth='md'
        PaperProps={{ sx: { borderRadius: 3 } }}
      >
        {(() => {
          const r = rcmDialogData as any
          const rcmId = Number(r?.id ?? 0)

          const rcmNumRaw = String(r?.numeroRcm ?? '').trim()
          const numShort = rcmNumRaw.replace(/^RCM[-\s]?/i, '').trim()
          const title = `RCM — ${numShort || rcmNumRaw || (rcmId ? String(rcmId) : '-')}`

          const codificadoTxt = (() => {
            const raw = r?.fechaCodificacion ?? null
            if (!raw) return null
            const txt = formatDateDDMMYYYYDash(raw)
            return txt && txt !== '-' ? `Codificado: ${txt}` : null
          })()

          const belongsCodigo = String(r?.codigoAgrupador?.codigoNombre ?? data?.codigoNombre ?? '').trim()
          const rcmsForFallback = (data?.rcms ?? []) as any[]
          const fallbackRow = rcmsForFallback.find((x: any) => Number(x?.id) === rcmId) ?? null
          const fallbackAny =
            rcmsForFallback.find((x: any) => {
              const hasCliente = String(x?.cliente?.razonSocial ?? x?.cliente?.nombreCliente ?? '').trim().length > 0
              const hasObra = String(x?.obra?.numeroObra ?? x?.obra?.nombreObra ?? '').trim().length > 0
              const hasCiudad = String(x?.obra?.comuna ?? x?.obra?.ciudad ?? '').trim().length > 0
              return hasCliente || hasObra || hasCiudad
            }) ?? null
          const cliente = String(
            r?.cliente?.razonSocial ??
            r?.cliente?.nombreCliente ??
            fallbackRow?.cliente?.razonSocial ??
            fallbackRow?.cliente?.nombreCliente ??
            fallbackAny?.cliente?.razonSocial ??
            fallbackAny?.cliente?.nombreCliente ??
            r?.obra?.razonSocial ??
            r?.obra?.nombreCliente ??
            fallbackRow?.obra?.razonSocial ??
            fallbackRow?.obra?.nombreCliente ??
            fallbackAny?.obra?.razonSocial ??
            fallbackAny?.obra?.nombreCliente ??
            ''
          ).trim()
          const obra = String(
            r?.obra?.numeroObra ??
            r?.obra?.nombreObra ??
            fallbackRow?.obra?.numeroObra ??
            fallbackRow?.obra?.nombreObra ??
            fallbackAny?.obra?.numeroObra ??
            fallbackAny?.obra?.nombreObra ??
            ''
          ).trim()
          const ciudad = String(
            r?.obra?.comuna ??
            fallbackRow?.obra?.comuna ??
            fallbackRow?.obra?.ciudad ??
            fallbackAny?.obra?.comuna ??
            fallbackAny?.obra?.ciudad ??
            rcmDialogCpMeta?.ciudad ??
            rcmDialogCpMeta?.obra?.comuna ??
            rcmDialogCpMeta?.cliente?.comuna ??
            rcmDialogCpMeta?.cliente?.ciudad ??
            ''
          ).trim()
          const cpCliente = String(
            rcmDialogCpMeta?.cliente?.razonSocial ?? rcmDialogCpMeta?.cliente?.nombreCliente ?? ''
          ).trim()
          const cpObra = String(rcmDialogCpMeta?.obra?.numeroObra ?? rcmDialogCpMeta?.obra?.nombreObra ?? '').trim()

          const ot = String(
            rcmDialogCpMeta?.ot ??
            r?.ordenTrabajo?.correlativ ??
            r?.ordenTrabajo?.correlativo ??
            r?.ordenTrabajo?.clave ??
            ''
          ).trim()

          const belongsText = [
            ot ? `OT ${ot}` : null,
            cliente || cpCliente || null,
            (obra || cpObra) ? `Obra ${obra || cpObra}` : null,
            ciudad || null
          ]
            .filter(Boolean)
            .join(' - ')

          const servicios = (r?.servicios ?? []) as Servicio[]
          const stateKey = (computeEnsayoStateKey(servicios) ?? normalizeStateKey(r?.estadoOperativo) ?? null) as any

          const informeFlags = (() => {
            const rows = (rcmDialogHistory ?? r?.RCMHistory ?? []) as any[]
            const hasManual = rows.some(h => normalizeStateKey(h?.tipoEstado) === 'INFORME_MANUAL')
            const hasDigital = rows.some(h => normalizeStateKey(h?.tipoEstado) === 'INFORME_AUTO')
            return { hasManual, hasDigital }
          })()

          const cpStateKey = (() => {
            const counts = (rcmDialogCpMeta?.estadoOperativoCounts ?? null) as Record<string, number> | null
            if (counts && typeof counts === 'object') {
              return pickStateFromCounts(counts, [
                'EVENTO',
                'EN_PROCESO',
                'CODIFICADO',
                'ENSAYADO',
                'ENVIADO_DIGITACION',
                'DIGITADO',
                'REVISADO',
                'FIRMADO',
                'ENVIADO'
              ])
            }
            return null
          })()

          const tipo = String(r?.rcmType ?? 'MUESTRA').trim().toUpperCase()
          const area = String(r?.area?.nombre ?? r?.area ?? '').trim()
          const servicio = String(r?.familia?.nombre ?? r?.tipoServicio ?? '').trim()
          const sede = String(r?.sede ?? '').trim()
          const tarjeta = String(r?.numeroTarjeta ?? '').trim()
          const muestreo = r?.fechaMuestreo ? formatDateDDMMYYYYDash(r?.fechaMuestreo) : '-'
          const ingreso = r?.fechaIngreso ? formatDateDDMMYYYYDash(r?.fechaIngreso) : '-'

          const material = String(r?.tipoMaterial ?? '').trim()
          const item = String(r?.item ?? '').trim()
          const toma = String(r?.tomaMuestra ?? '').trim()
          const cantidad = (() => {
            const raw = r?.cantidadMuestras
            const n = raw === null || raw === undefined ? NaN : Number(raw)
            return Number.isFinite(n) && n > 0 ? String(n) : '-'
          })()

          const ensayoCount = servicios.length

          const submuestras = (() => {
            const muestras = Array.isArray(r?.muestras) ? (r.muestras as any[]) : ([] as any[])
            const probetas = muestras.flatMap(m => (Array.isArray(m?.probetas) ? (m.probetas as any[]) : []))
            return probetas
              .map((p, idx) => {
                const numero = Number(p?.numero ?? idx + 1)
                const dias = Number(p?.dias ?? 0)
                const cantidad = Number(p?.cantidad ?? 0)
                const fechaV = p?.fechaVencimiento ?? null
                const estado = String(p?.estado ?? '').trim()

                return {
                  id: String(p?.id ?? `${numero}-${idx}`),
                  numero: Number.isFinite(numero) && numero > 0 ? numero : idx + 1,
                  dias: Number.isFinite(dias) && dias > 0 ? dias : 0,
                  fecha: fechaV ? formatDateDDMMYYYYDash(fechaV) : '-',
                  cantidad: Number.isFinite(cantidad) && cantidad > 0 ? cantidad : 0,
                  estadoKey: normalizeStateKey(estado) ?? null
                }
              })
              .filter(x => x != null)
          })()

          const showSubmuestras = Boolean(r?.vencimiento) && submuestras.length > 0

          return (
            <Box>
              <Box sx={{ p: 3.5, pb: 2.75 }}>
                <Box sx={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 2 }}>
                  <Box sx={{ minWidth: 0 }}>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, flexWrap: 'wrap' }}>
                      <Typography variant='h6' sx={{ fontWeight: 900, lineHeight: 1.1 }}>
                        {title}
                      </Typography>
                      <Chip
                        size='small'
                        label={String(r?.rcmType ?? 'MUESTRA').trim().toUpperCase() || 'MUESTRA'}
                        sx={{ bgcolor: 'primary.main', color: 'primary.contrastText', fontWeight: 900, fontSize: '0.72rem' }}
                      />
                    </Box>
                    {codificadoTxt ? (
                      <Typography variant='caption' color='text.secondary' sx={{ display: 'block', mt: 0.25, fontWeight: 700 }}>
                        {codificadoTxt}
                      </Typography>
                    ) : null}
                  </Box>

                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, flexShrink: 0 }}>
                    {stateKey ? (
                      <Chip size='small' label={getOperationalLabel(stateKey)} sx={getOperativeChipSx(stateKey)} />
                    ) : null}
                    <IconButton size='small' aria-label='Cerrar' onClick={closeRcmDialog}>
                      <CloseIcon fontSize='small' />
                    </IconButton>
                  </Box>
                </Box>

                <Divider sx={{ mt: 2 }} />

                <Paper
                  variant='outlined'
                  sx={theme => ({
                    mt: 2.25,
                    p: 1.5,
                    borderRadius: 2,
                    bgcolor: alpha(theme.palette.primary.main, 0.06),
                    borderColor: alpha(theme.palette.primary.main, 0.25)
                  })}
                >
                  <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 2 }}>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, minWidth: 0, flex: 1 }}>
                      <Typography variant='caption' color='text.secondary' sx={{ fontWeight: 900 }}>
                        PERTENECE A
                      </Typography>

                      {belongsCodigo ? (
                        <Chip size='small' label={belongsCodigo} sx={{ fontWeight: 900, bgcolor: 'primary.main', color: 'primary.contrastText' }} />
                      ) : null}

                      {belongsText ? (
                        <Typography
                          variant='body2'
                          sx={{
                            fontWeight: 600,
                            flex: '1 1 auto',
                            minWidth: 0,
                            overflow: 'hidden',
                            textOverflow: 'ellipsis',
                            whiteSpace: 'nowrap'
                          }}
                          title={belongsText}
                        >
                          {belongsText}
                        </Typography>
                      ) : null}
                    </Box>

                    {cpStateKey ? <Chip size='small' label={getOperationalLabel(cpStateKey)} sx={getOperativeChipSx(cpStateKey)} /> : null}
                  </Box>
                </Paper>

                <Paper
                  variant='outlined'
                  sx={theme => ({
                    mt: 2.25,
                    p: 2,
                    borderRadius: 2,
                    bgcolor: alpha(theme.palette.text.primary, 0.04),
                    borderColor: alpha(theme.palette.text.primary, 0.08)
                  })}
                >
                  <Box sx={{ display: 'flex', gap: 4, flexWrap: 'wrap' }}>
                    {/* Columna 1: Sede / Área / Servicio */}
                    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1, minWidth: 260 }}>
                      <Box sx={{ display: 'flex', gap: 1, alignItems: 'center' }}>
                        <Typography variant='caption' color='text.secondary' sx={{ fontWeight: 900, minWidth: 78 }}>
                          SEDE
                        </Typography>
                        <Typography variant='body2' sx={{ fontWeight: 700 }}>
                          {sede || '-'}
                        </Typography>
                      </Box>
                      <Box sx={{ display: 'flex', gap: 1, alignItems: 'center' }}>
                        <Typography variant='caption' color='text.secondary' sx={{ fontWeight: 900, minWidth: 78 }}>
                          ÁREA
                        </Typography>
                        <Typography variant='body2' sx={{ fontWeight: 700 }}>
                          {area || '-'}
                        </Typography>
                      </Box>
                      <Box sx={{ display: 'flex', gap: 1, alignItems: 'center' }}>
                        <Typography variant='caption' color='text.secondary' sx={{ fontWeight: 900, minWidth: 78 }}>
                          SERVICIO
                        </Typography>
                        <Typography variant='body2' sx={{ fontWeight: 700 }}>
                          {servicio || '-'}
                        </Typography>
                      </Box>
                    </Box>

                    {/* Columna 2: F. Muestreo / F. Ingreso / Tarjeta */}
                    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1, minWidth: 260 }}>
                      <Box sx={{ display: 'flex', gap: 1, alignItems: 'center' }}>
                        <Typography variant='caption' color='text.secondary' sx={{ fontWeight: 900, minWidth: 78 }}>
                          F.MUESTREO
                        </Typography>
                        <Typography variant='body2' sx={{ fontWeight: 700 }}>
                          {muestreo}
                        </Typography>
                      </Box>
                      <Box sx={{ display: 'flex', gap: 1, alignItems: 'center' }}>
                        <Typography variant='caption' color='text.secondary' sx={{ fontWeight: 900, minWidth: 78 }}>
                          F.INGRESO
                        </Typography>
                        <Typography variant='body2' sx={{ fontWeight: 700 }}>
                          {ingreso}
                        </Typography>
                      </Box>
                      <Box sx={{ display: 'flex', gap: 1, alignItems: 'center' }}>
                        <Typography variant='caption' color='text.secondary' sx={{ fontWeight: 900, minWidth: 78 }}>
                          TARJETA
                        </Typography>
                        <Typography variant='body2' sx={{ fontWeight: 900, color: 'primary.main' }}>
                          {tarjeta || '-'}
                        </Typography>
                      </Box>
                    </Box>

                    {/* Columna 3: Material / Item / Toma / Cantidad */}
                    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1, minWidth: 260 }}>
                      <Box sx={{ display: 'flex', gap: 1, alignItems: 'center' }}>
                        <Typography variant='caption' color='text.secondary' sx={{ fontWeight: 900, minWidth: 78 }}>
                          MATERIAL
                        </Typography>
                        <Typography variant='body2' sx={{ fontWeight: 700 }}>
                          {material || '-'}
                        </Typography>
                      </Box>
                      <Box sx={{ display: 'flex', gap: 1, alignItems: 'center' }}>
                        <Typography variant='caption' color='text.secondary' sx={{ fontWeight: 900, minWidth: 78 }}>
                          ÍTEM
                        </Typography>
                        <Typography variant='body2' sx={{ fontWeight: 700 }}>
                          {item || '-'}
                        </Typography>
                      </Box>
                      <Box sx={{ display: 'flex', gap: 1, alignItems: 'center' }}>
                        <Typography variant='caption' color='text.secondary' sx={{ fontWeight: 900, minWidth: 78 }}>
                          TOMA
                        </Typography>
                        <Typography variant='body2' sx={{ fontWeight: 700 }}>
                          {toma || '-'}
                        </Typography>
                      </Box>
                      <Box sx={{ display: 'flex', gap: 1, alignItems: 'center' }}>
                        <Typography variant='caption' color='text.secondary' sx={{ fontWeight: 900, minWidth: 78 }}>
                          CANTIDAD
                        </Typography>
                        <Typography variant='body2' sx={{ fontWeight: 700 }}>
                          {cantidad}
                        </Typography>
                      </Box>
                    </Box>
                  </Box>

                  {informeFlags.hasManual || informeFlags.hasDigital ? (
                    <Box sx={{ mt: 1.25, display: 'flex', alignItems: 'center', gap: 1, flexWrap: 'wrap' }}>
                      {informeFlags.hasManual ? (
                        <Chip
                          size='small'
                          icon={<DescriptionOutlinedIcon sx={{ fontSize: 16 }} />}
                          label='Informe manual'
                          variant='outlined'
                          sx={{ fontWeight: 900 }}
                        />
                      ) : null}
                      {informeFlags.hasDigital ? (
                        <Chip
                          size='small'
                          icon={<DescriptionOutlinedIcon sx={{ fontSize: 16 }} />}
                          label='Informe digital'
                          variant='outlined'
                          sx={{ fontWeight: 900 }}
                        />
                      ) : null}
                    </Box>
                  ) : null}
                </Paper>

                <Box sx={{ mt: 2.75 }}>
                  <Typography variant='subtitle2' sx={{ fontWeight: 900, mb: 1.25 }}>
                    Ensayos ({ensayoCount})
                  </Typography>

                  <Paper variant='outlined' sx={{ borderRadius: 2, overflow: 'hidden' }}>
                    <div className='overflow-x-auto'>
                      <table className={tableStyles.table}>
                        <thead>
                          <tr>
                            <th style={{ textAlign: 'center' }}>SKU</th>
                            <th style={{ textAlign: 'left' }}>ENSAYO / SERVICIO</th>
                            <th style={{ textAlign: 'center' }}>CANT.</th>
                            <th style={{ textAlign: 'center' }}>ESTADO</th>
                          </tr>
                        </thead>
                        <tbody>
                          {(servicios ?? []).flatMap((s: any, idx: number) => {
                            const rows = []
                            const sku = String(s?.producto?.sku ?? s?.codigo ?? s?.sku ?? '').trim() || '-'
                            const nombre = String(s?.producto?.nombre ?? s?.nombre ?? '').trim() || '-'
                            const norma = String(s?.producto?.norma ?? s?.norma ?? '').trim()
                            const qty = Number(s?.cantidad ?? 0)
                            const stKey = normalizeStateKey(s?.estadoOperativo ?? s?.estado) ?? null
                            const esPaquete = s?.esPaquete || Array.isArray(s?.hijos) || Array.isArray(s?.detalles) || Array.isArray(s?.componentes)
                            // Fila principal (paquete o normal)
                            rows.push(
                              <tr key={String(s?.id ?? idx)} style={esPaquete ? { background: '#eaf4ff' } : {}}>
                                <td style={{ textAlign: 'center' }}>
                                  <Chip size='small' label={sku} variant='outlined' sx={{ fontWeight: 800 }} />
                                </td>
                                <td>
                                  <Box sx={{ display: 'flex', flexDirection: 'row', alignItems: 'center', gap: 1 }}>
                                    <Typography variant='body2' sx={{ fontWeight: 800 }}>
                                      {nombre}
                                    </Typography>
                                    {esPaquete ? (
                                      <Chip size='small' label='Paquete' color='primary' sx={{ fontWeight: 900, ml: 1 }} />
                                    ) : null}
                                  </Box>
                                  {norma ? (
                                    <Typography variant='caption' color='text.secondary' sx={{ lineHeight: 1.2 }}>
                                      {norma}
                                    </Typography>
                                  ) : null}
                                </td>
                                <td style={{ textAlign: 'center' }}>
                                  <Typography variant='body2' sx={{ fontWeight: 800 }}>
                                    {Number.isFinite(qty) && qty > 0 ? qty : '-'}
                                  </Typography>
                                </td>
                                <td style={{ textAlign: 'center' }}>
                                  {stKey ? (
                                    <Chip size='small' label={getOperationalLabel(stKey)} sx={getOperativeChipSx(stKey)} />
                                  ) : (
                                    <Chip size='small' label='-' variant='outlined' sx={{ fontWeight: 800, fontSize: '0.72rem' }} />
                                  )}
                                </td>
                              </tr>
                            )
                            // Si es paquete, mostrar hijos
                            const hijos = s?.hijos || s?.detalles || s?.componentes || []
                            if (esPaquete && Array.isArray(hijos)) {
                              hijos.forEach((h: any, hidx: number) => {
                                const hsku = String(h?.producto?.sku ?? h?.codigo ?? h?.sku ?? '').trim() || '-'
                                const hnombre = String(h?.producto?.nombre ?? h?.nombre ?? '').trim() || '-'
                                const hnorma = String(h?.producto?.norma ?? h?.norma ?? '').trim()
                                const hqty = Number(h?.cantidad ?? 0)
                                const hstKey = normalizeStateKey(h?.estadoOperativo ?? h?.estado) ?? null
                                rows.push(
                                  <tr key={String(s?.id ?? idx) + '-hijo-' + hidx} style={{ background: '#eaf4ff' }}>
                                    <td style={{ textAlign: 'center', paddingLeft: 24 }}>
                                      <Typography variant='body2' sx={{ fontWeight: 700, color: 'text.secondary' }}>↳ {hsku}</Typography>
                                    </td>
                                    <td>
                                      <Typography variant='body2' sx={{ fontWeight: 600 }}>
                                        {hnombre}
                                      </Typography>
                                      {hnorma ? (
                                        <Typography variant='caption' color='text.secondary' sx={{ lineHeight: 1.2 }}>
                                          {hnorma}
                                        </Typography>
                                      ) : null}
                                    </td>
                                    <td style={{ textAlign: 'center' }}>
                                      <Typography variant='body2' sx={{ fontWeight: 700 }}>
                                        {Number.isFinite(hqty) && hqty > 0 ? hqty : '-'}
                                      </Typography>
                                    </td>
                                    <td style={{ textAlign: 'center' }}>
                                      {hstKey ? (
                                        <Chip size='small' label={getOperationalLabel(hstKey)} sx={getOperativeChipSx(hstKey)} />
                                      ) : (
                                        <Chip size='small' label='-' variant='outlined' sx={{ fontWeight: 800, fontSize: '0.72rem' }} />
                                      )}
                                    </td>
                                  </tr>
                                )
                              })
                            }
                            return rows
                          })}
                        </tbody>
                      </table>
                    </div>
                  </Paper>
                </Box>

                {showSubmuestras ? (
                  <Box sx={{ mt: 2.25 }}>
                    <Typography variant='subtitle2' sx={{ fontWeight: 900, mb: 1.25 }}>
                      Submuestras ({submuestras.length})
                    </Typography>

                    <Paper variant='outlined' sx={{ borderRadius: 2, overflow: 'hidden' }}>
                      <div className='overflow-x-auto'>
                        <table className={tableStyles.table}>
                          <thead>
                            <tr>
                              <th style={{ textAlign: 'center' }}>#</th>
                              <th style={{ textAlign: 'center' }}>DÍAS</th>
                              <th style={{ textAlign: 'center' }}>FECHA ENSAYO</th>
                              <th style={{ textAlign: 'center' }}>CANT.</th>
                              <th style={{ textAlign: 'center' }}>ESTADO</th>
                            </tr>
                          </thead>
                          <tbody>
                            {submuestras.map((sm: any) => (
                              <tr key={String(sm.id)}>
                                <td style={{ textAlign: 'center' }}>
                                  <Chip size='small' label={String(sm.numero)} variant='outlined' sx={{ fontWeight: 800 }} />
                                </td>
                                <td style={{ textAlign: 'center' }}>
                                  <Typography variant='body2' sx={{ fontWeight: 800 }}>
                                    {sm.dias > 0 ? `${sm.dias}d` : '-'}
                                  </Typography>
                                </td>
                                <td style={{ textAlign: 'center' }}>
                                  <Typography variant='body2' sx={{ fontWeight: 800 }}>
                                    {sm.fecha || '-'}
                                  </Typography>
                                </td>
                                <td style={{ textAlign: 'center' }}>
                                  <Typography variant='body2' sx={{ fontWeight: 800 }}>
                                    {sm.cantidad > 0 ? String(sm.cantidad) : '-'}
                                  </Typography>
                                </td>
                                <td style={{ textAlign: 'center' }}>
                                  {sm.estadoKey ? (
                                    <Chip size='small' label={getOperationalLabel(sm.estadoKey)} sx={getOperativeChipSx(sm.estadoKey)} />
                                  ) : (
                                    <Chip size='small' label='-' variant='outlined' sx={{ fontWeight: 800, fontSize: '0.72rem' }} />
                                  )}
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    </Paper>
                  </Box>
                ) : null}
              </Box>

              <Divider />

              <Box sx={{ p: 3.5, display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 2 }}>
                <Box />
                <Button size='small' onClick={closeRcmDialog} sx={{ textTransform: 'none' }}>
                  Cerrar
                </Button>
              </Box>

              {rcmDialogLoading ? <LinearProgress /> : null}

              {rcmDialogError ? (
                <Box sx={{ p: 2, pt: 1 }}>
                  <Typography variant='body2' color='error'>
                    {rcmDialogError}
                  </Typography>
                </Box>
              ) : null}
            </Box>
          )
        })()}
      </Dialog>
    </Card>
  )
}
