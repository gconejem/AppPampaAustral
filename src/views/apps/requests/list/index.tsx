'use client'

// MUI Imports
import Grid from '@mui/material/Grid'

// Component Imports
import RequestListTable from './RequestListTable'
import RequestListCards from './RequestListCards'
import RequestListCards2 from './RequestListCards2'

type SolicitudType = {
  id: number
  numeroSolicitud: string
  fecha: string
  cliente: string
  obra: string
  comuna: string
  estadoOperacional: string
  estadoAdministrativo: string
}

function RequestList({ requestData }: { requestData?: SolicitudType[] }) {
  return (
    <Grid container spacing={6}>
      <Grid item xs={12}>
        <RequestListCards2 />
        <RequestListCards />
      </Grid>
      <Grid item xs={12}>
        <RequestListTable tableData={requestData} />
      </Grid>
    </Grid>
  )
}

export default RequestList
