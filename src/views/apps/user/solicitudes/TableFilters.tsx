'use client'

// React Imports
import { Fragment, useState } from 'react'
import type { SyntheticEvent } from 'react'

import Link from 'next/link'

// MUI Imports
import Card from '@mui/material/Card'
import CardHeader from '@mui/material/CardHeader'
import CardContent from '@mui/material/CardContent'
import Divider from '@mui/material/Divider'
import { styled } from '@mui/material/styles'
import Tab from '@mui/material/Tab'
import TabList from '@mui/lab/TabList'
import TabPanel from '@mui/lab/TabPanel'
import TabContext from '@mui/lab/TabContext'
import Typography from '@mui/material/Typography'
import TimelineDot from '@mui/lab/TimelineDot'
import TimelineItem from '@mui/lab/TimelineItem'
import TimelineContent from '@mui/lab/TimelineContent'
import TimelineSeparator from '@mui/lab/TimelineSeparator'
import TimelineConnector from '@mui/lab/TimelineConnector'
import MuiTimeline from '@mui/lab/Timeline'
import Grid from '@mui/material/Grid'
import Chip from '@mui/material/Chip'
import Box from '@mui/material/Box'

// Components Imports
import OptionMenu from '@core/components/option-menu'

// Styled Timeline component
const Timeline = styled(MuiTimeline)({
  paddingLeft: 0,
  paddingRight: 0,
  '& .MuiTimelineItem-root': {
    width: '100%',
    '&:before': {
      display: 'none'
    }
  },
  '& .MuiTimelineDot-root': {
    border: 0,
    padding: 0
  }
})

// Vars
const data = {
  new: [
    {
      sender: {
        name: '0123456789 (N° Obra) - Nombre cliente',
        address: 'texto por definir'
      },
      receiver: {
        name: '0123456789 (N° Obra) - Nombre cliente',
        address: 'texto por definir'
      }
    },
    {
      sender: {
        name: '0123456789 (N° Obra) - Nombre cliente',
        address: 'texto por definir'
      },
      receiver: {
        name: '0123456789 (N° Obra) - Nombre cliente',
        address: 'texto por definir'
      }
    }
  ]
}

const LogisticsOrdersByCountries = () => {
  // States for the first tab
  const [value, setValue] = useState<string>('new')

  // States for the second tab in "Líneas Operativas y Administrativas"
  const [valueAdmin, setValueAdmin] = useState<string>('tab1')

  const handleChange = (event: SyntheticEvent, newValue: string) => {
    setValue(newValue)
  }

  const handleChangeAdmin = (event: SyntheticEvent, newValue: string) => {
    setValueAdmin(newValue)
  }

  return (
    <Grid container spacing={3}>
      {/* Título común para ambos TabPanels */}
      <Grid item xs={12}>
        <Typography variant='h5' component='h2' gutterBottom sx={{ ml: 2 }}>
          Solicitudes por estado
        </Typography>
      </Grid>

      {/* First Card with Tabs */}
      <Grid item xs={12} md={6}>
        <Card>
          <TabContext value={value}>
            {/* Las Tabs se quedan debajo del título */}
            <TabList variant='fullWidth' onChange={handleChange} aria-label='full width tabs example'>
              <Tab value='new' label='Nuevas' />
              <Tab value='new3' label='En ruta' />
              <Tab value='preparing' label='Recibido' />
            </TabList>
            <TabPanel value={value} className='pbs-0'>
              <CardContent>
                {data.new.map((item, index) => {
                  return (
                    <Fragment key={index}>
                      <Box display='flex' alignItems='center' mb={2}>
                        <i className='ri-truck-line text-lg text-success' style={{ marginRight: '8px' }} />
                        <Link href='/apps/user/solicitud'>
                          <Typography variant='body2' color='primary' sx={{ cursor: 'pointer' }}>
                            #0123456781
                          </Typography>
                        </Link>
                        <Chip label='Creada' color='default' sx={{ ml: 1, mr: 1 }} />
                        <Chip label='Cotizada' color='success' />
                      </Box>
                      <Typography variant='body2' color='primary'>
                        00/00/00 (Fecha de inicio ruta)
                      </Typography>
                      <Typography variant='body2'>123456 - Echeverría Izquierdo</Typography>
                      {/* PDF Example using a simple text */}
                      <Box mt={1} display='flex' alignItems='center'>
                        <span role='img' aria-label='pdf' style={{ marginRight: '8px' }}>
                          📄
                        </span>
                        <Typography variant='body2' color='text.primary'>
                          Cotización-012345.pdf
                        </Typography>
                      </Box>
                      {index !== data.new.length - 1 && <Divider className='my-2' />}
                    </Fragment>
                  )
                })}

                {/* Nueva entrada con "Creada - Sin Cotización" */}
                <Box display='flex' alignItems='center' mt={2}>
                  <i className='ri-truck-line text-lg text-success' style={{ marginRight: '8px' }} />
                  <Typography variant='body2' color='primary' sx={{ cursor: 'pointer' }}>
                    #0123456782
                  </Typography>
                  <Chip label='Creada' color='default' sx={{ ml: 1, mr: 1 }} />
                  <Chip label='Sin Cotización' color='error' />
                </Box>
                <Typography variant='body2' color='primary'>
                  00/00/00 (Fecha de inicio ruta)
                </Typography>
                <Typography variant='body2'>123456 - Echeverría Izquierdo</Typography>
              </CardContent>
            </TabPanel>
          </TabContext>
        </Card>
      </Grid>

      {/* Second Card with new Tabs */}
      <Grid item xs={12} md={6}>
        <Card>
          <TabContext value={valueAdmin}>
            <TabList variant='fullWidth' onChange={handleChangeAdmin}>
              <Tab value='tab1' label='Nuevas' />
              <Tab value='tab2' label='Informes Disponibles' />
            </TabList>
            <TabPanel value='tab1'>
              <CardContent>
                {[...Array(4)].map((_, index) => (
                  <Fragment key={index}>
                    <Box display='flex' alignItems='center' mb={2}>
                      <i className='ri-truck-line text-lg text-success' style={{ marginRight: '8px' }} />
                      <Typography variant='body2' color='primary' sx={{ cursor: 'pointer' }}>
                        #012345678{index}
                      </Typography>
                      <Chip label='Operativo' color='success' sx={{ ml: 1, mr: 1 }} />
                      <Chip label='Administrativo' color='primary' />
                    </Box>
                    <Typography variant='body2' color='primary'>
                      00/00/0{index}
                    </Typography>
                    <Typography variant='body2'>123456 - Echeverría Izquierdo</Typography>
                    {index < 3 && <Divider className='my-2' />} {/* Add a divider between entries */}
                  </Fragment>
                ))}
              </CardContent>
            </TabPanel>
            <TabPanel value='tab2'>
              <CardContent>
                <Typography variant='body2'>Informes...</Typography>
              </CardContent>
            </TabPanel>
          </TabContext>
        </Card>
      </Grid>
    </Grid>
  )
}

export default LogisticsOrdersByCountries
