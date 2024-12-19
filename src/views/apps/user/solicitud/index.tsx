// MUI Imports
import Grid from '@mui/material/Grid'

// Type Imports
import type { UsersType } from '@/types/apps/userTypes'

// Component Imports
import UserListTable from './UserListTable'
import UserListCards from './UserListCards'
import LogisticsOrdersByCountries from './OrderDetailsCard' // Importar el nuevo componente
import OrderDetailHeader from './OrderDetailHeader' // Importar el encabezado
import MeetingSchedule from './Visitas' // Importar el componente de Visitas
import BillingAddress from './BillingAddressCard' // Importar el componente de Cotización

const UserList = ({ userData }: { userData?: UsersType[] }) => {
  const orderData = {
    date: '2022-05-16',
    time: '02:11 AM'
  }

  return (
    <Grid container spacing={6}>
      {/* Encabezado de la solicitud que ocupa todo el ancho */}
      <Grid item xs={12}>
        <OrderDetailHeader orderData={orderData} order='5434' />
      </Grid>

      {/* Sección principal (8 columnas) */}
      <Grid item xs={12} md={8}>
        <Grid container spacing={6}>
          {/* Historial (LogisticsOrdersByCountries) */}
          <Grid item xs={12}>
            <LogisticsOrdersByCountries />
          </Grid>

          {/* Tarjeta de usuario */}
          <Grid item xs={12}>
            <UserListCards />
          </Grid>
        </Grid>
      </Grid>

      {/* Sección lateral (4 columnas) */}
      <Grid item xs={12} md={4}>
        <Grid container spacing={6}>
          {/* Cotización */}
          <Grid item xs={12}>
            <BillingAddress />
          </Grid>

          {/* Visitas */}
          <Grid item xs={12}>
            <MeetingSchedule />
          </Grid>
        </Grid>
      </Grid>

      {/* Sección de solicitudes que ocupa todo el ancho */}

      {/* Tabla de usuarios */}
      <Grid item xs={12}>
        <UserListTable tableData={userData} />
      </Grid>
    </Grid>
  )
}

export default UserList
