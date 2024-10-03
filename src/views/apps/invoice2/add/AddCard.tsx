'use client'

// React Imports
import { useState } from 'react'

// MUI Imports
import Grid from '@mui/material/Grid'
import Card from '@mui/material/Card'
import CardContent from '@mui/material/CardContent'
import TextField from '@mui/material/TextField'
import Typography from '@mui/material/Typography'
import InputAdornment from '@mui/material/InputAdornment'
import Divider from '@mui/material/Divider'
import Button from '@mui/material/Button'
import IconButton from '@mui/material/IconButton'
import Table from '@mui/material/Table'
import TableBody from '@mui/material/TableBody'
import TableCell from '@mui/material/TableCell'
import TableHead from '@mui/material/TableHead'
import TableRow from '@mui/material/TableRow'
import useMediaQuery from '@mui/material/useMediaQuery'
import type { Theme } from '@mui/material/styles'

// Component Imports
import AddPopUp from './AddPopUp'
import AddCustomerDrawer from './AddCustomerDrawer'
import Logo from '@components/layout/shared/Logo'

// Styled Component Imports
import AppReactDatepicker from '@/libs/styles/AppReactDatepicker'

const AddAction = ({ invoiceData }: { invoiceData?: any[] }) => {
  const [open, setOpen] = useState(false)
  const [isPopUpOpen, setIsPopUpOpen] = useState(false)
  const [count, setCount] = useState(1)
  const [issuedDate, setIssuedDate] = useState<Date | null | undefined>(null)
  const [dueDate, setDueDate] = useState<Date | null | undefined>(null)
  const [selectedVisits, setSelectedVisits] = useState<any[]>([])

  const isBelowMdScreen = useMediaQuery((theme: Theme) => theme.breakpoints.down('md'))

  const handleOpenPopUp = () => {
    setIsPopUpOpen(true)
  }

  const handleClosePopUp = () => {
    setIsPopUpOpen(false)
  }

  const handleAgregarVisitas = (visitasSeleccionadas: any[]) => {
    setSelectedVisits([...selectedVisits, ...visitasSeleccionadas])
    handleClosePopUp()
  }

  return (
    <>
      <Card>
        <CardContent className='sm:!p-12'>
          <Grid container spacing={6}>
            <Grid item xs={12}>
              <div className='p-6 bg-actionHover rounded'>
                <div className='flex justify-between gap-4 flex-col sm:flex-row'>
                  <div className='flex flex-col gap-6'>
                    <div className='flex items-center'>
                      <Logo />
                    </div>
                    <div>
                      <Typography color='text.primary'>Santa Blanca Nº51, Chillán, Chile</Typography>
                      <Typography color='text.primary'>Email: contacto@pampaustral.cl</Typography>
                      <Typography color='text.primary'>+56 42 223 82 90</Typography>
                    </div>
                  </div>
                  <div className='flex flex-col gap-2'>
                    <div className='flex items-center gap-4'>
                      <Typography variant='h5' className='min-is-[95px]'>
                        Minuta
                      </Typography>
                      <TextField
                        fullWidth
                        size='small'
                        value={invoiceData?.[0].id}
                        InputProps={{
                          disabled: true,
                          startAdornment: <InputAdornment position='start'>#</InputAdornment>
                        }}
                      />
                    </div>
                    <div className='flex items-center'>
                      <Typography className='min-is-[95px] mie-4' color='text.primary'>
                        Fecha:
                      </Typography>
                      <AppReactDatepicker
                        boxProps={{ className: 'is-full' }}
                        selected={issuedDate}
                        placeholderText='YYYY-MM-DD'
                        dateFormat={'yyyy-MM-dd'}
                        onChange={(date: Date | null) => setIssuedDate(date)}
                        customInput={<TextField fullWidth size='small' />}
                      />
                    </div>
                    <div className='flex items-center'>
                      <Typography className='min-is-[95px] mie-4' color='text.primary'>
                        Estado:
                      </Typography>
                      <AppReactDatepicker
                        boxProps={{ className: 'is-full' }}
                        selected={dueDate}
                        placeholderText='YYYY-MM-DD'
                        dateFormat={'yyyy-MM-dd'}
                        onChange={(date: Date | null) => setDueDate(date)}
                        customInput={<TextField fullWidth size='small' />}
                      />
                    </div>
                  </div>
                </div>
              </div>
            </Grid>

            {/* Buscar Cliente y Cargar Solicitudes */}
            <Grid item xs={12}>
              <div className='flex justify-between flex-col gap-4 sm:flex-row'>
                <TextField
                  fullWidth
                  size='small'
                  placeholder='Buscar Cliente'
                  InputProps={{
                    startAdornment: (
                      <InputAdornment position='start'>
                        <i className='ri-search-line'></i>
                      </InputAdornment>
                    )
                  }}
                />
                <TextField
                  fullWidth
                  size='small'
                  placeholder='Buscar Obra'
                  InputProps={{
                    startAdornment: (
                      <InputAdornment position='start'>
                        <i className='ri-search-line'></i>
                      </InputAdornment>
                    )
                  }}
                />
                <Button
                  variant='contained'
                  size='small'
                  startIcon={<i className='ri-file-list-line'></i>}
                  sx={{ whiteSpace: 'nowrap', minWidth: '180px' }}
                  onClick={handleOpenPopUp}
                >
                  Cargar Solicitudes
                </Button>
              </div>
            </Grid>
            <Grid item xs={12}>
              <Divider className='border-dashed' />
            </Grid>

            {/* Texto Agregado: "Invoice To" y "Bill To" */}
            <Grid item xs={12}>
              <div className='flex justify-between flex-col gap-4 flex-wrap sm:flex-row'>
                <div className='flex flex-col gap-4'>
                  <Typography className='font-medium' color='text.primary'>
                    Obra:
                  </Typography>
                  <div>
                    <div className='flex items-center gap-4'>
                      <Typography className='min-is-[100px]'>Obra N°:</Typography>
                      <Typography></Typography>
                    </div>
                    <div className='flex items-center gap-4'>
                      <Typography className='min-is-[100px]'>Nombre Obra:</Typography>
                      <Typography></Typography>
                    </div>
                    <div className='flex items-center gap-4'>
                      <Typography className='min-is-[100px]'>Encargado Obra:</Typography>
                      <Typography></Typography>
                    </div>
                    <div className='flex items-center gap-4'>
                      <Typography className='min-is-[100px]'>Teléfono:</Typography>
                      <Typography></Typography>
                    </div>
                    <div className='flex items-center gap-4'>
                      <Typography className='min-is-[100px]'>Lista de Precios:</Typography>
                      <Typography></Typography>
                    </div>
                    <div className='flex items-center gap-4'>
                      <Typography className='min-is-[100px]'></Typography>
                      <Typography></Typography>
                    </div>
                  </div>
                </div>
                <div className='flex flex-col gap-4'>
                  <Typography className='font-medium' color='text.primary'>
                    Facturar a:
                  </Typography>
                  <div>
                    <div className='flex items-center gap-4'>
                      <Typography className='min-is-[100px]'>RUT:</Typography>
                      <Typography></Typography>
                    </div>

                    <div className='flex items-center gap-4'>
                      <Typography className='min-is-[100px]'>Razón Social:</Typography>
                      <Typography></Typography>
                    </div>
                    <div className='flex items-center gap-4'>
                      <Typography className='min-is-[100px]'>Giro:</Typography>
                      <Typography></Typography>
                    </div>
                    <div className='flex items-center gap-4'>
                      <Typography className='min-is-[100px]'>Comuna:</Typography>
                      <Typography></Typography>
                    </div>
                    <div className='flex items-center gap-4'>
                      <Typography className='min-is-[100px]'>Dirección:</Typography>
                      <Typography></Typography>
                    </div>
                    <div className='flex items-center gap-4'>
                      <Typography className='min-is-[100px]'>Correo:</Typography>
                      <Typography></Typography>
                    </div>
                  </div>
                </div>
              </div>
            </Grid>

            {/* Tabla de Visitas */}
            <Grid item xs={12}>
              <Table>
                <TableHead>
                  <TableRow>
                    <TableCell>N° Solicitud</TableCell>
                    <TableCell>Visita</TableCell>
                    <TableCell>OTS</TableCell>
                    <TableCell>RCM</TableCell>
                    <TableCell>Valor</TableCell> {/* Nueva columna para el valor */}
                    <TableCell>Acciones</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {/* Agrupamos las visitas por número de solicitud */}
                  {Object.keys(
                    selectedVisits.reduce((acc, visita) => {
                      acc[visita.solicitud] = acc[visita.solicitud] || []
                      acc[visita.solicitud].push(visita)

                      return acc
                    }, {})
                  ).map(solicitud => (
                    <>
                      <TableRow key={`header-${solicitud}`}>
                        <TableCell colSpan={6}>
                          <Typography variant='h6'>
                            Solicitud {solicitud} {/* Encabezado para cada solicitud */}
                          </Typography>
                        </TableCell>
                      </TableRow>
                      {selectedVisits
                        .filter(visita => visita.solicitud === solicitud) // Filtramos por solicitud
                        .map((visita, index) => (
                          <TableRow key={index}>
                            <TableCell>{solicitud}</TableCell>
                            <TableCell>{visita.visita}</TableCell>
                            <TableCell>{visita.ots}</TableCell>
                            <TableCell>{visita.rcm}</TableCell>
                            <TableCell>{visita.valor}</TableCell> {/* Mostramos el valor */}
                            <TableCell>
                              <IconButton
                                size='small'
                                onClick={() => {
                                  const updatedVisits = selectedVisits.filter((_, idx) => idx !== index)

                                  setSelectedVisits(updatedVisits)
                                }}
                              >
                                <i className='ri-delete-bin-line' /> {/* Icono de basurero */}
                              </IconButton>
                              <IconButton
                                size='small'
                                onClick={() => {
                                  // Aquí puedes agregar la lógica para editar los datos
                                  alert('Función de edición aún no implementada')
                                }}
                              >
                                <i className='ri-pencil-line' /> {/* Icono de lápiz */}
                              </IconButton>
                            </TableCell>
                          </TableRow>
                        ))}
                      <TableRow>
                        <TableCell colSpan={4} align='right'>
                          <Typography variant='body2' fontWeight='bold'>
                            Subtotal Solicitud {solicitud}:
                          </Typography>
                        </TableCell>
                        <TableCell colSpan={2}>
                          {/* Calculamos el subtotal por solicitud */}
                          <Typography variant='body2' fontWeight='bold'>
                            {selectedVisits
                              .filter(visita => visita.solicitud === solicitud)
                              .reduce((total, visita) => total + (visita.valor || 0), 0)}{' '}
                            {/* Sumamos el valor de cada visita */}
                          </Typography>
                        </TableCell>
                      </TableRow>
                    </>
                  ))}
                </TableBody>
              </Table>
            </Grid>
          </Grid>
        </CardContent>
      </Card>

      {/* Pop-Up */}
      <AddPopUp
        open={isPopUpOpen}
        obra='Obra 1'
        handleClose={handleClosePopUp}
        handleAgregarVisitas={handleAgregarVisitas}
      />

      <AddCustomerDrawer open={open} setOpen={setOpen} onFormSubmit={() => {}} />
    </>
  )
}

export default AddAction
