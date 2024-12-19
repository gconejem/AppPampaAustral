// MUI Imports
import Grid from '@mui/material/Grid'

// Type Imports
import type { Cliente } from '@/types/cliente'

// Component Imports
import ClientListTable from './ClientListTable'

const UserList = ({ userData }: { userData?: Cliente[] }) => {
  return (
    <Grid container spacing={6}>
      <Grid item xs={12}>
        <ClientListTable tableData={userData} />
      </Grid>
    </Grid>
  )
}

export default UserList
