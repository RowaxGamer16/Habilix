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

        res.json({ token, usuario: { ID: user.ID, NOMBRE_USUARIO: user.NOMBRE_USUARIO, EMAIL: user.EMAIL, ROLE: user.ROLE } });
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

    const { nombre_usuario, email, password } = req.body;

    try {
        // Verificar si el email ya está registrado
        const [existingUser] = await db.promise().query('SELECT * FROM usuarios WHERE EMAIL = ?', [email]);
        if (existingUser.length > 0) {
            return res.status(400).json({ error: 'El correo electrónico ya está registrado' });
        }

        // Insertar el nuevo usuario en la base de datos (sin hashear la contraseña)
        const [result] = await db.promise().query(
            'INSERT INTO usuarios (NOMBRE_USUARIO, EMAIL, PASSWORD, ROLE) VALUES (?, ?, ?, ?)',
            [nombre_usuario, email, password, 1] // Rol por defecto: 1 (usuario normal)
        );

        // Crear un JWT para el nuevo usuario
        const token = jwt.sign({ id: result.insertId }, process.env.JWT_SECRET || 'token', { expiresIn: '1h' });

        // Responder con el token y la información del usuario
        res.status(201).json({
            token,
            usuario: {
                ID: result.insertId,
                NOMBRE_USUARIO: nombre_usuario,
                EMAIL: email,
                ROLE: 1, // Rol por defecto
            },
        });
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Error en el servidor' });
    }
});


app.get('/api/usuario/:id', validateToken, async (req, res) => {
    const userId = req.params.id;

    try {
        // Obtener el usuario de la base de datos
        const [results] = await db.promise().query('SELECT * FROM usuarios WHERE ID = ?', [userId]);

        if (results.length === 0) {
            return res.status(404).json({ error: 'Usuario no encontrado' });
        }

        const user = results[0];

        // Responder con los datos del usuario
        res.json({
            id: user.ID,
            nombre_usuario: user.NOMBRE_USUARIO, // Asegúrate de que esta columna exista en la base de datos
            email: user.EMAIL,
            role: user.ROLE,
        });
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Error del servidor' });
    }
});



const express = require('express');
const router = express.Router();

// Obtener todos los cursos
router.get('/cursos', (req, res) => {
    db.query('SELECT * FROM cursos', (err, results) => {
        if (err) {
            return res.status(500).json({ error: err.message });
        }
        res.json(results);
    });
});

// Obtener un curso por ID
router.get('/cursos/:id', (req, res) => {
    const cursoId = req.params.id;
    db.query('SELECT * FROM cursos WHERE Id = ?', [cursoId], (err, results) => {
        if (err) {
            return res.status(500).json({ error: err.message });
        }
        if (results.length === 0) {
            return res.status(404).json({ error: 'Curso no encontrado' });
        }
        res.json(results[0]);
    });
});

// Crear un nuevo curso
router.post('/cursos', (req, res) => {
    const { nombre, descripcion, portada, indico, imagenes_materiales, ranking, opiniones } = req.body;
    db.query(
        'INSERT INTO cursos (nombre, descripcion, portada, indico, imagenes_materiales, ranking, opiniones) VALUES (?, ?, ?, ?, ?, ?, ?)',
        [nombre, descripcion, portada, indico, imagenes_materiales, ranking, opiniones],
        (err, results) => {
            if (err) {
                return res.status(500).json({ error: err.message });
            }
            res.status(201).json({ id: results.insertId });
        }
    );
});

// Actualizar un curso
router.put('/cursos/:id', (req, res) => {
    const cursoId = req.params.id;
    const { nombre, descripcion, portada, indico, imagenes_materiales, ranking, opiniones } = req.body;
    db.query(
        'UPDATE cursos SET nombre = ?, descripcion = ?, portada = ?, indico = ?, imagenes_materiales = ?, ranking = ?, opiniones = ? WHERE Id = ?',
        [nombre, descripcion, portada, indico, imagenes_materiales, ranking, opiniones, cursoId],
        (err, results) => {
            if (err) {
                return res.status(500).json({ error: err.message });
            }
            res.json({ message: 'Curso actualizado correctamente' });
        }
    );
});

// Eliminar un curso
router.delete('/cursos/:id', (req, res) => {
    const cursoId = req.params.id;
    db.query('DELETE FROM cursos WHERE Id = ?', [cursoId], (err, results) => {
        if (err) {
            return res.status(500).json({ error: err.message });
        }
        res.json({ message: 'Curso eliminado correctamente' });
    });
});

module.exports = router;

const express = require('express');
const cursosRouter = require('./routes/cursos'); // Asegúrate de que la ruta sea correcta

app.use(express.json());

app.use('/api', cursosRouter);


const express = require('express');

const db = require('../config/db'); // Asegúrate de que la conexión a la base de datos esté configurada

// Obtener todos los cursos (requiere autenticación)
router.get('/cursos', (req, res) => {
    const token = req.headers['authorization']?.split(' ')[1];

    if (!token) {
        return res.status(401).json({ error: 'Acceso denegado, no se proporcionó token' });
    }

    // Verificar el token (puedes usar un middleware como `validateToken`)
    jwt.verify(token, process.env.JWT_SECRET || 'token', async (err, decoded) => {
        if (err) {
            return res.status(401).json({ error: 'Token inválido' });
        }

        try {
            const [results] = await db.promise().query('SELECT * FROM cursos');
            res.json(results);
        } catch (error) {
            console.error(error);
            res.status(500).json({ error: 'Error del servidor' });
        }
    });
});

module.exports = router;

// Iniciar servidor
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
    console.log(`🚀 Servidor corriendo en http://localhost:${PORT}`);
    
});
