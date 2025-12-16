import { PrismaClient } from '@prisma/client'
import xlsx from 'xlsx'
import { fileURLToPath } from 'url'
import { dirname, join } from 'path'

const __filename = fileURLToPath(import.meta.url)
const __dirname = dirname(__filename)

const prisma = new PrismaClient()

/**
 * Normaliza el cargo a minúsculas y con guiones bajos
 */
function normalizarCargo(cargo) {
  if (!cargo) return ''
  return cargo.toString().trim().toLowerCase().replace(/\s+/g, '_')
}

async function cargarClienteContacto() {
  try {
    console.log('Iniciando carga de relaciones Cliente-Contacto desde Excel...')
    
    // Leer el archivo Excel
    const archivoExcel = join(__dirname, 'PA-carga-inicial-mantenedores-(al-05-12-2025).xlsx')
    const workbook = xlsx.readFile(archivoExcel)
    
    // Obtener la hoja "Cliente-Contacto"
    const nombreHoja = 'Cliente-Contacto'
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
    let clientesNoEncontrados = 0
    let contactosNoEncontrados = 0
    
    for (let i = 0; i < datos.length; i++) {
      const fila = datos[i]
      
      try {
        // Extraer datos de las columnas
        const nombre = (fila[0] || '').toString().trim()
        const cargoExcel = (fila[1] || '').toString().trim()
        const email = (fila[2] || '').toString().trim()
        const telefono1 = (fila[3] || 'Sin teléfono').toString().trim()
        const telefono2 = (fila[4] || '').toString().trim() || null
        const rutCliente = (fila[8] || '').toString().trim()
        
        const cargo = normalizarCargo(cargoExcel)
        const isPrincipal = true
        
        // Validar datos requeridos
        if (!rutCliente) {
          console.warn(`Fila ${i + 2}: RUT cliente vacío, saltando...`)
          errores++
          continue
        }
        
        if (!email) {
          console.warn(`Fila ${i + 2}: Email vacío, saltando...`)
          errores++
          continue
        }
        
        if (!nombre) {
          console.warn(`Fila ${i + 2}: Nombre vacío, saltando...`)
          errores++
          continue
        }
        
        // Buscar el cliente por RUT
        const cliente = await prisma.cliente.findUnique({
          where: { rut: rutCliente }
        })
        
        if (!cliente) {
          console.warn(`Fila ${i + 2}: Cliente con RUT "${rutCliente}" no encontrado`)
          clientesNoEncontrados++
          errores++
          continue
        }
        
        // Buscar el contacto por email en la tabla Contacto
        const contacto = await prisma.contacto.findFirst({
          where: { email: email }
        })
        
        if (!contacto) {
          console.warn(`Fila ${i + 2}: Contacto con email "${email}" no encontrado`)
          contactosNoEncontrados++
          errores++
          continue
        }
        
        // Verificar si ya existe la relación
        const relacionExistente = await prisma.clienteContacto.findUnique({
          where: {
            clienteId_contactId: {
              clienteId: cliente.clienteId,
              contactId: contacto.contactId
            }
          }
        })
        
        if (relacionExistente) {
          console.log(`Fila ${i + 2}: Relación ya existe entre cliente "${cliente.razonSocial}" y contacto "${nombre}"`)
          continue
        }
        
        // Insertar la relación
        await prisma.clienteContacto.create({
          data: {
            clienteId: cliente.clienteId,
            contactId: contacto.contactId,
            cargo: cargo,
            nombre: nombre,
            email: email,
            telefono1: telefono1,
            telefono2: telefono2,
            isPrincipal: isPrincipal
          }
        })
        
        insertados++
        console.log(`✓ Fila ${i + 2}: Relación creada entre cliente "${cliente.razonSocial}" (${rutCliente}) y contacto "${nombre}" (${email}) con cargo: ${cargo}`)
        
      } catch (error) {
        console.error(`Error en fila ${i + 2}:`, error.message)
        errores++
      }
    }
    
    console.log('\n=== RESUMEN ===')
    console.log(`Total de registros procesados: ${datos.length}`)
    console.log(`Relaciones insertadas: ${insertados}`)
    console.log(`Errores: ${errores}`)
    console.log(`Clientes no encontrados: ${clientesNoEncontrados}`)
    console.log(`Contactos no encontrados: ${contactosNoEncontrados}`)
    
  } catch (error) {
    console.error('Error general:', error)
  } finally {
    await prisma.$disconnect()
  }
}

cargarClienteContacto()
