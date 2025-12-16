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

async function main() {
  try {
    console.log('Iniciando carga de clientes desde Excel...')
    
    // Leer el archivo Excel
    const archivoExcel = join(__dirname, 'PA-carga-inicial-mantenedores-(al-05-12-2025).xlsx')
    const workbook = xlsx.readFile(archivoExcel)
    
    // Obtener la hoja "Clientes"
    const nombreHoja = 'Clientes'
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
        // Extraer datos por índice de columna (basado en la estructura del Excel)
        // Índices: 0=fechaCreacion, 1=estado, 2=rut, 3=razonSocial, 4=nombreCliente,
        // 5=pais, 6=region, 7=comuna, 8=direccion, 9=telefono, 10=sitioWeb,
        // 11=segmento, 12=industria, 13=giro, 14-16=vacíos, 17=emailFacturacion
        
        const fechaCreacion = parsearFechaExcel(fila[0])
        const estado = fila[1] || 'active'
        const rut = (fila[2] || '').toString().trim()
        const razonSocial = (fila[3] || '').toString().trim()
        const nombreCliente = (fila[4] || razonSocial).toString().trim()
        const pais = (fila[5] || 'Chile').toString().trim()
        const region = (fila[6] || '').toString().trim()
        const comuna = (fila[7] || '').toString().trim()
        const direccion = (fila[8] || '').toString().trim()
        const telefono = (fila[9] || '').toString().trim() || null
        const sitioWeb = (fila[10] || '').toString().trim() || null
        const segmento = (fila[11] || '').toString().trim() || null
        const industria = (fila[12] || '').toString().trim() || null
        const giro = (fila[13] || '').toString().trim() || null
        const emailFacturacionStr = (fila[17] || '').toString().trim()
        const emailFacturacion = procesarEmails(emailFacturacionStr)
        
        // Validar datos requeridos
        if (!rut) {
          console.warn(`Fila ${i + 2}: RUT vacío, saltando...`)
          errores++
          continue
        }
        
        if (!razonSocial) {
          console.warn(`Fila ${i + 2}: Razón Social vacía, saltando...`)
          errores++
          continue
        }
        
        // Verificar si el cliente ya existe
        const clienteExistente = await prisma.cliente.findUnique({
          where: { rut: rut }
        })
        
        if (clienteExistente) {
          console.log(`Fila ${i + 2}: Cliente con RUT ${rut} ya existe, saltando...`)
          continue
        }
        
        // Crear el cliente
        const clienteCreado = await prisma.cliente.create({
          data: {
            fechaCreacion: fechaCreacion,
            estado: estado,
            rut: rut,
            razonSocial: razonSocial,
            nombreCliente: nombreCliente,
            pais: pais,
            region: region,
            ciudad: comuna, // Insertar comuna en ciudad
            comuna: comuna, // Insertar comuna en comuna
            direccion: direccion,
            telefono: telefono,
            sitioWeb: sitioWeb,
            segmento: segmento,
            industria: industria,
            giro: giro,
            emailFacturacion: emailFacturacion,
          }
        })
        
        insertados++
        console.log(`✓ Fila ${i + 2}: Cliente "${razonSocial}" (RUT: ${rut}) insertado correctamente`)
        
      } catch (error) {
        errores++
        console.error(`✗ Fila ${i + 2}: Error al insertar cliente:`, error.message)
      }
    }
    
    console.log('\n=== RESUMEN ===')
    console.log(`Total registros procesados: ${datos.length}`)
    console.log(`Insertados exitosamente: ${insertados}`)
    console.log(`Errores: ${errores}`)
    console.log(`Ya existían: ${datos.length - insertados - errores}`)
    
  } catch (error) {
    console.error('Error general al cargar clientes:', error)
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
