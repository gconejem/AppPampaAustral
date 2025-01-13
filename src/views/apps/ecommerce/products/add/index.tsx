import React, { useState } from 'react'

import { TextField, InputAdornment } from '@mui/material'

const AddProduct = () => {
  const [formData, setFormData] = useState({
    nombre: '',
    sku: '',
    descripcion: '',
    area: '',
    familia: '',
    tipo: 'Ensayo', // valor por defecto
    precio: '', // asegurarnos que existe este campo
    norma: '',
    listaPrecios: '',
    aplicaImpuesto: false
  })

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    try {
      // Convertir el precio a número antes de enviarlo
      const precio = parseFloat(formData.precio)

      if (isNaN(precio)) {
        throw new Error('El precio debe ser un número válido')
      }

      const response = await fetch('/api/productos', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          ...formData,
          precio // enviar el precio como número
        })
      })

      if (!response.ok) {
        throw new Error('Error al crear el producto')
      }

      // Manejar respuesta exitosa
    } catch (error) {
      console.error('Error:', error)

      // Mostrar mensaje de error
    }
  }

  const handlePriceChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    // Remover el símbolo $ y cualquier espacio
    const value = e.target.value.replace(/[$\s]/g, '')

    setFormData(prev => ({
      ...prev,
      precio: value
    }))
  }

  return (
    <form onSubmit={handleSubmit}>
      {/* ... otros campos ... */}
      <TextField
        label='Precio'
        value={formData.precio}
        onChange={handlePriceChange}
        required
        type='number'
        InputProps={{
          startAdornment: <InputAdornment position='start'>$</InputAdornment>
        }}
      />
      {/* ... resto del formulario ... */}
    </form>
  )
}

export default AddProduct
