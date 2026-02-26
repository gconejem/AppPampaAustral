export type LabFormulario = {
  CLAVE: string
  FORMULARIO: string
  DOCVERSION?: string
  APROBADO?: string
  APROFECHA?: string
  OPCIONES: string
  ESTADO: string
  TIPO: string
  IDREPORT?: string
}

// Fuente única para los formularios mock (LBDOCVER) usados por AppLab.
// Se mantiene como data estática porque aún no existe tabla/seed equivalente.
export const LAB_FORMULARIOS: LabFormulario[] = [
  {
    CLAVE: 'R-12-03001',
    FORMULARIO: 'R-12-03',
    DOCVERSION: '1',
    APROBADO: 'Juan Salas',
    APROFECHA: '19-02-2021',
    OPCIONES: JSON.stringify({
      formulario: 'Densidades',
      codigo: 'DENSD',
      version: '1.0',
      opciones: [
        {
          nombre: 'Tipo Medición',
          tipo: 'select',
          opciones: [
            { posicion: 1, texto: '15 seg' },
            { posicion: 2, texto: '30 seg' },
            { posicion: 3, texto: '45 seg' },
            { posicion: 4, texto: '60 seg' },
            { posicion: 5, texto: '75 seg' },
            { posicion: 6, texto: '90 seg' },
            { posicion: 7, texto: '105 seg' },
            { posicion: 8, texto: '120 seg' }
          ]
        },
        {
          nombre: 'entre',
          tipo: 'select',
          opciones: [
            { posicion: 1, texto: 'Calle' },
            { posicion: 2, texto: 'Pasaje' },
            { posicion: 3, texto: 'Cámaras' },
            { posicion: 4, texto: 'Nudos' },
            { posicion: 5, texto: 'Ejes' },
            { posicion: 6, texto: 'Georeferencia' },
            { posicion: 7, texto: 'Km.' }
          ]
        },
        {
          nombre: 'faja',
          tipo: 'select',
          opciones: [
            { posicion: 1, texto: 'Derecho' },
            { posicion: 2, texto: 'Izquierdo' },
            { posicion: 3, texto: 'Norte' },
            { posicion: 4, texto: 'Sur' },
            { posicion: 5, texto: 'Oriente' },
            { posicion: 6, texto: 'Poniente' },
            { posicion: 7, texto: 'Nor-Oriente' },
            { posicion: 8, texto: 'Sur-Oriente' },
            { posicion: 9, texto: 'Nor-Poniente' },
            { posicion: 10, texto: 'Sur-Poniente' },
            { posicion: 11, texto: 'Faja Única' },
            { posicion: 12, texto: 'Centro' },
            { posicion: 13, texto: 'No Aplica' }
          ]
        },
        {
          nombre: 'profundidad',
          tipo: 'select',
          opciones: [
            { posicion: 1, texto: '5 cm' },
            { posicion: 2, texto: '10 cm' },
            { posicion: 3, texto: '15 cm' },
            { posicion: 4, texto: '20 cm' },
            { posicion: 5, texto: '25 cm' },
            { posicion: 6, texto: '30 cm' }
          ]
        },
        {
          nombre: 'Item',
          tipo: 'select',
          opciones: [
            { posicion: 1, texto: 'Bases Granular', erp: 'S401' },
            { posicion: 2, texto: 'Cama de Apoyo', erp: 'S402' },
            { posicion: 3, texto: 'Cama de Arena', erp: 'S403' },
            { posicion: 4, texto: 'Mejoramiento', erp: 'S404' },
            { posicion: 5, texto: 'Relleno', erp: 'S405' },
            { posicion: 6, texto: 'Sello', erp: 'S466' },
            { posicion: 7, texto: 'Sub base', erp: 'S410' },
            { posicion: 8, texto: 'Sub rasante', erp: 'S411' },
            { posicion: 9, texto: 'Terraplen', erp: 'S412' },
            { posicion: 10, texto: 'Carpeta granular', erp: 'S413' },
            { posicion: 11, texto: 'Carpeta de rodado', erp: 'S414' },
            { posicion: 12, texto: 'Plataforma', erp: 'S415' }
          ]
        },
        {
          nombre: 'DescripVisual',
          tipo: 'select',
          opciones: [
            { posicion: 1, texto: 'Seco' },
            { posicion: 2, texto: 'Húmedo' },
            { posicion: 3, texto: 'Suelto' },
            { posicion: 4, texto: 'Con nidos de piedra' },
            { posicion: 5, texto: 'Saturado' },
            { posicion: 6, texto: 'Terminación superficial gruesa' },
            { posicion: 7, texto: 'Terminación superficial fina' },
            { posicion: 8, texto: 'Sin Observaciones' }
          ]
        }
      ]
    }),
    ESTADO: 'A',
    TIPO: 'D',
    IDREPORT: 'Densidades'
  },
  {
    CLAVE: 'R-12-27001',
    FORMULARIO: 'R-12-27',
    DOCVERSION: '1',
    APROBADO: 'Juan Salas',
    APROFECHA: '19-02-2021',
    OPCIONES: JSON.stringify({
      formulario: 'OT Muestreo Suelo',
      codigo: 'R-12-27',
      version: '1.0',
      opciones: [
        {
          nombre: 'servicios',
          tipo: 'select',
          opciones: [
            { codigo_erp: 'S001', descripcion: 'Granulometría', norma: '(8.102.1, Junio 2022, MC-V8)', area: 'Suelo' },
            { codigo_erp: 'S002', descripcion: 'Proctor Modificado', norma: '(NCh 1534/2.Of79)', area: 'Suelo' },
            { codigo_erp: 'S003', descripcion: 'Limites Atterberg', norma: '(NCh1517/1.Of79 y NCh1517/2.Of79)', area: 'Suelo' },
            { codigo_erp: 'S004', descripcion: 'C.B.R.', norma: '(NCh 1852.Of81)', area: 'Suelo' },
            { codigo_erp: 'S005', descripcion: 'Densidad in situ', norma: '(8.102.3, Junio 2022, MC-V8)', area: 'Suelo' },
            { codigo_erp: 'S006', descripcion: 'Humedad Natural', norma: '(8.102.2, Junio 2022, MC-V8)', area: 'Suelo' },
            { codigo_erp: 'H001', descripcion: 'Bloques de Hormigón', norma: '(NCh 181.Of65)', area: 'Hormigón' },
            { codigo_erp: 'H002', descripcion: 'Ensayo Adocretos', norma: '(Cód. MINVU N° 332, 6.2.4)', area: 'Hormigón' },
            { codigo_erp: 'H003', descripcion: 'Resistencia a la Compresión', norma: '(NCh 1037.Of77)', area: 'Hormigón' },
            { codigo_erp: 'H004', descripcion: 'Extracción de Testigos', norma: '(NCh 1171.Of77)', area: 'Hormigón' },
            { codigo_erp: 'H005', descripcion: 'Densidad Real', norma: '(NCh 1239.Of77)', area: 'Hormigón' },
            { codigo_erp: 'H006', descripcion: 'Absorción de Agua', norma: '(NCh 1239.Of77)', area: 'Hormigón' },
            { codigo_erp: 'H007', descripcion: 'Resistencia a la Flexotracción', norma: '(NCh 1038.Of77)', area: 'Hormigón' },
            { codigo_erp: 'H008', descripcion: 'Módulo de Elasticidad', norma: '(NCh 1172.Of77)', area: 'Hormigón' },
            { codigo_erp: 'A001', descripcion: 'Desgaste Los Ángeles', norma: '(NCh 1369-2010)', area: 'Áridos' },
            { codigo_erp: 'A002', descripcion: 'Granulometría Áridos', norma: '(NCh 165.Of77)', area: 'Áridos' },
            { codigo_erp: 'A003', descripcion: 'Densidad Real y Neta', norma: '(NCh 1116.Of77)', area: 'Áridos' },
            { codigo_erp: 'A004', descripcion: 'Absorción de Agua Áridos', norma: '(NCh 1239.Of77)', area: 'Áridos' },
            { codigo_erp: 'A005', descripcion: 'Material Fino', norma: '(NCh 1223.Of77)', area: 'Áridos' }
          ]
        },
        {
          nombre: 'procedimiento_extraccion',
          tipo: 'select',
          opciones: [
            { posicion: 1, texto: 'Excavación Manual' },
            { posicion: 2, texto: 'Excavación Mecánica' },
            { posicion: 3, texto: 'Sondaje' },
            { posicion: 4, texto: 'Calicata' }
          ]
        }
      ]
    }),
    ESTADO: 'A',
    TIPO: 'D',
    IDREPORT: 'MuestreoSuelo'
  },
  {
    CLAVE: 'R-12-31004',
    FORMULARIO: 'R-12-31',
    DOCVERSION: '4',
    APROBADO: 'Juan Salas',
    APROFECHA: '19-02-2021',
    OPCIONES: JSON.stringify({
      formulario: 'Extracion Asfalto',
      opciones: [
        {
          nombre: 'metodo',
          tipo: 'select',
          opciones: [
            { posicion: 1, texto: 'Centrifugado' },
            { posicion: 2, texto: 'Ignición (MOP)' }
          ]
        }
      ]
    }),
    ESTADO: 'A',
    TIPO: 'D',
    IDREPORT: 'Asfalto'
  },
  {
    CLAVE: 'R-12-34001',
    FORMULARIO: 'R-12-34',
    DOCVERSION: '1',
    APROBADO: 'Juan Salas',
    APROFECHA: '19-02-2021',
    OPCIONES: JSON.stringify({
      formulario: 'Orden de Trabajo General',
      codigo: 'R-12-34',
      version: '1.0',
      opciones: [
        {
          nombre: 'ensayos',
          tipo: 'select',
          opciones: [
            { descripcion: 'Control Hi-Lo', norma: '(8.502.4, Dic.2003, MC-V8)', area: 'Hormigon' },
            { descripcion: 'D.Aparente del Hormigón Fresco', norma: '(NCh1564.Of2009)', area: 'Hormigon' },
            { descripcion: 'Determinacion de la Uniformidad', norma: '(NCh 1789.Of1986)', area: 'Hormigon' },
            { descripcion: 'Control Docilidad Cono de Abrams', norma: '(NCh 1019.Of 2009)', area: 'Hormigon' },
            { descripcion: 'Índice esclerométrico', norma: '(NCh1565.Of2009)', area: 'Hormigon' },
            { descripcion: 'Ensayo Traccion de Pernos', norma: '(ASTM D4435-84)', area: 'Hormigon' },
            { descripcion: 'Retrorreflectancia', norma: 'No Aplica', area: 'Hormigon' },
            { descripcion: 'Otro', norma: 'No Aplica', area: 'Hormigon' },
            { descripcion: 'Densidad Nuclear', norma: '(8.502.9, Diciembre 2003, MC - V8)', area: 'Asfalto' },
            { descripcion: 'Densidad cono de Arena', norma: '(NCh 1516.Of79)', area: 'Suelo' },
            { descripcion: 'Circulo de Arena', norma: '(8.502.14, Diciembre 2003, MC-V8)', area: 'Asfalto' },
            { descripcion: 'Control Riego Asfaltico', norma: '(5.401 - 5.402, Dic. 2003, MC-V5)', area: 'Asfalto' },
            { descripcion: 'Control Temperatura', norma: '(5.408, Dic. 2003, MC-V5)', area: 'Asfalto' },
            { descripcion: 'Control de aridos DTS', norma: '', area: 'Asfalto' },
            { descripcion: 'Control Hi-LO', norma: '(8.502.4, Dic.2003, MC-V8)', area: 'Asfalto' },
            { descripcion: 'Otro', norma: 'No Aplica', area: 'Asfalto' },
            { descripcion: 'Estudio Mecanica de Suelo', norma: '(NCh 1508.Of2014)', area: 'Suelo' },
            { descripcion: 'Estratigrafia', norma: '(2.503.202, MC-V2-2015; NCh 3364-2014)', area: 'Suelo' },
            { descripcion: 'Sondaje', norma: '(NCh 433:1996 Mod.2009 No Nch 3364:2014)', area: 'Suelo' },
            { descripcion: 'Ensayo Placa de Carga', norma: '(8.102.14, Dic. 2003, MC - V8)', area: 'Suelo' },
            { descripcion: 'Macrogranulometria', norma: '(2.503.304, Dic. 2003, MC-V2)', area: 'Suelo' },
            { descripcion: 'Macrodensidad Proc. basado en', norma: '(NCh 1519 of 79)', area: 'Suelo' },
            { descripcion: 'Penetometro Dinamico', norma: '(8.102.12, Dic. 2003, MC-V8)', area: 'Suelo' },
            { descripcion: 'Ensayo Porchet', norma: '(Tec. Anternativas MINVU)', area: 'Suelo' },
            { descripcion: 'Absorción', norma: '(Mét. Ing.Sanitaria)', area: 'Suelo' },
            { descripcion: 'Ensayo Remi', norma: '(Manual de aplicaciones téc. geofisicas)', area: 'Suelo' },
            { descripcion: 'Otro', norma: 'No Aplica', area: 'Suelo' },
            { descripcion: 'Riedel Weber', norma: '(8.302.30, Diciembre 2003, MC - V8)', area: 'Asfalto' },
            { descripcion: 'Adherencia Metodo Estatico', norma: '(8.302.29, Diciembre 2003, MC -V8)', area: 'Asfalto' },
            { descripcion: 'Adherencia Metodo Dinámico', norma: '(8.302.31, Diciembre 2003 MC-V8)', area: 'Asfalto' },
            { descripcion: 'Densidad de las mezclas sin compactar', norma: '(8.302.37, Diciembre 2003, MC-V8)', area: 'Asfalto' },
            { descripcion: 'Compactacion probetas Marshall', norma: '(8.302.40, Diciembre 2003, MC-V8)', area: 'Asfalto' },
            { descripcion: 'Estabilidad probetas Marshall', norma: '(8.302.40, Diciembre 2003, MC-V8)', area: 'Asfalto' },
            { descripcion: 'Fluencia probetas Marshall', norma: '(8.302.40, Diciembre 2003, MC-V8)', area: 'Asfalto' }
          ]
        }
      ]
    }),
    ESTADO: 'A',
    TIPO: 'D',
    IDREPORT: 'OTGeneral'
  },
  {
    CLAVE: 'R-12-39010',
    FORMULARIO: 'R-12-39',
    DOCVERSION: '10',
    APROBADO: 'Juan Salas',
    APROFECHA: '19-02-2021',
    OPCIONES: JSON.stringify({
      formulario: 'Hormigon Fresco Muestreo',
      codigo: 'HFRE-M',
      version: '1.0',
      opciones: [
        {
          nombre: 'Muestreado por',
          tipo: 'select',
          opciones: [
            { posicion: 1, texto: 'Laboratorio' },
            { posicion: 2, texto: 'Cliente' }
          ]
        },
        {
          nombre: 'Regla',
          tipo: 'select',
          opciones: [
            { posicion: 1, texto: 'L-0-01' },
            { posicion: 2, texto: 'L-0-07' },
            { posicion: 3, texto: 'L-0-08' },
            { posicion: 4, texto: 'L-0-09' },
            { posicion: 5, texto: 'L-0-10' },
            { posicion: 6, texto: 'L-0-11' },
            { posicion: 7, texto: 'L-0-12' },
            { posicion: 8, texto: 'L-0-13' },
            { posicion: 9, texto: 'L-0-14' },
            { posicion: 10, texto: 'L-0-15' },
            { posicion: 11, texto: 'L-0-17' },
            { posicion: 12, texto: 'L-0-22' },
            { posicion: 13, texto: 'L-0-23' },
            { posicion: 14, texto: 'L-0-27' },
            { posicion: 15, texto: 'L-0-30' },
            { posicion: 16, texto: 'L-0-31' }
          ]
        },
        {
          nombre: 'Termometro',
          tipo: 'select',
          opciones: [
            { posicion: 1, texto: 'T-0-05' },
            { posicion: 2, texto: 'T-0-06' },
            { posicion: 3, texto: 'T-0-32' },
            { posicion: 4, texto: 'T-0-33' },
            { posicion: 5, texto: 'T-0-34' },
            { posicion: 6, texto: 'T-0-35' },
            { posicion: 7, texto: 'T-0-36' },
            { posicion: 8, texto: 'T-0-38' },
            { posicion: 9, texto: 'T-0-39' },
            { posicion: 10, texto: 'T-0-40' },
            { posicion: 11, texto: 'T-0-41' },
            { posicion: 12, texto: 'T-0-42' },
            { posicion: 13, texto: 'T-0-43' },
            { posicion: 14, texto: 'T-0-46' },
            { posicion: 15, texto: 'T-0-47' }
          ]
        },
        {
          nombre: 'Cono de Abrams',
          tipo: 'select',
          opciones: [
            { posicion: 1, texto: 'L-0-45' },
            { posicion: 2, texto: 'L-0-49' },
            { posicion: 3, texto: 'L-0-50' },
            { posicion: 4, texto: 'L-0-51' },
            { posicion: 5, texto: 'L-0-52' },
            { posicion: 6, texto: 'L-0-53' },
            { posicion: 7, texto: 'L-0-54' },
            { posicion: 8, texto: 'L-0-55' },
            { posicion: 9, texto: 'L-0-56' },
            { posicion: 10, texto: 'L-0-57' },
            { posicion: 11, texto: 'L-0-58' },
            { posicion: 12, texto: 'L-0-59' },
            { posicion: 13, texto: 'L-0-60' },
            { posicion: 14, texto: 'L-0-61' }
          ]
        },
        {
          nombre: 'Vibradores',
          tipo: 'select',
          opciones: [
            { posicion: 1, texto: 'X-0-256' },
            { posicion: 2, texto: 'X-0-264' },
            { posicion: 3, texto: 'X-0-265' },
            { posicion: 4, texto: 'X-0-266' },
            { posicion: 5, texto: 'X-0-267' },
            { posicion: 6, texto: 'X-0-268' },
            { posicion: 7, texto: 'X-0-269' },
            { posicion: 8, texto: 'X-0-270' },
            { posicion: 9, texto: 'X-0-271' },
            { posicion: 10, texto: 'X-0-272' },
            { posicion: 11, texto: 'X-0-273' },
            { posicion: 12, texto: 'X-0-274' },
            { posicion: 13, texto: 'X-0-275' },
            { posicion: 14, texto: 'X-0-276' },
            { posicion: 15, texto: 'X-0-277' }
          ]
        },
        {
          nombre: 'Tipo de Probeta',
          tipo: 'select',
          opciones: [
            { posicion: 1, texto: 'Prismática (530x150)', erp: '3MATHORVIG' },
            { posicion: 2, texto: 'Cúbica (200x200)', erp: '3MATHORC20' },
            { posicion: 3, texto: 'Cúbica (150x150)', erp: '3MATHORC15' },
            { posicion: 4, texto: 'Cilíndricas (300x150)', erp: '3MATHORPCI' },
            { posicion: 5, texto: 'Rilem (160x40x40)', erp: '3MATHORRIL' }
          ]
        },
        {
          nombre: 'Clima',
          tipo: 'select',
          opciones: [
            { posicion: 1, texto: 'Soleado' },
            { posicion: 2, texto: 'Parcial' },
            { posicion: 3, texto: 'Nuboso' },
            { posicion: 4, texto: 'Neblina' },
            { posicion: 5, texto: 'Llovizna' },
            { posicion: 6, texto: 'LLuvia' },
            { posicion: 7, texto: 'Frío' }
          ]
        },
        {
          nombre: 'Ensayo Solicitado',
          tipo: 'select',
          opciones: [
            { posicion: 1, texto: 'Compresión', erp: 'PH001' },
            { posicion: 2, texto: 'Flexión', erp: 'PH002' },
            { posicion: 3, texto: 'Hendimiento', erp: 'PH003' },
            { posicion: 4, texto: 'Compresión y Flexión (Rilem)', erp: 'PH004' }
          ]
        },
        {
          nombre: 'Tipo de transporte',
          tipo: 'select',
          opciones: [
            { posicion: 1, texto: 'Camión Mixer' },
            { posicion: 2, texto: 'Betonera' },
            { posicion: 3, texto: 'H. Estacionaria' },
            { posicion: 4, texto: 'Acopio' },
            { posicion: 5, texto: 'Otro' }
          ]
        },
        {
          nombre: 'Tipo de Muestra',
          tipo: 'select',
          opciones: [
            { posicion: 1, texto: 'Simple' },
            { posicion: 2, texto: 'Compuesta' }
          ]
        },
        {
          nombre: 'Procedencia Muestreo',
          tipo: 'select',
          opciones: [
            { posicion: 1, texto: 'H. Estacionaria' },
            { posicion: 2, texto: 'Camión Mezclador' },
            { posicion: 3, texto: 'Acopio' },
            { posicion: 4, texto: 'Otro' }
          ]
        },
        {
          nombre: 'Compactación Probeta',
          tipo: 'select',
          opciones: [
            { posicion: 1, texto: 'Apisonado' },
            { posicion: 2, texto: 'Vibrado' }
          ]
        },
        {
          nombre: 'Tipo de Colocación',
          tipo: 'select',
          opciones: [
            { posicion: 1, texto: 'Bombeado' },
            { posicion: 2, texto: 'Directo' },
            { posicion: 3, texto: 'Indirecto' }
          ]
        },
        {
          nombre: 'Características de la mezcla',
          tipo: 'select',
          opciones: [
            { posicion: 1, texto: 'Seca' },
            { posicion: 2, texto: 'Plástica' },
            { posicion: 3, texto: 'Fluida' },
            { posicion: 4, texto: 'Otro' }
          ]
        },
        {
          nombre: 'Curado Inicial',
          tipo: 'checkbox',
          opciones: [
            { posicion: 1, texto: 'Polietileno' },
            { posicion: 2, texto: 'Caja térmica' },
            { posicion: 3, texto: 'Arpillera' },
            { posicion: 4, texto: 'Piscina' }
          ]
        }
      ]
    }),
    ESTADO: 'A',
    TIPO: 'D',
    IDREPORT: 'Hormigon'
  },
  {
    CLAVE: 'R-12-58004',
    FORMULARIO: 'R-12-58',
    DOCVERSION: '4',
    APROBADO: 'Juan Salas',
    APROFECHA: '19-02-2021',
    OPCIONES: JSON.stringify({
      formulario: 'Testigos',
      opciones: []
    }),
    ESTADO: 'A',
    TIPO: 'D',
    IDREPORT: 'Testigos'
  },
  {
    CLAVE: 'R-12-69001',
    FORMULARIO: 'R-12-69',
    DOCVERSION: '1',
    APROBADO: 'Juan Salas',
    APROFECHA: '19-02-2021',
    OPCIONES: JSON.stringify({
      formulario: 'Dosificacion',
      opciones: []
    }),
    ESTADO: 'A',
    TIPO: 'D',
    IDREPORT: 'Dosificacion'
  },
  {
    CLAVE: 'R-12-99004',
    FORMULARIO: 'R-12-99',
    DOCVERSION: '4',
    APROBADO: 'Juan Salas',
    APROFECHA: '19-02-2021',
    OPCIONES: JSON.stringify({
      formulario: 'Retiro Probeta',
      opciones: []
    }),
    ESTADO: 'A',
    TIPO: 'D',
    IDREPORT: 'RetiroProbeta'
  },
  {
    CLAVE: 'X-1001',
    FORMULARIO: 'X-1',
    DOCVERSION: '1',
    APROBADO: 'Juan Salas',
    APROFECHA: '19-02-2021',
    OPCIONES: JSON.stringify({
      formulario: 'Suspendido en Terreno',
      codigo: 'X-1',
      version: '1.0',
      opciones: []
    }),
    ESTADO: 'A',
    TIPO: 'D',
    IDREPORT: 'Suspendido'
  }
]
