import pool from '../lib/db';
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';

export default async function handler(req, res) {
    if (req.method !== 'POST') {
        return res.status(405).json({ message: 'Method Not Allowed' });
    }

    try {
        const client = await db.connect();
        const { name, email, password } = req.body;

        if (!name || !email || !password) {
            return res.status(400).json({ message: 'Todos los campos son requeridos.' });
        }

        // Verificar si el usuario ya existe
        const { rows: existingUsers } = await client.sql`SELECT * FROM users WHERE email = ${email}`;
        if (existingUsers.length > 0) {
            return res.status(409).json({ message: 'El correo electrónico ya está registrado.' });
        }

        const hashedPassword = await bcrypt.hash(password, 10);

        // **CORRECCIÓN CLAVE**: Se usa la tabla 'users' (plural)
        const { rows: newUserRows } = await client.sql`
            INSERT INTO users (name, email, password) 
            VALUES (${name}, ${email}, ${hashedPassword}) 
            RETURNING id, name, email;
        `;
        
        const newUser = newUserRows[0];

        const token = jwt.sign(
            { userId: newUser.id, name: newUser.name, email: newUser.email },
            process.env.JWT_SECRET,
            { expiresIn: '1h' }
        );
        
        client.release();
        res.status(201).json({ token });

    } catch (error) {
        console.error('Error en el registro:', error);
        res.status(500).json({ message: 'Error interno del servidor.' });
    }
}