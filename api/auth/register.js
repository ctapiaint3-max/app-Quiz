import bcrypt from 'bcryptjs';
import { db } from '@vercel/postgres';

export default async function handler(req, res) {
  // --- AÑADE ESTA LÍNEA AQUÍ ---
  console.log('POSTGRES_URL:', process.env.POSTGRES_URL); 
  // -----------------------------

  if (req.method !== 'POST') {

      try {
        const { email, password, name } = req.body;
        const client = await db.connect(); // Aquí se establece la conexión a tu base de datos.

        // 1. Validar que todos los campos necesarios fueron enviados
        if (!email || !password || !name) {
          return res.status(400).json({ message: 'Faltan campos requeridos.' });
        }

        // 2. Verificar si el usuario ya existe en la base de datos
        const { rows: existingUsers } = await client.sql`
          SELECT * FROM users WHERE email = ${email}
        `;
        if (existingUsers.length > 0) {
          return res.status(409).json({ message: 'El correo ya está registrado.' });
        }

        // 3. Encriptar la contraseña antes de guardarla (¡MUY IMPORTANTE!)
        const hashedPassword = await bcrypt.hash(password, 10);

        // 4. Insertar el nuevo usuario en la tabla 'users'
        const { rows: newUsers } = await client.sql`
          INSERT INTO users (name, email, password) 
          VALUES (${name}, ${email}, ${hashedPassword}) 
          RETURNING id, name, email`; // RETURNING devuelve los datos del usuario creado sin la contraseña

        // 5. Enviar una respuesta exitosa con los datos del nuevo usuario
        res.status(201).json({ user: newUsers[0] });

      } catch (error) {
        console.error('Error en el registro:', error);
        res.status(500).json({ message: 'Error interno del servidor.' });
      }
    }
  }