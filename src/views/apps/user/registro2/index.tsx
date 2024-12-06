// MUI Imports
import Grid from '@mui/material/Grid'

// Component Imports
import UserListTable from './UserListTable'
import Header from './header'
import Acordeon from './acordeon' // Importa el acordeón

// Type Imports
import type { UsersType } from '@/types/apps/userTypes'

const UserList = ({ userData }: { userData?: UsersType[] }) => {
  return (
    <Grid container spacing={6}>
      {/* Header */}
      <Grid item xs={12}>
        <Header />
      </Grid>

      {/* Primera Tabla: Ocupa todo el ancho */}
      <Grid item xs={12}>
        <UserListTable tableData={userData} />
      </Grid>

      {/* Acordeón */}
      <Grid item xs={12}>
        <Acordeon />
      </Grid>
    </Grid>
  )
}

export default UserList
