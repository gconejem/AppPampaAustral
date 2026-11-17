import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

const referencias = [
  { codigo: '154602', fecha: new Date('2022-12-02T00:00:00.000Z'), item: 'Sello y Relleno', procedencia: 'Proctor Cliente, Laboratorio Lab Vial MAL Existente', ubicacion: 'Tramo eje 27 y B Estrato -1.60', proctor: 1700, humedad: 15.7, densidadMin: 1650, densidadMax: 1720 },
  { codigo: '154603', fecha: new Date('2022-11-28T00:00:00.000Z'), item: 'Base Granular', procedencia: 'Proctor Laboratorio, Ensayo Tipo A', ubicacion: 'Km 12+500, Calzada Derecha', proctor: 2100, humedad: 6.5, densidadMin: 2050, densidadMax: 2130 },
  { codigo: '154601', fecha: new Date('2022-11-25T00:00:00.000Z'), item: 'Sub-base Granular', procedencia: 'Proctor Modificado, Laboratorio Central', ubicacion: 'Km 12+300, Eje Central', proctor: 2250, humedad: 5.2, densidadMin: 2200, densidadMax: 2280 }
]

async function main() {
  const obras = await prisma.obra.findMany({ where: { numeroObra: '9139' }, select: { obraId: true, numeroObra: true, nombreObra: true } })

  if (obras.length !== 1) {
    throw new Error(`Se esperaba encontrar exactamente una obra 9139; encontradas: ${obras.length}. No se cargaron datos demo.`)
  }

  const obra = obras[0]

  for (const referencia of referencias) {
    await prisma.referenciaDensidad.upsert({
      where: { obraId_codigo: { obraId: obra.obraId, codigo: referencia.codigo } },
      create: { obraId: obra.obraId, ...referencia },
      update: { ...referencia }
    })
  }

  console.log(`Cargadas ${referencias.length} referencias demo en obra ${obra.numeroObra} (${obra.nombreObra}).`)
}

main()
  .catch(error => {
    console.error('Error cargando referencias demo de densidad:', error)
    process.exitCode = 1
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
