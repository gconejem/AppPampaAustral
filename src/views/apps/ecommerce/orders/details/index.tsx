// MUI Imports
import Grid from '@mui/material/Grid'

// Type Imports
import type { OrderType } from '@/types/apps/ecommerceTypes'

// Component Imports
import OrderDetailHeader from './OrderDetailHeader'
import OrderDetailsCard from './OrderDetailsCard'
import ShippingActivity from './ShippingActivityCard'
import CustomerDetails from './CustomerDetailsCard'
import BillingAddress from './BillingAddressCard'
import MeetingSchedule from './Visitas'
import SolicitudesLista from './SolicitudesLista'

const OrderDetails = ({ orderData, order }: { orderData?: OrderType; order: string }) => {
  return (
    <Grid container spacing={6}>
      {/* OrderDetailHeader, que ocupa todo el ancho */}
      <Grid item xs={12}>
        <OrderDetailHeader orderData={orderData} order={order} />
      </Grid>

      {/* Sección principal (8 columnas) */}
      <Grid item xs={12} md={8}>
        <Grid container spacing={6}>
          <Grid item xs={12}>
            <OrderDetailsCard />
          </Grid>
          <Grid item xs={12}>
            <ShippingActivity order={order} />
          </Grid>
        </Grid>
      </Grid>

      {/* Sección lateral (4 columnas) */}
      <Grid item xs={12} md={4}>
        <Grid container spacing={6}>
          <Grid item xs={12}>
            <BillingAddress />
          </Grid>
          <Grid item xs={12}>
            <MeetingSchedule />
          </Grid>
          <Grid item xs={12}>
            <CustomerDetails orderData={orderData} />
          </Grid>
        </Grid>
      </Grid>

      {/* Sección de SolicitudesLista que ocupa todo el ancho */}
      <Grid item xs={12}>
        <SolicitudesLista /> {/* Este componente ahora ocupará todo el ancho */}
      </Grid>
    </Grid>
  )
}

export default OrderDetails
