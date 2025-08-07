import { PrismaClient } from '@prisma/client'
import * as dotenv from 'dotenv'
import { fileURLToPath } from 'url'
import { dirname, join } from 'path'

// Configurar dotenv para cargar el archivo .env
const __filename = fileURLToPath(import.meta.url)
const __dirname = dirname(__filename)
dotenv.config({ path: join(__dirname, '..', '.env') })

const prisma = new PrismaClient()

async function main() {
  try {
    console.log('⚠️  ADVERTENCIA: Este script eliminará TODOS los equipos existentes')
    console.log('🔄 Iniciando proceso de reseteo completo de equipos...')
    
    // Obtener todos los tipos de equipos
    const tiposEquipo = await prisma.tipoEquipo.findMany()
    const tipoEquipoMap = tiposEquipo.reduce((map, tipo) => {
      map[tipo.tipo] = tipo.id
      return map
    }, {})

    // Obtener laboratoristas
    const rolesLaboratorista = await prisma.rol.findMany({
      where: {
        nombre: {
          in: ['Laboratorista', 'Laboratorista / E. de Área Sala']
        }
      }
    })

    const laboratoristas = await prisma.user.findMany({
      where: {
        roles: {
          some: {
            rolId: {
              in: rolesLaboratorista.map(rol => rol.id)
            }
          }
        }
      },
      select: {
        id: true,
        name: true,
        email: true
      }
    })

    console.log(`📋 ${laboratoristas.length} laboratoristas encontrados`)

    // Función para buscar laboratorista por similitud de nombre
    function findLaboratoristaByName(nombreFuncionario) {
      if (!nombreFuncionario) return null
      
      const nombreLower = nombreFuncionario.toLowerCase()
      return laboratoristas.find(lab => {
        if (!lab.name) return false
        const labNameLower = lab.name.toLowerCase()
        return labNameLower.includes(nombreLower.split(' ')[0]) || 
               nombreLower.includes(labNameLower.split(' ')[0])
      })
    }

    // Datos exactos de los 63 equipos
    const equiposData = [
      // Conos de Abrams
      { codigo: 'X-1-01', tipo: 'Cono de Abrams', descripcion: 'Cono de Arena X-1-01', serie: null, funcionario: null, estado: 'Activo', observaciones: null },
      { codigo: 'X-1-02', tipo: 'Cono de Abrams', descripcion: 'Cono de Arena X-1-02', serie: null, funcionario: null, estado: 'Activo', observaciones: null },
      { codigo: 'X-1-03', tipo: 'Cono de Abrams', descripcion: 'Cono de Arena X-1-03', serie: null, funcionario: null, estado: 'Activo', observaciones: null },
      { codigo: 'X-1-04', tipo: 'Cono de Abrams', descripcion: 'Cono de Arena X-1-04', serie: null, funcionario: null, estado: 'Activo', observaciones: null },
      { codigo: 'X-1-06', tipo: 'Cono de Abrams', descripcion: 'Cono de Arena X-1-06', serie: null, funcionario: null, estado: 'Activo', observaciones: null },
      { codigo: 'X-1-09', tipo: 'Cono de Abrams', descripcion: 'Cono de Arena X-1-09', serie: null, funcionario: null, estado: 'Inactivo', observaciones: null },
      
      // Densímetros
      { codigo: 'D01', tipo: 'Densímetro', descripcion: 'D-0-01', serie: '23739', funcionario: 'Roberto Vargas', estado: 'Activo', observaciones: null },
      { codigo: 'D02', tipo: 'Densímetro', descripcion: 'D-0-02', serie: '26631', funcionario: 'Marvin Sepulveda', estado: 'Activo', observaciones: null },
      { codigo: 'D03', tipo: 'Densímetro', descripcion: 'D-0-03', serie: '23870', funcionario: null, estado: 'Activo', observaciones: null },
      { codigo: 'D04', tipo: 'Densímetro', descripcion: 'D-0-04', serie: '22421', funcionario: 'Jonathan S.', estado: 'Activo', observaciones: null },
      { codigo: 'D05', tipo: 'Densímetro', descripcion: 'D-0-05', serie: '27503', funcionario: 'Alexis Gomez Salazar', estado: 'Activo', observaciones: null },
      { codigo: 'D06', tipo: 'Densímetro', descripcion: 'D-0-06', serie: '31784', funcionario: 'Juan Sepúlveda', estado: 'Activo', observaciones: null },
      { codigo: 'D07', tipo: 'Densímetro', descripcion: 'D-0-07', serie: '64898', funcionario: 'Jorge Guala', estado: 'Activo', observaciones: null },
      { codigo: 'D08', tipo: 'Densímetro', descripcion: 'D-0-08', serie: '65906', funcionario: null, estado: 'Activo', observaciones: null },
      { codigo: 'D09', tipo: 'Densímetro', descripcion: 'D-0-09', serie: '65907', funcionario: 'José Martinez', estado: 'Activo', observaciones: null },
      { codigo: 'D12', tipo: 'Densímetro', descripcion: 'D-0-12', serie: '60580', funcionario: 'Felix Opazo', estado: 'Activo', observaciones: null },
      { codigo: 'D13', tipo: 'Densímetro', descripcion: 'D-0-13', serie: '26823', funcionario: null, estado: 'Activo', observaciones: null },
      
      // Otros equipos
      { codigo: 'DRP', tipo: 'Otro', descripcion: 'Detector de Radiación Portatil', serie: null, funcionario: null, estado: 'Activo', observaciones: null },
      { codigo: 'F-1-16', tipo: 'Prensa', descripcion: 'F-1-16', serie: '20002627', funcionario: null, estado: 'Activo', observaciones: null },
      { codigo: 'GEL', tipo: 'Otro', descripcion: 'Generador Electrico', serie: null, funcionario: null, estado: 'Activo', observaciones: null },
      { codigo: 'Z-0-07', tipo: 'Otro', descripcion: 'Hi LO Z-0-07', serie: null, funcionario: null, estado: 'Activo', observaciones: null },
      { codigo: 'Z-0-06', tipo: 'Otro', descripcion: 'Hi LO Z-0-06', serie: null, funcionario: null, estado: 'Activo', observaciones: null },
      { codigo: 'Z-0-05', tipo: 'Otro', descripcion: 'Hi LO Z-0-05', serie: null, funcionario: null, estado: 'Inactivo', observaciones: null },
      
      // Pies de Metro
      { codigo: 'L-0-35', tipo: 'Pie de Metro', descripcion: 'L-0-35', serie: null, funcionario: null, estado: 'Activo', observaciones: null },
      { codigo: 'L-0-36', tipo: 'Pie de Metro', descripcion: 'L-0-36', serie: null, funcionario: null, estado: 'Activo', observaciones: null },
      { codigo: 'L-0-37', tipo: 'Pie de Metro', descripcion: 'L-0-37', serie: null, funcionario: null, estado: 'Activo', observaciones: null },
      { codigo: 'L-0-38', tipo: 'Pie de Metro', descripcion: 'L-0-38', serie: null, funcionario: null, estado: 'Activo', observaciones: null },
      { codigo: 'L-0-40', tipo: 'Pie de Metro', descripcion: 'L-0-40', serie: null, funcionario: null, estado: 'Activo', observaciones: null },
      { codigo: 'L-1-39', tipo: 'Pie de Metro', descripcion: 'L-1-39', serie: null, funcionario: null, estado: 'Activo', observaciones: null },
      
      // Balanzas
      { codigo: 'M-1-01', tipo: 'Balanza', descripcion: 'M-1-01', serie: null, funcionario: null, estado: 'Activo', observaciones: null },
      { codigo: 'M-1-02', tipo: 'Balanza', descripcion: 'M-1-02', serie: null, funcionario: null, estado: 'Activo', observaciones: null },
      { codigo: 'M-1-03', tipo: 'Balanza', descripcion: 'M-1-03', serie: null, funcionario: null, estado: 'Activo', observaciones: null },
      { codigo: 'M-1-04', tipo: 'Balanza', descripcion: 'M-1-04', serie: null, funcionario: null, estado: 'Activo', observaciones: null },
      { codigo: 'M-1-05', tipo: 'Balanza', descripcion: 'M-1-05', serie: null, funcionario: null, estado: 'Activo', observaciones: null },
      { codigo: 'M-1-06', tipo: 'Balanza', descripcion: 'M-1-06', serie: null, funcionario: null, estado: 'Activo', observaciones: null },
      { codigo: 'M-1-07', tipo: 'Balanza', descripcion: 'M-1-07', serie: null, funcionario: null, estado: 'Activo', observaciones: null },
      { codigo: 'M-1-08', tipo: 'Balanza', descripcion: 'M-1-08', serie: null, funcionario: null, estado: 'Activo', observaciones: null },
      { codigo: 'M-1-09', tipo: 'Balanza', descripcion: 'M-1-09', serie: null, funcionario: null, estado: 'Activo', observaciones: null },
      { codigo: 'M-1-10', tipo: 'Balanza', descripcion: 'M-1-10', serie: null, funcionario: null, estado: 'Activo', observaciones: null },
      { codigo: 'M-1-11', tipo: 'Balanza', descripcion: 'M-1-11', serie: null, funcionario: null, estado: 'Activo', observaciones: null },
      { codigo: 'M-1-13', tipo: 'Balanza', descripcion: 'M-1-13', serie: null, funcionario: null, estado: 'Activo', observaciones: null },
      { codigo: 'M-1-21', tipo: 'Balanza', descripcion: 'M-1-21', serie: null, funcionario: null, estado: 'Activo', observaciones: null },
      { codigo: 'M-1-28', tipo: 'Balanza', descripcion: 'M-1-28', serie: null, funcionario: null, estado: 'Activo', observaciones: null },
      { codigo: 'M-1-29', tipo: 'Balanza', descripcion: 'M-1-29', serie: null, funcionario: null, estado: 'Activo', observaciones: null },
      { codigo: 'M-1-32', tipo: 'Balanza', descripcion: 'M-1-32', serie: null, funcionario: null, estado: 'Activo', observaciones: null },
      { codigo: 'M-1-34', tipo: 'Balanza', descripcion: 'M-1-34', serie: null, funcionario: null, estado: 'Activo', observaciones: null },
      { codigo: 'M-1-35', tipo: 'Balanza', descripcion: 'M-1-35', serie: null, funcionario: null, estado: 'Activo', observaciones: null },
      { codigo: 'M-1-37', tipo: 'Balanza', descripcion: 'M-1-37', serie: null, funcionario: null, estado: 'Activo', observaciones: null },
      { codigo: 'M-1-40', tipo: 'Balanza', descripcion: 'M-1-40', serie: null, funcionario: null, estado: 'Activo', observaciones: null },
      { codigo: 'M-1-43', tipo: 'Balanza', descripcion: 'M-1-43', serie: null, funcionario: null, estado: 'Activo', observaciones: null },
      { codigo: 'M-1-44', tipo: 'Balanza', descripcion: 'M-1-44', serie: null, funcionario: null, estado: 'Activo', observaciones: null },
      
      // Otros equipos adicionales
      { codigo: 'F-0-01', tipo: 'Otro', descripcion: 'Martillo Smith F-0-01', serie: null, funcionario: null, estado: 'Activo', observaciones: null },
      { codigo: 'F-0-04', tipo: 'Otro', descripcion: 'Martillo Smith F-0-04', serie: null, funcionario: null, estado: 'Inactivo', observaciones: null },
      { codigo: 'RLM', tipo: 'Otro', descripcion: 'Rilem', serie: null, funcionario: null, estado: 'Activo', observaciones: 'Rilem' },
      { codigo: 'SCL', tipo: 'Otro', descripcion: 'Serie Cilindro', serie: null, funcionario: null, estado: 'Activo', observaciones: null },
      { codigo: 'SCB', tipo: 'Otro', descripcion: 'Serie de Cubos', serie: null, funcionario: null, estado: 'Activo', observaciones: null },
      { codigo: 'SVG', tipo: 'Otro', descripcion: 'Serie de Vigas', serie: null, funcionario: null, estado: 'Activo', observaciones: null },
      
      // Testigueras
      { codigo: 'Z-0-11', tipo: 'Testiguera', descripcion: 'Testiguera Z-0-11', serie: null, funcionario: null, estado: 'Inactivo', observaciones: null },
      { codigo: 'Z-0-12', tipo: 'Testiguera', descripcion: 'Testiguera Z-0-12', serie: null, funcionario: null, estado: 'Activo', observaciones: null },
      { codigo: 'Z-0-13', tipo: 'Testiguera', descripcion: 'Testiguera Z-0-13', serie: null, funcionario: null, estado: 'Activo', observaciones: null },
      { codigo: 'Z-0-14', tipo: 'Testiguera', descripcion: 'Testiguera Z-0-14', serie: null, funcionario: null, estado: 'Activo', observaciones: null },
      { codigo: 'Z-0-28', tipo: 'Testiguera', descripcion: 'Testiguera Z-0-28', serie: null, funcionario: null, estado: 'Activo', observaciones: null },
      { codigo: 'Z-0-30', tipo: 'Testiguera', descripcion: 'Testiguera Z-0-337', serie: null, funcionario: null, estado: 'Activo', observaciones: null },
    ]

    console.log('🗑️  Eliminando equipos existentes (incluyendo relaciones AgendaEquipo)...')
    await prisma.agendaEquipo.deleteMany()
    await prisma.equipo.deleteMany()

    console.log('🔄 Creando exactamente 63 equipos...')
    let equiposCreados = 0
    let equiposConFuncionario = 0

    for (const equipoData of equiposData) {
      const tipoEquipoId = tipoEquipoMap[equipoData.tipo]
      if (!tipoEquipoId) {
        console.warn(`⚠️ Tipo de equipo no encontrado: ${equipoData.tipo}`)
        continue
      }

      const laboratorista = findLaboratoristaByName(equipoData.funcionario)
      
      const equipo = await prisma.equipo.create({
        data: {
          codigo: equipoData.codigo,
          nombre: equipoData.descripcion,
          tipoEquipoId: tipoEquipoId,
          descripcion: equipoData.descripcion,
          serie: equipoData.serie,
          funcionarioAsignadoId: laboratorista ? laboratorista.id : null,
          estado: equipoData.estado,
          observaciones: equipoData.observaciones
        }
      })

      console.log(`✅ Equipo creado: ${equipo.codigo} - ${equipo.nombre}`)
      if (laboratorista) {
        console.log(`   -> Asignado a: ${laboratorista.name} (${equipoData.funcionario})`)
        equiposConFuncionario++
      } else if (equipoData.funcionario) {
        console.log(`   -> ⚠️ No se encontró laboratorista para: ${equipoData.funcionario}`)
      }
      
      equiposCreados++
    }

    console.log(`\n✅ Reseteo completo terminado:`)
    console.log(`   - ${equiposCreados} equipos creados (exactamente los mismos que en desarrollo)`)
    console.log(`   - ${equiposConFuncionario} equipos asignados a laboratoristas`)
    console.log(`   - ${equiposCreados - equiposConFuncionario} equipos sin asignar`)
    console.log(`\n🎯 La tabla de equipos ahora tiene EXACTAMENTE los mismos 63 registros que desarrollo`)

  } catch (error) {
    console.error('❌ Error al resetear equipos:', error)
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
