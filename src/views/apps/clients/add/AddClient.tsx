import { useState } from 'react'

// MUI Imports
import Button from '@mui/material/Button'
import Drawer from '@mui/material/Drawer'
import FormControl from '@mui/material/FormControl'
import IconButton from '@mui/material/IconButton'
import InputLabel from '@mui/material/InputLabel'
import MenuItem from '@mui/material/MenuItem'
import Select from '@mui/material/Select'
import TextField from '@mui/material/TextField'
import FormHelperText from '@mui/material/FormHelperText'
import Typography from '@mui/material/Typography'
import Grid from '@mui/material/Grid'
import FormControlLabel from '@mui/material/Checkbox'
import Box from '@mui/material/Box'
import CircularProgress from '@mui/material/CircularProgress'

// Third-party Imports
import { useForm, Controller } from 'react-hook-form'
import { toast } from 'react-hot-toast'
import axios from 'axios'

// Types Imports
import type { Cliente, FormValidateType, Contacto } from '@/types/forms/cliente'

// Data Imports
import { PAISES, SEGMENTOS, INDUSTRIAS, ESTADOS_CLIENTE, VENDEDORES } from '@/data/clientData'

// Hooks Imports
import { useRegionesYComunas } from '@/hooks/useRegionesYComunas'

type Props = {
  open: boolean
  handleClose: () => void
  setData: (data: Cliente[] | ((prevData: Cliente[]) => Cliente[])) => void
}

const AddClient = ({ open, handleClose, setData }: Props) => {
  const [isSubmitting, setIsSubmitting] = useState(false)
  const { regiones, comunas, selectedRegion, setSelectedRegion, setComunas } = useRegionesYComunas()
  const [contactos, setContactos] = useState<Contacto[]>([])

  const [formData, setFormData] = useState({
    pais: 'Chile'
  })

  const defaultValues = {
    rut: '',
    estado: 'active',
    razonSocial: '',
    nombreCliente: '',
    ciudad: '',
    comuna: '',
    direccion: '',
    telefono: '',
    sitioWeb: '',
    segmento: '',
    industria: '',
    vendedor: '',
    condicionVenta: '',
    observaciones: ''
  }

  const {
    control,
    handleSubmit,
    formState: { errors },
    setValue,
    getValues,
    reset
  } = useForm({
    defaultValues,
    mode: 'onChange'
  })

  const onSubmit = async (data: FormValidateType) => {
    setIsSubmitting(true)

    try {
      const regionSeleccionada = regiones.find(r => r.codigo === selectedRegion)
      const comunaSeleccionada = comunas.find(c => c.id === parseInt(data.comuna))

      if (!comunaSeleccionada) {
        toast.error('Por favor seleccione una comuna válida')

        return
      }

      const clienteData = {
        ...data,
        pais: formData.pais,
        region: regionSeleccionada?.codigo || '',
        comuna: comunaSeleccionada.id,
        clientesContactos: {
          create: contactos.map(contacto => ({
            isPrincipal: false,
            contacto: {
              create: {
                nombre: contacto.nombre,
                cargo: contacto.cargo,
                email: contacto.email,
                telefono1: contacto.telefono1,
                telefono2: contacto.telefono2 || ''
              }
            }
          }))
        },
        condicionesComerciales: {
          create: {
            vendedor: data.vendedor,
            condicionVenta: data.condicionVenta,
            observaciones: data.observaciones
          }
        }
      }

      const response = await axios.post('/api/clientes', clienteData)

      if (response.data) {
        setData(prevData => [...prevData, response.data])
        toast.success('Cliente creado exitosamente')
        handleClose()
        reset(defaultValues)
      }
    } catch (error) {
      console.error('Error al crear cliente:', error)
      toast.error('Error al crear cliente')
    } finally {
      setIsSubmitting(false)
    }
  }

  // ... resto del código del componente (UI) ...
}

export default AddClient
