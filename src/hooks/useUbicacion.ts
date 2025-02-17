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
type RegionData = {
  comunas: string[]
}

type RegionesChile = {
  [key: string]: RegionData
}

export const useUbicacion = () => {
  const [regiones, setRegiones] = useState<Array<{ id: number; nombre: string }>>([])
  const [comunas, setComunas] = useState<Array<{ id: number; nombre: string }>>([])
  const [selectedRegion, setSelectedRegion] = useState('')

  // Cargar regiones al montar el componente
  useEffect(() => {
    console.log('Cargando regiones...')

    const regionesArray = Object.keys(REGIONES_CHILE).map((nombre, index) => ({
      id: index + 1,
      nombre
    }))

    setRegiones(regionesArray)
    console.log('Regiones cargadas:', regionesArray)
  }, [])

  // Actualizar comunas cuando cambia la región
  useEffect(() => {
    console.log('Actualizando comunas para región:', selectedRegion)

    if (selectedRegion && REGIONES_CHILE[selectedRegion]) {
      const comunasArray = REGIONES_CHILE[selectedRegion].comunas.map((nombre, index) => ({
        id: index + 1,
        nombre
      }))

      setComunas(comunasArray)
      console.log('Comunas actualizadas:', comunasArray)
    } else {
      setComunas([])
    }
  }, [selectedRegion])

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
