// MUI Imports
import Grid from '@mui/material/Grid'

// Component Imports
import UserListTable from './UserListTable'
import Header from './Header' // Asegúrate de que Header esté en el mismo directorio o ajusta el import

// Type Imports
import type { UsersType } from '@/types/apps/userTypes'

const UserList = ({ userData }: { userData?: UsersType[] }) => {
  return (
    <Grid container spacing={6}>
      {/* Header */}
      <Grid item xs={12}>
        <Header />
      </Grid>

      {/* User List Table */}
      <Grid item xs={12}>
        <UserListTable tableData={userData} />
      </Grid>
    </Grid>
  )
}

export default UserList
