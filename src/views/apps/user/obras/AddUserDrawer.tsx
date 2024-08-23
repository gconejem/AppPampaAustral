// React Imports
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
import Typography from '@mui/material/Typography'
import Divider from '@mui/material/Divider'
import Grid from '@mui/material/Grid'

// Third-party Imports
import { useForm, Controller } from 'react-hook-form'

// Types Imports
import type { UsersType } from '@/types/apps/userTypes'

type Props = {
  open: boolean
  handleClose: () => void
  userData?: UsersType[]
  setData: (data: UsersType[]) => void
}

type FormValidateType = {
  numeroObra: string
  fechaIngreso: string
  numeroCotizacion: string
  nombreObra: string
  direccion: string
  region: string
  comuna: string
  sector: string
  georeferencia: string
  mandante: string
  informeMandante: string
  encargadoObra: string
  envioInformes: string
  acreditacionPersonal: string
  especificacionesTecnicas: string
  acreditacionEquipos: string
  cartaCompromiso: string
  mandatoServiu: string
  otros: string
}

const AddUserDrawer = (props: Props) => {
  const { open, handleClose, userData, setData } = props

  const {
    control,
    handleSubmit,
    formState: { errors }
  } = useForm<FormValidateType>({
    defaultValues: {
      numeroObra: '',
      fechaIngreso: '',
      numeroCotizacion: '',
      nombreObra: '',
      direccion: '',
      region: '',
      comuna: '',
      sector: '',
      georeferencia: '',
      mandante: '',
      informeMandante: '',
      encargadoObra: '',
      envioInformes: '',
      acreditacionPersonal: '',
      especificacionesTecnicas: '',
      acreditacionEquipos: '',
      cartaCompromiso: '',
      mandatoServiu: '',
      otros: ''
    }
  })

  const onSubmit = (data: FormValidateType) => {
    //  lógica para manejar el envío del formulario
    console.log(data)
    handleClose()
  }

  return (
    <Drawer
      open={open}
      anchor='right'
      variant='temporary'
      onClose={handleClose}
      ModalProps={{ keepMounted: true }}
      sx={{ '& .MuiDrawer-paper': { width: { xs: '75%', sm: '75%' } } }}
    >
      <div className='flex items-center justify-between pli-5 plb-4'>
        <Typography variant='h5'>Nueva Obra</Typography>
        <IconButton size='small' onClick={handleClose}>
          <i className='ri-close-line text-2xl' />
        </IconButton>
      </div>
      <Divider />
      <div className='p-5'>
        <form onSubmit={handleSubmit(onSubmit)} className='flex flex-col gap-5'>
          <Grid container spacing={5}>
            <Grid item xs={12} sm={4}>
              <Controller
                name='numeroObra'
                control={control}
                rules={{ required: true }}
                render={({ field }) => (
                  <TextField
                    {...field}
                    fullWidth
                    label='Número Obra *'
                    placeholder=''
                    {...(errors.numeroObra && { error: true, helperText: 'Este campo es obligatorio.' })}
                  />
                )}
              />
            </Grid>
            <Grid item xs={12} sm={4}>
              <Controller
                name='fechaIngreso'
                control={control}
                rules={{ required: true }}
                render={({ field }) => (
                  <TextField
                    {...field}
                    fullWidth
                    label='Fecha Ingreso *'
                    placeholder=''
                    {...(errors.fechaIngreso && { error: true, helperText: 'Este campo es obligatorio.' })}
                  />
                )}
              />
            </Grid>
            <Grid item xs={12} sm={4}>
              <Controller
                name='numeroCotizacion'
                control={control}
                render={({ field }) => <TextField {...field} fullWidth label='Número Cotización' placeholder='' />}
              />
            </Grid>
          </Grid>

          <Typography variant='h6' sx={{ mt: 4 }}>
            Antecedentes
          </Typography>
          <Grid container spacing={5}>
            <Grid item xs={12} sm={4}>
              <Controller
                name='nombreObra'
                control={control}
                rules={{ required: true }}
                render={({ field }) => (
                  <TextField
                    {...field}
                    fullWidth
                    label='Nombre Obra *'
                    placeholder=''
                    {...(errors.nombreObra && { error: true, helperText: 'Este campo es obligatorio.' })}
                  />
                )}
              />
            </Grid>
            <Grid item xs={12} sm={8}>
              <Controller
                name='direccion'
                control={control}
                render={({ field }) => <TextField {...field} fullWidth label='Dirección' placeholder='' />}
              />
            </Grid>
            <Grid item xs={12} sm={4}>
              <Controller
                name='region'
                control={control}
                rules={{ required: true }}
                render={({ field }) => (
                  <FormControl fullWidth>
                    <InputLabel>Región *</InputLabel>
                    <Select {...field}>
                      <MenuItem value='Region 1'>Region 1</MenuItem>
                      <MenuItem value='Region 2'>Region 2</MenuItem>
                    </Select>
                  </FormControl>
                )}
              />
            </Grid>
            <Grid item xs={12} sm={4}>
              <Controller
                name='comuna'
                control={control}
                rules={{ required: true }}
                render={({ field }) => (
                  <FormControl fullWidth>
                    <InputLabel>Comuna *</InputLabel>
                    <Select {...field}>
                      <MenuItem value='Comuna 1'>Comuna 1</MenuItem>
                      <MenuItem value='Comuna 2'>Comuna 2</MenuItem>
                    </Select>
                  </FormControl>
                )}
              />
            </Grid>
            <Grid item xs={12} sm={4}>
              <Controller
                name='sector'
                control={control}
                render={({ field }) => <TextField {...field} fullWidth label='Sector' placeholder='' />}
              />
            </Grid>
            <Grid item xs={12} sm={4}>
              <Controller
                name='georeferencia'
                control={control}
                render={({ field }) => <TextField {...field} fullWidth label='Georeferencia' placeholder='' />}
              />
            </Grid>
            <Grid item xs={12} sm={4}>
              <Controller
                name='mandante'
                control={control}
                rules={{ required: true }}
                render={({ field }) => (
                  <FormControl fullWidth>
                    <InputLabel>Mandante *</InputLabel>
                    <Select {...field}>
                      <MenuItem value='Mandante 1'>Mandante 1</MenuItem>
                      <MenuItem value='Mandante 2'>Mandante 2</MenuItem>
                    </Select>
                  </FormControl>
                )}
              />
            </Grid>
            <Grid item xs={12} sm={4}>
              <Controller
                name='informeMandante'
                control={control}
                render={({ field }) => <TextField {...field} fullWidth label='Informe a Mandante' placeholder='' />}
              />
            </Grid>
            <Grid item xs={12} sm={4}>
              <Controller
                name='encargadoObra'
                control={control}
                rules={{ required: true }}
                render={({ field }) => (
                  <FormControl fullWidth>
                    <InputLabel>Contactos</InputLabel>
                    <Select {...field}>
                      <MenuItem value='Encargado 1'>Contacto 1</MenuItem>
                      <MenuItem value='Encargado 2'>Contacto 2</MenuItem>
                    </Select>
                  </FormControl>
                )}
              />
            </Grid>
            <Grid item xs={12} sm={4}>
              <Controller
                name='envioInformes'
                control={control}
                rules={{ required: true }}
                render={({ field }) => (
                  <FormControl fullWidth>
                    <InputLabel>Encargado de obra</InputLabel>
                    <Select {...field}>
                      <MenuItem value='Envio 1'>Envio 1</MenuItem>
                      <MenuItem value='Envio 2'>Envio 2</MenuItem>
                    </Select>
                  </FormControl>
                )}
              />
            </Grid>
            <Grid item xs={12} sm={4}>
              <Controller
                name='envioInformes'
                control={control}
                rules={{ required: true }}
                render={({ field }) => (
                  <FormControl fullWidth>
                    <InputLabel>Envío de Informes *</InputLabel>
                    <Select {...field}>
                      <MenuItem value='Envio 1'>Envio 1</MenuItem>
                      <MenuItem value='Envio 2'>Envio 2</MenuItem>
                    </Select>
                  </FormControl>
                )}
              />
            </Grid>
          </Grid>

          <Typography variant='h6' sx={{ mt: 4 }}>
            Requisitos
          </Typography>
          <Grid container spacing={5}>
            <Grid item xs={12} sm={4}>
              <Controller
                name='acreditacionPersonal'
                control={control}
                render={({ field }) => (
                  <FormControl fullWidth>
                    <InputLabel>Acreditación de Personal</InputLabel>
                    <Select {...field}>
                      <MenuItem value='Acreditación 1'>Acreditación 1</MenuItem>
                      <MenuItem value='Acreditación 2'>Acreditación 2</MenuItem>
                    </Select>
                  </FormControl>
                )}
              />
            </Grid>
            <Grid item xs={12} sm={4}>
              <Controller
                name='especificacionesTecnicas'
                control={control}
                render={({ field }) => (
                  <FormControl fullWidth>
                    <InputLabel>Especificaciones Técnicas (EETT)</InputLabel>
                    <Select {...field}>
                      <MenuItem value='Especificación 1'>Especificación 1</MenuItem>
                      <MenuItem value='Especificación 2'>Especificación 2</MenuItem>
                    </Select>
                  </FormControl>
                )}
              />
            </Grid>
            <Grid item xs={12} sm={4}>
              <Controller
                name='acreditacionEquipos'
                control={control}
                render={({ field }) => (
                  <FormControl fullWidth>
                    <InputLabel>Acreditación de Equipos</InputLabel>
                    <Select {...field}>
                      <MenuItem value='Equipo 1'>Equipo 1</MenuItem>
                      <MenuItem value='Equipo 2'>Equipo 2</MenuItem>
                    </Select>
                  </FormControl>
                )}
              />
            </Grid>
            <Grid item xs={12} sm={4}>
              <Controller
                name='cartaCompromiso'
                control={control}
                render={({ field }) => (
                  <FormControl fullWidth>
                    <InputLabel>Carta de Compromiso</InputLabel>
                    <Select {...field}>
                      <MenuItem value='Compromiso 1'>Compromiso 1</MenuItem>
                      <MenuItem value='Compromiso 2'>Compromiso 2</MenuItem>
                    </Select>
                  </FormControl>
                )}
              />
            </Grid>
            <Grid item xs={12} sm={4}>
              <Controller
                name='mandatoServiu'
                control={control}
                render={({ field }) => (
                  <FormControl fullWidth>
                    <InputLabel>Mandato y Envío de Informes a SERVIU</InputLabel>
                    <Select {...field}>
                      <MenuItem value='Mandato 1'>Mandato 1</MenuItem>
                      <MenuItem value='Mandato 2'>Mandato 2</MenuItem>
                    </Select>
                  </FormControl>
                )}
              />
            </Grid>
            <Grid item xs={12} sm={4}>
              <Controller
                name='otros'
                control={control}
                render={({ field }) => <TextField {...field} fullWidth label='Otros' placeholder='' />}
              />
            </Grid>
          </Grid>

          <div className='flex items-center gap-4 mt-5'>
            <Button variant='contained' type='submit'>
              Crear Nueva Obra
            </Button>
            <Button variant='outlined' color='error' type='reset' onClick={handleClose}>
              Cancelar
            </Button>
          </div>
        </form>
      </div>
    </Drawer>
  )
}

export default AddUserDrawer
