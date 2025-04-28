import express from 'express';
import mysql from 'mysql2/promise';
import cors from 'cors';
import jwt from 'jsonwebtoken';
import { body, validationResult } from 'express-validator';
import dotenv from 'dotenv';
import multer from 'multer';
import path from 'path';
import { fileURLToPath } from 'url';
import fs from 'fs';
import { promisify } from 'util';

const unlinkAsync = promisify(fs.unlink);

// Configuración inicial
dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
app.use(cors());
app.use(express.json());

// Configuración de Multer para subida de archivos
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
console.log('✅ Conectado a la base de datos');

const validateToken = async (req, res, next) => {
    const authHeader = req.headers['authorization'];
    if (!authHeader) return res.status(403).json({ error: 'No se proporcionó token' });
  
    const token = authHeader.split(' ')[1];
    console.log('🔐 Token recibido:', token);
  
    try {
      const decoded = jwt.verify(token, process.env.JWT_SECRET || 'token');
      console.log('✅ Token decodificado:', decoded);
  
      const [results] = await db.query('SELECT * FROM usuarios WHERE ID = ?', [decoded.id]);
      if (results.length === 0) return res.status(401).json({ error: 'Usuario no encontrado' });
  
      req.user = results[0];
      next();
    } catch (err) {
      console.error('❌ Error al verificar token:', err.message);
      return res.status(401).json({ 
        error: 'Token inválido',
        details: process.env.NODE_ENV === 'development' ? err.message : undefined
      });
    }
  };

// Rutas de autenticación
app.post('/api/login', [
    body('email').isEmail().normalizeEmail(),
    body('password').isLength({ min: 5 }),
], async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) return res.status(400).json({ errors: errors.array() });

    const { email, password } = req.body;
    console.log('📩 Intento de login:', email);

    try {
        const [results] = await db.query('SELECT * FROM usuarios WHERE EMAIL = ?', [email]);

        if (results.length === 0 || results[0].PASSWORD !== password) {
            console.log('❌ Login fallido');
            return res.status(401).json({ error: 'Correo o contraseña incorrectos' });
        }

        const user = results[0];
        const token = jwt.sign({ id: user.ID }, process.env.JWT_SECRET || 'token', { expiresIn: '1h' });

        console.log('✅ Login exitoso');
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
        console.error('❌ Error en login:', error);
        res.status(500).json({ error: 'Error del servidor' });
    }
});


app.post('/api/register', [
    body('nombre_usuario').isLength({ min: 3 }).withMessage('El nombre debe tener al menos 3 caracteres'),
    body('email').isEmail().normalizeEmail().withMessage('Ingrese un email válido'),
    body('password').isLength({ min: 5 }).withMessage('La contraseña debe tener al menos 5 caracteres'),
], async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        return res.status(400).json({ 
            error: 'Error de validación',
            details: errors.array().map(err => err.msg) 
        });
    }

    const { nombre_usuario, email, password } = req.body;
    console.log('📩 Intento de registro:', email);

    try {
        // Verificar si el email ya existe
        const [existingUsers] = await db.query('SELECT * FROM usuarios WHERE EMAIL = ?', [email]);
        if (existingUsers.length > 0) {
            return res.status(400).json({ error: 'El correo ya está registrado' });
        }

        // Insertar nuevo usuario (sin hashear la contraseña)
        const [result] = await db.query(
            'INSERT INTO usuarios (NOMBRE_USUARIO, EMAIL, PASSWORD, ROLE, FECHA_CREACION) VALUES (?, ?, ?, "user", NOW())',
            [nombre_usuario, email, password] // Contraseña en texto plano
        );

        // Crear token
        const token = jwt.sign({ id: result.insertId }, process.env.JWT_SECRET || 'token', { expiresIn: '1h' });

        console.log('✅ Usuario registrado:', result.insertId);
        res.json({
            token,
            usuario: {
                ID: result.insertId,
                NOMBRE_USUARIO: nombre_usuario,
                EMAIL: email,
                ROLE: 'user'
            }
        });
    } catch (error) {
        console.error('❌ Error en registro:', error);
        res.status(500).json({ 
            error: 'Error del servidor al registrar usuario',
            details: process.env.NODE_ENV === 'development' ? error.message : undefined
        });
    }
});


// Ruta para obtener información del usuario autenticado
app.get('/api/usuario', validateToken, async (req, res) => {
    try {
        res.json({
            usuario: {
                ID: req.user.ID,
                NOMBRE_USUARIO: req.user.NOMBRE_USUARIO,
                EMAIL: req.user.EMAIL,
                ROLE: req.user.ROLE,
                TELEFONO: req.user.TELEFONO,
                FECHA_CREACION: req.user.FECHA_CREACION
            }
        });
    } catch (error) {
        console.error('Error al obtener usuario:', error);
        res.status(500).json({ error: 'Error del servidor' });
    }
});

// Rutas de cursos
app.post('/api/cursos', validateToken, upload.single('portada'), async (req, res) => {
    const { nombre, descripcion, categoria, precio, entrega, horario } = req.body;
    const portada = req.file ? `/uploads/${req.file.filename}` : '';
    const id_usuario = req.user.ID;

    console.log('📚 Creando curso:', { nombre, id_usuario });

    try {
        const query = `
            INSERT INTO cursos (nombre, descripcion, portada, categoria, precio, entrega, horario, ranking, opiniones, id_usuario, imagenes_materiales)
            VALUES (?, ?, ?, ?, ?, ?, ?, 0, '[]', ?, '[]')
        `;
        const [result] = await db.query(query, [nombre, descripcion, portada, categoria, precio, entrega, horario, id_usuario]);

        res.json({ success: true, id: result.insertId });
        console.log('✅ Curso creado:', result.insertId);
    } catch (err) {
        console.error('❌ Error al crear curso:', err);
        res.status(500).json({ error: 'Error al crear el curso' });
    }
});

// Obtener todos los cursos
app.get('/api/cursos', async (req, res) => {
    try {
        const [results] = await db.query(`
            SELECT c.*, u.NOMBRE_USUARIO as profesor 
            FROM cursos c
            JOIN usuarios u ON c.id_usuario = u.ID
        `);
        console.log('📥 Cursos obtenidos');
        res.json(results);
    } catch (err) {
        console.error('❌ Error al obtener cursos:', err);
        res.status(500).json({ error: 'Error al obtener los cursos' });
    }
});

// Obtener un curso por ID
app.get('/api/cursos/:id', async (req, res) => {
    const id = req.params.id;
    try {
        const [results] = await db.query(`
            SELECT c.*, u.NOMBRE_USUARIO as profesor 
            FROM cursos c
            JOIN usuarios u ON c.id_usuario = u.ID
            WHERE c.id = ?
        `, [id]);
        
        if (results.length === 0) {
            return res.status(404).json({ error: 'Curso no encontrado' });
        }
        
        console.log('📥 Curso obtenido:', id);
        res.json(results[0]);
    } catch (err) {
        console.error('❌ Error al obtener el curso:', err);
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
        if (cursos.length === 0) return res.status(403).json({ error: 'No tienes permiso para editar este curso' });

        const campos = ['nombre = ?', 'descripcion = ?', 'categoria = ?', 'precio = ?', 'entrega = ?', 'horario = ?'];
        const valores = [nombre, descripcion, categoria, precio, entrega, horario];

        if (portada) {
            campos.push('portada = ?');
            valores.push(portada);
            
            // Eliminar la imagen anterior si existe
            if (cursos[0].portada) {
                const oldImagePath = path.join(__dirname, cursos[0].portada);
                unlinkAsync(oldImagePath).catch(err => console.error('Error al borrar imagen anterior:', err));
            }
        }

        valores.push(idCurso);

        await db.query(`UPDATE cursos SET ${campos.join(', ')} WHERE id = ?`, valores);
        console.log('📝 Curso actualizado:', idCurso);
        res.json({ success: true });
    } catch (err) {
        console.error('❌ Error al actualizar el curso:', err);
        res.status(500).json({ error: 'Error al actualizar el curso' });
    }
});

// Eliminar curso
app.delete('/api/cursos/:id', validateToken, async (req, res) => {
    const idCurso = req.params.id;

    try {
        const [cursos] = await db.query('SELECT * FROM cursos WHERE id = ? AND id_usuario = ?', [idCurso, req.user.ID]);
        if (cursos.length === 0) return res.status(403).json({ error: 'No tienes permiso para eliminar este curso' });

        // Eliminar la imagen de portada si existe
        if (cursos[0].portada) {
            const imagePath = path.join(__dirname, cursos[0].portada);
            unlinkAsync(imagePath).catch(err => console.error('Error al borrar imagen:', err));
        }

        // Eliminar materiales asociados
        const materiales = JSON.parse(cursos[0].imagenes_materiales || '[]');
        for (const material of materiales) {
            const filePath = path.join(__dirname, material);
            unlinkAsync(filePath).catch(err => console.error('Error al borrar material:', err));
        }

        await db.query('DELETE FROM cursos WHERE id = ?', [idCurso]);
        console.log('🗑️ Curso eliminado:', idCurso);
        res.json({ success: true });
    } catch (err) {
        console.error('❌ Error al eliminar el curso:', err);
        res.status(500).json({ error: 'Error al eliminar el curso' });
    }
});

// Rutas para comentarios y valoraciones
app.post('/api/cursos/:id/comentario', validateToken, async (req, res) => {
    const id = req.params.id;
    const { comentario } = req.body;
    const usuarioId = req.user.ID;

    try {
        const comentarioCompleto = {
            usuarioId,
            texto: comentario,
            fecha: new Date().toISOString()
        };

        await db.query(`UPDATE cursos SET opiniones = JSON_ARRAY_APPEND(opiniones, '$', ?) WHERE id = ?`, [JSON.stringify(comentarioCompleto), id]);
        console.log('💬 Comentario agregado al curso:', id);
        res.json({ success: true });
    } catch (err) {
        console.error('❌ Error al agregar el comentario:', err);
        res.status(500).json({ error: 'Error al agregar el comentario' });
    }
});

// Actualizar ranking
app.put('/api/cursos/:id/ranking', validateToken, async (req, res) => {
    const id = req.params.id;
    const { ranking } = req.body;
    const usuarioId = req.user.ID;

    try {
        // Primero obtenemos el curso actual
        const [cursos] = await db.query('SELECT * FROM cursos WHERE id = ?', [id]);
        if (cursos.length === 0) return res.status(404).json({ error: 'Curso no encontrado' });

        const curso = cursos[0];
        const nuevoRanking = (curso.ranking * curso.num_valoraciones + ranking) / (curso.num_valoraciones + 1);

        await db.query('UPDATE cursos SET ranking = ?, num_valoraciones = num_valoraciones + 1 WHERE id = ?', [nuevoRanking, id]);
        console.log('⭐ Ranking actualizado para curso:', id);
        res.json({ success: true, nuevoRanking });
    } catch (err) {
        console.error('❌ Error al actualizar el ranking:', err);
        res.status(500).json({ error: 'Error al actualizar el ranking' });
    }
});

// Rutas para materiales del curso
app.post('/api/cursos/:id/materiales', validateToken, upload.array('materiales', 10), async (req, res) => {
    const idCurso = req.params.id;

    try {
        const [cursos] = await db.query('SELECT * FROM cursos WHERE id = ? AND id_usuario = ?', [idCurso, req.user.ID]);
        if (cursos.length === 0) return res.status(403).json({ error: 'No tienes permiso para modificar este curso' });

        const archivos = req.files.map(file => `/uploads/${file.filename}`);
        const materialesActuales = JSON.parse(cursos[0].imagenes_materiales || '[]');
        const nuevosMateriales = [...materialesActuales, ...archivos];

        await db.query('UPDATE cursos SET imagenes_materiales = ? WHERE id = ?', [JSON.stringify(nuevosMateriales), idCurso]);

        console.log('📎 Materiales agregados al curso:', idCurso);
        res.json({ success: true, nuevosMateriales });
    } catch (err) {
        console.error('❌ Error al agregar materiales:', err);
        
        // Si hay error, eliminamos los archivos subidos
        if (req.files) {
            for (const file of req.files) {
                const filePath = path.join(__dirname, 'uploads', file.filename);
                unlinkAsync(filePath).catch(err => console.error('Error al borrar archivo:', err));
            }
        }
        
        res.status(500).json({ error: 'Error al agregar materiales' });
    }
});

// Eliminar materiales del curso
app.delete('/api/cursos/:id/materiales', validateToken, async (req, res) => {
    const idCurso = req.params.id;
    const { archivo } = req.body;

    try {
        const [cursos] = await db.query('SELECT * FROM cursos WHERE id = ? AND id_usuario = ?', [idCurso, req.user.ID]);
        if (cursos.length === 0) return res.status(403).json({ error: 'No tienes permiso para modificar este curso' });

        const materialesActuales = JSON.parse(cursos[0].imagenes_materiales || '[]');
        const nuevosMateriales = materialesActuales.filter(material => {
            if (material === archivo) {
                // Borrar el archivo físico
                const filePath = path.join(__dirname, archivo);
                unlinkAsync(filePath).catch(err => console.error('Error al borrar archivo:', err));
                return false;
            }
            return true;
        });

        await db.query('UPDATE cursos SET imagenes_materiales = ? WHERE id = ?', [JSON.stringify(nuevosMateriales), idCurso]);

        console.log('🗑️ Material eliminado del curso:', archivo);
        res.json({ success: true, nuevosMateriales });
    } catch (err) {
        console.error('❌ Error al eliminar material:', err);
        res.status(500).json({ error: 'Error al eliminar material' });
    }
});

// Servir archivos estáticos
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// Manejo de errores global
app.use((err, req, res, next) => {
    console.error('🔥 Error global:', err);
    res.status(500).json({ 
        error: 'Error interno del servidor',
        message: process.env.NODE_ENV === 'development' ? err.message : undefined
    });
});

// Iniciar servidor
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
    console.log(`🚀 Servidor corriendo en el puerto ${PORT}`);
});