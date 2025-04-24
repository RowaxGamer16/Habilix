import React, { useState } from 'react';
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
  const [loading, setLoading] = useState(false);
  const history = useHistory();  

  // Validar formato de email
  const validateEmail = (email: string) => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  };

  // Manejar inicio de sesión
  const handleLogin = async () => {
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
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          email: email.trim(), 
          password: password.trim() 
        }),
      });

      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.error || data.errors?.join(', ') || 'Credenciales incorrectas');
      }

      // Guardar datos en localStorage
      localStorage.setItem('token', data.token);
      localStorage.setItem('usuario', JSON.stringify(data.usuario));
      localStorage.setItem('userId', data.usuario.ID);
      
      // Redirigir después de login exitoso
      history.push('/Inicio_Usuario'); // Ajusta según tu ruta

    } catch (error: any) {
      setError(error.message || 'Error al iniciar sesión. Verifique sus datos');
    } finally {
      setLoading(false);
    }
  };

  // Manejar registro
  const handleRegister = async () => {
    // Resetear errores previos
    setError('');
    
    // Validaciones básicas
    if (!name || !email || !password) {
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
                nombre_usuario: name.trim(), 
                email: email.trim().toLowerCase(), 
                password: password.trim() 
            }),
        });

        // Manejar respuestas no exitosas
        if (!response.ok) {
            const errorData = await response.json().catch(() => ({}));
            const errorMessage = errorData.error || 
                              errorData.message || 
                              `Error ${response.status}: ${response.statusText}`;
            throw new Error(errorMessage);
        }

        const data = await response.json();
        
        // Guardar datos de autenticación
        localStorage.setItem('token', data.token);
        localStorage.setItem('usuario', JSON.stringify(data.usuario));
        localStorage.setItem('userId', data.usuario.ID);

        // Cambiar al formulario de login después del registro exitoso
        setIsSignUpActive(false);

        // Redirigir a la página de inicio de sesión o dashboard
        history.push('/login'); // Ajusta según tu ruta

    } catch (error: any) {
        console.error('Error en registro:', error);
        
        // Mensajes de error más específicos
        let errorMessage = error.message;
        if (error.message.includes('Failed to fetch')) {
            errorMessage = 'No se pudo conectar con el servidor. Verifica tu conexión o intenta más tarde.';
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
                  <p>Enter your personal details and start your journey with us</p>
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
