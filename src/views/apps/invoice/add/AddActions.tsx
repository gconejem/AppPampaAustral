'use client'

// React Imports
import { useState } from 'react'

// Next Imports
import Link from 'next/link'
import { useParams, useRouter } from 'next/navigation'

// MUI Imports
import Card from '@mui/material/Card'
import CardContent from '@mui/material/CardContent'
import Button from '@mui/material/Button'
import Grid from '@mui/material/Grid'
import FormControl from '@mui/material/FormControl'
import InputLabel from '@mui/material/InputLabel'
import Select from '@mui/material/Select'
import MenuItem from '@mui/material/MenuItem'
import Switch from '@mui/material/Switch'

// Type Imports
import type { Locale } from '@configs/i18n'

// Component Imports
import SendInvoiceDrawer from '@views/apps/invoice/shared/SendInvoiceDrawer'

// Util Imports
import { getLocalizedUrl } from '@/utils/i18n'

const AddActions = () => {
  // States
  const [sendDrawerOpen, setSendDrawerOpen] = useState(false)
  const [currentFormData, setCurrentFormData] = useState<any>(null)

  // Hooks
  const { lang: locale } = useParams()
  const router = useRouter()

  // Función para guardar la cotización
  const handleGuardar = async () => {
    try {
      if (!currentFormData?.cliente?.clienteId) {
        throw new Error('Debe seleccionar un cliente')
      }

      const formData = {
        numeroCotizacion: currentFormData.numeroCotizacion,
        tipoCotizacion: currentFormData.tipoCotizacion,
        estado: 'PENDIENTE',
        clienteId: currentFormData.cliente.clienteId,
        obraId: currentFormData.obra?.obraId || null,
        fechaInicio: new Date().toISOString(),
        fechaFin: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
        // ... resto de los campos usando currentFormData
      }

      console.log('Datos a enviar:', formData)

      const response = await fetch('/api/cotizaciones', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(formData)
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.message || 'Error al guardar la cotización')
      }

      router.push(getLocalizedUrl('/apps/invoice/list', locale as Locale))
    } catch (error) {
      console.error('Error completo:', error)
      alert(error.message || 'Error al guardar la cotización')
    }
  }

  // Función para manejar la visualización
  const handlePreview = () => {
    try {
      // Obtener los elementos select usando los names
      const clienteSelect = document.querySelector<HTMLSelectElement>('select[name="cliente"]')
      const obraSelect = document.querySelector<HTMLSelectElement>('select[name="obra"]')
      const productoSelects = document.querySelectorAll<HTMLSelectElement>('.repeater-item select[name="producto"]')

      // Debug logs
      console.log('=== DEBUG SELECTS ===')
      console.log('Cliente select:', clienteSelect?.value)
      console.log('Cliente select text:', clienteSelect?.selectedOptions[0]?.text)
      console.log('Obra select:', obraSelect?.value)
      console.log('Obra select text:', obraSelect?.selectedOptions[0]?.text)

      const formData = {
        // Datos básicos
        numeroCotizacion: document.querySelector<HTMLInputElement>('[name="numeroCotizacion"]')?.value || '',
        tipoCotizacion: document.querySelector<HTMLSelectElement>('[name="tipoCotizacion"]')?.value || '',
        estado: document.querySelector<HTMLSelectElement>('[name="estado"]')?.value || '',

        // Cliente y obra
        cliente: {
          nombreCliente: clienteSelect?.selectedOptions[0]?.text || 'Sin cliente'
        },
        obra: {
          nombreObra: obraSelect?.selectedOptions[0]?.text || 'Sin obra'
        },

        // Fechas
        fechaInicio: document.querySelector<HTMLInputElement>('[name="fechaInicio"]')?.value || '',
        fechaFin: document.querySelector<HTMLInputElement>('[name="fechaFin"]')?.value || '',

        // Detalles y totales
        detalles: Array.from(document.querySelectorAll('.repeater-item')).map(item => {
          const productoSelect = item.querySelector<HTMLSelectElement>('select[name="producto"]')

          return {
            nombre: productoSelect?.selectedOptions[0]?.text || 'Producto sin nombre',
            cantidad: item.querySelector<HTMLInputElement>('input[name="cantidad"]')?.value || '0',
            precio: item.querySelector('.precio-valor')?.textContent?.replace(/[^\d]/g, '') || '0',
            descuento: item.querySelector('input[name="descuento"]')?.value || '0',
            subtotal: item.querySelector('.subtotal-valor')?.textContent?.replace(/[^\d]/g, '') || '0'
          }
        }),

        // Totales
        subtotal: document.querySelector('.subtotal-valor')?.textContent?.replace(/[^\d]/g, '') || '0',
        descuentoMonto: document.querySelector('.descuento-valor')?.textContent?.replace(/[^\d]/g, '') || '0',
        impuesto: document.querySelector('.impuesto-valor')?.textContent?.replace(/[^\d]/g, '') || '0',
        total: document.querySelector('.total-valor')?.textContent?.replace(/[^\d]/g, '') || '0',

        // Otros
        observaciones: document.querySelector<HTMLTextAreaElement>('[name="observaciones"]')?.value || ''
      }

      console.log('=== DATOS FINALES ===')
      console.log('Datos completos a enviar:', formData)
      localStorage.setItem('cotizacionPreview', JSON.stringify(formData))

      router.push(getLocalizedUrl('/apps/invoice/preview', locale as Locale))
    } catch (error) {
      console.error('Error al preparar datos para preview:', error)
    }
  }

  // Función para cancelar
  const handleCancel = () => {
    router.back() // Volver a la página anterior
  }

  return (
    <Grid container spacing={6}>
      <Grid item xs={12}>
        <Card>
          <CardContent className='flex flex-col gap-4'>
            <Button
              fullWidth
              color='primary'
              variant='contained'
              className='capitalize'
              onClick={handleGuardar}
            >
              Guardar
            </Button>
            <Button
              fullWidth
              color='secondary'
              variant='outlined'
              className='capitalize'
              onClick={handlePreview}
            >
              Visualizar
            </Button>
            <Button
              fullWidth
              color='secondary'
              variant='outlined'
              className='capitalize'
              onClick={() => router.back()}
            >
              Cancelar
            </Button>
          </CardContent>
        </Card>
        <SendInvoiceDrawer open={sendDrawerOpen} handleClose={() => setSendDrawerOpen(false)} />
      </Grid>

      <Grid item xs={12}>
        <div className='flex items-center justify-between'>
          <InputLabel htmlFor='invoice-edit-payment-terms' className='cursor-pointer'></InputLabel>
        </div>
        <div className='flex items-center justify-between'>
          <InputLabel htmlFor='invoice-edit-client-notes' className='cursor-pointer'></InputLabel>
        </div>
        <div className='flex items-center justify-between'>
          <InputLabel htmlFor='invoice-edit-payment-stub' className='cursor-pointer'></InputLabel>
        </div>
      </Grid>
    </Grid>
  )
}

export default AddActions
