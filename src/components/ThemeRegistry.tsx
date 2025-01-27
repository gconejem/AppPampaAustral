'use client'

import { ThemeProvider, createTheme } from '@mui/material/styles'

import { themeColors } from '@/configs/primaryColorConfig'

export default function ThemeRegistry({ children }: { children: React.ReactNode }) {
  const theme = createTheme({
    palette: {
      mode: 'light',
      background: {
        default: themeColors.light.background,
        paper: themeColors.light.paper
      }
    }
  })

  return <ThemeProvider theme={theme}>{children}</ThemeProvider>
}
