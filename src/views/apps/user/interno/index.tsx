// MUI Imports
import Grid from '@mui/material/Grid'

// Type Imports
import type { UsersType } from '@/types/apps/userTypes'

// Component Imports
import UserListTable from './UserListTable'
import UserListCards from './UserListCards'
import Header from './header' // Importamos el Header
import StepperAlternativeLabel from './StepperAlternativeLabel' // Importamos el Stepper horizontal
import StepperVerticalWithNumbers from './StepperVerticalWithNumbers' // Importamos el Stepper vertical

const UserList = ({ userData }: { userData?: UsersType[] }) => {
  return (
    <Grid container spacing={6}>
      {/* Agregamos el Header */}
      <Grid item xs={12}>
        <Header /> {/* Aquí se muestra el Stepper horizontal en la página */}
      </Grid>

      {/* Integración del Stepper Horizontal */}
      <Grid item xs={12}>
        <StepperVerticalWithNumbers /> {/* Aquí se muestra el Stepper horizontal en la página */}
      </Grid>

      {/* Contenido de UserListCards */}
      <Grid item xs={12}>
        <UserListCards />
      </Grid>

      {/* Puedes agregar el UserListTable si es necesario en otro Grid */}
    </Grid>
  )
}

export default UserList
