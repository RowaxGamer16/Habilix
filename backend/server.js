import express from 'express';
import mysql from 'mysql2/promise';
import cors from 'cors';
import jwt from 'jsonwebtoken';
import { body, validationResult } from 'express-validator';
import dotenv from 'dotenv';

dotenv.config();

const app = express();
app.use(cors());
app.use(express.json());

// Configuración de la conexión a la base de datos
const db = await mysql.createPool({
    connectionLimit: 10,
    host: process.env.DB_HOST || 'localhost',
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD || '',
    database: process.env.DB_NAME || 'intercambio_de_abilidades',
});

// Middleware para validar el token JWT
const validateToken = async (req, res, next) => {
    const token = req.headers['authorization']?.split(' ')[1];
    if (!token) {
        return res.status(403).json({ error: 'Acceso denegado, no se proporcionó token' });
    }
    try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET || 'token');
        const [results] = await db.query('SELECT * FROM usuarios WHERE ID = ?', [decoded.id]);
        if (results.length === 0) {
            return res.status(401).json({ error: 'Usuario no encontrado en la base de datos' });
        }
        req.user = results[0];
        next();
    } catch (err) {
        return res.status(401).json({ error: 'Token inválido o expirado' });
    }
};

// Ruta de login
app.post('/api/login', [
    body('email').isEmail().withMessage('Correo electrónico inválido').normalizeEmail(),
    body('password').notEmpty().withMessage('La contraseña es obligatoria')
], async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
    }
    const { email, password } = req.body;
    try {
        const [results] = await db.query('SELECT * FROM usuarios WHERE EMAIL = ?', [email]);
        if (results.length === 0 || results[0].PASSWORD !== password) {
            return res.status(401).json({ error: 'Correo o contraseña incorrectos' });
        }
        const user = results[0];
        const token = jwt.sign({ id: user.ID }, process.env.JWT_SECRET || 'token', { expiresIn: '1h' });
        res.json({
            token,
            usuario: { ID: user.ID, NOMBRE_USUARIO: user.NOMBRE_USUARIO, EMAIL: user.EMAIL, ROLE: user.ROLE }
        });
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Error del servidor' });
    }
});

// Ruta de registro
app.post('/api/register', [
    body('nombre_usuario').notEmpty().withMessage('El nombre de usuario es obligatorio').trim(),
    body('email').isEmail().withMessage('Correo electrónico inválido').normalizeEmail(),
    body('password').notEmpty().withMessage('La contraseña es obligatoria')
], async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
    }
    const { nombre_usuario, email, password } = req.body;
    try {
        const [existingEmail] = await db.query('SELECT * FROM usuarios WHERE EMAIL = ?', [email]);
        if (existingEmail.length > 0) {
            return res.status(400).json({ error: 'El correo electrónico ya está registrado' });
        }
        const [existingUsername] = await db.query('SELECT * FROM usuarios WHERE NOMBRE_USUARIO = ?', [nombre_usuario]);
        if (existingUsername.length > 0) {
            return res.status(400).json({ error: 'El nombre de usuario ya está en uso' });
        }
        const [result] = await db.query(
            'INSERT INTO usuarios (NOMBRE_USUARIO, EMAIL, PASSWORD, ROLE) VALUES (?, ?, ?, ?)',
            [nombre_usuario, email, password, 1]
        );
        const token = jwt.sign({ id: result.insertId }, process.env.JWT_SECRET || 'token', { expiresIn: '1h' });
        res.status(201).json({
            token,
            usuario: { ID: result.insertId, NOMBRE_USUARIO: nombre_usuario, EMAIL: email, ROLE: 1 }
        });
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Error en el servidor' });
    }
});

// Iniciar servidor
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
    console.log(`🚀 Servidor corriendo en http://localhost:${PORT}`);
});