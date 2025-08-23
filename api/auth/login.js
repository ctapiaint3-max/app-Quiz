import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { db } from '@vercel/postgres';

export default async function handler(req, res) {
  // --- AÑADE ESTA LÍNEA AQUÍ ---
  console.log('JWT_SECRET:', process.env.JWT_SECRET); 
  // -----------------------------

  if (req.method !== 'POST') {

try {
    const { email, password } = req.body;
    const client = await db.connect(); // Conectamos a la base de datos

    // 1. Buscar al usuario por su correo electrónico
    const { rows } = await client.sql`
      SELECT * FROM users WHERE email = ${email}
    `;

    // Si no se encuentra ningún usuario, las credenciales son inválidas
    if (rows.length === 0) {
      return res.status(401).json({ message: 'Credenciales inválidas.' });
    }
    const user = rows[0];

    // 2. Comparar la contraseña enviada con la contraseña encriptada de la base de datos
    const isPasswordValid = await bcrypt.compare(password, user.password);

    // Si las contraseñas no coinciden, las credenciales son inválidas
    if (!isPasswordValid) {
      return res.status(401).json({ message: 'Credenciales inválidas.' });
    }

    // 3. Si todo es correcto, crear el token (JWT)
    // Este token contiene información del usuario (como su ID) de forma segura.
    const token = jwt.sign(
      { userId: user.id, email: user.email },
      process.env.JWT_SECRET, // ¡IMPORTANTE! Debes crear esta variable en Vercel
      { expiresIn: '1d' } // El token será válido por 1 día
    );

    // 4. Enviar el token y los datos del usuario (sin la contraseña) al cliente
    res.status(200).json({
      token,
      user: { id: user.id, name: user.name, email: user.email },
    });

  } catch (error) {
    console.error('Error en login:', error);
    res.status(500).json({ message: 'Error interno del servidor.' });
  }
}
}
