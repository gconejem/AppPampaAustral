// React Imports
import { useState, useEffect } from 'react'

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
import Divider from '@mui/material/Divider'
import Grid from '@mui/material/Grid'
import Table from '@mui/material/Table'
import TableBody from '@mui/material/TableBody'
import TableCell from '@mui/material/TableCell'
import TableContainer from '@mui/material/TableContainer'
import TableHead from '@mui/material/TableHead'
import TableRow from '@mui/material/TableRow'
import FormControlLabel from '@mui/material/FormControlLabel'
import Checkbox from '@mui/material/Checkbox'
import InputAdornment from '@mui/material/InputAdornment'
import SearchIcon from '@mui/icons-material/Search'

// Third-party Imports
import { useForm, Controller } from 'react-hook-form'
import axios from 'axios'
import { toast } from 'react-hot-toast'

import ContactSearchObra from '../components/ContactSearchObra'

// Types Imports
import type { Obra } from '@/types/forms/obra'

type Props = {
  open: boolean
  handleClose: () => void
  currentObra: Obra | null
  setData: (data: Obra[]) => void
}

type FormValidateType = {
  obraId: number
  fechaCreacion: string
  numeroObra: string
  fechaIngreso: string
  estado: string
  estadoObra: string
  nombreObra: string
  direccion: string
  region: string
  comuna: string
  rut: string
  razonSocial: string
  giro: string
  direccionComercial: string
  comunaFacturacion: string
  telefonoFacturacion: string
  listaPrecios: string
  mailRecepcionFactura: string
  informeMandante: boolean
  textoMandante: string
  acreditacionPersonal: boolean
  especificacionesTecnicas: boolean
  acreditacionEquipos: boolean
  cartaCompromiso: boolean
  mandatoServiu: boolean
  otrosRequisitos: string
  estadoPago: boolean
  hes: boolean
  oc: boolean
  otrasReferencias: string
  telefono: string
  sitioWeb: string
}

const EditWorksForm = ({ open, handleClose, currentObra, setData }: Props) => {
  const {
    control,
    handleSubmit,
    reset,
    formState: { errors }
  } = useForm<FormValidateType>({
    defaultValues: {
      obraId: 0,
      fechaCreacion: '',
      numeroObra: '',
      fechaIngreso: '',
      estado: '',
      estadoObra: '',
      nombreObra: '',
      direccion: '',
      region: '',
      comuna: '',
      rut: '',
      razonSocial: '',
      giro: '',
      direccionComercial: '',
      comunaFacturacion: '',
      telefonoFacturacion: '',
      listaPrecios: '',
      mailRecepcionFactura: '',
      telefono: '',
      sitioWeb: ''
    }
  })

  const [contactos, setContactos] = useState<ContactoObra[]>([])

  const handleAddContact = (contact: ContactoObra) => {
    setContactos(prev => [...prev, contact])
  }

  const handleDeleteContact = (contactId: number) => {
    setContactos(prev => prev.filter(c => c.id !== contactId))
  }

  useEffect(() => {
    console.log('currentObra recibido en EditWorksForm:', currentObra)
    console.log('Contactos recibidos:', currentObra?.contactos)

    if (currentObra) {
      console.log('Todos los campos de currentObra:', Object.keys(currentObra))

      console.log('Reseteando formulario con datos:', {
        obraId: currentObra.obraId,
        fechaCreacion: currentObra.fechaCreacion,
        numeroObra: currentObra.numeroObra

        // ... resto de campos
      })

      reset({
        obraId: currentObra.obraId,
        fechaCreacion: currentObra.fechaCreacion || '',
        numeroObra: currentObra.numeroObra || '',
        fechaIngreso: currentObra.fechaIngreso || '',
        estado: currentObra.estado || '',
        estadoObra: currentObra.estadoObra || '',
        nombreObra: currentObra.nombreObra || '',
        direccion: currentObra.direccion || '',
        region: currentObra.region || '',
        comuna: currentObra.comuna || '',
        rut: currentObra.rut || '',
        razonSocial: currentObra.razonSocial || '',
        giro: currentObra.giro || '',
        direccionComercial: currentObra.direccionComercial || '',
        comunaFacturacion: currentObra.comunaFacturacion || '',
        telefonoFacturacion: currentObra.telefonoFacturacion || '',
        listaPrecios: currentObra.listaPrecios || '',
        mailRecepcionFactura: currentObra.mailRecepcionFactura || '',
        informeMandante: currentObra.informeMandante || false,
        textoMandante: currentObra.textoMandante || '',
        acreditacionPersonal: currentObra.acreditacionPersonal || false,
        especificacionesTecnicas: currentObra.especificacionesTecnicas || false,
        acreditacionEquipos: currentObra.acreditacionEquipos || false,
        cartaCompromiso: currentObra.cartaCompromiso || false,
        mandatoServiu: currentObra.mandatoServiu || false,
        otrosRequisitos: currentObra.otrosRequisitos || '',
        estadoPago: currentObra.estadoPago || false,
        hes: currentObra.hes || false,
        oc: currentObra.oc || false,
        otrasReferencias: currentObra.otrasReferencias || '',
        telefono: currentObra.telefono || '',
        sitioWeb: currentObra.sitioWeb || ''
      })

      if (currentObra.contactos) {
        console.log('Estableciendo contactos:', currentObra.contactos)
        setContactos(currentObra.contactos)
      } else {
        console.log('No hay contactos en currentObra')
      }
    }
  }, [currentObra, reset])

  const onSubmit = async (data: FormValidateType) => {
    try {
      if (currentObra?.obraId) {
        const response = await axios.put(`/api/obras/${currentObra.obraId}`, {
          ...data,
          contactos
        })

        if (response.status === 200) {
          setData(prevData =>
            prevData.map(obra => (obra.obraId === currentObra.obraId ? { ...obra, ...response.data } : obra))
          )
          toast.success('Obra actualizada exitosamente')
          handleClose()
        }
      }
    } catch (error) {
      console.error('Error al actualizar obra:', error)
      toast.error('Error al actualizar la obra')
    }
  }

  return (
    <Drawer
      open={open}
      anchor='right'
      variant='temporary'
      onClose={handleClose}
      ModalProps={{ keepMounted: true }}
      sx={{ '& .MuiDrawer-paper': { width: { xs: '100%', sm: '75%' } } }}
    >
      <div className='flex items-center justify-between p-5'>
        <Typography variant='h5'>Editar Obra</Typography>
        <IconButton onClick={handleClose}>
          <i className='ri-close-line' />
        </IconButton>
      </div>
      <Divider />

      <form onSubmit={handleSubmit(onSubmit)} className='p-5 space-y-4'>
        {/* Datos Principales */}
        <Grid container spacing={5}>
          <Grid item xs={12} sm={6}>
            <Controller
              name='numeroObra'
              control={control}
              render={({ field }) => <TextField {...field} fullWidth label='Número Obra' />}
            />
          </Grid>
          <Grid item xs={12} sm={6}>
            <Controller
              name='fechaIngreso'
              control={control}
              render={({ field }) => <TextField {...field} fullWidth type='date' label='Fecha Ingreso' />}
            />
          </Grid>
          <Grid item xs={12} sm={6}>
            <FormControl fullWidth>
              <InputLabel>Estado</InputLabel>
              <Controller
                name='estado'
                control={control}
                render={({ field }) => (
                  <Select {...field} label='Estado'>
                    <MenuItem value='active'>Activo</MenuItem>
                    <MenuItem value='inactive'>Inactivo</MenuItem>
                    <MenuItem value='pending'>Pendiente</MenuItem>
                  </Select>
                )}
              />
            </FormControl>
          </Grid>
          <Grid item xs={12} sm={6}>
            <Controller
              name='estadoObra'
              control={control}
              render={({ field }) => (
                <Select {...field} label='Estado Obra'>
                  <MenuItem value='active'>Activo</MenuItem>
                  <MenuItem value='inactive'>Inactivo</MenuItem>
                </Select>
              )}
            />
          </Grid>
          <Grid item xs={12} sm={6}>
            <Controller
              name='rut'
              control={control}
              render={({ field }) => <TextField {...field} fullWidth label='RUT' />}
            />
          </Grid>
          <Grid item xs={12} sm={6}>
            <Controller
              name='nombreCliente'
              control={control}
              render={({ field }) => <TextField {...field} fullWidth label='Nombre Cliente' />}
            />
          </Grid>
        </Grid>

        {/* Sección de Antecedentes */}
        <Divider sx={{ my: 4 }} />
        <Typography variant='h6'>Antecedentes</Typography>
        <Grid container spacing={5}>
          <Grid item xs={12} sm={6}>
            <Controller
              name='nombreObra'
              control={control}
              render={({ field }) => <TextField {...field} fullWidth label='Nombre Obra' />}
            />
          </Grid>
          <Grid item xs={12} sm={6}>
            <Controller
              name='direccion'
              control={control}
              render={({ field }) => <TextField {...field} fullWidth label='Dirección' />}
            />
          </Grid>
          <Grid item xs={12} sm={6}>
            <Controller
              name='region'
              control={control}
              render={({ field }) => <TextField {...field} fullWidth label='Región' />}
            />
          </Grid>
          <Grid item xs={12} sm={6}>
            <Controller
              name='comuna'
              control={control}
              render={({ field }) => <TextField {...field} fullWidth label='Comuna' />}
            />
          </Grid>
          <Grid item xs={12} sm={6}>
            <Controller
              name='sector'
              control={control}
              render={({ field }) => <TextField {...field} fullWidth label='Sector' />}
            />
          </Grid>
          <Grid item xs={12} sm={6}>
            <Controller
              name='georreferencia'
              control={control}
              render={({ field }) => <TextField {...field} fullWidth label='Georreferencia' />}
            />
          </Grid>
          <Grid item xs={12} sm={6}>
            <Controller
              name='referencia'
              control={control}
              render={({ field }) => <TextField {...field} fullWidth label='Referencia' />}
            />
          </Grid>
          <Grid item xs={12} sm={6}>
            <Controller
              name='mandante'
              control={control}
              render={({ field }) => <TextField {...field} fullWidth label='Mandante' />}
            />
          </Grid>
          <Grid item xs={12} sm={6}>
            <FormControlLabel
              control={
                <Controller
                  name='informeMandante'
                  control={control}
                  render={({ field }) => <Checkbox {...field} checked={field.value} />}
                />
              }
              label='Informe a Mandante'
            />
          </Grid>
          <Grid item xs={12} sm={6}>
            <Controller
              name='textoMandante'
              control={control}
              render={({ field }) => <TextField {...field} fullWidth label='Texto Mandante' />}
            />
          </Grid>
        </Grid>

        {/* Sección de Contactos */}
        <Divider sx={{ my: 4 }} />
        <Grid container alignItems='center' spacing={2}>
          <Grid item xs={6}>
            <Typography variant='h6'>Contactos</Typography>
          </Grid>
          <Grid item xs={6} container justifyContent='flex-end'>
            <ContactSearchObra onContactSelect={handleAddContact} />
          </Grid>
        </Grid>

        <TableContainer>
          <Table>
            <TableHead>
              <TableRow>
                <TableCell>NOMBRE</TableCell>
                <TableCell>CARGO</TableCell>
                <TableCell>EMAIL</TableCell>
                <TableCell>TELÉFONO 1</TableCell>
                <TableCell>TELÉFONO 2</TableCell>
                <TableCell>ACCIÓN</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {contactos.length > 0 ? (
                contactos.map(contacto => (
                  <TableRow key={contacto.id}>
                    <TableCell>{contacto.nombre}</TableCell>
                    <TableCell>{contacto.cargo}</TableCell>
                    <TableCell>{contacto.email}</TableCell>
                    <TableCell>{contacto.telefono1}</TableCell>
                    <TableCell>{contacto.telefono2}</TableCell>
                    <TableCell>
                      <IconButton size='small' onClick={() => handleDeleteContact(contacto.id)}>
                        <i className='ri-delete-bin-line' />
                      </IconButton>
                    </TableCell>
                  </TableRow>
                ))
              ) : (
                <TableRow>
                  <TableCell colSpan={6} align='center'>
                    No hay contactos
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </TableContainer>

        {/* Sección de Requisitos */}
        <Divider sx={{ my: 4 }} />
        <Typography variant='h6'>Requisitos</Typography>
        <Grid container spacing={5}>
          <Grid item xs={12} sm={6}>
            <FormControlLabel
              control={
                <Controller
                  name='acreditacionPersonal'
                  control={control}
                  render={({ field }) => <Checkbox {...field} checked={field.value} />}
                />
              }
              label='Acreditación Personal'
            />
          </Grid>
          <Grid item xs={12} sm={6}>
            <FormControlLabel
              control={
                <Controller
                  name='especificacionesTecnicas'
                  control={control}
                  render={({ field }) => <Checkbox {...field} checked={field.value} />}
                />
              }
              label='Especificaciones Técnicas'
            />
          </Grid>
          <Grid item xs={12} sm={6}>
            <FormControlLabel
              control={
                <Controller
                  name='acreditacionEquipos'
                  control={control}
                  render={({ field }) => <Checkbox {...field} checked={field.value} />}
                />
              }
              label='Acreditación Equipos'
            />
          </Grid>
          <Grid item xs={12} sm={6}>
            <FormControlLabel
              control={
                <Controller
                  name='cartaCompromiso'
                  control={control}
                  render={({ field }) => <Checkbox {...field} checked={field.value} />}
                />
              }
              label='Carta Compromiso'
            />
          </Grid>
          <Grid item xs={12} sm={6}>
            <FormControlLabel
              control={
                <Controller
                  name='mandatoServiu'
                  control={control}
                  render={({ field }) => <Checkbox {...field} checked={field.value} />}
                />
              }
              label='Mandato SERVIU'
            />
          </Grid>
          <Grid item xs={12}>
            <Controller
              name='otrosRequisitos'
              control={control}
              render={({ field }) => <TextField {...field} fullWidth multiline rows={4} label='Otros Requisitos' />}
            />
          </Grid>
        </Grid>

        {/* Sección de Facturación */}
        <Divider sx={{ my: 4 }} />
        <Typography variant='h6'>Facturación</Typography>
        <Grid container spacing={5}>
          <Grid item xs={12} sm={6}>
            <Controller
              name='razonSocial'
              control={control}
              render={({ field }) => <TextField {...field} fullWidth label='Razón Social' />}
            />
          </Grid>
          <Grid item xs={12} sm={6}>
            <Controller
              name='giro'
              control={control}
              render={({ field }) => <TextField {...field} fullWidth label='Giro' />}
            />
          </Grid>
          <Grid item xs={12} sm={6}>
            <Controller
              name='direccionComercial'
              control={control}
              render={({ field }) => <TextField {...field} fullWidth label='Dirección Comercial' />}
            />
          </Grid>
          <Grid item xs={12} sm={6}>
            <Controller
              name='comunaFacturacion'
              control={control}
              render={({ field }) => <TextField {...field} fullWidth label='Comuna Facturación' />}
            />
          </Grid>
          <Grid item xs={12} sm={6}>
            <Controller
              name='telefonoFacturacion'
              control={control}
              render={({ field }) => <TextField {...field} fullWidth label='Teléfono Facturación' />}
            />
          </Grid>
          <Grid item xs={12} sm={6}>
            <Controller
              name='listaPrecios'
              control={control}
              render={({ field }) => <TextField {...field} fullWidth label='Lista de Precios' />}
            />
          </Grid>
          <Grid item xs={12} sm={6}>
            <Controller
              name='mailRecepcionFactura'
              control={control}
              render={({ field }) => <TextField {...field} fullWidth label='Email Recepción Factura' />}
            />
          </Grid>
        </Grid>

        {/* Sección de Referencias */}
        <Divider sx={{ my: 4 }} />
        <Typography variant='h6'>Referencias</Typography>
        <Grid container spacing={5}>
          <Grid item xs={12} sm={4}>
            <FormControlLabel
              control={
                <Controller
                  name='estadoPago'
                  control={control}
                  render={({ field }) => <Checkbox {...field} checked={field.value} />}
                />
              }
              label='Estado Pago'
            />
          </Grid>
          <Grid item xs={12} sm={4}>
            <FormControlLabel
              control={
                <Controller
                  name='hes'
                  control={control}
                  render={({ field }) => <Checkbox {...field} checked={field.value} />}
                />
              }
              label='HES'
            />
          </Grid>
          <Grid item xs={12} sm={4}>
            <FormControlLabel
              control={
                <Controller
                  name='oc'
                  control={control}
                  render={({ field }) => <Checkbox {...field} checked={field.value} />}
                />
              }
              label='OC'
            />
          </Grid>
          <Grid item xs={12}>
            <Controller
              name='otrasReferencias'
              control={control}
              render={({ field }) => <TextField {...field} fullWidth multiline rows={4} label='Otras Referencias' />}
            />
          </Grid>
        </Grid>

        {/* Botones */}
        <div className='flex justify-end gap-4 mt-4'>
          <Button variant='outlined' color='secondary' onClick={handleClose}>
            Cancelar
          </Button>
          <Button variant='contained' type='submit'>
            Guardar Cambios
          </Button>
        </div>
      </form>
    </Drawer>
  )
}

export default EditWorksForm
