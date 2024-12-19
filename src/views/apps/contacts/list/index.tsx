// MUI Imports
import Grid from '@mui/material/Grid'

// Type Imports
import type { UsersType } from '@/types/apps/userTypes'

// Component Imports
import ContactsListTable from './ContactListTable'

const UserList = ({ userData }: { userData?: UsersType[] }) => {
  return (
    <Grid container spacing={6}>
      <Grid item xs={12}>
        <ContactsListTable tableData={userData} />
      </Grid>
    </Grid>
  )
}

export default UserList
