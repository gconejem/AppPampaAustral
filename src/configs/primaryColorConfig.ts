export type PrimaryColorConfig = {
  name?: string
  light?: string
  main: string
  dark?: string
}

// Primary color config object
export const primaryColorConfig: PrimaryColorConfig[] = [
  {
    name: 'primary-1',
    light: '#A379FF',
    main: '#8C57FF',
    dark: '#7E4EE6'
  },
  {
    name: 'primary-2',
    light: '#4EB0B1',
    main: '#0D9394',
    dark: '#096B6C'
  },
  {
    name: 'primary-3',
    light: '#F0718D',
    main: '#EB3D63',
    dark: '#AC2D48'
  },
  {
    name: 'primary-4',
    light: '#FFC25A',
    main: '#FFAB1D',
    dark: '#BA7D15'
  },
  {
    name: 'primary-5',
    light: '#5CAFF1',
    main: '#2092EC',
    dark: '#176BAC'
  }
]

// Renombramos esta configuración para evitar el conflicto
export const themeColors = {
  light: {
    primary: '#2196f3',
    background: '#ffffff',
    paper: '#ffffff'
  }
}

export default primaryColorConfig
