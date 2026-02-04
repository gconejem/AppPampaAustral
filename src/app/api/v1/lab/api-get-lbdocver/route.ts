import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export const dynamic = 'force-dynamic'
export const revalidate = 0

const ALLOWED_ORIGINS = new Set([
  'http://localhost:8080',
  'http://localhost:3000',
  'http://localhost:5173',
  'https://localhost'
])

function corsHeaders(origin?: string | null) {
  const allowedOrigin = origin && ALLOWED_ORIGINS.has(origin) ? origin : null
  return {
    ...(allowedOrigin ? { 'Access-Control-Allow-Origin': allowedOrigin } : {}),
    'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    'Access-Control-Allow-Credentials': 'true'
  }
}

export async function OPTIONS(request: Request) {
  return NextResponse.json({}, { headers: corsHeaders(request.headers.get('origin')) })
}

export async function GET(request: Request) {
  try {
    const origin = request.headers.get('origin')
    const { searchParams } = new URL(request.url)
    
    // Formularios basados en tabla LBDOCVER
    // TODO: Migrar estos datos a la base de datos
    const formularios = [
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
              nombre: 'Entre',
              tipo: 'select',
              opciones: [
                { posicion: 1, texto: 'Entre Ejes' },
                { posicion: 2, texto: 'Vereda Norte' },
                { posicion: 3, texto: 'Vereda Sur' },
                { posicion: 4, texto: 'Vereda Oriente' },
                { posicion: 5, texto: 'Vereda Poniente' },
                { posicion: 6, texto: 'Bandejón Central' },
                { posicion: 7, texto: 'Otro' }
              ]
            },
            {
              nombre: 'Faja o Lado',
              tipo: 'select',
              opciones: [
                { posicion: 1, texto: 'Faja 1' },
                { posicion: 2, texto: 'Faja 2' },
                { posicion: 3, texto: 'Faja 3' },
                { posicion: 4, texto: 'Faja 4' },
                { posicion: 5, texto: 'Lado Derecho' },
                { posicion: 6, texto: 'Lado Izquierdo' },
                { posicion: 7, texto: 'Centro' },
                { posicion: 8, texto: 'Eje' }
              ]
            },
            {
              nombre: 'Profundidad Ensayo',
              tipo: 'select',
              opciones: [
                { posicion: 1, texto: '0-20 cm' },
                { posicion: 2, texto: '20-40 cm' },
                { posicion: 3, texto: '40-60 cm' },
                { posicion: 4, texto: '5 cm' },
                { posicion: 5, texto: '10 cm' },
                { posicion: 6, texto: '15 cm' },
                { posicion: 7, texto: '20 cm' },
                { posicion: 8, texto: '25 cm' },
                { posicion: 9, texto: '30 cm' },
                { posicion: 10, texto: 'Variable' }
              ]
            },
            {
              nombre: 'Item',
              tipo: 'select',
              opciones: [
                { erp: '201-01', texto: 'Limpieza y Desbroce del terreno' },
                { erp: '202-01', texto: 'Demoliciones' },
                { erp: '203-01', texto: 'Excavaciones no clasificadas' },
                { erp: '203-02', texto: 'Excavación clasificada en roca' },
                { erp: '204-01', texto: 'Terraplenes' },
                { erp: '205-01', texto: 'Bases' },
                { erp: '206-01', texto: 'Sub-bases' },
                { erp: '207-01', texto: 'Capas anticontaminantes' },
                { erp: '301-01', texto: 'Pavimentos de hormigón' },
                { erp: '302-01', texto: 'Tratamientos superficiales' },
                { erp: '303-01', texto: 'Mezclas asfálticas en caliente' },
                { erp: '304-01', texto: 'Mezclas asfálticas en frío' },
                { erp: 'OTRO', texto: 'Otro' }
              ]
            },
            {
              nombre: 'Descripción visual del suelo',
              tipo: 'select',
              opciones: [
                { posicion: 1, texto: 'Arena' },
                { posicion: 2, texto: 'Arena Arcillosa' },
                { posicion: 3, texto: 'Arena Limosa' },
                { posicion: 4, texto: 'Grava' },
                { posicion: 5, texto: 'Grava Arenosa' },
                { posicion: 6, texto: 'Grava Arcillosa' },
                { posicion: 7, texto: 'Limo' },
                { posicion: 8, texto: 'Arcilla' },
                { posicion: 9, texto: 'Hormigón' },
                { posicion: 10, texto: 'Base Granular' },
                { posicion: 11, texto: 'Sub-base Granular' },
                { posicion: 12, texto: 'Mezcla Asfáltica' },
                { posicion: 13, texto: 'Tratamiento Superficial' }
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
          formulario: 'Extraccion Asfalto',
          opciones: [
            {
              nombre: 'metodo',
              tipo: 'select',
              opciones: [
                { posicion: 1, texto: 'Centrifugado' },
                { posicion: 2, texto: 'Ignición (MOP)' },
                { posicion: 3, texto: 'Extracción con Solvente' }
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
                { codigo_erp: 'A004', descripcion: 'Absorción de Agua', norma: '(NCh 1239.Of77)', area: 'Áridos' },
                { codigo_erp: 'A005', descripcion: 'Material Fino', norma: '(NCh 1223.Of77)', area: 'Áridos' },
                { codigo_erp: 'S001', descripcion: 'Granulometría', norma: '(8.102.1, Junio 2022, MC-V8)', area: 'Suelo' },
                { codigo_erp: 'S002', descripcion: 'Proctor Modificado', norma: '(NCh 1534/2.Of79)', area: 'Suelo' },
                { codigo_erp: 'S003', descripcion: 'Limites Atterberg', norma: '(NCh1517/1.Of79 y NCh1517/2.Of79)', area: 'Suelo' },
                { codigo_erp: 'S004', descripcion: 'C.B.R.', norma: '(NCh 1852.Of81)', area: 'Suelo' },
                { codigo_erp: 'S005', descripcion: 'Densidad in situ', norma: '(8.102.3, Junio 2022, MC-V8)', area: 'Suelo' },
                { codigo_erp: 'S006', descripcion: 'Humedad Natural', norma: '(8.102.2, Junio 2022, MC-V8)', area: 'Suelo' }
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
                { posicion: 1, texto: 'SI' },
                { posicion: 2, texto: 'NO' }
              ]
            },
            {
              nombre: 'Termómetro',
              tipo: 'select',
              opciones: [
                { posicion: 1, texto: 'SI' },
                { posicion: 2, texto: 'NO' }
              ]
            },
            {
              nombre: 'Cono Abrams',
              tipo: 'select',
              opciones: [
                { posicion: 1, texto: 'SI' },
                { posicion: 2, texto: 'NO' }
              ]
            },
            {
              nombre: 'Vibradores',
              tipo: 'select',
              opciones: [
                { posicion: 1, texto: 'SI' },
                { posicion: 2, texto: 'NO' }
              ]
            },
            {
              nombre: 'Tipo de Probeta',
              tipo: 'select',
              opciones: [
                { erp: 'CILINDRO-15', texto: 'Cilindro 15 x 30 cm (NCh 1017)' },
                { erp: 'CILINDRO-10', texto: 'Cilindro 10 x 20 cm (NCh 1017)' },
                { erp: 'CUBO-20', texto: 'Cubo 20 x 20 cm (NCh 1037)' },
                { erp: 'VIGA-15', texto: 'Viga 15 x 15 x 50 cm (NCh 1038)' },
                { erp: 'RILEM', texto: 'Rilem (NCh 2261)' }
              ]
            },
            {
              nombre: 'Clima',
              tipo: 'select',
              opciones: [
                { posicion: 1, texto: 'Soleado' },
                { posicion: 2, texto: 'Nublado' },
                { posicion: 3, texto: 'Lluvia' },
                { posicion: 4, texto: 'Viento' }
              ]
            },
            {
              nombre: 'Ensayo Solicitado',
              tipo: 'select',
              opciones: [
                { erp: '7-DIAS', texto: 'Resistencia a 7 días' },
                { erp: '28-DIAS', texto: 'Resistencia a 28 días' },
                { erp: '7-28-DIAS', texto: 'Resistencia a 7 y 28 días' },
                { erp: 'OTRO', texto: 'Otro' }
              ]
            },
            {
              nombre: 'Tipo Transporte',
              tipo: 'select',
              opciones: [
                { posicion: 1, texto: 'Mixer' },
                { posicion: 2, texto: 'Tolva' },
                { posicion: 3, texto: 'Otro' }
              ]
            },
            {
              nombre: 'Tipo de Muestra',
              tipo: 'select',
              opciones: [
                { posicion: 1, texto: 'Mezcladora' },
                { posicion: 2, texto: 'Transporte' },
                { posicion: 3, texto: 'Punto de Colocación' }
              ]
            },
            {
              nombre: 'Procedimiento Muestreo',
              tipo: 'select',
              opciones: [
                { posicion: 1, texto: 'NCh 171' },
                { posicion: 2, texto: 'Otro' }
              ]
            },
            {
              nombre: 'Compactación Probeta',
              tipo: 'select',
              opciones: [
                { posicion: 1, texto: 'Vibrado' },
                { posicion: 2, texto: 'Varillado' }
              ]
            },
            {
              nombre: 'Tipo de Colocación',
              tipo: 'select',
              opciones: [
                { posicion: 1, texto: 'Losa' },
                { posicion: 2, texto: 'Muro' },
                { posicion: 3, texto: 'Pilote' },
                { posicion: 4, texto: 'Viga' },
                { posicion: 5, texto: 'Columna' },
                { posicion: 6, texto: 'Fundación' },
                { posicion: 7, texto: 'Otro' }
              ]
            },
            {
              nombre: 'Características de la Mezcla',
              tipo: 'select',
              opciones: [
                { posicion: 1, texto: 'Normal' },
                { posicion: 2, texto: 'Fluida' },
                { posicion: 3, texto: 'Autocompactante' },
                { posicion: 4, texto: 'Otro' }
              ]
            },
            {
              nombre: 'Curado Inicial',
              tipo: 'select',
              opciones: [
                { posicion: 1, texto: 'Agua' },
                { posicion: 2, texto: 'Membrana' },
                { posicion: 3, texto: 'Paño húmedo' },
                { posicion: 4, texto: 'Sin curado' },
                { posicion: 5, texto: 'Otro' }
              ]
            }
          ]
        }),
        ESTADO: 'A',
        TIPO: 'D',
        IDREPORT: 'MuestreoHormigon'
      },
      {
        CLAVE: 'R-12-58004',
        FORMULARIO: 'R-12-58',
        DOCVERSION: '4',
        APROBADO: 'Juan Salas',
        APROFECHA: '19-02-2021',
        OPCIONES: JSON.stringify({
          formulario: 'Testigos',
          codigo: 'TESTIGO',
          version: '1.0',
          opciones: [
            {
              nombre: 'Testigo Normal',
              tipo: 'select',
              opciones: [
                { posicion: 1, texto: 'Calzada' },
                { posicion: 2, texto: 'Acera' }
              ]
            },
            {
              nombre: 'Tipo Extracción',
              tipo: 'select',
              opciones: [
                { posicion: 1, texto: 'Seco' },
                { posicion: 2, texto: 'Húmedo' }
              ]
            },
            {
              nombre: 'Tipo de Hormigón',
              tipo: 'select',
              opciones: [
                { posicion: 1, texto: 'H-5' },
                { posicion: 2, texto: 'H-10' },
                { posicion: 3, texto: 'H-15' },
                { posicion: 4, texto: 'H-20' },
                { posicion: 5, texto: 'H-25' },
                { posicion: 6, texto: 'H-30' },
                { posicion: 7, texto: 'H-35' },
                { posicion: 8, texto: 'H-40' },
                { posicion: 9, texto: 'Desconocido' }
              ]
            },
            {
              nombre: 'Destino del Testigo',
              tipo: 'select',
              opciones: [
                { posicion: 1, texto: 'Resistencia a la Compresión' },
                { posicion: 2, texto: 'Resistencia a la Tracción' },
                { posicion: 3, texto: 'Módulo de Elasticidad' },
                { posicion: 4, texto: 'Densidad y Absorción' },
                { posicion: 5, texto: 'Inspección Visual' },
                { posicion: 6, texto: 'Otro' }
              ]
            },
            {
              nombre: 'Diámetro Testigo',
              tipo: 'select',
              opciones: [
                { posicion: 1, texto: '75 mm' },
                { posicion: 2, texto: '100 mm' },
                { posicion: 3, texto: '150 mm' },
                { posicion: 4, texto: '200 mm' }
              ]
            },
            {
              nombre: 'Estado del Testigo',
              tipo: 'select',
              opciones: [
                { posicion: 1, texto: 'Bueno' },
                { posicion: 2, texto: 'Fisurado' },
                { posicion: 3, texto: 'Dañado' },
                { posicion: 4, texto: 'Con segregación' }
              ]
            }
          ]
        }),
        ESTADO: 'A',
        TIPO: 'D',
        IDREPORT: 'OtTestigos'
      },
      {
        CLAVE: 'R-12-69001',
        FORMULARIO: 'R-12-69',
        DOCVERSION: '1',
        APROBADO: 'Cristián Salinas',
        APROFECHA: '24-11-2023',
        OPCIONES: JSON.stringify({
          formulario: 'Dosificaciones',
          codigo: 'DOSIF',
          version: '1.0',
          opciones: [
            {
              nombre: 'grado',
              tipo: 'select',
              opciones: [
                { posicion: 1, texto: 'H-5' },
                { posicion: 2, texto: 'H-10' },
                { posicion: 3, texto: 'H-15' },
                { posicion: 4, texto: 'H-20' },
                { posicion: 5, texto: 'H-25' },
                { posicion: 6, texto: 'H-30' },
                { posicion: 7, texto: 'H-35' },
                { posicion: 8, texto: 'H-40' },
                { posicion: 9, texto: 'H-45' },
                { posicion: 10, texto: 'H-50' }
              ]
            },
            {
              nombre: 'Tipo de Cemento',
              tipo: 'select',
              opciones: [
                { posicion: 1, texto: 'Corriente' },
                { posicion: 2, texto: 'Alta Resistencia' },
                { posicion: 3, texto: 'Puzolánico' },
                { posicion: 4, texto: 'Siderúrgico' },
                { posicion: 5, texto: 'Compuesto' }
              ]
            }
          ]
        }),
        ESTADO: 'A',
        TIPO: 'D',
        IDREPORT: 'OTDosificaciones'
      },
      {
        CLAVE: 'R-12-99004',
        FORMULARIO: 'R-12-99',
        DOCVERSION: '10',
        APROBADO: 'Juan Salas',
        APROFECHA: '19-02-2021',
        OPCIONES: JSON.stringify({
          formulario: 'Retiro Probetas',
          codigo: 'R-12-99',
          version: '1.0',
          opciones: [
            {
              nombre: 'Condicion de transporte',
              tipo: 'select',
              opciones: [
                { posicion: 1, texto: 'Cama de arena' },
                { posicion: 2, texto: 'Caja de traslado' },
                { posicion: 3, texto: 'Cubierta con paño húmedo' },
                { posicion: 4, texto: 'Sin protección especial' }
              ]
            },
            {
              nombre: 'Tipo de Probeta',
              tipo: 'select',
              opciones: [
                { posicion: 1, texto: 'Cilindro 15 x 30 cm' },
                { posicion: 2, texto: 'Cilindro 10 x 20 cm' },
                { posicion: 3, texto: 'Cubo 20 x 20 cm' },
                { posicion: 4, texto: 'Viga 15 x 15 x 50 cm' }
              ]
            }
          ]
        }),
        ESTADO: 'A',
        TIPO: 'D',
        IDREPORT: 'RetiroProbetas'
      },
      {
        CLAVE: 'X-1001',
        FORMULARIO: 'X-1',
        DOCVERSION: '1',
        APROBADO: 'Eric Concha',
        APROFECHA: '20-02-2021',
        OPCIONES: JSON.stringify({
          formulario: 'Cancelacion',
          codigo: 'X-1',
          version: '1.0',
          opciones: [
            {
              nombre: 'motivoCancelacion',
              tipo: 'select',
              opciones: [
                { posicion: 1, texto: 'Clima' },
                { posicion: 2, texto: 'Problema Interno (Pampa Austral)' },
                { posicion: 3, texto: 'Problema Planta (Hormigón)' }
              ]
            }
          ]
        }),
        ESTADO: 'A',
        TIPO: 'D',
        IDREPORT: 'FormCancelacion'
      }
    ]

    console.log('=== GET FORMULARIOS BACKEND - ENVIANDO ===')
    console.log('Total formularios activos:', formularios.length)
    console.log('Primer formulario:', formularios[0])

    return NextResponse.json(
      { data: formularios },
      { headers: corsHeaders(origin), status: 200 }
    )
  } catch (error: any) {
    console.error('Error en api-get-lbdocver:', error)
    return NextResponse.json(
      { error: error?.message ?? 'unknown' },
      { status: 500, headers: corsHeaders(request.headers.get('origin')) }
    )
  }
}
