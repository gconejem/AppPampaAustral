'use client'

// React Imports
import { useState, useEffect } from 'react'

import { useSearchParams } from 'next/navigation'

// MUI Imports
import MenuItem from '@mui/material/MenuItem'
import Select from '@mui/material/Select'
import Box from '@mui/material/Box'
import Radio from '@mui/material/Radio'

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
  const [isValorGlobal, setIsValorGlobal] = useState(false) // Estado para el booleano "Valor Global"
  const [valorUF, setValorUF] = useState('') // Estado para el campo VALOR UF
  const [isPopUpOpen, setIsPopUpOpen] = useState(false)
  const [count, setCount] = useState(1)
  const [issuedDate, setIssuedDate] = useState<Date | null | undefined>(null)
  const [dueDate, setDueDate] = useState<Date | null | undefined>(null)
  const [selectedVisits, setSelectedVisits] = useState<any[]>([])
  const [precioSeleccionado, setPrecioSeleccionado] = useState('')
  const searchParams = useSearchParams()
  const cliente = searchParams.get('cliente') || 'Cliente'
  const obra = searchParams.get('obra') || 'Obra'

  const isBelowMdScreen = useMediaQuery((theme: Theme) => theme.breakpoints.down('md'))

  const handleChange = (event: React.ChangeEvent<{ value: unknown }>) => {
    setPrecioSeleccionado(event.target.value as string)
  }

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
            {/* Encabezado Principal */}
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
                  placeholder={cliente}
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
                  placeholder={obra}
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

            {/* Sección Obra y Facturar a */}
            <Grid item xs={12}>
              <div className='flex justify-between flex-col gap-4 flex-wrap sm:flex-row'>
                {/* Obra */}
                <div className='flex flex-col gap-4'>
                  <Typography className='font-medium' color='text.primary'>
                    Obra:
                  </Typography>
                  <Typography>Obra: N°</Typography>
                  <Typography>
                    <strong>Nombre Obra:</strong> Nombre Obra
                  </Typography>
                  <Typography>
                    <strong>Encargado de Obra:</strong> Nombre Encargado
                  </Typography>
                  <Typography>
                    <strong>Teléfono:</strong> +56900000000
                  </Typography>
                  <Typography>Lista 1</Typography>
                  <Select
                    value={precioSeleccionado}
                    onChange={handleChange}
                    displayEmpty
                    fullWidth
                    size='small'
                    sx={{ maxWidth: '200px' }}
                  >
                    <MenuItem value=''>Lista de Precios</MenuItem>
                    <MenuItem value='precio1'>Precio 1</MenuItem>
                    <MenuItem value='precio2'>Precio 2</MenuItem>
                    <MenuItem value='precio3'>Precio 3</MenuItem>
                  </Select>
                </div>

                {/* Facturar a */}
                <div className='flex flex-col gap-4'>
                  <Typography className='font-medium' color='text.primary'>
                    Facturar a:
                  </Typography>
                  <Typography>
                    <strong>RUT:</strong> N° RUT
                  </Typography>
                  <Typography>
                    <strong>Razón Social:</strong> Nombre Razón Social
                  </Typography>
                  <Typography>
                    <strong>Giro:</strong> Nombre Giro
                  </Typography>
                  <Typography>
                    <strong>Comuna:</strong> Nombre Comuna
                  </Typography>
                  <Typography>
                    <strong>Dirección:</strong> Calle y número, Ciudad
                  </Typography>
                  <Typography>
                    <strong>Correo:</strong> dirección@correo.com
                  </Typography>
                </div>
              </div>
            </Grid>

            {/* Tarjetas, Booleano y Tabla Condicional */}
            {selectedVisits.length > 0 && (
              <>
                <Grid item xs={12}>
                  <Box display='flex' alignItems='center' justifyContent='space-between' sx={{ mb: 2 }}>
                    <Box display='flex' gap={2}>
                      <Box display='flex' alignItems='center' gap={1}>
                        <Typography variant='body2' sx={{ fontWeight: 'bold' }}>
                          Solicitud:
                        </Typography>
                        <Box
                          sx={{
                            backgroundColor: '#E3F2FD',
                            color: '#0277BD',
                            fontWeight: 'bold',
                            fontSize: '0.9rem',
                            borderRadius: '8px',
                            padding: '2px 8px',
                            display: 'inline-block'
                          }}
                        >
                          123
                        </Box>
                      </Box>

                      <Box display='flex' alignItems='center' gap={1}>
                        <Typography variant='body2' sx={{ fontWeight: 'bold' }}>
                          Cotización:
                        </Typography>
                        <Box
                          sx={{
                            backgroundColor: '#E3F2FD',
                            color: '#0277BD',
                            fontWeight: 'bold',
                            fontSize: '0.9rem',
                            borderRadius: '8px',
                            padding: '2px 8px',
                            display: 'inline-block'
                          }}
                        >
                          433
                        </Box>
                      </Box>
                    </Box>
                    <Box display='flex' alignItems='center' gap={2}>
                      <Radio
                        checked={isValorGlobal}
                        onChange={() => setIsValorGlobal(!isValorGlobal)}
                        color='primary'
                      />
                      <Typography>Valor Global</Typography>
                      <TextField
                        label='Valor UF'
                        variant='outlined'
                        size='small'
                        value={valorUF}
                        onChange={e => setValorUF(e.target.value)}
                        disabled={!isValorGlobal}
                      />
                    </Box>
                  </Box>
                </Grid>

                {/* Tabla de Visitas */}
                <Grid item xs={12}>
                  <Table>
                    <TableHead>
                      <TableRow>
                        <TableCell>VISITA</TableCell>
                        <TableCell>...</TableCell>
                        <TableCell>OT</TableCell>
                        <TableCell>RCM</TableCell>
                        <TableCell>COD-INT</TableCell>
                        <TableCell>DESCRIPCIÓN</TableCell>
                        <TableCell>CANTIDAD</TableCell>

                        <TableCell>VALO</TableCell>
                        <TableCell>TOTAL</TableCell>

                        <TableCell>ACCIONES</TableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {selectedVisits.map((visita, index) => (
                        <TableRow key={index}>
                          <TableCell>{visita.solicitud}</TableCell>
                          <TableCell>...</TableCell>

                          <TableCell>{visita.ots}</TableCell>
                          <TableCell></TableCell>
                          <TableCell>MOV</TableCell>
                          <TableCell>DESCRIPCIÓN</TableCell>
                          <TableCell>1</TableCell>
                          <TableCell>1</TableCell>

                          <TableCell>{visita.valor}</TableCell>
                          <TableCell>
                            <IconButton size='small'>
                              <i className='ri-pencil-line' /> {/* Ícono de editar */}
                            </IconButton>
                            <IconButton size='small'>
                              <i className='ri-delete-bin-line' /> {/* Ícono de eliminar */}
                            </IconButton>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </Grid>
              </>
            )}
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
