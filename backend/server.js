const express = require('express');
const mysql = require('mysql2/promise'); // Usamos la versión promise-based
const cors = require('cors');
const jwt = require('jsonwebtoken');
const { body, validationResult } = require('express-validator');
const rateLimit = require('express-rate-limit');
const helmet = require('helmet');
const morgan = require('morgan');
require('dotenv').config();

const app = express();

// Configuración de middlewares de seguridad
app.use(helmet());
app.use(cors({
  origin: process.env.FRONTEND_URL || 'http://localhost:3000',
  credentials: true
}));
app.use(express.json());
app.use(morgan('dev')); // Logger para ver las peticiones

// Limitador de tasa para prevenir ataques de fuerza bruta
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutos
  max: 100 // límite de 100 peticiones por IP
});
app.use(limiter);

// Configuración del pool de conexiones a la base de datos
const db = mysql.createPool({
  connectionLimit: 10,
  host: process.env.DB_HOST || 'localhost',
  user: process.env.DB_USER || 'root',
  password: process.env.DB_PASSWORD || '',
  database: process.env.DB_NAME || 'intercambio_de_abilidades',
  waitForConnections: true,
  queueLimit: 0
});

// Verificar conexión a la base de datos
const checkDBConnection = async () => {
  try {
    const connection = await db.getConnection();
    console.log('✅ Conectado a la base de datos MySQL');
    connection.release();
  } catch (err) {
    console.error('❌ Error conectando a la base de datos:', err.message);
    process.exit(1);
  }
};

checkDBConnection();

// Middleware para validar el token JWT
const validateToken = async (req, res, next) => {
  console.log('Validando token...');
  const authHeader = req.headers['authorization'];
  
  if (!authHeader) {
    console.log('No se proporcionó header de autorización');
    return res.status(403).json({ error: 'Acceso denegado, no se proporcionó token' });
  }

  const token = authHeader.split(' ')[1];
  
  if (!token) {
    console.log('Token no presente en el header');
    return res.status(403).json({ error: 'Acceso denegado, formato de token incorrecto' });
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'token');
    console.log('Token decodificado:', decoded);

    const [results] = await db.query('SELECT * FROM usuarios WHERE ID = ?', [decoded.id]);
    
    if (results.length === 0) {
      console.log('Usuario no encontrado en DB con ID:', decoded.id);
      return res.status(401).json({ error: 'Usuario no encontrado en la base de datos' });
    }

    req.user = results[0];
    console.log('Usuario autenticado:', req.user);
    next();
  } catch (error) {
    console.error('Error al verificar token:', error.message);
    
    if (error.name === 'TokenExpiredError') {
      return res.status(401).json({ error: 'Token expirado' });
    }
    
    return res.status(401).json({ error: 'Token inválido' });
  }
};

// Ruta de login
app.post('/api/login', [
  body('email').isEmail().normalizeEmail(),
  body('password').isLength({ min: 5 })
], async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }

  const { email, password } = req.body;
  console.log('Intento de login para:', email);

  try {
    const [results] = await db.query('SELECT * FROM usuarios WHERE EMAIL = ?', [email]);

    if (results.length === 0) {
      console.log('Usuario no encontrado para email:', email);
      return res.status(404).json({ error: 'Usuario no encontrado' });
    }

    const user = results[0];
    console.log('Usuario encontrado:', user.ID);

    // Comparar la contraseña (en producción usar bcrypt)
    if (user.PASSWORD !== password) {
      console.log('Contraseña incorrecta para usuario:', user.ID);
      return res.status(401).json({ error: 'Contraseña incorrecta' });
    }

    // Crear token JWT
    const token = jwt.sign(
      { id: user.ID }, 
      process.env.JWT_SECRET || 'token', 
      { expiresIn: process.env.JWT_EXPIRES_IN || '1h' }
    );

    console.log('Login exitoso para usuario:', user.ID);
    
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
    console.error('Error en login:', error);
    res.status(500).json({ error: 'Error del servidor' });
  }
});

// Ruta de registro
app.post('/api/register', [
  body('nombre_usuario').notEmpty().trim().escape(),
  body('email').isEmail().normalizeEmail(),
  body('password').isLength({ min: 5 })
], async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }

  const { nombre_usuario, email, password, telefono } = req.body;
  console.log('Nuevo registro para:', email);

  try {
    // Verificar si el email ya está registrado
    const [existingUser] = await db.query('SELECT * FROM usuarios WHERE EMAIL = ?', [email]);
    if (existingUser.length > 0) {
      console.log('Email ya registrado:', email);
      return res.status(400).json({ error: 'El correo electrónico ya está registrado' });
    }

    // Insertar nuevo usuario
    const [result] = await db.query(
      'INSERT INTO usuarios (NOMBRE_USUARIO, EMAIL, PASSWORD, ROLE, TELEFONO) VALUES (?, ?, ?, ?, ?)',
      [nombre_usuario, email, password, 1, telefono || null]
    );

    // Crear token JWT
    const token = jwt.sign(
      { id: result.insertId }, 
      process.env.JWT_SECRET || 'token', 
      { expiresIn: process.env.JWT_EXPIRES_IN || '1h' }
    );

    // Obtener usuario recién creado
    const [newUser] = await db.query('SELECT * FROM usuarios WHERE ID = ?', [result.insertId]);

    console.log('Usuario registrado exitosamente:', result.insertId);
    
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
    console.error('Error en registro:', error);
    res.status(500).json({ error: 'Error en el servidor' });
  }
});

// Ruta para obtener todos los usuarios (solo admin)
app.get('/api/usuarios', validateToken, async (req, res) => {
  console.log('Solicitud de lista de usuarios por:', req.user.ID);
  
  if (req.user.ROLE !== 2) {
    console.log('Acceso denegado. Rol del usuario:', req.user.ROLE);
    return res.status(403).json({ error: 'Acceso denegado. Solo para administradores' });
  }

  try {
    console.log('Obteniendo lista de usuarios...');
    const [results] = await db.query(
      `SELECT 
        ID, 
        NOMBRE_USUARIO, 
        EMAIL, 
        TELEFONO, 
        DATE_FORMAT(FECHA_CREACION, '%Y-%m-%d %H:%i:%s') as FECHA_CREACION, 
        ROLE 
       FROM usuarios 
       ORDER BY FECHA_CREACION DESC`
    );
    
    console.log(`Se encontraron ${results.length} usuarios`);
    res.json(results);
  } catch (error) {
    console.error('Error al obtener usuarios:', error);
    res.status(500).json({ 
      error: 'Error al obtener usuarios',
      details: process.env.NODE_ENV === 'development' ? error.message : null
    });
  }
});

// Ruta para obtener un usuario específico
app.get('/api/usuario/:id', validateToken, async (req, res) => {
  const userId = req.params.id;
  console.log(`Solicitud de usuario ${userId} por:`, req.user.ID);

  try {
    const [results] = await db.query(
      `SELECT 
        ID, 
        NOMBRE_USUARIO, 
        EMAIL, 
        TELEFONO, 
        DATE_FORMAT(FECHA_CREACION, '%Y-%m-%d %H:%i:%s') as FECHA_CREACION, 
        ROLE 
       FROM usuarios 
       WHERE ID = ?`, 
      [userId]
    );

    if (results.length === 0) {
      console.log('Usuario no encontrado:', userId);
      return res.status(404).json({ error: 'Usuario no encontrado' });
    }

    const user = results[0];
    console.log('Usuario encontrado:', user.ID);
    
    res.json(user);
  } catch (error) {
    console.error('Error al obtener usuario:', error);
    res.status(500).json({ error: 'Error del servidor' });
  }
});

// Ruta para actualizar un usuario
app.put('/api/usuario/:id', validateToken, [
  body('nombre_usuario').notEmpty().trim().escape(),
  body('email').isEmail().normalizeEmail(),
], async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }

  const userId = req.params.id;
  const { nombre_usuario, email, telefono, role } = req.body;
  console.log(`Actualización de usuario ${userId} por:`, req.user.ID);

  try {
    // Verificar si el email ya está registrado por otro usuario
    const [existingUser] = await db.query(
      'SELECT * FROM usuarios WHERE EMAIL = ? AND ID != ?',
      [email, userId]
    );
    
    if (existingUser.length > 0) {
      console.log('Email ya en uso por otro usuario:', email);
      return res.status(400).json({ error: 'El correo electrónico ya está en uso por otro usuario' });
    }

    // Solo admin puede cambiar el rol
    const newRole = req.user.ROLE === 2 ? role || 1 : undefined;
    
    // Construir la consulta dinámicamente
    let query = 'UPDATE usuarios SET NOMBRE_USUARIO = ?, EMAIL = ?, TELEFONO = ?';
    const params = [nombre_usuario, email, telefono || null];
    
    if (newRole !== undefined) {
      query += ', ROLE = ?';
      params.push(newRole);
    }
    
    query += ' WHERE ID = ?';
    params.push(userId);

    // Actualizar el usuario
    await db.query(query, params);

    // Obtener el usuario actualizado
    const [updatedUser] = await db.query(
      'SELECT * FROM usuarios WHERE ID = ?', 
      [userId]
    );

    console.log('Usuario actualizado exitosamente:', userId);
    
    res.json({
      ID: updatedUser[0].ID,
      NOMBRE_USUARIO: updatedUser[0].NOMBRE_USUARIO,
      EMAIL: updatedUser[0].EMAIL,
      TELEFONO: updatedUser[0].TELEFONO,
      ROLE: updatedUser[0].ROLE,
      FECHA_CREACION: updatedUser[0].FECHA_CREACION
    });
  } catch (error) {
    console.error('Error al actualizar usuario:', error);
    res.status(500).json({ error: 'Error al actualizar usuario' });
  }
});

// Ruta para eliminar usuario (solo admin)
app.delete('/api/usuarios/:id', validateToken, async (req, res) => {
  const userId = req.params.id;
  console.log(`Eliminación de usuario ${userId} solicitada por:`, req.user.ID);

  if (req.user.ROLE !== 2) {
    console.log('Acceso denegado. Rol del usuario:', req.user.ROLE);
    return res.status(403).json({ error: 'Acceso denegado. Solo para administradores' });
  }

  try {
    // Verificar que no se elimine a sí mismo
    if (req.user.ID === parseInt(userId)) {
      console.log('Intento de auto-eliminación:', userId);
      return res.status(400).json({ error: 'No puedes eliminarte a ti mismo' });
    }

    const [result] = await db.query('DELETE FROM usuarios WHERE ID = ?', [userId]);

    if (result.affectedRows === 0) {
      console.log('Usuario no encontrado para eliminar:', userId);
      return res.status(404).json({ error: 'Usuario no encontrado' });
    }

    console.log('Usuario eliminado exitosamente:', userId);
    res.json({ message: 'Usuario eliminado correctamente' });
  } catch (error) {
    console.error('Error al eliminar usuario:', error);
    res.status(500).json({ error: 'Error al eliminar usuario' });
  }
});

// Ruta de verificación de salud del servidor
app.get('/api/health', (req, res) => {
  res.json({
    status: 'OK',
    timestamp: new Date().toISOString(),
    database: 'Connected',
    environment: process.env.NODE_ENV || 'development'
  });
});

// Manejo de errores 404
app.use((req, res) => {
  res.status(404).json({ error: 'Ruta no encontrada' });
});

// Manejo centralizado de errores
app.use((err, req, res, next) => {
  console.error('Error no manejado:', err);
  res.status(500).json({ error: 'Error interno del servidor' });
});

// Iniciar servidor
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`🚀 Servidor corriendo en http://localhost:${PORT}`);
});