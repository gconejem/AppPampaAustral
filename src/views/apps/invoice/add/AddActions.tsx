'use client'

// React Imports
import type { FC } from 'react'

// Next Imports
import { useParams, useRouter } from 'next/navigation'

// MUI Imports
import Card from '@mui/material/Card'
import CardContent from '@mui/material/CardContent'
import Button from '@mui/material/Button'

interface AddActionsProps {
  currentFormData: any
}

interface Detalle {
  productoId: number | string
  cantidad: number
  precioUnitarioUF: number
  totalNetoUF: number
  esSubProducto?: boolean
  servicio?: string
  area?: string
  descripcion?: string
}

interface ContactoPreview {
  nombre: string
  cargo: string
  email: string
  telefono1: string
}

interface FormDataPreview {
  numeroCotizacion: string
  version: string
  tipoCotizacion: string
  estado: string
  fechaInicio: string | Date
  fechaFin: string | Date
  nombreProyecto: string
  empresa: string
  ubicacion: string
  formaPago: string
  contacto: ContactoPreview | null
  contactId: number | null
  observaciones: string
  subtotal: number
  descuento: number
  impuesto: number
  total: number
  detalles: Detalle[]
}

const AddActions: FC<AddActionsProps> = ({ currentFormData }) => {
  // Hooks
  const params = useParams()
  const router = useRouter()
  const locale = typeof params?.lang === 'string' ? params.lang : 'es'

  const handlePreview = () => {
    try {
      if (!currentFormData) {
        throw new Error('No hay datos para previsualizar')
      }

      console.log('Datos recibidos en AddActions:', currentFormData)

      // Validar que haya al menos un producto válido
      const detallesValidos =
        currentFormData.detalles?.filter((detalle: Detalle) => detalle.productoId && !detalle.esSubProducto) || []

      console.log('Detalles válidos:', detallesValidos)

      if (detallesValidos.length === 0) {
        throw new Error('Debe agregar al menos un producto a la cotización')
      }

      const formData: FormDataPreview = {
        numeroCotizacion: currentFormData.numeroCotizacion || '',
        version: currentFormData.version || '00',
        tipoCotizacion: currentFormData.tipoCotizacion || 'A',
        estado: 'BORRADOR',
        fechaInicio: currentFormData.fechaInicio || new Date().toISOString(),
        fechaFin: currentFormData.fechaFin || new Date(Date.now() + 15 * 24 * 60 * 60 * 1000).toISOString(),
        nombreProyecto: currentFormData.nombreProyecto || '',
        empresa: currentFormData.empresa || '',
        ubicacion: currentFormData.ubicacion || '',
        formaPago: currentFormData.formaPago || 'CONTADO',
        contacto: currentFormData.contacto
          ? {
              nombre: currentFormData.contacto.nombre || '',
              cargo: currentFormData.contacto.cargo || 'Sin cargo',
              email: currentFormData.contacto.email || '',
              telefono1: currentFormData.contacto.telefono1 || ''
            }
          : null,
        contactId: currentFormData.contactId || currentFormData.contactoId || null,
        observaciones: currentFormData.observaciones || '',
        subtotal: parseFloat(currentFormData.subtotal?.toString() || '0'),
        descuento: parseFloat(currentFormData.descuento?.toString() || '0'),
        impuesto: parseFloat(currentFormData.impuesto?.toString() || '0'),
        total: parseFloat(currentFormData.total?.toString() || '0'),
        detalles: detallesValidos.map((detalle: Detalle) => ({
          productoId: parseInt(detalle.productoId.toString()),
          cantidad: detalle.cantidad || 1,
          precioUnitario: parseFloat(detalle.precioUnitarioUF?.toString() || '0'),
          descuento: 0,
          subtotal: parseFloat(detalle.totalNetoUF?.toString() || '0'),
          servicio: detalle.servicio || '',
          area: detalle.area || '',
          descripcion: detalle.descripcion || '',
          precioUnitarioUF: parseFloat(detalle.precioUnitarioUF?.toString() || '0'),
          totalNetoUF: parseFloat(detalle.totalNetoUF?.toString() || '0')
        }))
      }

      console.log('Datos formateados para preview:', formData)
      console.log('Contacto a guardar:', formData.contacto)
      console.log('Detalles a guardar:', formData.detalles)

      localStorage.setItem('cotizacionPreview', JSON.stringify(formData))
      router.push(`/${locale}/apps/invoice/preview`)
    } catch (error) {
      console.error('Error al preparar la vista previa:', error)
      alert(error instanceof Error ? error.message : 'Error al preparar la vista previa')
    }
  }

  return (
    <Card>
      <CardContent>
        <Button fullWidth variant='contained' onClick={handlePreview} sx={{ mb: 2, '& svg': { marginRight: 2 } }}>
          Vista Previa
        </Button>
      </CardContent>
    </Card>
  )
}

export default AddActions
