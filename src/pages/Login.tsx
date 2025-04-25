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

const Login: React.FC = () => {
  const [loginData, setLoginData] = useState({ email: '', password: '' });
  const [registerData, setRegisterData] = useState({ 
    nombre_usuario: '', 
    email: '', 
    password: '' 
  });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [isSignUpActive, setIsSignUpActive] = useState(false);
  const history = useHistory();

  const validateEmail = (email: string) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);

  const handleLogin = async () => {
    const { email, password } = loginData;

    // Validaciones
    if (!email || !password) {
      setError('Por favor ingrese su correo y contraseña');
      return;
    }

    if (!validateEmail(email)) {
      setError('Por favor ingrese un correo válido (ejemplo: usuario@dominio.com)');
      return;
    }

    setLoading(true);
    try {
      const response = await fetch('http://localhost:5000/api/login', {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'Accept': 'application/json'
        },
        body: JSON.stringify({ 
          email: email.trim().toLowerCase(), 
          password: password.trim() 
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || data.message || 'Credenciales incorrectas');
      }

      // Almacenamiento seguro de datos
      localStorage.setItem('token', data.token);
      localStorage.setItem('usuario', JSON.stringify(data.user));
      localStorage.setItem('userId', data.user.ID);

      // 🔴 Redirección FORZADA (100% efectiva)
      window.location.href = '/Inicio_Usuario'; 

      // Opcional: Redirección SPA (sin recargar)
      // history.push('/Inicio_Usuario');

    } catch (error: any) {
      console.error('Error en login:', error);
      setError(error.message || 'Error al iniciar sesión. Verifique sus datos.');
    } finally {
      setLoading(false);
    }
  };

  const handleRegister = async () => {
    const { nombre_usuario, email, password } = registerData;

    // Validaciones
    if (!nombre_usuario?.trim() || !email?.trim() || !password?.trim()) {
      setError('Por favor complete todos los campos');
      return;
    }

    if (!validateEmail(email)) {
      setError('Por favor ingrese un correo válido (ejemplo: usuario@dominio.com)');
      return;
    }

    if (password.length < 5) {
      setError('La contraseña debe tener al menos 5 caracteres');
      return;
    }

    setLoading(true);

    try {
      const response = await fetch('http://localhost:5000/api/register', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json'
        },
        body: JSON.stringify({
          nombre_usuario: nombre_usuario.trim(),
          email: email.trim().toLowerCase(),
          password: password.trim()
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        const errorMsg = data.error || 
                        data.message || 
                        data.errors?.map((e: any) => e.message).join(', ') || 
                        'Error en el registro';
        throw new Error(errorMsg);
      }

      // Almacenamiento y redirección
      localStorage.setItem('token', data.token);
      localStorage.setItem('usuario', JSON.stringify(data.user));
      
      // Mensaje de éxito y cambio a formulario de login
      setError('¡Registro exitoso! Por favor inicie sesión');
      setIsSignUpActive(false);
      setLoginData({...loginData, email: email.trim().toLowerCase()});
      
    } catch (error: any) {
      console.error('Error en registro:', error);
      
      let errorMessage = error.message;
      if (error.message.includes('Failed to fetch')) {
        errorMessage = 'No se pudo conectar con el servidor. Verifica tu conexión.';
      } else if (error.message.includes('already registered') || 
                 error.message.includes('ya está registrado')) {
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
            
            {/* Formulario de Registro */}
            <div className="form-container sign-up-container">
              <form onSubmit={e => { e.preventDefault(); handleRegister(); }}>
                <h1>Crear Cuenta</h1>
                <IonInput
                  label="Nombre de usuario"
                  labelPlacement="floating"
                  type="text"
                  placeholder="Ej: CarlosPerez"
                  value={registerData.nombre_usuario}
                  onIonChange={e => setRegisterData({...registerData, nombre_usuario: e.detail.value!})}
                  required
                  minlength={3}
                />
                <IonInput
                  label="Correo electrónico"
                  labelPlacement="floating"
                  type="email"
                  placeholder="Ej: usuario@dominio.com"
                  value={registerData.email}
                  onIonChange={e => setRegisterData({...registerData, email: e.detail.value!})}
                  required
                />
                <IonInput
                  label="Contraseña (mínimo 5 caracteres)"
                  labelPlacement="floating"
                  type="password"
                  value={registerData.password}
                  onIonChange={e => setRegisterData({...registerData, password: e.detail.value!})}
                  required
                  minlength={5}
                />
                <IonButton 
                  expand="block" 
                  type="submit" 
                  disabled={loading}
                  className="ion-margin-top"
                >
                  {loading ? 'Registrando...' : 'Registrarse'}
                </IonButton>
              </form>
            </div>

            {/* Formulario de Inicio de Sesión */}
            <div className="form-container sign-in-container">
              <form onSubmit={(e) => { e.preventDefault(); handleLogin(); }}>
                <h1>Iniciar Sesión</h1>
                <IonInput
                  label="Correo electrónico"
                  labelPlacement="floating"
                  type="email"
                  placeholder="Ej: usuario@dominio.com"
                  value={loginData.email}
                  onIonChange={(e) => setLoginData({...loginData, email: e.detail.value!})}
                  required
                />
                <IonInput
                  label="Contraseña"
                  labelPlacement="floating"
                  type="password"
                  value={loginData.password}
                  onIonChange={(e) => setLoginData({...loginData, password: e.detail.value!})}
                  required
                />
                <IonButton 
                  expand="block" 
                  type="submit" 
                  disabled={loading}
                  className="ion-margin-top"
                >
                  {loading ? 'Iniciando sesión...' : 'Iniciar Sesión'}
                </IonButton>
              </form>
            </div>

            {/* Overlay */}
            <div className="overlay-container">
              <div className="overlay">
                <div className="overlay-panel overlay-left">
                  <h1>¡Bienvenido de vuelta!</h1>
                  <p>Para acceder a tu cuenta, inicia sesión con tus credenciales</p>
                  <IonButton 
                    fill="clear" 
                    onClick={() => setIsSignUpActive(false)}
                    disabled={loading}
                  >
                    Iniciar Sesión
                  </IonButton>
                </div>
                <div className="overlay-panel overlay-right">
                  <h1>¡Hola, Bienvenido!</h1>
                  <p>Regístrate con tus datos para comenzar a usar la aplicación</p>
                  <IonButton 
                    fill="clear" 
                    onClick={() => setIsSignUpActive(true)}
                    disabled={loading}
                  >
                    Registrarse
                  </IonButton>
                </div>
              </div>
            </div>
          </div>

          {/* Notificaciones */}
          <IonToast
            isOpen={!!error}
            message={error}
            duration={5000}
            onDidDismiss={() => setError('')}
            color={error.includes('éxito') ? 'success' : 'danger'}
            position="top"
          />
          <IonLoading 
            isOpen={loading} 
            message={isSignUpActive ? "Registrando usuario..." : "Iniciando sesión..."} 
          />
        </div>
      </IonContent>
    </IonPage>
  );
};

export default Login;