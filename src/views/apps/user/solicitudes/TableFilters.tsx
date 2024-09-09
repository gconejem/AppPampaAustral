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
import Button from '@mui/material/Button'
import type { TimelineProps } from '@mui/lab/Timeline'

// Components Imports
import OptionMenu from '@core/components/option-menu'

// Styled Timeline component
const Timeline = styled(MuiTimeline)<TimelineProps>({
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
  ],
  new2: [
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
  ],
  new3: [
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
  ],
  preparing: [
    {
      sender: {
        name: '0123456789 (N° Obra) - Nombre cliente',
        address: '61 Unions, California (CA), 922523'
      },
      receiver: {
        name: '0123456789 (N° Obra) - Nombre cliente',
        address: '865 Delta, California (CA), 932830'
      }
    },
    {
      sender: {
        name: '0123456789 (N° Obra) - Nombre cliente',
        address: '37 Marjory, California (CA), 951958'
      },
      receiver: {
        name: '0123456789 (N° Obra) - Nombre cliente',
        address: '926 Reynolds, California (CA), 910279'
      }
    }
  ],
  shipping: [
    {
      sender: {
        name: 'Alex Walton',
        address: '78 Judson, California (CA), 956084'
      },
      receiver: {
        name: 'Eula Griffin',
        address: '56 Bernard, California (CA), 965133'
      }
    },
    {
      sender: {
        name: 'Lula Barton',
        address: '95 Gaylord, California (CA), 991955'
      },
      receiver: {
        name: 'Craig Jacobs',
        address: '73 Sandy, California (CA), 954566'
      }
    }
  ]
}

const LogisticsOrdersByCountries = () => {
  // States
  const [value, setValue] = useState<string>('new')

  const handleChange = (event: SyntheticEvent, newValue: string) => {
    setValue(newValue)
  }

  return (
    <Grid container spacing={6}>
      <Grid item xs={12} md={8}>
        <Card>
          <CardHeader
            title='Solicitudes por estado'
            subheader='12 solicitudes en proceso'
            action={<OptionMenu iconClassName='text-textPrimary' options={['Show all orders', 'Share', 'Refresh']} />}
            className='pbe-4'
          />
          <TabContext value={value}>
            <TabList variant='fullWidth' onChange={handleChange} aria-label='full width tabs example'>
              <Tab value='new' label='Nuevas' />
              <Tab value='new3' label='En ruta' />
              <Tab value='preparing' label='Recibido' />
              <Tab value='shipping' label='En proceso' />
            </TabList>
            <TabPanel value={value} className='pbs-0'>
              <CardContent>
                {data[value as keyof typeof data].map((item, index) => {
                  return (
                    <Fragment key={index}>
                      <Timeline>
                        <TimelineItem>
                          <TimelineSeparator>
                            <TimelineDot variant='outlined' className='mlb-0'>
                              <i className='ri-checkbox-circle-line text-xl text-success' />
                            </TimelineDot>
                            <TimelineConnector />
                          </TimelineSeparator>
                          <TimelineContent className='flex flex-col gap-0.5 pbs-0 pis-5 pbe-5'>
                            <Link href='/apps/ecommerce/orders/details/5434'>
                              <Typography
                                variant='caption'
                                className='uppercase'
                                color='success.main'
                                sx={{ cursor: 'pointer' }}
                              >
                                N° ID solicitud - 28/08/2024 (Fecha de solicitud)
                              </Typography>
                            </Link>
                            <Typography color='text.primary' className='font-medium'>
                              {item.sender.name}
                            </Typography>
                            <Typography variant='body2' className='line-clamp-1'>
                              {item.sender.address}
                            </Typography>
                          </TimelineContent>
                        </TimelineItem>
                        <TimelineItem>
                          <TimelineSeparator>
                            <TimelineDot variant='outlined' className='mlb-0'>
                              <i className='ri-map-pin-line text-xl text-primary' />
                            </TimelineDot>
                          </TimelineSeparator>
                          <TimelineContent className='flex flex-col pbe-0 gap-0.5 pbs-0 pis-5'>
                            <Typography variant='caption' className='uppercase' color='primary.main'>
                              N° ID solicitud - 28/08/2024 (Fecha de solicitud)
                            </Typography>
                            <Typography color='text.primary' className='font-medium'>
                              {item.receiver.name}
                            </Typography>
                            <Typography variant='body2' className='line-clamp-1'>
                              {item.receiver.address}
                            </Typography>
                          </TimelineContent>
                        </TimelineItem>
                      </Timeline>
                      {index !== data[value as keyof typeof data].length - 1 && (
                        <Divider className='mlb-4 border-dashed' />
                      )}
                    </Fragment>
                  )
                })}
              </CardContent>
            </TabPanel>
          </TabContext>
        </Card>
      </Grid>

      {/* Nueva caja al lado derecho */}
      <Grid item xs={12} md={4}>
        <Card>
          <CardHeader title='Líneas Operativas y Administrativas' />
          <CardContent>
            <Typography variant='body2'></Typography>
          </CardContent>
        </Card>
      </Grid>
    </Grid>
  )
}

export default LogisticsOrdersByCountries
