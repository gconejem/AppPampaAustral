import { PrismaClient } from '@prisma/client';
import 'dotenv/config';

const prisma = new PrismaClient();

async function main() {
  try {
    const listasPrecios = [
      { nombre: "Lista 1" },
      { nombre: "Lista 2" },
      { nombre: "Lista 3" },
      { nombre: "Lista 4" }
    ];

    for (const lista of listasPrecios) {
      const nuevaLista = await prisma.listaPrecio.create({
        data: lista
      });
      console.log(`Lista de precio creada:`, nuevaLista);
    }

  } catch (error) {
    console.error('Error al crear las listas de precios:', error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  }); 
