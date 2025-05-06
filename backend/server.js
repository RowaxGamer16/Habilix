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
        const uploadDir = path.join(__dirname, 'Uploads');
        if (!fs.existsSync(uploadDir)) {
            fs.mkdirSync(uploadDir, { recursive: true });
        }
        cb(null, uploadDir);
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
    },
    limits: {
        fileSize: 10 * 1024 * 1024 // 10MB
    }
});

// Conexión a la base de datos
let db;
try {
    db = await mysql.createPool({
        connectionLimit: 10,
        host: process.env.DB_HOST || 'localhost',
        user: process.env.DB_USER || 'root',
        password: process.env.DB_PASSWORD || '',
        database: process.env.DB_NAME || 'intercambio_de_abilidades',
    });
    console.log('✅ Conectado a la base de datos');
} catch (error) {
    console.error('❌ Error al conectar a la base de datos:', error);
    process.exit(1);
}

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
            'INSERT INTO usuarios (NOMBRE_USUARIO, EMAIL, PASSWORD, ROLE, FECHA_CREACION) VALUES (?, ?, ?, 1, NOW())',
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

// Agrega esto en tu server.js, en la sección de rutas de administrador - Usuarios

// Ruta para crear un nuevo usuario (admin)
app.post('/api/admin/usuarios', validateToken, isAdmin, [
    // Validaciones
    body('NOMBRE_USUARIO').trim()
        .notEmpty().withMessage('El nombre de usuario es requerido')
        .isLength({ min: 3 }).withMessage('El nombre debe tener al menos 3 caracteres'),
    body('EMAIL').trim()
        .notEmpty().withMessage('El email es requerido')
        .isEmail().withMessage('Debe ser un email válido')
        .normalizeEmail(),
    body('PASSWORD')
        .notEmpty().withMessage('La contraseña es requerida')
        .isLength({ min: 5 }).withMessage('La contraseña debe tener al menos 5 caracteres'),
    body('CONFIRM_PASSWORD')
        .notEmpty().withMessage('Debes confirmar la contraseña')
        .custom((value, { req }) => {
            if (value !== req.body.PASSWORD) {
                throw new Error('Las contraseñas no coinciden');
            }
            return true;
        }),
    body('TELEFONO').optional()
        .isLength({ min: 8, max: 15 }).withMessage('El teléfono debe tener entre 8 y 15 caracteres'),
    body('ROLE').optional()
        .isIn([1, 2]).withMessage('Rol inválido (1: Usuario, 2: Admin)')
        .default(1)
], async (req, res) => {
    // Verificar errores de validación
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        return res.status(400).json({ 
            success: false,
            error: 'Error de validación',
            details: errors.array().map(err => ({
                field: err.param,
                message: err.msg
            }))
        });
    }

    // Extraer datos del cuerpo de la petición
    const { 
        NOMBRE_USUARIO, 
        EMAIL, 
        PASSWORD, 
        TELEFONO, 
        ROLE 
    } = req.body;

    try {
        // 1. Verificar si el email ya existe
        const [existingUsers] = await db.query(
            'SELECT * FROM usuarios WHERE EMAIL = ?', 
            [EMAIL]
        );
        
        if (existingUsers.length > 0) {
            return res.status(400).json({ 
                success: false,
                error: 'El correo electrónico ya está registrado'
            });
        }

        // 2. Crear el nuevo usuario (sin hashear la contraseña)
        const [result] = await db.query(
            `INSERT INTO usuarios 
            (NOMBRE_USUARIO, EMAIL, PASSWORD, TELEFONO, ROLE, FECHA_CREACION) 
            VALUES (?, ?, ?, ?, ?, NOW())`,
            [NOMBRE_USUARIO, EMAIL, PASSWORD, TELEFONO || null, ROLE || 1]
        );

        // 3. Obtener el usuario recién creado
        const [newUser] = await db.query(`
            SELECT 
                ID,
                NOMBRE_USUARIO,
                EMAIL,
                COALESCE(TELEFONO, '') AS TELEFONO,
                DATE_FORMAT(FECHA_CREACION, '%Y-%m-%d %H:%i:%s') AS FECHA_CREACION,
                ROLE
            FROM usuarios
            WHERE ID = ?
        `, [result.insertId]);

        // 4. Responder con éxito
        return res.status(201).json({
            success: true,
            data: newUser[0], // Estructura que espera el frontend
            message: 'Usuario creado correctamente'
        });

    } catch (error) {
        console.error('Error al crear usuario:', error);
        
        // Manejar errores específicos de la base de datos
        if (error.code === 'ER_DUP_ENTRY') {
            return res.status(400).json({ 
                success: false,
                error: 'El correo electrónico ya está registrado'
            });
        }

        // Error genérico del servidor
        return res.status(500).json({ 
            success: false,
            error: 'Error del servidor al crear usuario',
            details: process.env.NODE_ENV === 'development' ? error.message : undefined
        });
    }
});

// Ruta para actualizar un usuario (admin)
app.put('/api/admin/usuarios/:id', validateToken, isAdmin, [
    body('NOMBRE_USUARIO').optional().trim().isLength({ min: 3 }).withMessage('El nombre debe tener al menos 3 caracteres'),
    body('TELEFONO').optional().isLength({ min: 8, max: 15 }).withMessage('Teléfono debe tener entre 8 y 15 caracteres'),
    body('ROLE').optional().isIn([1, 2]).withMessage('Rol inválido (1: Usuario, 2: Admin)'),
    body('PASSWORD').optional().isLength({ min: 5 }).withMessage('La contraseña debe tener al menos 5 caracteres'),
    body('CONFIRM_PASSWORD').optional().custom((value, { req }) => {
        if (req.body.PASSWORD && value !== req.body.PASSWORD) {
            throw new Error('Las contraseñas no coinciden');
        }
        return true;
    })
], async (req, res) => {
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

    const { id } = req.params;
    const { NOMBRE_USUARIO, TELEFONO, ROLE, PASSWORD } = req.body;

    try {
        // Verificar si el usuario existe
        const [users] = await db.query('SELECT * FROM usuarios WHERE ID = ?', [id]);
        if (users.length === 0) {
            return res.status(404).json({ 
                success: false,
                error: 'Usuario no encontrado'
            });
        }

        const user = users[0];

        // No permitir que un admin se quite sus propios privilegios
        if (parseInt(id) === req.user.ID && ROLE !== undefined && ROLE !== 2) {
            return res.status(400).json({ 
                success: false,
                error: 'No puedes cambiar tu propio rol de administrador'
            });
        }

        // Preparar los campos a actualizar
        const updates = {};
        if (NOMBRE_USUARIO !== undefined) updates.NOMBRE_USUARIO = NOMBRE_USUARIO;
        if (TELEFONO !== undefined) updates.TELEFONO = TELEFONO || null;
        if (ROLE !== undefined) updates.ROLE = ROLE;
        
        // Si se proporcionó una nueva contraseña (sin hashear)
        if (PASSWORD) {
            updates.PASSWORD = PASSWORD;
        }

        if (Object.keys(updates).length === 0) {
            return res.status(400).json({ 
                success: false,
                error: 'No se proporcionaron datos para actualizar' 
            });
        }

        // Actualizar el usuario
        await db.query('UPDATE usuarios SET ? WHERE ID = ?', [updates, id]);

        // Obtener el usuario actualizado sin la contraseña
        const [updatedUser] = await db.query(`
            SELECT 
                ID,
                NOMBRE_USUARIO,
                EMAIL,
                COALESCE(TELEFONO, '') AS TELEFONO,
                DATE_FORMAT(FECHA_CREACION, '%Y-%m-%d %H:%i:%s') AS FECHA_CREACION,
                ROLE
            FROM usuarios
            WHERE ID = ?
        `, [id]);

        res.json({
            success: true,
            data: updatedUser[0],
            message: 'Usuario actualizado correctamente'
        });
    } catch (error) {
        console.error('Error al actualizar usuario:', error);
        res.status(500).json({ 
            success: false,
            error: 'Error del servidor al actualizar usuario',
            details: process.env.NODE_ENV === 'development' ? error.message : undefined
        });
    }
});

// Rutas de administrador - Usuarios (GET todos)
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

// Ruta para eliminar usuario (admin)
app.delete('/api/admin/usuarios/:id', validateToken, isAdmin, async (req, res) => {
    try {
        const { id } = req.params;
        
        // Verificar que no sea el mismo usuario
        if (parseInt(id) === req.user.ID) {
            return res.status(400).json({
                success: false,
                error: 'No puedes eliminarte a ti mismo'
            });
        }

        // Verificar que el usuario exista
        const [user] = await db.query('SELECT * FROM usuarios WHERE ID = ?', [id]);
        if (user.length === 0) {
            return res.status(404).json({
                success: false,
                error: 'Usuario no encontrado'
            });
        }

        // Eliminar el usuario
        const [result] = await db.query('DELETE FROM usuarios WHERE ID = ?', [id]);

        res.json({
            success: true,
            message: 'Usuario eliminado correctamente',
            deletedUser: {
                id: user[0].ID,
                email: user[0].EMAIL
            }
        });
    } catch (error) {
        console.error('Error al eliminar usuario:', error);
        
        // Manejar error de clave foránea
        if (error.code === 'ER_ROW_IS_REFERENCED_2') {
            return res.status(400).json({
                success: false,
                error: 'No se puede eliminar el usuario porque tiene registros asociados'
            });
        }

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
    const { nombre, descripcion, profesor, categoria, precio, entrega, horario, id_usuario } = req.body;
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
            profesor,
            categoria: categoria || null,
            precio: precio || null,
            entrega: entrega || null,
            horario: horario || null,
            id_usuario
        };
        
        if (portada) updates.portada = portada;

        if (portada && cursos[0].portada) {
            const oldImagePath = path.join(__dirname, cursos[0].portada);
            await unlinkAsync(oldImagePath).catch(err => console.error('Error al borrar imagen anterior:', err));
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
            await unlinkAsync(imagePath).catch(err => console.error('Error al borrar imagen:', err));
        }

        const materiales = JSON.parse(cursos[0].imagenes_materiales || '[]');
        for (const material of materiales) {
            const filePath = path.join(__dirname, material);
            await unlinkAsync(filePath).catch(err => console.error('Error al borrar material:', err));
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

// Rutas de cursos - Versión corregida
app.post('/api/cursos', validateToken, upload.single('portada'), async (req, res) => {
    const { nombre, descripcion, profesor, categoria, precio, entrega, horario } = req.body;
    const portada = req.file ? `/Uploads/${req.file.filename}` : '';
    const id_usuario = req.user.ID;

    console.log('📚 Creando curso:', { nombre, id_usuario, profesor });

    try {
        // Consulta SQL corregida - asegúrate que el número de columnas coincida con los valores
        const query = `
            INSERT INTO cursos (
                nombre, 
                descripcion, 
                profesor, 
                portada, 
                categoria, 
                precio, 
                entrega, 
                horario, 
                ranking, 
                id_usuario, 
                imagenes_materiales
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, 0, ?, '[]')
        `;
        
        // Parámetros en el orden correcto
        const [result] = await db.query(query, [
            nombre, 
            descripcion, 
            profesor, 
            portada, 
            categoria, 
            precio, 
            entrega, 
            horario, 
            id_usuario
        ]);

        res.json({ 
            success: true, 
            id: result.insertId,
            portada: portada // Incluir la URL de la portada en la respuesta
        });
        console.log('✅ Curso creado:', result.insertId);
    } catch (err) {
        console.error('❌ Error al crear curso:', err);
        res.status(500).json({ 
            success: false,
            error: 'Error al crear el curso',
            details: process.env.NODE_ENV === 'development' ? err.message : undefined
        });
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

// Modifica el endpoint GET /api/cursos/:id para asegurar que devuelva id_usuario
app.get('/api/cursos/:id', async (req, res) => {
    const id = req.params.id;
    try {
        const [results] = await db.query(`
            SELECT c.*, u.NOMBRE_USUARIO as profesor, c.id_usuario
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
    const { nombre, descripcion, profesor, categoria, precio, entrega, horario } = req.body;
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
        if (profesor) updates.profesor = profesor;
        if (categoria) updates.categoria = categoria;
        if (precio) updates.precio = precio;
        if (entrega) updates.entrega = entrega;
        if (horario) updates.horario = horario;
        if (portada) updates.portada = portada;

        if (Object.keys(updates).length === 0) {
            return res.status(400).json({ error: 'No se proporcionaron campos para actualizar' });
        }

        if (portada && cursos[0].portada) {
            const oldImagePath = path.join(__dirname, cursos[0].portada);
            await unlinkAsync(oldImagePath).catch(err => console.error('Error al borrar imagen anterior:', err));
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
            await unlinkAsync(imagePath).catch(err => console.error('Error al borrar imagen:', err));
        }

        const materiales = JSON.parse(cursos[0].imagenes_materiales || '[]');
        for (const material of materiales) {
            const filePath = path.join(__dirname, material);
            await unlinkAsync(filePath).catch(err => console.error('Error al borrar material:', err));
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
    const connection = await db.getConnection(); // Para usar transacciones

    try {
        await connection.beginTransaction();

        // Verificar permisos
        const [curso] = await connection.query('SELECT id_usuario, imagenes_materiales FROM cursos WHERE id = ?', [idCurso]);
        if (!curso || curso.id_usuario !== req.user.ID) {
            throw new Error('No tienes permiso para modificar este curso');
        }

        // Procesar archivos
        const archivos = req.files.map(file => {
            const nombreOriginal = sanitizarNombreArchivo(file.originalname);
            const extension = path.extname(nombreOriginal);
            const nuevoNombre = `${path.basename(nombreOriginal, extension)}-${Date.now()}${extension}`;
            const nuevoPath = path.join(__dirname, 'Uploads', nuevoNombre);

            fs.renameSync(file.path, nuevoPath);
            return `/Uploads/${nuevoNombre}`;
        });

        // Actualizar base de datos
        const materialesActuales = JSON.parse(curso.imagenes_materiales || '[]');
        const nuevosMateriales = [...materialesActuales, ...archivos];

        await connection.query('UPDATE cursos SET imagenes_materiales = ? WHERE id = ?', [
            JSON.stringify(nuevosMateriales),
            idCurso
        ]);

        await connection.commit();

        res.json({ 
            success: true, 
            nuevosMateriales: archivos,
            nombresOriginales: req.files.map(file => file.originalname)
        });
    } catch (err) {
        await connection.rollback();
        
        // Eliminar archivos subidos en caso de error
        if (req.files) {
            for (const file of req.files) {
                const filePath = path.join(__dirname, 'Uploads', file.filename);
                await unlinkAsync(filePath).catch(console.error);
            }
        }

        res.status(500).json({ error: err.message || 'Error al agregar materiales' });
    } finally {
        if (connection) connection.release();
    }
});

app.delete('/api/cursos/:id/materiales', validateToken, async (req, res) => {
    const idCurso = req.params.id;
    const { archivo } = req.body;
    const connection = await db.getConnection();

    try {
        await connection.beginTransaction();

        // Verificar permisos
        const [curso] = await connection.query('SELECT id_usuario, imagenes_materiales FROM cursos WHERE id = ?', [idCurso]);
        if (!curso || curso.id_usuario !== req.user.ID) {
            throw new Error('No tienes permiso para modificar este curso');
        }

        // Eliminar archivo físico
        const filePath = path.join(__dirname, archivo);
        await unlinkAsync(filePath).catch(err => {
            throw new Error('No se pudo eliminar el archivo físico');
        });

        // Actualizar base de datos
        const materialesActuales = JSON.parse(curso.imagenes_materiales || '[]');
        const nuevosMateriales = materialesActuales.filter(m => m !== archivo);

        await connection.query('UPDATE cursos SET imagenes_materiales = ? WHERE id = ?', [
            JSON.stringify(nuevosMateriales),
            idCurso
        ]);

        await connection.commit();
        res.json({ success: true, nuevosMateriales });
    } catch (err) {
        await connection.rollback();
        res.status(500).json({ error: err.message || 'Error al eliminar material' });
    } finally {
        if (connection) connection.release();
    }
});

// Configuración para servir archivos estáticos
app.use('/Uploads', express.static(path.join(__dirname, 'Uploads')));

// Middleware para manejo de errores
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