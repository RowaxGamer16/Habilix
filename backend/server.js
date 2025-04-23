import express from 'express';
import mysql from 'mysql2/promise';
import cors from 'cors';
import jwt from 'jsonwebtoken';
import { body, validationResult } from 'express-validator';
import dotenv from 'dotenv';
import multer from 'multer';
import path from 'path';
import { fileURLToPath } from 'url'; // Necesario para simular __dirname en ESM

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
app.use(cors());
app.use(express.json());

// Configuración de multer para almacenamiento de archivos
const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        cb(null, 'uploads/');
    },
    filename: (req, file, cb) => {
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
        cb(null, file.fieldname + '-' + uniqueSuffix + path.extname(file.originalname));
    }
});
const upload = multer({ storage: storage });

// Conexión a la base de datos
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
            return res.status(401).json({ error: 'Usuario no encontrado' });
        }

        req.user = results[0];
        next();
    } catch (err) {
        return res.status(401).json({ error: 'Token inválido' });
    }
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
        const [results] = await db.query('SELECT * FROM usuarios WHERE EMAIL = ?', [email]);

        if (results.length === 0 || results[0].PASSWORD !== password) {
            return res.status(401).json({ error: 'Correo o contraseña incorrectos' });
        }

        const user = results[0];
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

// Crear curso con imagen y asociar al usuario
app.post('/api/cursos', validateToken, upload.single('portada'), async (req, res) => {
    const { nombre, descripcion, categoria, precio, entrega, horario } = req.body;
    const portada = req.file ? `/uploads/${req.file.filename}` : '';
    const id_usuario = req.user.ID;  // Obtener el ID del usuario autenticado

    const query = `
        INSERT INTO cursos
        (nombre, descripcion, portada, categoria, precio, entrega, horario, ranking, opiniones, id_usuario)
        VALUES (?, ?, ?, ?, ?, ?, ?, 0, '[]', ?)
    `;

    try {
        const [result] = await db.query(query, [nombre, descripcion, portada, categoria, precio, entrega, horario, id_usuario]);
        res.json({ success: true, id: result.insertId });
    } catch (err) {
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
app.put('/api/cursos/:id', validateToken, upload.single('portada'), async (req, res) => {
    const idCurso = req.params.id;
    const { nombre, descripcion, categoria, precio, entrega, horario } = req.body;
    const portada = req.file ? `/uploads/${req.file.filename}` : null;

    try {
        const [cursos] = await db.query('SELECT * FROM cursos WHERE id = ? AND id_usuario = ?', [idCurso, req.user.ID]);
        if (cursos.length === 0) {
            return res.status(403).json({ error: 'No tienes permiso para editar este curso' });
        }

        const campos = ['nombre = ?', 'descripcion = ?', 'categoria = ?', 'precio = ?', 'entrega = ?', 'horario = ?'];
        const valores = [nombre, descripcion, categoria, precio, entrega, horario];

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
app.delete('/api/cursos/:id', validateToken, async (req, res) => {
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
app.post('/api/cursos/:id/materiales', validateToken, upload.array('materiales', 10), async (req, res) => {
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
app.delete('/api/cursos/:id/materiales', validateToken, async (req, res) => {
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

// Iniciar el servidor
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`Servidor corriendo en el puerto ${PORT}`);
});
