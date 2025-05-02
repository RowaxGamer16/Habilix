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
        cb(null, 'Uploads/');
    },
    filename: (req, file, cb) => {
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
        cb(null, file.fieldname + '-' + uniqueSuffix + path.extname(file.originalname));
    }
});

const upload = multer({ 
    storage: storage,
    fileFilter: (req, file, cb) => {
        const allowedTypes = [
            'image/jpeg', 
            'image/png',
            'application/pdf',
            'application/msword',
            'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
            'application/vnd.ms-powerpoint',
            'application/vnd.openxmlformats-officedocument.presentationml.presentation'
        ];
        
        if (allowedTypes.includes(file.mimetype)) {
            cb(null, true);
        } else {
            cb(new Error('Tipo de archivo no permitido'));
        }
    }
});

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

const isAdmin = (req, res, next) => {
    if (req.user && req.user.ROLE === 2) {
        next();
    } else {
        console.error('⚠️ Intento de acceso no autorizado a ruta de admin por usuario:', req.user?.ID);
        res.status(403).json({ error: 'Acceso denegado. Se requieren privilegios de administrador' });
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
        const [existingUsers] = await db.query('SELECT * FROM usuarios WHERE EMAIL = ?', [email]);
        if (existingUsers.length > 0) {
            return res.status(400).json({ error: 'El correo ya está registrado' });
        }

        const [result] = await db.query(
            'INSERT INTO usuarios (NOMBRE_USUARIO, EMAIL, PASSWORD, ROLE, FECHA_CREACION) VALUES (?, ?, ?, "1", NOW())',
            [nombre_usuario, email, password]
        );

        const token = jwt.sign({ id: result.insertId }, process.env.JWT_SECRET || 'token', { expiresIn: '1h' });

        console.log('✅ Usuario registrado:', result.insertId);
        res.json({
            token,
            usuario: {
                ID: result.insertId,
                NOMBRE_USUARIO: nombre_usuario,
                EMAIL: email,
                ROLE: 1
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
        res.status(500).json({ 
            error: 'Error del servidor',
            details: process.env.NODE_ENV === 'development' ? error.message : undefined
        });
    }
});

app.put('/api/usuario/actualizar', validateToken, [
    body('NOMBRE_USUARIO').optional().isLength({ min: 3 }).withMessage('El nombre debe tener al menos 3 caracteres'),
    body('TELEFONO').optional().isLength({ min: 8 }).withMessage('Teléfono inválido')
], async (req, res) => {
    try {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({ 
                success: false,
                errors: errors.array().map(err => ({
                    field: err.param,
                    message: err.msg
                }))
            });
        }

        const { NOMBRE_USUARIO, TELEFONO } = req.body;
        const updates = {};
        
        if (NOMBRE_USUARIO !== undefined) updates.NOMBRE_USUARIO = NOMBRE_USUARIO;
        if (TELEFONO !== undefined) updates.TELEFONO = TELEFONO;

        if (Object.keys(updates).length === 0) {
            return res.status(400).json({ 
                success: false,
                error: 'No hay datos para actualizar' 
            });
        }

        await db.query('UPDATE usuarios SET ? WHERE ID = ?', [updates, req.user.ID]);

        const [user] = await db.query('SELECT * FROM usuarios WHERE ID = ?', [req.user.ID]);
        
        res.json({ 
            success: true,
            usuario: {
                ID: user[0].ID,
                NOMBRE_USUARIO: user[0].NOMBRE_USUARIO,
                EMAIL: user[0].EMAIL,
                ROLE: user[0].ROLE,
                TELEFONO: user[0].TELEFONO || '',
                FECHA_CREACION: user[0].FECHA_CREACION
            }
        });

    } catch (error) {
        console.error('Error al actualizar usuario:', error);
        res.status(500).json({ 
            success: false,
            error: 'Error al actualizar el perfil',
            details: process.env.NODE_ENV === 'development' ? error.message : undefined
        });
    }
});

// Asegúrate de tener esta ruta en tu backend
app.get('/api/admin/usuarios', validateToken, async (req, res) => {
    try {
        // Verificar que el usuario sea administrador (ROLE = 2)
        if (req.user.ROLE !== 2) {
            return res.status(403).json({ 
                success: false,
                error: 'Acceso denegado: Se requieren permisos de administrador' 
            });
        }

        // Consulta a la base de datos
        const [rows] = await db.query(`
            SELECT 
                ID,
                NOMBRE_USUARIO,
                EMAIL,
                COALESCE(TELEFONO, '') AS TELEFONO,
                DATE_FORMAT(FECHA_CREACION, '%Y-%m-%d %H:%i:%s') AS FECHA_CREACION,
                ROLE
            FROM usuarios
            ORDER BY FECHA_CREACION DESC
        `);

        res.json({
            success: true,
            data: rows,
            count: rows.length
        });

    } catch (error) {
        console.error('Error al obtener usuarios:', error);
        res.status(500).json({ 
            success: false,
            error: 'Error del servidor',
            details: process.env.NODE_ENV === 'development' ? error.message : undefined
        });
    }
});
// Ruta para eliminar usuarios (admin only) - Versión corregida
app.delete('/api/admin/usuarios/:id', validateToken, async (req, res) => {
    try {
        if (req.user.ROLE !== 2) {
            return res.status(403).json({ 
                success: false,
                error: 'Acceso denegado' 
            });
        }

        const { id } = req.params;
        
        // Verificar que no sea auto-eliminación
        if (parseInt(id) === req.user.ID) {
            return res.status(400).json({
                success: false,
                error: 'No puedes eliminarte a ti mismo'
            });
        }

        // CORRECCIÓN: Usar db.query con sintaxis MySQL
        const [result] = await db.query(
            'DELETE FROM usuarios WHERE ID = ?',
            [id]
        );

        if (result.affectedRows === 0) {
            return res.status(404).json({
                success: false,
                error: 'Usuario no encontrado'
            });
        }

        // Para obtener el usuario eliminado (MySQL no tiene RETURNING)
        const [deletedUser] = await db.query(
            'SELECT * FROM usuarios WHERE ID = ?',
            [id]
        );

        res.json({
            success: true,
            message: 'Usuario eliminado correctamente',
            deletedUser: deletedUser[0] || null
        });

    } catch (error) {
        console.error('Error al eliminar usuario:', error);
        res.status(500).json({ 
            success: false,
            error: 'Error del servidor',
            details: process.env.NODE_ENV === 'development' ? error.message : undefined
        });
    }
});

// Rutas de administrador - Usuarios
app.get('/api/admin/usuarios', validateToken, isAdmin, async (req, res) => {
    try {
        const [rows] = await db.query(`
            SELECT 
                ID,
                NOMBRE_USUARIO,
                EMAIL,
                COALESCE(TELEFONO, '') AS TELEFONO,
                DATE_FORMAT(FECHA_CREACION, '%Y-%m-%d %H:%i:%s') AS FECHA_CREACION,
                ROLE
            FROM usuarios
            ORDER BY FECHA_CREACION DESC
        `);

        res.json({
            success: true,
            data: rows,
            count: rows.length
        });
    } catch (error) {
        console.error('Error al obtener usuarios:', error);
        res.status(500).json({ 
            success: false,
            error: 'Error del servidor',
            details: process.env.NODE_ENV === 'development' ? error.message : undefined
        });
    }
});

app.delete('/api/admin/usuarios/:id', validateToken, isAdmin, async (req, res) => {
    try {
        const { id } = req.params;
        
        if (parseInt(id) === req.user.ID) {
            return res.status(400).json({
                success: false,
                error: 'No puedes eliminarte a ti mismo'
            });
        }

        const [result] = await db.query('DELETE FROM usuarios WHERE ID = ?', [id]);

        if (result.affectedRows === 0) {
            return res.status(404).json({
                success: false,
                error: 'Usuario no encontrado'
            });
        }

        res.json({
            success: true,
            message: 'Usuario eliminado correctamente'
        });
    } catch (error) {
        console.error('Error al eliminar usuario:', error);
        res.status(500).json({ 
            success: false,
            error: 'Error del servidor',
            details: process.env.NODE_ENV === 'development' ? error.message : undefined
        });
    }
});

// Rutas de administrador - Cursos
app.get('/api/admin/cursos', validateToken, isAdmin, async (req, res) => {
    try {
        const [results] = await db.query(`
            SELECT c.*, u.NOMBRE_USUARIO as profesor 
            FROM cursos c
            JOIN usuarios u ON c.id_usuario = u.ID
        `);
        res.json({
            success: true,
            data: results
        });
    } catch (err) {
        console.error('Error al obtener cursos:', err);
        res.status(500).json({ 
            success: false,
            error: 'Error al obtener los cursos' 
        });
    }
});

app.get('/api/admin/cursos/:id', validateToken, isAdmin, async (req, res) => {
    const id = req.params.id;
    try {
        const [results] = await db.query(`
            SELECT c.*, u.NOMBRE_USUARIO as profesor 
            FROM cursos c
            JOIN usuarios u ON c.id_usuario = u.ID
            WHERE c.id = ?
        `, [id]);
        
        if (results.length === 0) {
            return res.status(404).json({ 
                success: false,
                error: 'Curso no encontrado' 
            });
        }
        
        res.json({
            success: true,
            data: results[0]
        });
    } catch (err) {
        console.error('Error al obtener el curso:', err);
        res.status(500).json({ 
            success: false,
            error: 'Error al obtener el curso' 
        });
    }
});

app.put('/api/admin/cursos/:id', validateToken, isAdmin, upload.single('portada'), async (req, res) => {
    const idCurso = req.params.id;
    const { nombre, descripcion, categoria, precio, entrega, horario, id_usuario } = req.body;
    const portada = req.file ? `/Uploads/${req.file.filename}` : null;

    try {
        const [cursos] = await db.query('SELECT * FROM cursos WHERE id = ?', [idCurso]);
        if (cursos.length === 0) {
            return res.status(404).json({ 
                success: false,
                error: 'Curso no encontrado' 
            });
        }

        if (!nombre || !descripcion || !id_usuario) {
            return res.status(400).json({ 
                success: false,
                error: 'Nombre, descripción y ID de usuario son campos requeridos' 
            });
        }

        const updates = {
            nombre,
            descripcion,
            categoria: categoria || null,
            precio: precio || null,
            entrega: entrega || null,
            horario: horario || null,
            id_usuario
        };
        
        if (portada) updates.portada = portada;

        if (portada && cursos[0].portada) {
            const oldImagePath = path.join(__dirname, cursos[0].portada);
            unlinkAsync(oldImagePath).catch(err => console.error('Error al borrar imagen anterior:', err));
        }

        await db.query('UPDATE cursos SET ? WHERE id = ?', [updates, idCurso]);
        
        res.json({ 
            success: true,
            message: 'Curso actualizado correctamente'
        });
    } catch (err) {
        console.error('Error al actualizar el curso:', err);
        res.status(500).json({ 
            success: false,
            error: 'Error al actualizar el curso' 
        });
    }
});

app.delete('/api/admin/cursos/:id', validateToken, isAdmin, async (req, res) => {
    const idCurso = req.params.id;

    try {
        const [cursos] = await db.query('SELECT * FROM cursos WHERE id = ?', [idCurso]);
        if (cursos.length === 0) {
            return res.status(404).json({ 
                success: false,
                error: 'Curso no encontrado' 
            });
        }

        if (cursos[0].portada) {
            const imagePath = path.join(__dirname, cursos[0].portada);
            unlinkAsync(imagePath).catch(err => console.error('Error al borrar imagen:', err));
        }

        const materiales = JSON.parse(cursos[0].imagenes_materiales || '[]');
        for (const material of materiales) {
            const filePath = path.join(__dirname, material);
            unlinkAsync(filePath).catch(err => console.error('Error al borrar material:', err));
        }

        await db.query('DELETE FROM cursos WHERE id = ?', [idCurso]);
        
        res.json({ 
            success: true,
            message: 'Curso eliminado correctamente'
        });
    } catch (err) {
        console.error('Error al eliminar el curso:', err);
        res.status(500).json({ 
            success: false,
            error: 'Error al eliminar el curso' 
        });
    }
});

// Rutas de cursos
app.post('/api/cursos', validateToken, upload.single('portada'), async (req, res) => {
    const { nombre, descripcion, categoria, precio, entrega, horario, profesor } = req.body;
    const portada = req.file ? `/Uploads/${req.file.filename}` : '';
    const id_usuario = req.user.ID;

    console.log('📚 Creando curso:', { nombre, id_usuario, profesor });

    try {
        const query = `
            INSERT INTO cursos (nombre, descripcion, portada, categoria, precio, entrega, horario, profesor, ranking, opiniones, id_usuario, imagenes_materiales)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, 0, '[]', ?, '[]')
        `;
        const [result] = await db.query(query, [nombre, descripcion, portada, categoria, precio, entrega, horario, profesor, id_usuario]);

        res.json({ success: true, id: result.insertId });
        console.log('✅ Curso creado:', result.insertId);
    } catch (err) {
        console.error('❌ Error al crear curso:', err);
        res.status(500).json({ error: 'Error al crear el curso' });
    }
});

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

app.put('/api/cursos/:id', validateToken, upload.single('portada'), async (req, res) => {
    const idCurso = req.params.id;
    const { nombre, descripcion, categoria, precio, entrega, horario, profesor } = req.body;
    const portada = req.file ? `/Uploads/${req.file.filename}` : null;

    try {
        const [cursos] = await db.query('SELECT * FROM cursos WHERE id = ? AND id_usuario = ?', [idCurso, req.user.ID]);
        if (cursos.length === 0) return res.status(403).json({ error: 'No tienes permiso para editar este curso' });

        // Validar campos requeridos
        if (!nombre || !descripcion || !profesor) {
            return res.status(400).json({ error: 'Nombre, descripción y profesor son campos requeridos' });
        }

        const updates = {};
        if (nombre) updates.nombre = nombre;
        if (descripcion) updates.descripcion = descripcion;
        if (categoria) updates.categoria = categoria;
        if (precio) updates.precio = precio;
        if (entrega) updates.entrega = entrega;
        if (horario) updates.horario = horario;
        if (profesor) updates.profesor = profesor;
        if (portada) updates.portada = portada;

        if (Object.keys(updates).length === 0) {
            return res.status(400).json({ error: 'No se proporcionaron campos para actualizar' });
        }

        if (portada && cursos[0].portada) {
            const oldImagePath = path.join(__dirname, cursos[0].portada);
            unlinkAsync(oldImagePath).catch(err => console.error('Error al borrar imagen anterior:', err));
        }

        const fields = Object.keys(updates).map((key) => `${key} = ?`);
        const values = Object.values(updates);
        values.push(idCurso);

        await db.query(`UPDATE cursos SET ${fields.join(', ')} WHERE id = ?`, values);
        console.log('📝 Curso actualizado:', idCurso);
        res.json({ success: true });
    } catch (err) {
        console.error('❌ Error al actualizar el curso:', err);
        res.status(500).json({ error: 'Error al actualizar el curso' });
    }
});

app.delete('/api/cursos/:id', validateToken, async (req, res) => {
    const idCurso = req.params.id;

    try {
        const [cursos] = await db.query('SELECT * FROM cursos WHERE id = ? AND id_usuario = ?', [idCurso, req.user.ID]);
        if (cursos.length === 0) return res.status(403).json({ error: 'No tienes permiso para eliminar este curso' });

        if (cursos[0].portada) {
            const imagePath = path.join(__dirname, cursos[0].portada);
            unlinkAsync(imagePath).catch(err => console.error('Error al borrar imagen:', err));
        }

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

app.put('/api/cursos/:id/ranking', validateToken, async (req, res) => {
    const id = req.params.id;
    const { ranking } = req.body;
    const usuarioId = req.user.ID;

    try {
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

app.post('/api/cursos/:id/materiales', validateToken, upload.array('materiales', 10), async (req, res) => {
    const idCurso = req.params.id;

    try {
        const [cursos] = await db.query('SELECT * FROM cursos WHERE id = ? AND id_usuario = ?', [idCurso, req.user.ID]);
        if (cursos.length === 0) return res.status(403).json({ error: 'No tienes permiso para modificar este curso' });

        const archivos = req.files.map(file => {
            const nombreOriginal = file.originalname;
            const extension = path.extname(nombreOriginal);
            const nombreBase = path.basename(nombreOriginal, extension);
            const nuevoNombre = `${nombreBase}-${Date.now()}${extension}`;
            const nuevoPath = path.join(__dirname, 'Uploads', nuevoNombre);
            fs.renameSync(file.path, nuevoPath);
            return `/Uploads/${nuevoNombre}`;
        });

        const materialesActuales = JSON.parse(cursos[0].imagenes_materiales || '[]');
        const nuevosMateriales = [...materialesActuales, ...archivos];

        await db.query('UPDATE cursos SET imagenes_materiales = ? WHERE id = ?', [JSON.stringify(nuevosMateriales), idCurso]);

        console.log('📎 Materiales agregados al curso:', idCurso);
        res.json({ 
            success: true, 
            nuevosMateriales: archivos,
            nombresOriginales: req.files.map(file => file.originalname)
        });
    } catch (err) {
        console.error('❌ Error al agregar materiales:', err);
        
        if (req.files) {
            for (const file of req.files) {
                const filePath = path.join(__dirname, 'Uploads', file.filename);
                unlinkAsync(filePath).catch(err => console.error('Error al borrar archivo:', err));
            }
        }
        
        res.status(500).json({ error: 'Error al agregar materiales' });
    }
});

app.delete('/api/cursos/:id/materiales', validateToken, async (req, res) => {
    const idCurso = req.params.id;
    const { archivo } = req.body;

    try {
        const [cursos] = await db.query('SELECT * FROM cursos WHERE id = ? AND id_usuario = ?', [idCurso, req.user.ID]);
        if (cursos.length === 0) return res.status(403).json({ error: 'No tienes permiso para modificar este curso' });

        const materialesActuales = JSON.parse(cursos[0].imagenes_materiales || '[]');
        const nuevosMateriales = materialesActuales.filter(material => {
            if (material === archivo) {
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

app.use('/Uploads', express.static(path.join(__dirname, 'Uploads')));

app.use((err, req, res, next) => {
    console.error('🔥 Error global:', err);
    res.status(500).json({ 
        error: 'Error interno del servidor',
        message: process.env.NODE_ENV === 'development' ? err.message : undefined
    });
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
    console.log(`🚀 Servidor corriendo en el puerto ${PORT}`);
});