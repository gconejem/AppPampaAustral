export const ENSAYO_STATES = [
    { value: 'CODIFICADO', label: 'Codificado', color: '#f3f3f3ff' },
    { value: 'EN_PROCESO', label: 'En Proceso', color: '#c9daf8ff' },
    { value: 'ENSAYADO', label: 'Ensayado', color: '#1155ccff' }
] as const

export type EnsayoState = typeof ENSAYO_STATES[number]['value']

export default ENSAYO_STATES
