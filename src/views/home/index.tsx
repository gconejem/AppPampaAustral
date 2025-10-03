'use client'

// MUI Imports
import Grid from '@mui/material/Grid'
import Card from '@mui/material/Card'
import CardContent from '@mui/material/CardContent'
import Typography from '@mui/material/Typography'

const Home = () => {
    return (
        <Grid container spacing={6}>
            <Grid item xs={12}>
                <Card>
                    <CardContent>
                        <Typography variant="h4" component="h1" gutterBottom>
                            Bienvenido al Sistema Pampa
                        </Typography>
                        <Typography variant="body1">
                            Sistema de gestión administrativa y de operaciones.
                        </Typography>
                    </CardContent>
                </Card>
            </Grid>
        </Grid>
    )
}

export default Home
