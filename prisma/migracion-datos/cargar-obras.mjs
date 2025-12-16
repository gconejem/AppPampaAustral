import { PrismaClient } from '@prisma/client'
import * as dotenv from 'dotenv'
import { fileURLToPath } from 'url'
import { dirname, join } from 'path'
import xlsx from 'xlsx'

// Configurar dotenv para cargar el archivo .env
const __filename = fileURLToPath(import.meta.url)
const __dirname = dirname(__filename)
dotenv.config({ path: join(__dirname, '..', '..', '.env') })

const prisma = new PrismaClient()

/**
 * Convierte una fecha en formato dd-mm-aa del Excel a formato Date con año completo
 * @param {string} fechaStr - Fecha en formato dd-mm-aa
 * @returns {Date} - Fecha en formato Date
 */
function parsearFechaExcel(fechaStr) {
  if (!fechaStr || fechaStr === '') {
    return new Date() // Fecha actual por defecto
  }

  // Si es un número de serie de Excel (fecha numérica)
  if (typeof fechaStr === 'number') {
    // Excel almacena las fechas como número de días desde 1900-01-01
    const excelEpoch = new Date(1900, 0, 1)
    const days = fechaStr - 2 // Ajuste por el bug de Excel con años bisiestos
    const fecha = new Date(excelEpoch.getTime() + days * 24 * 60 * 60 * 1000)
    return fecha
  }

  // Si es un string, intentar parsearlo
  const partes = fechaStr.toString().split(/[-\/]/)
  
  if (partes.length === 3) {
    let dia = parseInt(partes[0], 10)
    let mes = parseInt(partes[1], 10)
    let año = parseInt(partes[2], 10)
    
    // Convertir año de 2 dígitos a 4 dígitos
    // Asumimos que años 00-30 son 2000-2030, y 31-99 son 1931-1999
    if (año < 100) {
      año = año <= 30 ? 2000 + año : 1900 + año
    }
    
    // Crear fecha (mes - 1 porque en JavaScript los meses van de 0-11)
    return new Date(año, mes - 1, dia)
  }
  
  // Si no se puede parsear, devolver fecha actual
  console.warn(`No se pudo parsear la fecha: ${fechaStr}`)
  return new Date()
}

/**
 * Procesa un valor de email que puede ser string simple o múltiples emails separados por comas
 * @param {string} emailStr - Email(s) del Excel
 * @returns {string[]} - Array de emails
 */
function procesarEmails(emailStr) {
  if (!emailStr || emailStr === '') {
    return []
  }
  
  // Si contiene comas, separar múltiples emails
  if (emailStr.includes(',')) {
    return emailStr.split(',').map(email => email.trim()).filter(email => email !== '')
  }
  
  return [emailStr.trim()]
}

/**
 * Convierte valores booleanos del Excel
 */
function parseBoolean(val) {
  if (typeof val === 'boolean') return val
  if (typeof val === 'string') {
    const lower = val.toLowerCase().trim()
    return lower === 'true' || lower === 'sí' || lower === 'si' || lower === '1' || lower === 'yes'
  }
  if (typeof val === 'number') return val !== 0
  return false
}

async function main() {
  try {
    console.log('Iniciando carga de obras desde Excel...')
    
    // Leer el archivo Excel
    const archivoExcel = join(__dirname, 'PA-carga-inicial-mantenedores-(al-05-12-2025).xlsx')
    const workbook = xlsx.readFile(archivoExcel)
    
    // Obtener la hoja "Obras"
    const nombreHoja = 'Obras'
    const hoja = workbook.Sheets[nombreHoja]
    
    if (!hoja) {
      throw new Error(`No se encontró la hoja "${nombreHoja}" en el archivo Excel`)
    }
    
    // Convertir la hoja a JSON sin usar encabezados (usar índices de columna)
    const datos = xlsx.utils.sheet_to_json(hoja, { 
      header: 1, // Usar arrays en lugar de objetos con encabezados
      range: 1, // Empezar desde la fila 2 (índice 1, ya que 0 es la fila 1)
      defval: '' // Valor por defecto para celdas vacías
    })
    
    console.log(`Se encontraron ${datos.length} registros en la hoja "${nombreHoja}"`)
    
    let insertados = 0
    let errores = 0
    
    // Procesar cada fila
    for (let i = 0; i < datos.length; i++) {
      const fila = datos[i]
      
      // Saltar filas vacías
      if (!fila || fila.length === 0) {
        continue
      }
      
      try {
        // Extraer datos por índice de columna basado en los encabezados del Excel:
        // 0=numeroObra, 1=estado, 2=estadoObra, 3=rut, 4=nombreCliente, 
        // 5=razonSocial, 6=nombreObra, 7=direccion, 8=region, 9=comuna, 10=sector
        // 11=georreferencia, 12=referencia, 13=mandante, 14=informeMandante,
        // 15=textoMandante, 16=giro, 17=direccionComercial, 18=comunaFacturacion,
        // 19=telefonoFacturacion, 20=listaPrecios, 21=correos, 22=acreditacionPersonal
        // 23=especificacionesTecnicas, 24=acreditacionEquipos, 25=cartaCompromiso
        // 26=mandatoServiu, 27=otrosRequisitos, 28=estadoPago, 29=hes, 30=oc
        // 31=otrasReferencias, 32=envioInformes, 33=representanteLegal, 
        // 34=rutRepresentanteLegal, 35=mailRecepcionFactura, 36=FechaIngreso
        
        const numeroObra = (fila[0] || '').toString().trim()
        const estado = (fila[1] || 'activo').toString().trim()
        const estadoObra = (fila[2] || 'activa').toString().trim()
        const rut = (fila[3] || '').toString().trim()
        const nombreCliente = (fila[4] || '').toString().trim()
        const razonSocial = (fila[5] || '').toString().trim() || null
        const nombreObra = (fila[6] || '').toString().trim()
        const direccion = (fila[7] || '').toString().trim()
        const region = (fila[8] || '').toString().trim()
        const comuna = (fila[9] || '').toString().trim()
        const sector = (fila[10] || '').toString().trim() || null
        const georreferencia = (fila[11] || '').toString().trim() || null
        const referencia = (fila[12] || '').toString().trim() || null
        const mandante = (fila[13] || '').toString().trim() || null
        const informeMandante = parseBoolean(fila[14])
        const textoMandante = (fila[15] || '').toString().trim() || null
        const giro = (fila[16] || '').toString().trim() || null
        const direccionComercial = (fila[17] || '').toString().trim() || null
        const comunaFacturacion = (fila[18] || '').toString().trim() || null
        const telefonoFacturacion = (fila[19] || '').toString().trim() || null
        const listaPrecios = (fila[20] || '').toString().trim() || null
        
        // Correos y emails
        const correosStr = (fila[21] || '').toString().trim()
        const correos = procesarEmails(correosStr)
        
        // Campos booleanos
        const acreditacionPersonal = parseBoolean(fila[22])
        const especificacionesTecnicas = parseBoolean(fila[23])
        const acreditacionEquipos = parseBoolean(fila[24])
        const cartaCompromiso = parseBoolean(fila[25])
        const mandatoServiu = parseBoolean(fila[26])
        const otrosRequisitos = (fila[27] || '').toString().trim() || null
        const estadoPago = parseBoolean(fila[28])
        const hes = parseBoolean(fila[29])
        const oc = parseBoolean(fila[30])
        const otrasReferencias = (fila[31] || '').toString().trim() || null
        const envioInformes = parseBoolean(fila[32])
        
        // Representante legal
        const representanteLegal = (fila[33] || '').toString().trim() || null
        const rutRepresentanteLegal = (fila[34] || '').toString().trim() || null
        
        // Mail recepción factura (hasta aquí según indicación del usuario)
        const mailRecepcionFacturaStr = (fila[35] || '').toString().trim()
        const mailRecepcionFactura = procesarEmails(mailRecepcionFacturaStr)
        
        // Fecha de ingreso está en columna 36
        const fechaIngreso = parsearFechaExcel(fila[36])
        
        // Validar datos requeridos
        if (!numeroObra) {
          console.warn(`Fila ${i + 2}: Número de obra vacío, saltando...`)
          errores++
          continue
        }
        
        if (!rut) {
          console.warn(`Fila ${i + 2}: RUT vacío, saltando...`)
          errores++
          continue
        }
        
        if (!nombreCliente) {
          console.warn(`Fila ${i + 2}: Nombre de cliente vacío, saltando...`)
          errores++
          continue
        }
        
        // Verificar si la obra ya existe
        const obraExistente = await prisma.obra.findFirst({
          where: { 
            numeroObra: numeroObra,
            rut: rut
          }
        })
        
        if (obraExistente) {
          console.log(`Fila ${i + 2}: Obra ${numeroObra} para RUT ${rut} ya existe, saltando...`)
          continue
        }
        
        // Crear la obra
        const obraCreada = await prisma.obra.create({
          data: {
            numeroObra: numeroObra,
            fechaIngreso: fechaIngreso,
            estado: estado,
            estadoObra: estadoObra,
            rut: rut,
            nombreCliente: nombreCliente,
            razonSocial: razonSocial,
            nombreObra: nombreObra,
            direccion: direccion,
            region: region,
            comuna: comuna,
            sector: sector,
            georreferencia: georreferencia,
            referencia: referencia,
            mandante: mandante,
            informeMandante: informeMandante,
            textoMandante: textoMandante,
            giro: giro,
            direccionComercial: direccionComercial,
            comunaFacturacion: comunaFacturacion,
            telefonoFacturacion: telefonoFacturacion,
            listaPrecios: listaPrecios,
            mailRecepcionFactura: mailRecepcionFactura,
            correos: correos,
            acreditacionPersonal: acreditacionPersonal,
            especificacionesTecnicas: especificacionesTecnicas,
            acreditacionEquipos: acreditacionEquipos,
            cartaCompromiso: cartaCompromiso,
            mandatoServiu: mandatoServiu,
            otrosRequisitos: otrosRequisitos,
            estadoPago: estadoPago,
            hes: hes,
            oc: oc,
            otrasReferencias: otrasReferencias,
            envioInformes: envioInformes,
            representanteLegal: representanteLegal,
            rutRepresentanteLegal: rutRepresentanteLegal,
          }
        })
        
        insertados++
        console.log(`✓ Fila ${i + 2}: Obra "${numeroObra}" (${nombreObra}) insertada correctamente`)
        
      } catch (error) {
        errores++
        console.error(`✗ Fila ${i + 2}: Error al insertar obra:`, error.message)
      }
    }
    
    console.log('\n=== RESUMEN ===')
    console.log(`Total registros procesados: ${datos.length}`)
    console.log(`Insertados exitosamente: ${insertados}`)
    console.log(`Errores: ${errores}`)
    console.log(`Ya existían: ${datos.length - insertados - errores}`)
    
  } catch (error) {
    console.error('Error general al cargar obras:', error)
    throw error
  }
}

main()
  .catch(e => {
    console.error(e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
