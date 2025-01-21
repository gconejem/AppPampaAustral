import { useState, useEffect } from 'react'

export const useRegionesYComunas = () => {
  const [regiones, setRegiones] = useState([])
  const [comunas, setComunas] = useState([])
  const [selectedRegion, setSelectedRegion] = useState('')
  const [selectedComuna, setSelectedComuna] = useState('')

  // Cargar regiones al montar el componente
  useEffect(() => {
    const fetchRegiones = async () => {
      try {
        const response = await fetch('/api/ubicacion/regiones')
        const data = await response.json()

        setRegiones(data)
      } catch (error) {
        console.error('Error al cargar regiones:', error)
      }
    }

    fetchRegiones()
  }, [])

  // Cargar comunas cuando cambia la región
  useEffect(() => {
    const fetchComunas = async () => {
      if (!selectedRegion) {
        setComunas([])

        return
      }

      try {
        const response = await fetch(`/api/ubicacion/comunas/${selectedRegion}`)
        const data = await response.json()

        setComunas(data)
      } catch (error) {
        console.error('Error al cargar comunas:', error)
        setComunas([])
      }
    }

    fetchComunas()
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
