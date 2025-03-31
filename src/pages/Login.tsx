import React, { useState, useEffect } from 'react';
import {
  IonPage,
  IonContent,
  IonInput,
  IonButton,
  IonHeader,
  IonToolbar,
  IonTitle,
  IonToast,
} from '@ionic/react';
import { useHistory } from 'react-router-dom';
import './Login.css';

const Login: React.FC = () => {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [isSignUpActive, setIsSignUpActive] = useState(false);
  const history = useHistory();

  // Verificar si el usuario ya está autenticado
  useEffect(() => {
    const token = localStorage.getItem('token');
    if (token) {
      // Redirigir a Inicio_Usuario si ya está autenticado
      history.push('/Inicio_Usuario');
    }
  }, [history]);

  // Validar el formato del email
  const validateEmail = (email: string) => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  };

  // Manejar el inicio de sesión
  const handleLogin = async () => {
    if (!email || !password) {
      setError('Por favor ingrese su correo y contraseña');
      return;
    }

    if (!validateEmail(email)) {
      setError('Por favor ingrese un correo electrónico válido');
      return;
    }

    try {
      const response = await fetch('http://localhost:5000/api/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password: password.trim() }),
      });

      const data = await response.json();
      if (!response.ok) throw new Error(data.error || 'Error al iniciar sesión');

      // Guardar datos en localStorage
      localStorage.setItem('token', data.token);
      localStorage.setItem('usuario', JSON.stringify(data.usuario));
      localStorage.setItem('userId', data.usuario.ID);

      // Redirigir a Inicio_Usuario después del login
      history.push('/Inicio_Usuario');

      // Recargar la página para actualizar el estado
      window.location.reload();
    } catch (error: any) {
      setError(error.message || 'Error al iniciar sesión. Verifique sus credenciales');
    }
  };

  // Manejar el registro
  const handleRegister = async () => {
    if (!name || !email || !password) {
      setError('Por favor ingrese todos los campos');
      return;
    }

    if (!validateEmail(email)) {
      setError('Por favor ingrese un correo electrónico válido');
      return;
    }

    try {
      const response = await fetch('http://localhost:5000/api/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ nombre_usuario: name, email, password: password.trim() }),
      });

      const data = await response.json();
      if (!response.ok) throw new Error(data.error || 'Error en el registro');

      // Guardar datos en localStorage
      localStorage.setItem('token', data.token);
      localStorage.setItem('usuario', JSON.stringify(data.usuario));
      localStorage.setItem('userId', data.usuario.ID);

      // Redirigir a Inicio_Usuario después del registro
      history.push('/Inicio_Usuario');

      // Recargar la página para actualizar el estado
      window.location.reload();
    } catch (error: any) {
      setError(error.message || 'Error en el registro. Intente nuevamente');
    }
  };

  return (
    <IonPage>
      <IonContent className="ion-padding">
        {/* Contenedor específico para la página de login */}
        <div className="login-page">
          <div className={`container ${isSignUpActive ? 'right-panel-active' : ''}`} id="container">
            {/* Formulario de Registro */}
            <div className="form-container sign-up-container">
              <form>
                <h1>Create Account</h1>
                <div className="social-container">
                  <a href="#" className="social">
                    <i className="fab fa-facebook-f"></i>
                  </a>
                  <a href="#" className="social">
                    <i className="fab fa-google-plus-g"></i>
                  </a>
                  <a href="#" className="social">
                    <i className="fab fa-linkedin-in"></i>
                  </a>
                </div>
                <span>or use your email for registration</span>
                <IonInput
                  type="text"
                  placeholder="Name"
                  value={name}
                  onIonChange={(e) => setName(e.detail.value!)}
                />
                <IonInput
                  type="email"
                  placeholder="Email"
                  value={email}
                  onIonChange={(e) => setEmail(e.detail.value!)}
                />
                <IonInput
                  type="password"
                  placeholder="Password"
                  value={password}
                  onIonChange={(e) => setPassword(e.detail.value!)}
                />
                <IonButton expand="block" onClick={handleRegister}>
                  Sign Up
                </IonButton>
              </form>
            </div>

            {/* Formulario de Inicio de Sesión */}
            <div className="form-container sign-in-container">
              <form>
                <h1>Sign in</h1>
                <div className="social-container">
                  <a href="#" className="social">
                    <i className="fab fa-facebook-f"></i>
                  </a>
                  <a href="#" className="social">
                    <i className="fab fa-google-plus-g"></i>
                  </a>
                  <a href="#" className="social">
                    <i className="fab fa-linkedin-in"></i>
                  </a>
                </div>
                <span>or use your account</span>
                <IonInput
                  type="email"
                  placeholder="Email"
                  value={email}
                  onIonChange={(e) => setEmail(e.detail.value!)}
                />
                <IonInput
                  type="password"
                  placeholder="Password"
                  value={password}
                  onIonChange={(e) => setPassword(e.detail.value!)}
                />
                <a href="#">Forgot your password?</a>
                <IonButton expand="block" onClick={handleLogin}>
                  Sign In
                </IonButton>
              </form>
            </div>

            {/* Overlay */}
            <div className="overlay-container">
              <div className="overlay">
                <div className="overlay-panel overlay-left">
                  <h1>Welcome Back!</h1>
                  <p>To keep connected with us please login with your personal info</p>
                  <IonButton className="ghost" onClick={() => setIsSignUpActive(false)}>
                    Sign In
                  </IonButton>
                </div>
                <div className="overlay-panel overlay-right">
                  <h1>Hello, Friend!</h1>
                  <p>Enter your personal details and start journey with us</p>
                  <IonButton className="ghost" onClick={() => setIsSignUpActive(true)}>
                    Sign Up
                  </IonButton>
                </div>
              </div>
            </div>
          </div>

          {/* Mostrar errores */}
          <IonToast
            isOpen={!!error}
            message={error}
            duration={3000}
            onDidDismiss={() => setError('')}
          />
        </div>
      </IonContent>
    </IonPage>
  );
};

export default Login;