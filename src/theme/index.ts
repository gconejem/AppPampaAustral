// MUI Imports
import type { Theme } from '@mui/material/styles'
import { createTheme } from '@mui/material/styles'

// Create theme
const theme = (mode: 'light' | 'dark'): Theme => {
  return createTheme({
    palette: {
      mode,
      primary: {
        light: '#42a5f5', // Azul más claro
        main: '#1976d2', // Azul principal
        dark: '#1565c0', // Azul más oscuro
        contrastText: '#FFF'
      },
      secondary: {
        light: '#7986cb',
        main: '#3f51b5',
        dark: '#303f9f',
        contrastText: '#FFF'
      }

      // ... otros colores si los necesitas
    }

    // ... otras configuraciones del tema
  })
}

// Crear tema claro
export const lightTheme = theme('light')

export default theme
