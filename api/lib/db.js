import { createPool } from '@vercel/postgres';

/**
 * Crea y exporta un pool de conexiones a la base de datos.
 * El paquete `@vercel/postgres` leerá automáticamente las variables 
 * de entorno (POSTGRES_URL, etc.) que configuraste en Vercel.
 * * No necesitas pasarle ninguna configuración si tus variables de entorno
 * están nombradas correctamente.
 */
const pool = createPool({
  // La cadena de conexión se toma automáticamente de process.env.POSTGRES_URL
});

export default pool;
