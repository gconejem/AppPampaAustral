// MUI Imports
import Grid from '@mui/material/Grid'

// Type Imports
import type { UsersType } from '@/types/apps/userTypes'

// Component Imports
import UserListTable from './UserListTable'
import UserListCards from './UserListCards'
import UserListTable2 from './UserListTable2'
import UserListTable3 from './UserListTable3'
import Header from './header' // Importamos el componente Header

const UserList = ({ userData }: { userData?: UsersType[] }) => {
  return (
    <Grid container spacing={6}>
      {/* Agregamos el Header */}
      <Grid item xs={12}>
        <Header />
      </Grid>

      {/* Componente de la tabla */}
      <Grid item xs={12}>
        <UserListTable3 tableData={userData} />
      </Grid>
    </Grid>
  )
}

export default UserList
