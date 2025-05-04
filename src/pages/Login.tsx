import React, { useState } from 'react';
import {
  IonPage,
  IonContent,
  IonInput,
  IonButton,
  IonToast,
  IonLoading,
} from '@ionic/react';
import { useHistory } from 'react-router-dom';
import './Login.css';

const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000';
console.log('API_URL:', API_URL); // Debug: Verificar la URL de la API

interface UserData {
  ID: number;
  nombre_usuario: string;
  email: string;
  ROLE: number;
  // Agrega otros campos según lo que devuelva tu backend
}

const Login: React.FC = () => {
  const [loginData, setLoginData] = useState({ email: '', password: '' });
  console.log('loginData state:', loginData); // Debug: Estado de login

  const [registerData, setRegisterData] = useState({ nombre_usuario: '', email: '', password: '' });
  console.log('registerData state:', registerData); // Debug: Estado de registro

  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [loading, setLoading] = useState(false);
  const [isSignUpActive, setIsSignUpActive] = useState(false);
  console.log('isSignUpActive:', isSignUpActive); // Debug: Estado del panel activo

  const history = useHistory();

  const validateEmail = (email: string) => {
    const isValid = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
    console.log('Validating email:', email, 'Result:', isValid); // Debug: Validación de email
    return isValid;
  };

  const handleLogin = async () => {
    console.log('Iniciando handleLogin'); // Debug: Inicio de función
    const { email, password } = loginData;
    console.log('Login attempt with:', { email, password }); // Debug: Datos de login

    if (!email || !password) {
      console.log('Validation failed: Campos vacíos'); // Debug: Validación fallida
      setError('Por favor ingrese su correo y contraseña');
      return;
    }
  
    if (!validateEmail(email)) {
      console.log('Validation failed: Email inválido'); // Debug: Validación fallida
      setError('Por favor ingrese un correo válido');
      return;
    }
  
    setLoading(true);
    console.log('Loading set to true'); // Debug: Estado de loading
    
    try {
      console.log('Making login request to:', `${API_URL}/api/login`); // Debug: URL de petición
      const response = await fetch(`${API_URL}/api/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: email.trim().toLowerCase(),
          password: password.trim(),
        }),
      });
  
      console.log('Response status:', response.status); // Debug: Status de respuesta
      const data = await response.json();
      console.log('Response data:', data); // Debug: Datos de respuesta

      if (!response.ok) {
        console.log('Login failed:', data.error || 'Credenciales incorrectas'); // Debug: Login fallido
        throw new Error(data.error || 'Credenciales incorrectas');
      }

      // Guardar datos en localStorage
      console.log('Saving to localStorage:', { 
        token: data.token, 
        userData: data.usuario,
        userId: data.usuario.ID,
        isAdmin: data.usuario.ROLE === 2 
      }); // Debug: Datos a guardar

      localStorage.setItem('token', data.token);
      localStorage.setItem('userData', JSON.stringify(data.usuario));
      localStorage.setItem('userId', data.usuario.ID.toString());
      localStorage.setItem('isAdmin', data.usuario.ROLE === 2 ? 'true' : 'false');

      console.log('Login successful, user role:', data.usuario.ROLE); // Debug: Rol de usuario
      
      // Redirección basada en el rol
      if (data.usuario.ROLE === 2) { // Admin
        console.log('Redirecting to admin dashboard'); // Debug: Redirección
        window.location.assign('/InicioAdmin');
      } else { // Usuario normal
        console.log('Redirecting to user dashboard'); // Debug: Redirección
        window.location.assign('/Inicio_Usuario');
      }
      
    } catch (error: any) {
      console.error('Error en login:', error); // Debug: Error capturado
      setError(error.message || 'Error al iniciar sesión.');
    } finally {
      setLoading(false);
      console.log('Loading set to false'); // Debug: Estado de loading
    }
  };

  const handleRegister = async () => {
    console.log('Iniciando handleRegister'); // Debug: Inicio de función
    const { nombre_usuario, email, password } = registerData;
    console.log('Register attempt with:', { nombre_usuario, email, password }); // Debug: Datos de registro

    if (!nombre_usuario.trim() || !email.trim() || !password.trim()) {
      console.log('Validation failed: Campos vacíos'); // Debug: Validación fallida
      setError('Por favor complete todos los campos');
      return;
    }

    if (!validateEmail(email)) {
      console.log('Validation failed: Email inválido'); // Debug: Validación fallida
      setError('Por favor ingrese un correo válido');
      return;
    }

    if (password.length < 5) {
      console.log('Validation failed: Contraseña muy corta'); // Debug: Validación fallida
      setError('La contraseña debe tener al menos 5 caracteres');
      return;
    }

    setLoading(true);
    console.log('Loading set to true'); // Debug: Estado de loading

    try {
      console.log('Making register request to:', `${API_URL}/api/register`); // Debug: URL de petición
      const response = await fetch(`${API_URL}/api/register`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          nombre_usuario: nombre_usuario.trim(),
          email: email.trim().toLowerCase(),
          password: password.trim(),
          ROLE: 1 // Por defecto todos los nuevos usuarios son normales (ROLE = 1)
        }),
      });

      console.log('Response status:', response.status); // Debug: Status de respuesta
      const data = await response.json();
      console.log('Response data:', data); // Debug: Datos de respuesta

      if (!response.ok) {
        const errorMsg = data.error || data.message || 'Error en el registro';
        console.log('Register failed:', errorMsg); // Debug: Registro fallido
        throw new Error(errorMsg);
      }

      console.log('Register successful'); // Debug: Registro exitoso
      setSuccess('¡Registro exitoso! Ahora puede iniciar sesión.');
      setIsSignUpActive(false);
      setLoginData({ email: email.trim().toLowerCase(), password: '' });
      setRegisterData({ nombre_usuario: '', email: '', password: '' });

    } catch (error: any) {
      console.error('Error en registro:', error); // Debug: Error capturado

      let errorMessage = error.message;
      if (error.message.includes('Failed to fetch')) {
        errorMessage = 'No se pudo conectar con el servidor';
      } else if (error.message.includes('ya está registrado')) {
        errorMessage = 'El correo electrónico ya está registrado';
      }

      console.log('Error message to display:', errorMessage); // Debug: Mensaje de error
      setError(errorMessage);
    } finally {
      setLoading(false);
      console.log('Loading set to false'); // Debug: Estado de loading
    }
  };

  return (
    <IonPage>
      <IonContent className="ion-padding">
        <div className="login-page">
          <div className={`container ${isSignUpActive ? 'right-panel-active' : ''}`}>
            {/* Registro */}
            <div className="form-container sign-up-container">
              <form onSubmit={(e) => { 
                console.log('Register form submitted'); // Debug: Form submit
                e.preventDefault(); 
                handleRegister(); 
              }}>
                <h1>Crear Cuenta</h1>

                <IonInput
                  label="Nombre de usuario"
                  labelPlacement="floating"
                  type="text"
                  placeholder="Ej: CarlosPerez"
                  value={registerData.nombre_usuario}
                  onIonInput={(e) => {
                    console.log('nombre_usuario input:', e.detail.value); // Debug: Input change
                    setRegisterData({ ...registerData, nombre_usuario: e.detail.value || '' });
                  }}
                  required
                />

                <IonInput
                  label="Correo electrónico"
                  labelPlacement="floating"
                  type="email"
                  placeholder="Ej: usuario@dominio.com"
                  value={registerData.email}
                  onIonInput={(e) => {
                    console.log('email input:', e.detail.value); // Debug: Input change
                    setRegisterData({ ...registerData, email: e.detail.value || '' });
                  }}
                  required
                />

                <IonInput
                  label="Contraseña"
                  labelPlacement="floating"
                  type="password"
                  placeholder="Mínimo 5 caracteres"
                  value={registerData.password}
                  onIonInput={(e) => {
                    console.log('password input:', e.detail.value); // Debug: Input change
                    setRegisterData({ ...registerData, password: e.detail.value || '' });
                  }}
                  required
                />

                <IonButton expand="block" type="submit" disabled={loading} className="ion-margin-top">
                  {loading ? 'Registrando...' : 'Registrarse'}
                </IonButton>
              </form>
            </div>

            {/* Login */}
            <div className="form-container sign-in-container">
              <form onSubmit={(e) => { 
                console.log('Login form submitted'); // Debug: Form submit
                e.preventDefault(); 
                handleLogin(); 
              }}>
                <h1>Iniciar Sesión</h1>

                <IonInput
                  label="Correo electrónico"
                  labelPlacement="floating"
                  type="email"
                  placeholder="Ej: usuario@dominio.com"
                  value={loginData.email}
                  onIonInput={(e) => {
                    console.log('email input:', e.detail.value); // Debug: Input change
                    setLoginData({ ...loginData, email: e.detail.value || '' });
                  }}
                  required
                />

                <IonInput
                  label="Contraseña"
                  labelPlacement="floating"
                  type="password"
                  value={loginData.password}
                  onIonInput={(e) => {
                    console.log('password input:', e.detail.value); // Debug: Input change
                    setLoginData({ ...loginData, password: e.detail.value || '' });
                  }}
                  required
                />

                <IonButton expand="block" type="submit" disabled={loading} className="ion-margin-top">
                  {loading ? 'Iniciando sesión...' : 'Iniciar Sesión'}
                </IonButton>
              </form>
            </div>

            {/* Panel overlay */}
            <div className="overlay-container">
              <div className="overlay">
                <div className="overlay-panel overlay-left">
                  <h1>¡Bienvenido de vuelta!</h1>
                  <p>Para acceder a tu cuenta, inicia sesión</p>
                  <IonButton 
                    fill="clear" 
                    onClick={() => {
                      console.log('Switching to login panel'); // Debug: Cambio de panel
                      setIsSignUpActive(false);
                    }} 
                    disabled={loading}
                  >
                    Iniciar Sesión
                  </IonButton>
                </div>

                <div className="overlay-panel overlay-right">
                  <h1>¡Hola!</h1>
                  <p>Regístrate para comenzar</p>
                  <IonButton 
                    fill="clear" 
                    onClick={() => {
                      console.log('Switching to register panel'); // Debug: Cambio de panel
                      setIsSignUpActive(true);
                    }} 
                    disabled={loading}
                  >
                    Registrarse
                  </IonButton>
                </div>
              </div>
            </div>
          </div>

          {/* Toasts */}
          <IonToast
            isOpen={!!error}
            message={error}
            duration={4000}
            onDidDismiss={() => {
              console.log('Error toast dismissed'); // Debug: Toast cerrado
              setError('');
            }}
            color="danger"
            position="top"
          />

          <IonToast
            isOpen={!!success}
            message={success}
            duration={4000}
            onDidDismiss={() => {
              console.log('Success toast dismissed'); // Debug: Toast cerrado
              setSuccess('');
            }}
            color="success"
            position="top"
          />

          <IonLoading
            isOpen={loading}
            message={isSignUpActive ? 'Registrando usuario...' : 'Iniciando sesión...'}
          />
        </div>
      </IonContent>
    </IonPage>
  );
};

export default Login;