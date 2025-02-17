import { useState, useEffect } from 'react'

// Definir las interfaces si no existen en el archivo de tipos
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

  // Cargar las regiones desde el archivo local o API
  useEffect(() => {
    const regiones = [
      { id: 1, nombre: 'Metropolitana' },
      { id: 2, nombre: 'Valparaíso' },
      { id: 3, nombre: 'Biobío' }

      // ... otras regiones
    ]

    setRegiones(regiones)
  }, [])

  // Cargar las comunas cuando cambia la región
  useEffect(() => {
    if (!selectedRegion) {
      setComunas([])

      return
    }

    // Mapa de comunas por región
    const comunasPorRegion: { [key: string]: Comuna[] } = {
      Metropolitana: [
        { id: 1, nombre: 'Santiago' },
        { id: 2, nombre: 'Las Condes' },
        { id: 3, nombre: 'Providencia' }
      ],
      Valparaíso: [
        { id: 4, nombre: 'Viña del Mar' },
        { id: 5, nombre: 'Valparaíso' },
        { id: 6, nombre: 'Concón' }
      ]

      // ... otras comunas por región
    }

    setComunas(comunasPorRegion[selectedRegion] || [])
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
