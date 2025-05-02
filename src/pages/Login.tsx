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

interface UserData {
  ID: number;
  nombre_usuario: string;
  email: string;
  ROLE: number;
  // Agrega otros campos según lo que devuelva tu backend
}

const Login: React.FC = () => {
  const [loginData, setLoginData] = useState({ email: '', password: '' });
  const [registerData, setRegisterData] = useState({ nombre_usuario: '', email: '', password: '' });
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [loading, setLoading] = useState(false);
  const [isSignUpActive, setIsSignUpActive] = useState(false);
  const history = useHistory();

  const validateEmail = (email: string) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);

  const handleLogin = async () => {
    const { email, password } = loginData;
  
    if (!email || !password) {
      setError('Por favor ingrese su correo y contraseña');
      return;
    }
  
    if (!validateEmail(email)) {
      setError('Por favor ingrese un correo válido');
      return;
    }
  
    setLoading(true);
    
    try {
      const response = await fetch(`${API_URL}/api/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: email.trim().toLowerCase(),
          password: password.trim(),
        }),
      });
  
      const data = await response.json();
  
      if (!response.ok) {
        throw new Error(data.error || 'Credenciales incorrectas');
      }

      // Guardar datos en localStorage
      localStorage.setItem('token', data.token);
      localStorage.setItem('userData', JSON.stringify(data.usuario));
      localStorage.setItem('userId', data.usuario.ID.toString());
      localStorage.setItem('isAdmin', data.usuario.ROLE === 2 ? 'true' : 'false');

      // Redirección basada en el rol
      if (data.usuario.ROLE === 2) { // Admin
        window.location.assign('/InicioAdmin');
      } else { // Usuario normal
        window.location.assign('/Inicio_Usuario');
      }
      
    } catch (error: any) {
      console.error('Error en login:', error);
      setError(error.message || 'Error al iniciar sesión.');
    } finally {
      setLoading(false);
    }
  };

  const handleRegister = async () => {
    const { nombre_usuario, email, password } = registerData;

    if (!nombre_usuario.trim() || !email.trim() || !password.trim()) {
      setError('Por favor complete todos los campos');
      return;
    }

    if (!validateEmail(email)) {
      setError('Por favor ingrese un correo válido');
      return;
    }

    if (password.length < 5) {
      setError('La contraseña debe tener al menos 5 caracteres');
      return;
    }

    setLoading(true);

    try {
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

      const data = await response.json();

      if (!response.ok) {
        const errorMsg = data.error || data.message || 'Error en el registro';
        throw new Error(errorMsg);
      }

      setSuccess('¡Registro exitoso! Ahora puede iniciar sesión.');
      setIsSignUpActive(false);
      setLoginData({ email: email.trim().toLowerCase(), password: '' });
      setRegisterData({ nombre_usuario: '', email: '', password: '' });

    } catch (error: any) {
      console.error('Error en registro:', error);

      let errorMessage = error.message;
      if (error.message.includes('Failed to fetch')) {
        errorMessage = 'No se pudo conectar con el servidor';
      } else if (error.message.includes('ya está registrado')) {
        errorMessage = 'El correo electrónico ya está registrado';
      }

      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  return (
    <IonPage>
      <IonContent className="ion-padding">
        <div className="login-page">
          <div className={`container ${isSignUpActive ? 'right-panel-active' : ''}`}>
            {/* Registro */}
            <div className="form-container sign-up-container">
              <form onSubmit={(e) => { e.preventDefault(); handleRegister(); }}>
                <h1>Crear Cuenta</h1>

                <IonInput
                  label="Nombre de usuario"
                  labelPlacement="floating"
                  type="text"
                  placeholder="Ej: CarlosPerez"
                  value={registerData.nombre_usuario}
                  onIonInput={(e) => setRegisterData({ ...registerData, nombre_usuario: e.detail.value || '' })}
                  required
                />

                <IonInput
                  label="Correo electrónico"
                  labelPlacement="floating"
                  type="email"
                  placeholder="Ej: usuario@dominio.com"
                  value={registerData.email}
                  onIonInput={(e) => setRegisterData({ ...registerData, email: e.detail.value || '' })}
                  required
                />

                <IonInput
                  label="Contraseña"
                  labelPlacement="floating"
                  type="password"
                  placeholder="Mínimo 5 caracteres"
                  value={registerData.password}
                  onIonInput={(e) => setRegisterData({ ...registerData, password: e.detail.value || '' })}
                  required
                />

                <IonButton expand="block" type="submit" disabled={loading} className="ion-margin-top">
                  {loading ? 'Registrando...' : 'Registrarse'}
                </IonButton>
              </form>
            </div>

            {/* Login */}
            <div className="form-container sign-in-container">
              <form onSubmit={(e) => { e.preventDefault(); handleLogin(); }}>
                <h1>Iniciar Sesión</h1>

                <IonInput
                  label="Correo electrónico"
                  labelPlacement="floating"
                  type="email"
                  placeholder="Ej: usuario@dominio.com"
                  value={loginData.email}
                  onIonInput={(e) => setLoginData({ ...loginData, email: e.detail.value || '' })}
                  required
                />

                <IonInput
                  label="Contraseña"
                  labelPlacement="floating"
                  type="password"
                  value={loginData.password}
                  onIonInput={(e) => setLoginData({ ...loginData, password: e.detail.value || '' })}
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
                  <IonButton fill="clear" onClick={() => setIsSignUpActive(false)} disabled={loading}>
                    Iniciar Sesión
                  </IonButton>
                </div>

                <div className="overlay-panel overlay-right">
                  <h1>¡Hola!</h1>
                  <p>Regístrate para comenzar</p>
                  <IonButton fill="clear" onClick={() => setIsSignUpActive(true)} disabled={loading}>
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
            onDidDismiss={() => setError('')}
            color="danger"
            position="top"
          />

          <IonToast
            isOpen={!!success}
            message={success}
            duration={4000}
            onDidDismiss={() => setSuccess('')}
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