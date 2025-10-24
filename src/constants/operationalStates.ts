export const OPERATIONAL_STATES = [
    { value: 'CODIFICADO', label: 'CODIFICADO' },
    { value: 'ENSAYADO', label: 'ENSAYADO' },
    { value: 'DIGITADO', label: 'DIGITADO' },
    { value: 'REVISADO', label: 'REVISADO' },
    { value: 'FIRMADO', label: 'FIRMADO' },
    { value: 'ENVIADO', label: 'ENVIADO' }
] as const

export type OperationalState = typeof OPERATIONAL_STATES[number]['value']
export default OPERATIONAL_STATES
