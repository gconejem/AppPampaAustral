import { useState, useEffect } from 'react'

import { REGIONES_CHILE } from '@/data/clientData'

interface Region {
  id: number
  nombre: string
}

interface Comuna {
  id: number
  nombre: string
}

export const useRegionesYComunas = () => {
  const [regiones, setRegiones] = useState<Region[]>([])
  const [comunas, setComunas] = useState<Comuna[]>([])
  const [selectedRegion, setSelectedRegion] = useState('')
  const [selectedComuna, setSelectedComuna] = useState('')

  useEffect(() => {
    const regionesArray = Object.keys(REGIONES_CHILE).map((nombre, index) => ({
      id: index + 1,
      nombre
    }))

    setRegiones(regionesArray)
  }, [])

  useEffect(() => {
    if (selectedRegion && REGIONES_CHILE[selectedRegion]) {
      const comunasArray = REGIONES_CHILE[selectedRegion].comunas.map((nombre, index) => ({
        id: index + 1,
        nombre
      }))

      setComunas(comunasArray)
    } else {
      setComunas([])
    }
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
