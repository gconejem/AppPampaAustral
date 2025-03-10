import { useState, useEffect } from 'react'

import { REGIONES_CHILE } from '@/data/clientData'

// Definir las interfaces si no existen en el archivo de tipos
interface Region {
  id: number
  nombre: string
}

interface Comuna {
  id: number
  nombre: string
}

// Definir el tipo para REGIONES_CHILE
type RegionData = {
  comunas: string[]
}

type RegionesChileType = {
  [key: string]: RegionData
}

export const useRegionesYComunas = () => {
  const [regiones, setRegiones] = useState<Region[]>([])
  const [comunas, setComunas] = useState<Comuna[]>([])
  const [selectedRegion, setSelectedRegion] = useState('')
  const [selectedComuna, setSelectedComuna] = useState('')

  // Cargar las regiones desde REGIONES_CHILE
  useEffect(() => {
    const regionesArray = Object.keys(REGIONES_CHILE as RegionesChileType).map((nombre: string, index: number) => ({
      id: index + 1,
      nombre
    }))

    setRegiones(regionesArray)
  }, [])

  // Cargar las comunas cuando cambia la región
  useEffect(() => {
    if (!selectedRegion || !(REGIONES_CHILE as RegionesChileType)[selectedRegion]) {
      setComunas([])

      return
    }

    const comunasArray = (REGIONES_CHILE as RegionesChileType)[selectedRegion].comunas.map(
      (nombre: string, index: number) => ({
        id: index + 1,
        nombre
      })
    )

    setComunas(comunasArray)
  }, [selectedRegion])

  return {
    regiones,
    comunas,
    selectedRegion,
    selectedComuna,
    setSelectedRegion,
    setSelectedComuna
  }
}
