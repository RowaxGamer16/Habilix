import React, { useState } from 'react';
import {
  IonPage,
  IonContent,
  IonInput,
  IonButton,
  IonItem,
  IonLabel,
  IonHeader,
  IonToolbar,
  IonTitle,
  IonToast,
  IonGrid,
  IonRow,
  IonCol,
  IonCard,
  IonCardContent,
} from '@ionic/react';
import { useHistory } from 'react-router-dom';
import './Login.css';

const Login: React.FC = () => {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [isLogin, setIsLogin] = useState(true);
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
      localStorage.setItem('usuario', JSON.stringify(data.usuarios));
      
      // Redirección basada en el ROLE
      if (data.usuarios.ROLE === 2) {
        history.push('/InicioAdmin'); // Panel de administración
      } else {
        history.push('/Inicio_Usuario'); // Panel de usuario normal
      }

    } catch (error: any) {
      setError(error.message || 'Error al iniciar sesión. Verifique sus datos');
    } finally {
      setLoading(false);
    }
  };

  // Manejar registro (sin cambios)
  const handleRegister = async () => {
    if (!name || !email || !password) {
      setError('Por favor complete todos los campos');
      return;
    }

    if (!validateEmail(email)) {
      setError('Por favor ingrese un correo válido (ejemplo: usuario@dominio.com)');
      return;
    }

    setLoading(true);
    try {
      const response = await fetch('http://localhost:5000/api/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          nombre_usuario: name.trim(), 
          email: email.trim(), 
          password: password.trim() 
        }),
      });

      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.error || 'Error en el registro');
      }

      setName('');
      setEmail('');
      setPassword('');
      setError('¡Registro exitoso! Por favor inicie sesión');
      setIsLogin(true);

    } catch (error: any) {
      setError(error.message || 'Error al registrarse. Intente nuevamente');
    } finally {
      setLoading(false);
    }
  };

  return (
    <IonPage>
      <IonHeader>
        <IonToolbar>
          <IonTitle>{isLogin ? 'Iniciar Sesión' : 'Registrarse'}</IonTitle>
        </IonToolbar>
      </IonHeader>
      <IonContent className="login-container">
        <IonGrid>
          <IonRow className="ion-justify-content-center">
            <IonCol size="12" size-md="8" size-lg="5">
              <IonCard className="login-card">
                <IonCardContent>
                  <h2 className="ion-text-center">{isLogin ? 'Iniciar Sesión' : 'Registrarse'}</h2>

                  {!isLogin && (
                    <IonItem className="custom-input">
                      <IonLabel position="floating">Nombre de usuario</IonLabel>
                      <IonInput 
                        type="text" 
                        value={name} 
                        onIonChange={(e) => setName(e.detail.value!)} 
                      />
                    </IonItem>
                  )}

                  <IonItem className="custom-input">
                    <IonLabel position="floating">Email</IonLabel>
                    <IonInput 
                      type="email" 
                      value={email} 
                      onIonChange={(e) => setEmail(e.detail.value!)}
                      inputMode="email"
                    />
                  </IonItem>

                  <IonItem className="custom-input">
                    <IonLabel position="floating">Contraseña</IonLabel>
                    <IonInput 
                      type="password" 
                      value={password} 
                      onIonChange={(e) => setPassword(e.detail.value!)} 
                    />
                  </IonItem>

                  <IonButton 
                    expand="full" 
                    className="main-button" 
                    onClick={isLogin ? handleLogin : handleRegister}
                    disabled={loading}
                  >
                    {loading ? 'Procesando...' : (isLogin ? 'Iniciar Sesión' : 'Registrarse')}
                  </IonButton>

                  <IonButton 
                    expand="full" 
                    fill="outline" 
                    className="switch-button" 
                    onClick={() => setIsLogin(!isLogin)}
                    disabled={loading}
                  >
                    {isLogin ? 'Crear una cuenta' : 'Ya tengo una cuenta'}
                  </IonButton>
                </IonCardContent>
              </IonCard>
              <IonToast 
                isOpen={!!error} 
                message={error} 
                duration={3000} 
                onDidDismiss={() => setError('')} 
                color="danger"
              />
            </IonCol>
          </IonRow>
        </IonGrid>
      </IonContent>
    </IonPage>
  );
};

export default Login;