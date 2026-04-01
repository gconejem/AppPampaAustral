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

import VisibilityIcon from '@mui/icons-material/Visibility'

import { OPERATIONAL_STATES } from '@/constants/operationalStates'

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

const isEventoSinResolver = (lastEstNuevo?: string | null) => {
  const s = String(lastEstNuevo ?? '').toLowerCase()
  return s.includes('en_correccion') || s.includes('correccion') || s.includes('correg')
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

  return {
    bgcolor: `${hex}20`,
    color: hex,
    border: '1px solid',
    borderColor: `${hex}30`,
    textTransform: 'uppercase',
    fontWeight: 700,
    fontSize: '0.72rem'
  } as const
}

export default function CodigoProductoDetallePanel({ codigoAgrupadorId }: { codigoAgrupadorId: number | null }) {
  const [tab, setTab] = useState<'rcms' | 'eventos'>('rcms')
  const [loading, setLoading] = useState(false)
  const [data, setData] = useState<AgrupadorDetalle | null>(null)

  useEffect(() => {
    if (!codigoAgrupadorId) {
      setData(null)
      return
    }

    let cancelled = false

    const run = async () => {
      setLoading(true)

      try {
        const res = await fetch(`/api/codigo-agrupador/${codigoAgrupadorId}`)
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
  }, [codigoAgrupadorId])

  const rcms = data?.rcms ?? []

  const eventos = useMemo(() => {
    return rcms
      .map(r => {
        const last = (r.RCMHistory ?? [])[0] ?? null
        if (!last) return null
        if (!isEventoSinResolver(last.estNuevo ?? null)) return null

        return { rcm: r, last }
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
    const url = `${window.location.origin}/${lang}/apps/rcm-edit/${rcmId}`
    window.open(url, '_blank')
  }

  if (!codigoAgrupadorId) return null

  return (
    <Card sx={{ mt: 4 }}>
      <CardHeader
        title={
          <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 2, flexWrap: 'wrap' }}>
            <Box sx={{ display: 'flex', alignItems: 'baseline', gap: 1.5, flexWrap: 'wrap' }}>
              <Typography variant='subtitle1' sx={{ fontWeight: 800 }}>
                {data?.codigoNombre ?? `Código #${codigoAgrupadorId}`}
              </Typography>
              {data?.descripcionServicio ? (
                <Typography variant='caption' color='text.secondary'>
                  {data.descripcionServicio}
                </Typography>
              ) : null}
            </Box>

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
                      <td style={{ fontWeight: 800, color: 'var(--mui-palette-primary-main)' }}>{formatRcmLabel(r.numeroRcm)}</td>
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
                        <Chip
                          size='small'
                          label={OPERATIONAL_STATES.find(s => s.value === normalizeStateKey(r.estadoOperativo))?.label ?? (r.estadoOperativo ?? '-')}
                          sx={getOperativeChipSx(r.estadoOperativo)}
                        />
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
            <div className='overflow-x-auto'>
              <table className={tableStyles.table}>
                <thead>
                  <tr>
                    <th style={{ textAlign: 'left' }}>RCM</th>
                    <th style={{ textAlign: 'center' }}>ESTADO</th>
                    <th style={{ textAlign: 'left' }}>MOTIVO</th>
                    <th style={{ textAlign: 'left' }}>OBSERVACIÓN</th>
                    <th style={{ textAlign: 'center' }}>FECHA</th>
                  </tr>
                </thead>
                <tbody>
                  {eventos.map(({ rcm, last }) => {
                    const when = last.fechaAccion ?? last.createdAt ?? null
                    return (
                      <tr key={rcm.id}>
                        <td style={{ fontWeight: 800, color: 'var(--mui-palette-primary-main)' }}>{formatRcmLabel(rcm.numeroRcm)}</td>
                        <td style={{ textAlign: 'center' }}>
                          <Chip
                            size='small'
                            label={(last.estNuevo ?? 'EVENTO').toUpperCase()}
                            color='warning'
                            variant='outlined'
                            sx={{ fontWeight: 800, fontSize: '0.72rem' }}
                          />
                        </td>
                        <td>{last.motivo ?? '-'}</td>
                        <td>{last.observacion ?? '-'}</td>
                        <td style={{ textAlign: 'center' }}>{when ? new Date(when).toLocaleDateString() : '-'}</td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
          )}
        </Box>
      )}
    </Card>
  )
}
