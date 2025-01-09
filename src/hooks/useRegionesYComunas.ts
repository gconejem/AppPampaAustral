import { useState, useEffect } from 'react'

export const useRegionesYComunas = () => {
  const [regiones, setRegiones] = useState<any[]>([])
  const [comunas, setComunas] = useState<any[]>([])
  const [selectedRegion, setSelectedRegion] = useState('')
  const [loading, setLoading] = useState(false)

  // Cargar regiones
  useEffect(() => {
    const fetchRegiones = async () => {
      console.log('Iniciando fetchRegiones')
      setLoading(true)

      try {
        const response = await fetch('/api/ubicacion')
        console.log('Response status:', response.status)

        const data = await response.json()
        console.log('Datos de la API:', data)

        if (Array.isArray(data)) {
          console.log('Estableciendo regiones:', data)
          setRegiones(data)
        } else {
          console.error('Los datos no son un array:', data)
        }
      } catch (error) {
        console.error('Error al cargar regiones:', error)
      } finally {
        setLoading(false)
      }
    }

    fetchRegiones()
  }, [])

  // Cargar comunas cuando se selecciona una región
  useEffect(() => {
    if (!selectedRegion) {
      setComunas([])

      return
    }

    const fetchComunas = async () => {
      setLoading(true)

      try {
        console.log('Cargando comunas para región:', selectedRegion)
        const response = await fetch(`/api/ubicacion?regionId=${selectedRegion}`)
        const data = await response.json()

        console.log('Comunas cargadas:', data)

        if (Array.isArray(data)) {
          setComunas(data)
        }
      } catch (error) {
        console.error('Error al cargar comunas:', error)
      } finally {
        setLoading(false)
      }
    }

    fetchComunas()
  }, [selectedRegion])

  return {
    regiones,
    comunas,
    selectedRegion,
    setSelectedRegion,
    loading
  }
}
