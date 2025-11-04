export const ADMINISTRATIVE_STATES = [
  { value: 'SIN_INICIO', label: 'Sin Inicio' },
  { value: 'MINUTAS_OK', label: 'Minutas OK' },
  { value: 'FACTURADO', label: 'Facturado' },
  { value: 'PAGADO', label: 'Pagado' }
] as const

export type AdministrativeState = typeof ADMINISTRATIVE_STATES[number]['value']
export default ADMINISTRATIVE_STATES
