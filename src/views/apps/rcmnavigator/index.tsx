'use client'
import { useEffect, useState } from 'react'
import { useSettings } from '@core/hooks/useSettings'

// Component Imports
import Header from './Header'
import CodigoProductoDetallePanel from './CodigoProductoDetallePanel'
import UserListTable2 from './UserListTable'

export default function RcmNavigatorPage() {
  const { updatePageSettings } = useSettings()

  useEffect(() => {
    return updatePageSettings({
      contentWidth: 'wide',
      navbarContentWidth: 'wide',
      footerContentWidth: 'wide'
    })
    // updatePageSettings cambia de referencia en cada render; este efecto debe correr solo al montar.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const [selectedCodigoId, setSelectedCodigoId] = useState<number | null>(null)

  const [filters, setFilters] = useState<{
    dateField?: 'fecha_codificacion' | 'fecha_muestreo'
    start?: string
    end?: string
    estadoOperativo?: string | string[]
    estadoAdministrativo?: string | string[]
    conEvento?: boolean
    areaId?: number | null
    areaName?: string | null
    familia?: string
    sede?: string
  } | undefined>()

  return (
    <div>
      <Header onFiltersChange={(f) => setFilters(f)} />
      <UserListTable2
        filters={filters}
        onFiltersChange={(f) => setFilters(f)}
        onSelectCodigo={setSelectedCodigoId}
      />
      <CodigoProductoDetallePanel
        codigoAgrupadorId={selectedCodigoId}
        onClose={() => setSelectedCodigoId(null)}
        onResolveEvento={(rcmId) => {
          if (typeof window === 'undefined') return
          window.dispatchEvent(new CustomEvent('rcmnavigator:cerrar-evento', { detail: { rcmId } }))
        }}
      />
    </div>
  )
}
