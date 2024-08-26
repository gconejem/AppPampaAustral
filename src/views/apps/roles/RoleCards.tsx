'use client'

// MUI Imports
import Card from '@mui/material/Card'
import CardContent from '@mui/material/CardContent'
import Grid from '@mui/material/Grid'
import Typography from '@mui/material/Typography'
import Avatar from '@mui/material/Avatar'
import AvatarGroup from '@mui/material/AvatarGroup'
import IconButton from '@mui/material/IconButton'
import Button from '@mui/material/Button'
import type { TypographyProps } from '@mui/material/Typography'
import type { CardProps } from '@mui/material/Card'

// Component Imports
import RoleDialog from '@components/dialogs/role-dialog'
import OpenDialogOnElementClick from '@components/dialogs/OpenDialogOnElementClick'
import Link from '@components/Link'

type CardDataType = {
  title: string
  avatars: string[]
  totalUsers: number
}

// Vars
const cardData: CardDataType[] = [
  { totalUsers: 4, title: 'Administrador', avatars: ['1.png', '2.png', '3.png', '4.png'] },
  { totalUsers: 7, title: 'Analista', avatars: ['5.png', '6.png', '7.png'] }
]

const RoleCards = () => {
  // Vars
  const typographyProps: TypographyProps = {
    children: 'Editar Rol',
    component: Link,
    color: 'primary',
    onClick: e => e.preventDefault()
  }

  const CardProps: CardProps = {}

  return (
    <>
      <Grid container spacing={6}>
        {cardData.map((item, index) => (
          <Grid item xs={12} sm={6} lg={4} key={index}>
            <Card>
              <CardContent className='flex flex-col gap-4'>
                <div className='flex items-center justify-between'>
                  <Typography className='flex-grow'>{`Total de usuarios ${item.totalUsers}`}</Typography>
                  <AvatarGroup total={item.totalUsers}>
                    {item.avatars.map((img, index: number) => (
                      <Avatar key={index} alt={item.title} src={`/images/avatars/${img}`} />
                    ))}
                  </AvatarGroup>
                </div>
                <div className='flex justify-between items-center'>
                  <div className='flex flex-col items-start gap-1'>
                    <Typography variant='h5'>{item.title}</Typography>
                    <OpenDialogOnElementClick
                      element={Typography}
                      elementProps={typographyProps}
                      dialog={RoleDialog}
                      dialogProps={{ title: item.title }}
                    />
                  </div>
                  <IconButton>
                    <i className='ri-file-copy-line text-secondary' />
                  </IconButton>
                </div>
              </CardContent>
            </Card>
          </Grid>
        ))}
        <Grid item xs={12} sm={6} lg={4}>
          <OpenDialogOnElementClick element={Card} elementProps={CardProps} dialog={RoleDialog} />
        </Grid>
      </Grid>
    </>
  )
}

export default RoleCards
