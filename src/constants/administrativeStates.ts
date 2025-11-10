export const ADMINISTRATIVE_STATES = [
  { value: 'SIN_INICIO', label: 'Sin Inicio', color: '#f3f3f3ff' },
  { value: 'MINUTAS_OK', label: 'Minutas OK', color: '#FFE082ff' },
  { value: 'FACTURADO', label: 'Facturado', color: '#b6d7a8ff' },
  { value: 'PAGADO', label: 'Pagado', color: '#2E7D32ff' }
] as const

export type AdministrativeState = typeof ADMINISTRATIVE_STATES[number]['value']
export default ADMINISTRATIVE_STATES
