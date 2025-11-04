export const OPERATIONAL_STATES = [
    { value: 'CODIFICADO', label: 'Codificado', color: '#C0CA33' },        // lima/verde
    { value: 'EN_PROCESO', label: 'En Proceso', color: '#009688' },       // teal
    { value: 'ENSAYADO', label: 'Ensayado', color: '#43A047' },           // verde
    { value: 'ENVIADO_DIGITACION', label: 'Enviado a Digitación', color: '#FB8C00' }, // ámbar/naranja
    { value: 'DIGITADO', label: 'Digitado', color: '#8E24AA' },           // morado
    { value: 'REVISADO', label: 'Revisado', color: '#5C6BC0' },           // índigo
    { value: 'FIRMADO', label: 'Firmado', color: '#1976D2' },             // azul
    { value: 'ENVIADO', label: 'Enviado', color: '#00ACC1' },              // cian
    { value: 'EVENTO', label: 'Evento', color: '#00ACC1' },                // cian
    { value: 'CERRADO_OP', label: 'Cerrado Op', color: '#00ACC1' }               // cian
] as const

export type OperationalState = typeof OPERATIONAL_STATES[number]['value']
export default OPERATIONAL_STATES
