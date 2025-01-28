import { useMemo, useState } from 'react'

import { REGIONES_CHILE } from '@/data/clientData'

interface Region {
  id: number
  nombre: string
}

interface Comuna {
  id: number
  nombre: string
  regionId: number
}

// Definir la estructura de REGIONES_CHILE
type RegionData = {
  comunas: string[]
}

type RegionesChile = {
  [key: string]: RegionData
}

export const useUbicacion = () => {
  const [selectedRegion, setSelectedRegion] = useState<string>('')

  const regiones = useMemo<Region[]>(() => {
    return Object.keys(REGIONES_CHILE).map((nombre, index) => ({
      id: index + 1,
      nombre
    }))
  }, [])

  const comunas = useMemo<Comuna[]>(() => {
    if (!selectedRegion) return []

    const regionData = REGIONES_CHILE[selectedRegion]

    console.log('Región seleccionada:', selectedRegion)
    console.log('Datos de región:', regionData)

    if (!regionData?.comunas) {
      console.log('No se encontraron comunas para:', selectedRegion)

      return []
    }

    const comunasArray = regionData.comunas.map((nombre, index) => ({
      id: index + 1,
      nombre,
      regionId: regiones.find(r => r.nombre === selectedRegion)?.id || 0
    }))

    console.log('Comunas encontradas:', comunasArray)

    return comunasArray
  }, [selectedRegion, regiones])

  const handleSetSelectedRegion = (value: string) => {
    console.log('Estableciendo región:', value)
    setSelectedRegion(value)
  }

  return {
    regiones,
    comunas,
    selectedRegion,
    setSelectedRegion: handleSetSelectedRegion
  }
}
