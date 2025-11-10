export const OPERATIONAL_STATES = [
    { value: 'CODIFICADO', label: 'Codificado', color: '#f3f3f3ff' },        // lima/verde
    { value: 'EN_PROCESO', label: 'En Proceso', color: '#c9daf8ff' },       // teal
    { value: 'ENSAYADO', label: 'Ensayado', color: '#1155ccff' },           // verde
    { value: 'ENVIADO_DIGITACION', label: 'Enviado a Digitación', color: '#fff2ccff' }, // ámbar/naranja
    { value: 'DIGITADO', label: 'Digitado', color: '#ffbe26ff' },           // morado
    { value: 'REVISADO', label: 'Revisado', color: '#424242' },           // índigo
    { value: 'FIRMADO', label: 'Firmado', color: '#b6d7a8ff' },             // azul
    { value: 'ENVIADO', label: 'Enviado', color: '#2E7D32' },              // cian
    { value: 'EVENTO', label: 'Evento', color: '#f44336ff' },                // cian
    { value: 'CERRADO_OP', label: 'Cerrado Op', color: '#990000ff' }               // cian
] as const

export type OperationalState = typeof OPERATIONAL_STATES[number]['value']
export default OPERATIONAL_STATES
