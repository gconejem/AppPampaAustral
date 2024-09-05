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
import Table from '@mui/material/Table'
import TableBody from '@mui/material/TableBody'
import TableCell from '@mui/material/TableCell'
import TableContainer from '@mui/material/TableContainer'
import TableHead from '@mui/material/TableHead'
import TableRow from '@mui/material/TableRow'
import Checkbox from '@mui/material/Checkbox'
import FormControlLabel from '@mui/material/FormControlLabel'

// Third-party Imports
import { useForm, Controller } from 'react-hook-form'

// PDF Imports
import { jsPDF } from 'jspdf'
import 'jspdf-autotable'

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
  estadoObra: string
  rut: string
  nombreCliente: string
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
  acreditacionPersonal: boolean
  especificacionesTecnicas: boolean
  acreditacionEquipos: boolean
  cartaCompromiso: boolean
  mandatoServiu: boolean
  otros: string
  razonSocial: string
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
      estadoObra: '',
      rut: '',
      nombreCliente: '',
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
      acreditacionPersonal: false,
      especificacionesTecnicas: false,
      acreditacionEquipos: false,
      cartaCompromiso: false,
      mandatoServiu: false,
      otros: '',
      razonSocial: ''
    }
  })

  const onSubmit = (data: FormValidateType) => {
    // lógica para manejar el envío del formulario
    console.log(data)
    handleClose()
  }

  const handleReset = () => {
    handleClose()
  }

  const generatePDF = () => {
    const doc = new jsPDF()

    // Título
    doc.text('Nueva Obra - Ejemplo', 10, 10)

    // Añadir una tabla con algunos datos del formulario como ejemplo
    doc.autoTable({
      startY: 20,
      head: [['Campo', 'Valor']],
      body: [
        ['Número Obra', '12345'], // Aquí puedes poner los valores reales del formulario
        ['Fecha Ingreso', '2024-09-04'],
        ['Estado', 'Activo'],
        ['Nombre Cliente', 'Sebastian']

        // Añade más campos según sea necesario
      ]
    })

    // Guardar el PDF
    doc.save('nueva_obra.pdf')
  }

  return (
    <Drawer
      open={open}
      anchor='right'
      variant='temporary'
      onClose={handleReset}
      ModalProps={{ keepMounted: true }}
      sx={{ '& .MuiDrawer-paper': { width: { xs: '75%', sm: '75%' } } }}
    >
      <div className='flex items-center justify-between pli-5 plb-4'>
        <Typography variant='h5'>Nueva Obra</Typography>
        <IconButton size='small' onClick={handleReset}>
          <i className='ri-close-line text-2xl' />
        </IconButton>
      </div>
      <Divider />
      <div className='p-5'>
        <form onSubmit={handleSubmit(onSubmit)} className='flex flex-col gap-5'>
          <Typography variant='h6'>Nueva Obra</Typography>
          <Grid container spacing={5}>
            <Grid item xs={12} sm={3}>
              <Controller
                name='numeroObra'
                control={control}
                rules={{ required: true }}
                render={({ field }) => (
                  <TextField
                    {...field}
                    fullWidth
                    label='Número Obra *'
                    {...(errors.numeroObra && { error: true, helperText: 'Este campo es obligatorio.' })}
                  />
                )}
              />
            </Grid>
            <Grid item xs={12} sm={3}>
              <Controller
                name='fechaIngreso'
                control={control}
                rules={{ required: true }}
                render={({ field }) => (
                  <TextField
                    {...field}
                    fullWidth
                    label='Fecha Ingreso *'
                    {...(errors.fechaIngreso && { error: true, helperText: 'Este campo es obligatorio.' })}
                  />
                )}
              />
            </Grid>
            <Grid item xs={12} sm={3}>
              <Controller
                name='estadoObra'
                control={control}
                render={({ field }) => (
                  <FormControl fullWidth>
                    <InputLabel>Estado</InputLabel>
                    <Select {...field}>
                      <MenuItem value='Activo'>Activo</MenuItem>
                      <MenuItem value='Inactivo'>Inactivo</MenuItem>
                    </Select>
                  </FormControl>
                )}
              />
            </Grid>
            <Grid item xs={12} sm={3}>
              <Controller
                name='rut'
                control={control}
                render={({ field }) => <TextField {...field} fullWidth label='RUT' placeholder='' />}
              />
            </Grid>
          </Grid>

          <Grid container spacing={5}>
            <Grid item xs={12} sm={6}>
              <Controller
                name='nombreCliente'
                control={control}
                render={({ field }) => <TextField {...field} fullWidth label='Nombre Cliente' placeholder='' />}
              />
            </Grid>
          </Grid>

          <Typography variant='h6' sx={{ mt: 4 }}>
            Antecedentes
          </Typography>
          <Grid container spacing={5}>
            <Grid item xs={12} sm={6}>
              <Controller
                name='nombreObra'
                control={control}
                rules={{ required: true }}
                render={({ field }) => (
                  <TextField
                    {...field}
                    fullWidth
                    label='Nombre Obra *'
                    {...(errors.nombreObra && { error: true, helperText: 'Este campo es obligatorio.' })}
                  />
                )}
              />
            </Grid>
            <Grid item xs={12} sm={6}>
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
                render={({ field }) => (
                  <FormControl fullWidth>
                    <InputLabel>Región</InputLabel>
                    <Select {...field}>
                      <MenuItem value='Región 1'>Región 1</MenuItem>
                      <MenuItem value='Región 2'>Región 2</MenuItem>
                    </Select>
                  </FormControl>
                )}
              />
            </Grid>
            <Grid item xs={12} sm={4}>
              <Controller
                name='comuna'
                control={control}
                render={({ field }) => (
                  <FormControl fullWidth>
                    <InputLabel>Comuna</InputLabel>
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
                render={({ field }) => (
                  <FormControl fullWidth>
                    <InputLabel>Mandante</InputLabel>
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
          </Grid>

          <Typography variant='h6' sx={{ mt: 4 }}>
            Roles y Contactos
          </Typography>
          <TableContainer sx={{ mt: 2 }}>
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell>Rol</TableCell>
                  <TableCell>Nombre</TableCell>
                  <TableCell>Email</TableCell>
                  <TableCell>Teléfono</TableCell>
                  <TableCell>Acción</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                <TableRow>
                  <TableCell>Encargado de Obra</TableCell>
                  <TableCell>Nombre Encargado</TableCell>
                  <TableCell>email@email.com</TableCell>
                  <TableCell>+56912345678</TableCell>
                  <TableCell>
                    <IconButton size='small'>
                      <i className='ri-edit-line' />
                    </IconButton>
                    <IconButton size='small'>
                      <i className='ri-delete-bin-line' />
                    </IconButton>
                  </TableCell>
                </TableRow>
                <TableRow>
                  <TableCell>Envio de Informes</TableCell>
                  <TableCell>Nombre Encargado</TableCell>
                  <TableCell>email@email.com</TableCell>
                  <TableCell>+56912345678</TableCell>
                  <TableCell>
                    <IconButton size='small'>
                      <i className='ri-edit-line' />
                    </IconButton>
                    <IconButton size='small'>
                      <i className='ri-delete-bin-line' />
                    </IconButton>
                  </TableCell>
                </TableRow>
              </TableBody>
            </Table>
          </TableContainer>

          <Typography variant='h6' sx={{ mt: 4 }}>
            Requisitos
          </Typography>
          <Grid container spacing={5}>
            <Grid item xs={12} sm={4}>
              <Controller
                name='acreditacionPersonal'
                control={control}
                render={({ field }) => (
                  <FormControlLabel control={<Checkbox {...field} />} label='Acreditación de Personal' />
                )}
              />
            </Grid>
            <Grid item xs={12} sm={4}>
              <Controller
                name='especificacionesTecnicas'
                control={control}
                render={({ field }) => (
                  <FormControlLabel control={<Checkbox {...field} />} label='Especificaciones Técnicas (EETT)' />
                )}
              />
            </Grid>
            <Grid item xs={12} sm={4}>
              <Controller
                name='acreditacionEquipos'
                control={control}
                render={({ field }) => (
                  <FormControlLabel control={<Checkbox {...field} />} label='Acreditación de Equipos' />
                )}
              />
            </Grid>
            <Grid item xs={12} sm={4}>
              <Controller
                name='cartaCompromiso'
                control={control}
                render={({ field }) => (
                  <FormControlLabel control={<Checkbox {...field} />} label='Carta de Compromiso' />
                )}
              />
            </Grid>
            <Grid item xs={12} sm={4}>
              <Controller
                name='mandatoServiu'
                control={control}
                render={({ field }) => (
                  <FormControlLabel control={<Checkbox {...field} />} label='Mandato y Envío de Informes a SERVIU' />
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

          <Typography variant='h6' sx={{ mt: 4 }}>
            Facturación
          </Typography>
          <Grid container spacing={5}>
            <Grid item xs={12} sm={4}>
              <Controller
                name='razonSocial'
                control={control}
                render={({ field }) => <TextField {...field} fullWidth label='Razón Social' placeholder='' />}
              />
            </Grid>
            <Grid item xs={12} sm={4}>
              <Controller
                name='rut'
                control={control}
                render={({ field }) => <TextField {...field} fullWidth label='RUT' placeholder='' />}
              />
            </Grid>
            <Grid item xs={12} sm={4}>
              <Controller
                name='giro'
                control={control}
                render={({ field }) => <TextField {...field} fullWidth label='Giro' placeholder='' />}
              />
            </Grid>
            <Grid item xs={12} sm={4}>
              <Controller
                name='direccionComercial'
                control={control}
                render={({ field }) => <TextField {...field} fullWidth label='Dirección Comercial' placeholder='' />}
              />
            </Grid>
            <Grid item xs={12} sm={4}>
              <Controller
                name='comuna'
                control={control}
                render={({ field }) => (
                  <FormControl fullWidth>
                    <InputLabel>Comuna</InputLabel>
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
                name='telefono'
                control={control}
                render={({ field }) => <TextField {...field} fullWidth label='Teléfono' placeholder='' />}
              />
            </Grid>
            <Grid item xs={12} sm={4}>
              <Controller
                name='mailRecepcionFactura'
                control={control}
                render={({ field }) => <TextField {...field} fullWidth label='Mail Recepción Factura' placeholder='' />}
              />
            </Grid>
          </Grid>

          <Typography variant='h6' sx={{ mt: 4 }}>
            Referencias
          </Typography>
          <Grid container spacing={5}>
            <Grid item xs={12} sm={4}>
              <Controller
                name='estadoDePago'
                control={control}
                render={({ field }) => <FormControlLabel control={<Checkbox {...field} />} label='Estado de Pago' />}
              />
            </Grid>
            <Grid item xs={12} sm={4}>
              <Controller
                name='hes'
                control={control}
                render={({ field }) => <FormControlLabel control={<Checkbox {...field} />} label='HES' />}
              />
            </Grid>
            <Grid item xs={12} sm={4}>
              <Controller
                name='oc'
                control={control}
                render={({ field }) => <FormControlLabel control={<Checkbox {...field} />} label='OC' />}
              />
            </Grid>
            <Grid item xs={12} sm={4}>
              <Controller
                name='otro'
                control={control}
                render={({ field }) => <TextField {...field} fullWidth label='Otro' placeholder='' />}
              />
            </Grid>
          </Grid>

          <div className='flex items-center gap-4 mt-5'>
            <Button variant='contained' type='submit'>
              Crear Nueva Obra
            </Button>
            <Button variant='outlined' color='error' onClick={generatePDF}>
              Exportar a PDF
            </Button>
          </div>
        </form>
      </div>
    </Drawer>
  )
}

export default AddUserDrawer
