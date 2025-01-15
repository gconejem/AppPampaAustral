import { useState, useEffect } from 'react'

import axios from 'axios'

export const useRegionesYComunas = () => {
  const [regiones, setRegiones] = useState<any[]>([])
  const [comunas, setComunas] = useState<any[]>([])
  const [selectedRegion, setSelectedRegion] = useState<string>('')
  const [loading, setLoading] = useState(true)

  // Cargar regiones y comunas al montar el componente
  useEffect(() => {
    const loadData = async () => {
      try {
        setLoading(true)

        // Primero cargar las regiones
        const regionesResponse = await axios.get('/api/ubicacion')
        const regionesData = regionesResponse.data

        if (Array.isArray(regionesData)) {
          setRegiones(regionesData)

          // Cargar las comunas de todas las regiones
          const comunasPromises = regionesData.map(region =>
            axios.get('/api/ubicacion', {
              params: { regionId: region.codigo }
            })
          )

          const comunasResponses = await Promise.all(comunasPromises)
          const todasLasComunas = comunasResponses.flatMap(response => response.data)

          console.log('Regiones cargadas:', regionesData)
          console.log('Comunas cargadas:', todasLasComunas)

          setComunas(todasLasComunas)
        }
      } catch (error) {
        console.error('Error cargando datos:', error)
      } finally {
        setLoading(false)
      }
    }

    loadData()
  }, []) // Solo se ejecuta al montar el componente

  // Mantener las comunas actualizadas cuando cambia la región seleccionada
  useEffect(() => {
    if (!selectedRegion || !regiones.length) return

    const loadComunasForRegion = async () => {
      try {
        const response = await axios.get('/api/ubicacion', {
          params: { regionId: selectedRegion }
        })

        if (Array.isArray(response.data)) {
          // Actualizar las comunas manteniendo las demás
          setComunas(prevComunas => {
            const nuevasComunas = response.data

            const comunasDeOtrasRegiones = prevComunas.filter(c => !nuevasComunas.find((nc: any) => nc.id === c.id))

            return [...comunasDeOtrasRegiones, ...nuevasComunas]
          })
        }
      } catch (error) {
        console.error('Error al cargar comunas de la región:', error)
      }
    }

    loadComunasForRegion()
  }, [selectedRegion, regiones])

  return {
    regiones,
    comunas,
    selectedRegion,
    setSelectedRegion,
    loading
  }
}
