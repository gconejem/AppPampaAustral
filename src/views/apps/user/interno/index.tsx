// MUI Imports
import Grid from '@mui/material/Grid'

// Type Imports
import type { UsersType } from '@/types/apps/userTypes'

// Component Imports
import UserListTable from './UserListTable'
import UserListCards from './UserListCards'
import Header from './header' // Importamos el Header

const UserList = ({ userData }: { userData?: UsersType[] }) => {
  return (
    <Grid container spacing={6}>
      {/* Agregamos el Header */}
      <Grid item xs={12}>
        <Header /> {/* Aquí agregamos el Header */}
      </Grid>

      {/* Contenido de UserListCards */}
      <Grid item xs={12}>
        <UserListCards />
      </Grid>

      {/* Puedes agregar el UserListTable si es necesario en otro Grid */}
      <Grid item xs={12}>
        {/* Ejemplo de tabla u otro contenido */}
      </Grid>
    </Grid>
  )
}

export default UserList
