// MUI Imports
import Grid from '@mui/material/Grid'
import Typography from '@mui/material/Typography'

// Type Imports
import type { UsersType } from '@/types/apps/userTypes'

// Component Imports
import RoleCards from './RoleCards'
import RolesTable from './RolesTable'

const Roles = ({ userData }: { userData?: UsersType[] }) => {
  return (
    <Grid container spacing={6}>
      <Grid item xs={12}>
        <Typography variant='h4' className='mbe-1'>
          Lista de roles
        </Typography>
        <Typography></Typography>
      </Grid>
      <Grid item xs={12}>
        <RoleCards />
      </Grid>
      <Grid item xs={12} className='!pbs-12'>
        <Typography variant='h4' className='mbe-1'>
          Total usuarios y sus roles
        </Typography>
        <Typography></Typography>
      </Grid>
      <Grid item xs={12}>
        <RolesTable tableData={userData} />
      </Grid>
    </Grid>
  )
}

export default Roles
