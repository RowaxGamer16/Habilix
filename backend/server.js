const express = require('express');
const mysql = require('mysql2');
const cors = require('cors');
const jwt = require('jsonwebtoken');
require('dotenv').config(); // Cargar variables de entorno

const app = express();
app.use(cors());
app.use(express.json());

// Conexión con la base de datos
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

// Middleware para validar el token y el id de la base de datos
const validateToken = (req, res, next) => {
    const token = req.headers['authorization']?.split(' ')[1]; // Obtener el token del encabezado Authorization

    if (!token) {
        return res.status(403).json({ error: 'Acceso denegado, no se proporcionó token' });
    }

    jwt.verify(token, process.env.JWT_SECRET || 'token', async (err, decoded) => {
        if (err) {
            return res.status(401).json({ error: 'Token inválido' });
        }

        // Extraer el id del usuario del token
        const userId = decoded.id;

        // Validar el id del usuario en la base de datos
        const [results] = await db.promise().query('SELECT * FROM usuarios WHERE ID = ?', [userId]);
        
        if (results.length === 0) {
            return res.status(401).json({ error: 'Usuario no encontrado en la base de datos' });
        }

        // Si el usuario existe, asignamos el usuario al request
        req.user = results[0];
        next();
    });
};

// Ruta para obtener los datos del usuario
app.get('/api/usuario', validateToken, (req, res) => {
    const { user } = req;
    res.json({
        id: user.ID,
        nombre_usuario: user.NOMBRE_USUARIO,
        email: user.EMAIL,
        role: user.ROLE,
    });
});

// Ruta de login
app.post('/api/login', async (req, res) => {
    const { email, password } = req.body;

    // Validación básica
    if (!email || !password) {
        return res.status(400).json({ error: 'Correo y contraseña son requeridos' });
    }

    try {
        // Verificar si el usuario existe
        const [results] = await db.promise().query('SELECT * FROM usuarios WHERE EMAIL = ?', [email]);

        if (results.length === 0) {
            return res.status(404).json({ error: 'Usuario no encontrado' });
        }

        const user = results[0];

        // Verificar la contraseña (esto debe ser encriptado en la base de datos)
        if (user.PASSWORD !== password) { // Esto es solo un ejemplo, deberías usar un método seguro como bcrypt
            return res.status(401).json({ error: 'Contraseña incorrecta' });
        }

        // Crear un JWT
        const token = jwt.sign({ id: user.ID }, process.env.JWT_SECRET || 'token', { expiresIn: '1h' });

        // Responder con el token y la información del usuario
        res.json({ token, usuario: { ID: user.ID, NOMBRE_USUARIO: user.NOMBRE_USUARIO, EMAIL: user.EMAIL, ROLE: user.ROLE } });
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Error del servidor' });
    }
});

// Iniciar servidor
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
    console.log(`🚀 Servidor corriendo en http://localhost:${PORT}`);
});
