import { Box, Typography, Card, CardContent, Container } from '@mui/material'

const Home = () => {
    return (
        <Container>
            <Box sx={{ mt: 6, mb: 6 }}>
                <Typography variant="h4" gutterBottom>
                    Bienvenido a Pampa Austral
                </Typography>
                <Card>
                    <CardContent>
                        <Typography variant="body1">
                            Sistema de gestión para Pampa Austral
                        </Typography>
                    </CardContent>
                </Card>
            </Box>
        </Container>
    )
}

export default Home 
