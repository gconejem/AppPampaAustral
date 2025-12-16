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
 * Normaliza el cargo según las reglas especificadas
 * @param {string} cargoStr - Cargo del Excel
 * @returns {string} - Cargo normalizado
 */
function normalizarCargo(cargoStr) {
  if (!cargoStr || cargoStr === '') {
    return 'Sin cargo'
  }
  
  const cargoTrimmed = cargoStr.toString().trim()
  
  // Si es "Encargado de Obra", devolver "encargado_obra"
  if (cargoTrimmed.toLowerCase() === 'encargado de obra') {
    return 'encargado_obra'
  }
  
  // Para otros casos, convertir a minúsculas y reemplazar espacios por guion bajo
  return cargoTrimmed.toLowerCase().replace(/\s+/g, '_')
}

async function main() {
  try {
    console.log('Iniciando carga de contactos desde Excel...')
    
    // Leer el archivo Excel
    const archivoExcel = join(__dirname, 'PA-carga-inicial-mantenedores-(al-05-12-2025).xlsx')
    const workbook = xlsx.readFile(archivoExcel)
    
    // Obtener la hoja "Contacto"
    const nombreHoja = 'Contacto'
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
        // 0="Nombre y Apellido", 1="Cargo", 2="Email", 3="Teléfono 1", 
        // 4="Teléfono 2", 5="Empresa", 6="Dirección", 7="Comuna"
        
        const nombre = (fila[0] || '').toString().trim()
        const cargoExcel = (fila[1] || '').toString().trim()
        const cargo = normalizarCargo(cargoExcel)
        const email = (fila[2] || '').toString().trim()
        const telefono1 = (fila[3] || 'Sin teléfono').toString().trim()
        const telefono2 = (fila[4] || '').toString().trim() || null
        const empresa = (fila[5] || '').toString().trim() || null
        const direccion = (fila[6] || '').toString().trim() || null
        const comuna = (fila[7] || '').toString().trim() || null
        const estado = 'ACTIVO' // Siempre ACTIVO según instrucciones
        
        // Validar datos requeridos
        if (!nombre) {
          console.warn(`Fila ${i + 2}: Nombre vacío, saltando...`)
          errores++
          continue
        }
        
        if (!email) {
          console.warn(`Fila ${i + 2}: Email vacío, saltando...`)
          errores++
          continue
        }
        
        // Verificar si el contacto ya existe (por email)
        const contactoExistente = await prisma.contacto.findFirst({
          where: { 
            email: email,
            nombre: nombre
          }
        })
        
        if (contactoExistente) {
          console.log(`Fila ${i + 2}: Contacto "${nombre}" (${email}) ya existe, saltando...`)
          continue
        }
        
        // Crear el contacto
        const contactoCreado = await prisma.contacto.create({
          data: {
            nombre: nombre,
            cargo: cargo,
            email: email,
            telefono1: telefono1,
            telefono2: telefono2,
            empresa: empresa,
            direccion: direccion,
            comuna: comuna,
            estado: estado,
          }
        })
        
        insertados++
        console.log(`✓ Fila ${i + 2}: Contacto "${nombre}" (${email}) insertado correctamente con cargo: ${cargo}`)
        
      } catch (error) {
        errores++
        console.error(`✗ Fila ${i + 2}: Error al insertar contacto:`, error.message)
      }
    }
    
    console.log('\n=== RESUMEN ===')
    console.log(`Total registros procesados: ${datos.length}`)
    console.log(`Insertados exitosamente: ${insertados}`)
    console.log(`Errores: ${errores}`)
    console.log(`Ya existían: ${datos.length - insertados - errores}`)
    
  } catch (error) {
    console.error('Error general al cargar contactos:', error)
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
