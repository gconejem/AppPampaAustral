export const ADMINISTRATIVE_STATES = [
  { value: 'SIN_INICIO', label: 'SIN INICIO' },
  { value: 'MINUTAS_OK', label: 'MINUTAS OK' },
  { value: 'FACTURADO', label: 'FACTURADO' },
  { value: 'PAGADO', label: 'PAGADO' }
] as const

export type AdministrativeState = typeof ADMINISTRATIVE_STATES[number]['value']
export default ADMINISTRATIVE_STATES
