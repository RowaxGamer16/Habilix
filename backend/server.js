const express = require('express');
const mysql = require('mysql2');
const cors = require('cors');
const jwt = require('jsonwebtoken');
const { body, validationResult } = require('express-validator');
require('dotenv').config();

const app = express();
app.use(cors());
app.use(express.json());

// Configuración de la conexión a la base de datos
const db = mysql.createPool({
    connectionLimit: 10,
    host: process.env.DB_HOST || 'localhost',
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD || '',
    database: process.env.DB_NAME || 'intercambio_de_abilidades',
});

// Verificar conexión a la base de datos
db.getConnection((err, connection) => {
    if (err) {
        console.error('❌ Error conectando a la base de datos:', err.message);
        return;
    }
    console.log('✅ Conectado a la base de datos MySQL');
    connection.release();
});

// Middleware para validar el token JWT
const validateToken = (req, res, next) => {
    const token = req.headers['authorization']?.split(' ')[1];

    if (!token) {
        return res.status(403).json({ error: 'Acceso denegado, no se proporcionó token' });
    }

    jwt.verify(token, process.env.JWT_SECRET || 'token', async (err, decoded) => {
        if (err) {
            return res.status(401).json({ error: 'Token inválido' });
        }

        const userId = decoded.id;

        const [results] = await db.promise().query('SELECT * FROM usuarios WHERE ID = ?', [userId]);
        
        if (results.length === 0) {
            return res.status(401).json({ error: 'Usuario no encontrado en la base de datos' });
        }

        req.user = results[0];
        next();
    });
};

// Ruta de login
app.post('/api/login', [
    body('email').isEmail().normalizeEmail(),
    body('password').isLength({ min: 5 }),
], async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
    }

    const { email, password } = req.body;

    try {
        const [results] = await db.promise().query('SELECT * FROM usuarios WHERE EMAIL = ?', [email]);

        if (results.length === 0) {
            return res.status(404).json({ error: 'Usuario no encontrado' });
        }

        const user = results[0];

        // Comparar la contraseña en texto plano
        if (user.PASSWORD !== password) {
            return res.status(401).json({ error: 'Contraseña incorrecta' });
        }

        // Crear un JWT
        const token = jwt.sign({ id: user.ID }, process.env.JWT_SECRET || 'token', { expiresIn: '1h' });

        res.json({ 
            token, 
            usuario: { 
                ID: user.ID, 
                NOMBRE_USUARIO: user.NOMBRE_USUARIO, 
                EMAIL: user.EMAIL, 
                ROLE: user.ROLE,
                TELEFONO: user.TELEFONO,
                FECHA_CREACION: user.FECHA_CREACION
            } 
        });
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Error del servidor' });
    }
});

// Ruta de registro
app.post('/api/register', [
    body('nombre_usuario').notEmpty().trim(),
    body('email').isEmail().normalizeEmail(),
    body('password').isLength({ min: 5 }),
], async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
    }

    const { nombre_usuario, email, password, telefono } = req.body;

    try {
        // Verificar si el email ya está registrado
        const [existingUser] = await db.promise().query('SELECT * FROM usuarios WHERE EMAIL = ?', [email]);
        if (existingUser.length > 0) {
            return res.status(400).json({ error: 'El correo electrónico ya está registrado' });
        }

        // Insertar el nuevo usuario en la base de datos
        const [result] = await db.promise().query(
            'INSERT INTO usuarios (NOMBRE_USUARIO, EMAIL, PASSWORD, ROLE, TELEFONO) VALUES (?, ?, ?, ?, ?)',
            [nombre_usuario, email, password, 1, telefono || null]
        );

        // Crear un JWT para el nuevo usuario
        const token = jwt.sign({ id: result.insertId }, process.env.JWT_SECRET || 'token', { expiresIn: '1h' });

        // Obtener el usuario recién creado
        const [newUser] = await db.promise().query('SELECT * FROM usuarios WHERE ID = ?', [result.insertId]);

        // Responder con el token y la información del usuario
        res.status(201).json({
            token,
            usuario: {
                ID: newUser[0].ID,
                NOMBRE_USUARIO: newUser[0].NOMBRE_USUARIO,
                EMAIL: newUser[0].EMAIL,
                ROLE: newUser[0].ROLE,
                TELEFONO: newUser[0].TELEFONO,
                FECHA_CREACION: newUser[0].FECHA_CREACION
            },
        });
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Error en el servidor' });
    }
});

// Ruta para obtener todos los usuarios (solo admin)
app.get('/api/usuarios', validateToken, async (req, res) => {
    if (req.user.ROLE !== 2) {
        return res.status(403).json({ error: 'Acceso denegado. Solo para administradores' });
    }

    try {
        const [results] = await db.promise().query(
            'SELECT ID, NOMBRE_USUARIO, EMAIL, TELEFONO, FECHA_CREACION, ROLE FROM usuarios ORDER BY FECHA_CREACION DESC'
        );
        res.json(results);
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Error al obtener usuarios' });
    }
});

// Ruta para obtener un usuario específico
app.get('/api/usuario/:id', validateToken, async (req, res) => {
    const userId = req.params.id;

    try {
        const [results] = await db.promise().query('SELECT * FROM usuarios WHERE ID = ?', [userId]);

        if (results.length === 0) {
            return res.status(404).json({ error: 'Usuario no encontrado' });
        }

        const user = results[0];
        
        res.json({
            ID: user.ID,
            NOMBRE_USUARIO: user.NOMBRE_USUARIO,
            EMAIL: user.EMAIL,
            TELEFONO: user.TELEFONO,
            ROLE: user.ROLE,
            FECHA_CREACION: user.FECHA_CREACION
        });
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Error del servidor' });
    }
});

// Ruta para actualizar un usuario
app.put('/api/usuario/:id', validateToken, [
    body('nombre_usuario').notEmpty().trim(),
    body('email').isEmail().normalizeEmail(),
], async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
    }

    const userId = req.params.id;
    const { nombre_usuario, email, telefono, role } = req.body;

    try {
        // Verificar si el email ya está registrado por otro usuario
        const [existingUser] = await db.promise().query(
            'SELECT * FROM usuarios WHERE EMAIL = ? AND ID != ?',
            [email, userId]
        );
        
        if (existingUser.length > 0) {
            return res.status(400).json({ error: 'El correo electrónico ya está en uso por otro usuario' });
        }

        // Actualizar el usuario
        await db.promise().query(
            'UPDATE usuarios SET NOMBRE_USUARIO = ?, EMAIL = ?, TELEFONO = ?, ROLE = ? WHERE ID = ?',
            [nombre_usuario, email, telefono || null, role || 1, userId]
        );

        // Obtener el usuario actualizado
        const [updatedUser] = await db.promise().query('SELECT * FROM usuarios WHERE ID = ?', [userId]);

        res.json({
            ID: updatedUser[0].ID,
            NOMBRE_USUARIO: updatedUser[0].NOMBRE_USUARIO,
            EMAIL: updatedUser[0].EMAIL,
            TELEFONO: updatedUser[0].TELEFONO,
            ROLE: updatedUser[0].ROLE,
            FECHA_CREACION: updatedUser[0].FECHA_CREACION
        });
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Error al actualizar usuario' });
    }
});

// Ruta para eliminar usuario (solo admin)
app.delete('/api/usuarios/:id', validateToken, async (req, res) => {
    if (req.user.ROLE !== 2) {
        return res.status(403).json({ error: 'Acceso denegado. Solo para administradores' });
    }

    const userId = req.params.id;

    try {
        // Verificar que no se elimine a sí mismo
        if (req.user.ID === parseInt(userId)) {
            return res.status(400).json({ error: 'No puedes eliminarte a ti mismo' });
        }

        const [result] = await db.promise().query('DELETE FROM usuarios WHERE ID = ?', [userId]);

        if (result.affectedRows === 0) {
            return res.status(404).json({ error: 'Usuario no encontrado' });
        }

        res.json({ message: 'Usuario eliminado correctamente' });
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Error al eliminar usuario' });
    }
});

// Iniciar servidor
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
    console.log(`🚀 Servidor corriendo en http://localhost:${PORT}`);
});