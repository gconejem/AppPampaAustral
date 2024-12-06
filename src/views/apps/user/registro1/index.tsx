// MUI Imports
import Grid from '@mui/material/Grid'

// Component Imports
import UserListTable from './UserListTable'
import Header from './Header'
import UserListTable2 from './UserListTable2'
import UserListTable3 from './UserListTable3'

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
    </Grid>
  )
}

export default UserList
