import express from 'express';
import mysql from 'mysql2/promise';
import cors from 'cors';
import jwt from 'jsonwebtoken';
import { body, validationResult } from 'express-validator';
import dotenv from 'dotenv';
import multer from 'multer';
import path from 'path';
import { fileURLToPath } from 'url';

// Configuración de entorno
dotenv.config();

// Configuración de rutas de archivos
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();

// Middlewares
app.use(cors({
    origin: process.env.FRONTEND_URL || 'http://localhost:8100',
    methods: ['GET', 'POST', 'PUT', 'DELETE'],
    allowedHeaders: ['Content-Type', 'Authorization']
}));
app.use(express.json());

// Configuración de Multer para subida de archivos
const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        cb(null, path.join(__dirname, 'uploads'));
    },
    filename: (req, file, cb) => {
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
        cb(null, file.fieldname + '-' + uniqueSuffix + path.extname(file.originalname));
    }
});
const upload = multer({ 
    storage: storage,
    limits: { fileSize: 5 * 1024 * 1024 } // 5MB
});

// Conexión a la base de datos
let db;

async function initializeDatabase() {
    try {
        db = await mysql.createPool({
            connectionLimit: 10,
            host: process.env.DB_HOST || 'localhost',
            user: process.env.DB_USER || 'root',
            password: process.env.DB_PASSWORD || '',
            database: process.env.DB_NAME || 'intercambio_de_abilidades',
            waitForConnections: true,
            queueLimit: 0
        });

        // Verificar y crear tablas con la estructura correcta
        await db.query(`
            CREATE TABLE IF NOT EXISTS roles (
                ID INT PRIMARY KEY,
                NOMBRE VARCHAR(50) NOT NULL
                /* Eliminado: DESCRIPCION VARCHAR(255) */
            )
        `);

        await db.query(`
            INSERT IGNORE INTO roles (ID, NOMBRE) 
            VALUES (1, 'user')
            /* Eliminado: , 'Usuario normal' */
        `);

        await db.query(`
            CREATE TABLE IF NOT EXISTS usuarios (
                ID INT AUTO_INCREMENT PRIMARY KEY,
                NOMBRE_USUARIO VARCHAR(100) NOT NULL,
                EMAIL VARCHAR(100) NOT NULL UNIQUE,
                PASSWORD VARCHAR(255) NOT NULL,
                ROLE INT DEFAULT 1,
                TELEFONO VARCHAR(20),
                FECHA_CREACION DATETIME DEFAULT CURRENT_TIMESTAMP
            )
        `);

        console.log('Base de datos inicializada correctamente');
    } catch (error) {
        console.error('Error al inicializar la base de datos:', error);
        throw error;
    }
}


// Ruta protegida para obtener perfil de usuario autenticado
app.get('/api/usuario/perfil', authenticateJWT, async (req, res) => {
    try {
      const userId = req.user.ID;
  
      const [result] = await pool.query(
        'SELECT id, nombre_usuario, email, role, telefono, fecha_creacion FROM usuarios WHERE id = ?',
        [userId]
      );
  
      if (result.length === 0) {
        return res.status(404).json({ error: 'Usuario no encontrado' });
      }
  
      res.json(result[0]);
    } catch (error) {
      console.error('Error al obtener perfil:', error.message);
      res.status(500).json({ error: 'Error al obtener el perfil del usuario' });
    }
  });

// Asegúrate de que 'authenticateJWT' sea un middleware que verifique el JWT y lo decodifique.
// Este middleware debe agregar la propiedad 'user' a 'req' con la información decodificada del token.

app.get('/api/usuario/:id', authenticateJWT, async (req, res) => {
    try {
      const userId = req.params.id;
  
      // Verificar que el usuario esté autenticado y que su ID coincida con el ID en la URL
      if (!req.user || req.user.ID !== parseInt(userId)) {
        return res.status(403).json({ error: 'No autorizado para ver este perfil' });
      }
  
      // Realizar la consulta a la base de datos para obtener los datos del usuario
      const [users] = await db.query(
        'SELECT ID, NOMBRE_USUARIO, EMAIL, ROLE, TELEFONO FROM usuarios WHERE ID = ?',
        [userId]
      );
  
      // Verificar si el usuario existe
      if (users.length === 0) {
        return res.status(404).json({ error: 'Usuario no encontrado' });
      }
  
      // Obtener los datos del usuario
      const user = users[0];
  
      // Enviar los datos del usuario como respuesta
      res.json({
        id: user.ID,
        nombre_usuario: user.NOMBRE_USUARIO,
        email: user.EMAIL,
        role: user.ROLE,
        telefono: user.TELEFONO || null,
      });
  
    } catch (error) {
      console.error('Error al obtener usuario:', error);
      res.status(500).json({ error: 'Error del servidor al obtener datos de usuario' });
    }
  });
  
// Rutas de autenticación
app.post('/api/login', [
    body('email').isEmail().normalizeEmail(),
    body('password').isLength({ min: 1 })
], async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
    }

    try {
        const [users] = await db.query(
            'SELECT * FROM usuarios WHERE EMAIL = ?', 
            [req.body.email.toLowerCase().trim()]
        );
        
        if (!users[0] || users[0].PASSWORD !== req.body.password.trim()) {
            return res.status(401).json({ error: 'Credenciales incorrectas' });
        }

        const user = users[0];
        const token = jwt.sign(
            { id: user.ID, role: user.ROLE },
            process.env.JWT_SECRET || 'secret',
            { expiresIn: '1h' }
        );

        return res.json({
            token,
            user: {
                ID: user.ID,
                NOMBRE_USUARIO: user.NOMBRE_USUARIO,
                EMAIL: user.EMAIL,
                ROLE: user.ROLE
            }
        });
    } catch (error) {
        console.error('Error en login:', error);
        return res.status(500).json({ error: 'Error del servidor' });
    }
});

app.post('/api/register', [
    body('nombre_usuario').notEmpty().trim().escape(),
    body('email').isEmail().normalizeEmail(),
    body('password').isLength({ min: 5 })
], async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) return res.status(400).json({ errors: errors.array() });

    try {
        const { nombre_usuario, email, password } = req.body;
        
        // Verificar si el email ya existe
        const [existing] = await db.query('SELECT ID FROM usuarios WHERE EMAIL = ?', [email.toLowerCase().trim()]);
        if (existing[0]) {
            return res.status(409).json({ error: 'El email ya está registrado' });
        }

        // Verificar que exista el rol por defecto (ID = 1)
        const [roleExists] = await db.query('SELECT ID FROM roles WHERE ID = 1');
        if (!roleExists[0]) {
            await db.query('INSERT INTO roles (ID, NOMBRE) VALUES (1, "user")');
        }

        // Insertar nuevo usuario asegurando el ROLE
        const [result] = await db.query(
            `INSERT INTO usuarios (NOMBRE_USUARIO, EMAIL, PASSWORD, ROLE) 
             VALUES (?, ?, ?, 1)`, // Asignamos ROLE = 1 explícitamente
            [nombre_usuario.trim(), email.toLowerCase().trim(), password.trim()]
        );

        // Generar token JWT
        const token = jwt.sign(
            { id: result.insertId, role: 1 },
            process.env.JWT_SECRET || 'secret',
            { expiresIn: '24h' }
        );

        return res.status(201).json({
            token,
            user: {
                ID: result.insertId,
                NOMBRE_USUARIO: nombre_usuario.trim(),
                EMAIL: email.toLowerCase().trim(),
                ROLE: 1
            }
        });
    } catch (error) {
        console.error('Error en registro:', error);
        
        if (error.code === 'ER_NO_REFERENCED_ROW_2') {
            return res.status(500).json({ 
                error: 'Error de configuración: rol por defecto no existe',
                details: 'El sistema no pudo asignar un rol al usuario'
            });
        }
        
        return res.status(500).json({ 
            error: 'Error al registrar usuario',
            details: process.env.NODE_ENV === 'development' ? error.message : undefined
        });
    }
});

// Middleware de autenticación JWT
const authenticateJWT = async (req, res, next) => {
    // Obtener el token de la cabecera Authorization
    const token = req.headers['authorization']?.split(' ')[1];
    
    // Si no se proporciona el token
    if (!token) {
        return res.status(403).json({ error: 'Token no proporcionado' });
    }

    try {
        // Verificar el token y decodificarlo
        const decoded = jwt.verify(token, process.env.JWT_SECRET || 'token');

        // Obtener el usuario a partir del ID decodificado
        req.user = await getUserById(decoded.id);

        // Si no se encuentra el usuario
        if (!req.user) {
            return res.status(401).json({ error: 'Usuario no encontrado' });
        }

        // Continuar con la siguiente función del middleware
        next();
    } catch (err) {
        // Si hay un error al verificar el token
        return res.status(401).json({ error: 'Token inválido o expirado' });
    }
};

// Función para obtener el usuario desde la base de datos por ID
async function getUserById(id) {
    try {
        // Realizar una consulta a la base de datos para obtener el usuario
        const [user] = await db.query('SELECT * FROM usuarios WHERE ID = ?', [id]);

        // Si no se encuentra el usuario, devolvemos null
        return user.length > 0 ? user[0] : null;
    } catch (err) {
        console.error('Error al obtener el usuario:', err);
        throw err; // Propagar el error
    }
}


app.post('/api/cursos', authenticateJWT, upload.single('portada'), async (req, res) => {
    try {
        // Los campos vienen en req.body para los textos y req.file para la imagen
        const { nombre, descripcion, profesor, categoria, precio, entrega, horario } = req.body;
        const portada = req.file ? `/uploads/${req.file.filename}` : '';
        const id_usuario = req.user.ID;

        // Convertir precio a número
        const precioNum = parseFloat(precio) || 0;

        const query = `INSERT INTO cursos...`;
        const [result] = await db.query(query, [
            nombre,
            descripcion,
            profesor,
            portada,
            categoria,
            precioNum, // Asegurar que es número
            entrega,
            horario,
            id_usuario
        ]);

        res.json({ 
            success: true, 
            id: result.insertId,
            portada // Devolver la ruta de la imagen para que el frontend la muestre
        });
    } catch (err) {
        console.error('Error al crear curso:', err);
        res.status(500).json({ error: 'Error al crear el curso' });
    }
});


// Obtener todos los cursos
app.get('/api/cursos', async (req, res) => {
    try {
        const [results] = await db.query('SELECT * FROM cursos');
        res.json(results);
    } catch (err) {
        res.status(500).json({ error: 'Error al obtener los cursos' });
    }
});

// Obtener un curso por ID
app.get('/api/cursos/:id', async (req, res) => {
    const id = req.params.id;
    try {
        const [results] = await db.query('SELECT * FROM cursos WHERE id = ?', [id]);
        res.json(results[0]);
    } catch (err) {
        res.status(500).json({ error: 'Error al obtener el curso' });
    }
});

// Editar curso
app.put('/api/cursos/:id', authenticateJWT, upload.single('portada'), async (req, res) => {
    const idCurso = req.params.id;
    const { nombre, descripcion, profesor, categoria, precio, entrega, horario } = req.body;
    const portada = req.file ? `/uploads/${req.file.filename}` : null;

    try {
        const [cursos] = await db.query('SELECT * FROM cursos WHERE id = ? AND id_usuario = ?', [idCurso, req.user.ID]);
        if (cursos.length === 0) {
            return res.status(403).json({ error: 'No tienes permiso para editar este curso' });
        }

        const campos = ['nombre = ?', 'descripcion = ?', 'profesor = ?',  'categoria = ?', 'precio = ?', 'entrega = ?', 'horario = ?'];
        const valores = [nombre, descripcion, profesor,  categoria, precio, entrega, horario];

        if (portada) {
            campos.push('portada = ?');
            valores.push(portada);
        }

        valores.push(idCurso);

        await db.query(`UPDATE cursos SET ${campos.join(', ')} WHERE id = ?`, valores);
        res.json({ success: true });
    } catch (err) {
        res.status(500).json({ error: 'Error al actualizar el curso' });
    }
});

// Eliminar curso
app.delete('/api/cursos/:id', authenticateJWT, async (req, res) => {
    const idCurso = req.params.id;

    try {
        const [cursos] = await db.query('SELECT * FROM cursos WHERE id = ? AND id_usuario = ?', [idCurso, req.user.ID]);
        if (cursos.length === 0) {
            return res.status(403).json({ error: 'No tienes permiso para eliminar este curso' });
        }

        await db.query('DELETE FROM cursos WHERE id = ?', [idCurso]);
        res.json({ success: true });
    } catch (err) {
        res.status(500).json({ error: 'Error al eliminar el curso' });
    }
});

// Agregar un comentario
app.post('/api/cursos/:id/comentario', async (req, res) => {
    const id = req.params.id;
    const { comentario } = req.body;

    const query = `
        UPDATE cursos
        SET opiniones = JSON_ARRAY_APPEND(opiniones, '$', ?)
        WHERE id = ?
    `;

    try {
        await db.query(query, [comentario, id]);
        res.json({ success: true });
    } catch (err) {
        res.status(500).json({ error: 'Error al agregar el comentario' });
    }
});

// Actualizar ranking
app.put('/api/cursos/:id/ranking', async (req, res) => {
    const id = req.params.id;
    const { ranking } = req.body;

    try {
        await db.query('UPDATE cursos SET ranking = ? WHERE id = ?', [ranking, id]);
        res.json({ success: true });
    } catch (err) {
        res.status(500).json({ error: 'Error al actualizar el ranking' });
    }
});

// Agregar materiales al curso
app.post('/api/cursos/:id/materiales', authenticateJWT, upload.array('materiales', 10), async (req, res) => {
    const idCurso = req.params.id;

    try {
        const [cursos] = await db.query('SELECT * FROM cursos WHERE id = ? AND id_usuario = ?', [idCurso, req.user.ID]);
        if (cursos.length === 0) {
            return res.status(403).json({ error: 'No tienes permiso para modificar este curso' });
        }

        const archivos = req.files.map(file => `/uploads/${file.filename}`);
        const materialesActuales = JSON.parse(cursos[0].imagenes_materiales || '[]');
        const nuevosMateriales = [...materialesActuales, ...archivos];

        await db.query('UPDATE cursos SET imagenes_materiales = ? WHERE id = ?', [JSON.stringify(nuevosMateriales), idCurso]);

        res.json({ success: true, nuevosMateriales });
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Error al agregar materiales' });
    }
});

// Eliminar materiales del curso
app.delete('/api/cursos/:id/materiales', authenticateJWT, async (req, res) => {
    const idCurso = req.params.id;
    const { archivo } = req.body;

    try {
        const [cursos] = await db.query('SELECT * FROM cursos WHERE id = ? AND id_usuario = ?', [idCurso, req.user.ID]);
        if (cursos.length === 0) {
            return res.status(403).json({ error: 'No tienes permiso para modificar este curso' });
        }

        const materialesActuales = JSON.parse(cursos[0].imagenes_materiales || '[]');
        const nuevosMateriales = materialesActuales.filter(material => material !== archivo);

        await db.query('UPDATE cursos SET imagenes_materiales = ? WHERE id = ?', [JSON.stringify(nuevosMateriales), idCurso]);

        res.json({ success: true, nuevosMateriales });
    } catch (err) {
        res.status(500).json({ error: 'Error al eliminar material' });
    }
});

// Servir archivos estáticos
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// Manejador de errores global
app.use((err, req, res, next) => {
    console.error(err.stack);
    res.status(500).json({ error: 'Error interno del servidor' });
});

// Iniciar servidor
initializeDatabase()
    .then(() => {
        const PORT = process.env.PORT || 5000;
        app.listen(PORT, () => {
            console.log(`Servidor corriendo en http://localhost:${PORT}`);
        });
    })
    .catch(error => {
        console.error('No se pudo iniciar el servidor:', error);
        process.exit(1);
    });