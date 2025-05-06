import { useState, useEffect } from 'react'

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
interface RegionData {
  comunas: string[]
}

interface RegionesChile {
  [key: string]: RegionData
}

const REGIONES_CHILE_TYPED = REGIONES_CHILE as RegionesChile

export const useUbicacion = () => {
  const [regiones, setRegiones] = useState<Region[]>([])
  const [comunas, setComunas] = useState<Comuna[]>([])
  const [selectedRegion, setSelectedRegion] = useState('')
  const [selectedComuna, setSelectedComuna] = useState('')

  // Cargar regiones al montar el componente
  useEffect(() => {
    const regionesArray = Object.keys(REGIONES_CHILE_TYPED).map((nombre: string, index: number) => ({
      id: index + 1,
      nombre
    }))

    setRegiones(regionesArray)
  }, [])

  // Actualizar comunas cuando cambia la región
  useEffect(() => {
    if (selectedRegion) {
      const regionData = REGIONES_CHILE_TYPED[selectedRegion]

      if (regionData) {
        const comunasArray = regionData.comunas.map((nombre: string, index: number) => ({
          id: index + 1,
          nombre,
          regionId: regiones.find(r => r.nombre === selectedRegion)?.id || 0
        }))

        setComunas(comunasArray)
      } else {
        setComunas([])
      }
    } else {
      setComunas([])
    }
  }, [selectedRegion, regiones])

  // Función para obtener las comunas por nombre de región
  const getComunasByRegionNombre = (regionNombre: string): Comuna[] => {
    if (!regionNombre || !REGIONES_CHILE_TYPED[regionNombre]) return []

    const regionId = regiones.find(r => r.nombre === regionNombre)?.id || 0

    return REGIONES_CHILE_TYPED[regionNombre].comunas.map((nombre: string, index: number) => ({
      id: index + 1,
      nombre,
      regionId
    }))
  }

  // Función para obtener una región por su ID
  const getRegionById = (id: number): Region | undefined => {
    return regiones.find(r => r.id === id)
  }

  return {
    regiones,
    comunas,
    selectedRegion,
    selectedComuna,
    setSelectedRegion,
    setSelectedComuna,
    getComunasByRegionNombre,
    getRegionById
  }
}
