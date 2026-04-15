'use client'

import { useEffect, useMemo, useState } from 'react'

import Box from '@mui/material/Box'
import Card from '@mui/material/Card'
import CardHeader from '@mui/material/CardHeader'
import Chip from '@mui/material/Chip'
import Divider from '@mui/material/Divider'
import IconButton from '@mui/material/IconButton'
import LinearProgress from '@mui/material/LinearProgress'
import Tab from '@mui/material/Tab'
import Tabs from '@mui/material/Tabs'
import Typography from '@mui/material/Typography'
import Button from '@mui/material/Button'
import Paper from '@mui/material/Paper'
import { alpha } from '@mui/material/styles'

import VisibilityIcon from '@mui/icons-material/Visibility'
import CloseIcon from '@mui/icons-material/Close'

import { OPERATIONAL_STATES } from '@/constants/operationalStates'
import ADMINISTRATIVE_STATES from '@/constants/administrativeStates'

import tableStyles from '@core/styles/table.module.css'

type Servicio = {
  cantidad?: number | null
  estadoOperativo?: string | null
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
  numeroTarjeta?: string | null
  rcmType?: string | null
  estadoOperativo?: string | null
  estadoAdministrativo?: string | null
  sede?: string | null
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
      fontWeight: 700,
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
    fontWeight: 700,
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
  const [tab, setTab] = useState<'rcms' | 'eventos'>('rcms')
  const [loading, setLoading] = useState(false)
  const [data, setData] = useState<AgrupadorDetalle | null>(null)
  const [refreshTick, setRefreshTick] = useState(0)

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

  const handleViewRcm = (rcmId: number) => {
    if (typeof window === 'undefined') return
    const parts = window.location.pathname.split('/').filter(Boolean)
    const lang = parts[0] || 'en'
    const url = `${window.location.origin}/${lang}/apps/view-rcm/${rcmId}`
    window.open(url, '_blank')
  }

  if (!codigoAgrupadorId) return null

  return (
    <Card sx={{ mt: 4 }}>
      <CardHeader
        title={
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 0.75 }}>
            {/* Fila superior: Código + Estados */}
            <Box sx={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 2, flexWrap: 'wrap' }}>
              <Box sx={{ display: 'flex', alignItems: 'baseline', gap: 1.5, flexWrap: 'wrap', minWidth: 0 }}>
                <Typography variant='subtitle1' sx={{ fontWeight: 800 }}>
                  {data?.codigoNombre ?? `Código #${codigoAgrupadorId}`}
                </Typography>
                {data?.descripcionServicio ? (
                  <Typography variant='caption' color='text.secondary'>
                    {data.descripcionServicio}
                  </Typography>
                ) : null}
              </Box>

              <Box sx={{ display: 'flex', alignItems: 'flex-start', gap: 1, flexWrap: 'wrap' }}>
                {/* Estado Operativo + fecha */}
                {headerStates.opMain ? (
                  <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-start', lineHeight: 1.1 }}>
                    <Chip
                      size='small'
                      label={OPERATIONAL_STATES.find(s => s.value === headerStates.opMain)?.label ?? headerStates.opMain}
                      sx={getOperativeChipSx(headerStates.opMain)}
                    />
                    <Typography variant='caption' color='text.secondary' sx={{ mt: 0.25, fontWeight: 700 }}>
                      Desde {formatDateDDMMYYYYDash(headerStates.opSince)}
                    </Typography>
                  </Box>
                ) : null}

                {/* Estado Administrativo */}
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

            {/* Segunda fila: OT / SS / loading */}
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, flexWrap: 'wrap' }}>
              {data?.ordenTrabajo?.correlativ ? (
                <Chip size='small' label={`OT ${data.ordenTrabajo.correlativ}`} variant='outlined' sx={{ fontWeight: 700 }} />
              ) : null}
              {data?.ordenTrabajo?.clave ? (
                <Chip size='small' label={data.ordenTrabajo.clave} variant='outlined' sx={{ fontWeight: 700 }} />
              ) : null}
              {loading ? <Chip size='small' label='Cargando…' variant='outlined' /> : null}
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
        <Box sx={{ p: 2 }}>
          <div className='overflow-x-auto'>
            <table className={tableStyles.table}>
              <thead>
                <tr>
                  <th style={{ textAlign: 'left' }}>#</th>
                  <th style={{ textAlign: 'center' }}>TARJETA</th>
                  <th style={{ textAlign: 'center' }}>TIPO</th>
                  <th style={{ textAlign: 'center' }}>ÁREA</th>
                  <th style={{ textAlign: 'center' }}>SERVICIO</th>
                  <th style={{ textAlign: 'left' }}>MATERIAL · ÍTEM · TOMA</th>
                  <th style={{ textAlign: 'center' }}>ENSAYOS</th>
                  <th style={{ textAlign: 'center' }}>ESTADO</th>
                  <th style={{ textAlign: 'center' }} />
                </tr>
              </thead>
              <tbody>
                {rcms.map(r => {
                  const ens = computeEnsayos(r.servicios)
                  const pct = ens.total > 0 ? Math.round((ens.ensayados / ens.total) * 100) : 0

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
                      <td style={{ textAlign: 'center' }}>{r.area?.nombre ?? '-'}</td>
                      <td style={{ textAlign: 'center' }}>{r.familia?.nombre ?? '-'}</td>
                      <td>{formatMaterialItemToma(r)}</td>
                      <td style={{ textAlign: 'center', minWidth: 120 }}>
                        <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 0.5 }}>
                          <LinearProgress variant='determinate' value={pct} sx={{ height: 6, borderRadius: 999, width: 60 }} />
                          <Typography variant='caption' sx={{ fontWeight: 800 }}>{`${ens.ensayados}/${ens.total}`}</Typography>
                        </Box>
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
                          const label =
                            ensayoState === 'CODIFICADO'
                              ? 'Pendiente'
                              : OPERATIONAL_STATES.find(s => s.value === ensayoState)?.label ?? ensayoState

                          return <Chip size='small' label={label} sx={getOperativeChipSx(ensayoState)} />
                        })()}
                      </td>
                      <td style={{ textAlign: 'center' }}>
                        <IconButton size='small' title='Ver' onClick={() => handleViewRcm(r.id)}>
                          <VisibilityIcon fontSize='small' />
                        </IconButton>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        </Box>
      ) : (
        <Box sx={{ p: 2 }}>
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
    </Card>
  )
}
