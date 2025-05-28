export const ESTADOS_OBRA = [
  { value: 'activa', label: 'Activa' },
  { value: 'terminada', label: 'Terminada' },
  { value: 'bloqueada', label: 'Bloqueada' },
  { value: 'inactiva', label: 'Inactiva' }
]

export const LISTAS_PRECIOS = [
  { value: 'lista1', label: 'Lista 1' },
  { value: 'lista2', label: 'Lista 2' },
  { value: 'lista3', label: 'Lista 3' }
]

export const CARGOS_OBRA = [
  { value: 'encargado_obra', label: 'Encargado de Obra' },
  { value: 'dueno', label: 'Dueño' },
  { value: 'representante', label: 'Representante' },
  { value: 'jefe_obra_planta', label: 'Jefe de Obra / Planta' },
  { value: 'supervisor', label: 'Supervisor' },
  { value: 'administrador_obra', label: 'Administrador de Obra' },
  { value: 'encargado_calidad', label: 'Encargado de Calidad' },
  { value: 'autocontrol', label: 'Autocontrol' },
  { value: 'profesional', label: 'Profesional' },
  { value: 'laboratorista', label: 'Laboratorista' },
  { value: 'ejecutivo_comercial', label: 'Ejecutivo Comercial y Administración' },
  { value: 'otro', label: 'Otro (Especificar)' }
]

// Usar la misma estructura de regiones que en clientes
export const REGIONES_CHILE = {
  'Arica y Parinacota': {
    comunas: ['Arica', 'Camarones', 'Putre', 'General Lagos']
  },
  Tarapacá: {
    comunas: ['Iquique', 'Alto Hospicio', 'Pozo Almonte', 'Camiña', 'Colchane', 'Huara', 'Pica']
  },
  Antofagasta: {
    comunas: ['Antofagasta', 'Mejillones', 'Sierra Gorda', 'Taltal', 'Calama', 'Ollagüe', 'San Pedro de Atacama']
  },
  Atacama: {
    comunas: [
      'Copiapó',
      'Caldera',
      'Tierra Amarilla',
      'Chañaral',
      'Diego de Almagro',
      'Vallenar',
      'Alto del Carmen',
      'Freirina',
      'Huasco'
    ]
  },
  Coquimbo: {
    comunas: [
      'La Serena',
      'Coquimbo',
      'Andacollo',
      'La Higuera',
      'Paiguano',
      'Vicuña',
      'Illapel',
      'Canela',
      'Los Vilos',
      'Salamanca',
      'Ovalle',
      'Combarbalá',
      'Monte Patria',
      'Punitaqui',
      'Río Hurtado'
    ]
  },
  Valparaíso: {
    comunas: ['Valparaíso', 'Casablanca', 'Concón', 'Juan Fernández', 'Puchuncaví', 'Quintero', 'Viña del Mar']
  },
  Metropolitana: {
    comunas: [
      'Santiago',
      'Cerrillos',
      'Cerro Navia',
      'Conchalí',
      'El Bosque',
      'Estación Central',
      'Huechuraba',
      'Independencia',
      'La Cisterna',
      'La Florida',
      'La Granja',
      'La Pintana',
      'La Reina',
      'Las Condes',
      'Lo Barnechea',
      'Lo Espejo',
      'Lo Prado',
      'Macul',
      'Maipú',
      'Ñuñoa',
      'Pedro Aguirre Cerda',
      'Peñalolén',
      'Providencia',
      'Pudahuel',
      'Quilicura',
      'Quinta Normal',
      'Recoleta',
      'Renca',
      'San Joaquín',
      'San Miguel',
      'San Ramón',
      'Vitacura'
    ]
  }
}
