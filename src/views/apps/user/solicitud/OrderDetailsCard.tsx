'use client'

// React Imports
import { Fragment, useState } from 'react'
import type { SyntheticEvent } from 'react'

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
import type { TimelineProps } from '@mui/lab/Timeline'

// Components Imports
import OptionMenu from '@core/components/option-menu'

type TimelineItemData = {
  name: string
  address: string
}

type TimelineData = Record<'sender' | 'receiver', TimelineItemData>

type Data = Record<'new' | 'preparing' | 'shipping', TimelineData[]>

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
const data: Data = {
  new: [
    {
      sender: {
        name: 'Ejemplo',
        address: 'Ejemplo'
      },
      receiver: {
        name: 'Ejemplo',
        address: 'Ejemplo'
      }
    },
    {
      sender: {
        name: 'Ejemplo',
        address: 'Ejemplo'
      },
      receiver: {
        name: 'Ejemplo',
        address: 'Ejemplo'
      }
    }
  ],

  preparing: [
    {
      sender: {
        name: 'Ejemplo',
        address: 'Ejemplo'
      },
      receiver: {
        name: 'Ejemplo',
        address: 'Ejemplo'
      }
    },
    {
      sender: {
        name: 'Ejemplo',
        address: 'Ejemplo'
      },
      receiver: {
        name: 'Ejemplo',
        address: 'Ejemplo'
      }
    }
  ],
  shipping: [
    {
      sender: {
        name: 'Ejemplo',
        address: 'Ejemplo'
      },
      receiver: {
        name: 'Ejemplo',
        address: 'Ejemplo'
      }
    },
    {
      sender: {
        name: 'Ejemplo',
        address: 'Ejemplo'
      },
      receiver: {
        name: 'Ejemplo',
        address: 'Ejemplo'
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
    <Card sx={{ minHeight: '555px' }}>
      {' '}
      {/* Ajusta el valor según sea necesario */}
      <CardHeader
        title='Historial'
        subheader=''
        action={<OptionMenu iconClassName='text-textPrimary' options={['Agendar']} />}
        className='pbe-4'
      />
      <TabContext value={value}>
        <TabList variant='fullWidth' onChange={handleChange} aria-label='full width tabs example'>
          <Tab value='new' label='OTS' />
          <Tab value='preparing' label='Muestras' />
          <Tab value='shipping' label='Ensayos' />
        </TabList>
        <TabPanel value={value} className='pbs-0'>
          <CardContent>
            {data[value as keyof Data].map((item: TimelineData, index: number) => {
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
                        <Typography variant='caption' className='uppercase' color='success.main'>
                          Ejemplo
                        </Typography>
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
                          Ejemplo
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
                  {index !== data[value as keyof Data].length - 1 && <Divider className='mlb-4 border-dashed' />}
                </Fragment>
              )
            })}
          </CardContent>
        </TabPanel>
      </TabContext>
    </Card>
  )
}

export default LogisticsOrdersByCountries
