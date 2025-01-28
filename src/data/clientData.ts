export const PAISES = [
  { value: 'Chile', label: 'Chile' },
  { value: 'AR', label: 'Argentina' },
  { value: 'PE', label: 'Perú' },
  { value: 'BO', label: 'Bolivia' }
]

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
  },
  "O'Higgins": {
    comunas: ['Rancagua', 'Codegua', 'Coinco', 'Coltauco', 'Doñihue', 'Graneros', 'Las Cabras']
  },
  Maule: {
    comunas: ['Talca', 'Constitución', 'Curepto', 'Empedrado', 'Maule', 'Pelarco', 'Pencahue']
  },
  Ñuble: {
    comunas: ['Chillán', 'Bulnes', 'Cobquecura', 'Coelemu', 'Coihueco', 'Chillán Viejo', 'El Carmen']
  },
  Biobío: {
    comunas: ['Concepción', 'Coronel', 'Chiguayante', 'Florida', 'Hualqui', 'Lota', 'Penco']
  },
  'La Araucanía': {
    comunas: ['Temuco', 'Carahue', 'Cunco', 'Curarrehue', 'Freire', 'Galvarino', 'Gorbea']
  },
  'Los Ríos': {
    comunas: ['Valdivia', 'Corral', 'Lanco', 'Los Lagos', 'Máfil', 'Mariquina', 'Paillaco']
  },
  'Los Lagos': {
    comunas: ['Puerto Montt', 'Calbuco', 'Cochamó', 'Fresia', 'Frutillar', 'Los Muermos', 'Llanquihue']
  },
  Aysén: {
    comunas: ['Coihaique', 'Lago Verde', 'Aisén', 'Cisnes', 'Guaitecas', 'Cochrane', "O'Higgins"]
  },
  Magallanes: {
    comunas: ['Punta Arenas', 'Laguna Blanca', 'Río Verde', 'San Gregorio', 'Cabo de Hornos', 'Antártica']
  }
}

export const SEGMENTOS = [
  { value: 'Corporativo', label: 'Corporativo' },
  { value: 'Pyme', label: 'Pyme' },
  { value: 'Retail', label: 'Retail' },
  { value: 'Gobierno', label: 'Gobierno' },
  { value: 'Institucional', label: 'Institucional' },
  { value: 'Industrial', label: 'Industrial' }
]

export const INDUSTRIAS = [
  { value: 'Tecnología', label: 'Tecnología' },
  { value: 'Manufactura', label: 'Manufactura' },
  { value: 'Servicios', label: 'Servicios' },
  { value: 'Comercio', label: 'Comercio' },
  { value: 'Construcción', label: 'Construcción' },
  { value: 'Educación', label: 'Educación' },
  { value: 'Salud', label: 'Salud' },
  { value: 'Transporte', label: 'Transporte' },
  { value: 'Agricultura', label: 'Agricultura' },
  { value: 'Minería', label: 'Minería' },
  { value: 'Energía', label: 'Energía' },
  { value: 'Telecomunicaciones', label: 'Telecomunicaciones' },
  { value: 'Banca y Finanzas', label: 'Banca y Finanzas' },
  { value: 'Turismo y Hotelería', label: 'Turismo y Hotelería' },
  { value: 'Alimentación', label: 'Alimentación' },
  { value: 'Logística', label: 'Logística' }
]

export const ESTADOS_CLIENTE = [
  { value: 'active', label: 'Activo' },
  { value: 'inactive', label: 'Inactivo' },
  { value: 'pending', label: 'Pendiente' },
  { value: 'blocked', label: 'Bloqueado' }
]

export const VENDEDORES = [
  { value: 'Carlos Vega', label: 'Carlos Vega' },
  { value: 'Vendedor 1', label: 'Vendedor 1' },
  { value: 'Vendedor 2', label: 'Vendedor 2' }
]
