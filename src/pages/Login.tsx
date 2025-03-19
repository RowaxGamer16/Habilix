import React, { useState, useEffect } from 'react';
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
      localStorage.setItem('userId', data.usuario.id);

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
      localStorage.setItem('userId', data.usuario.id);

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
                      <IonLabel position="floating">Nombre</IonLabel>
                      <IonInput type="text" value={name} onIonChange={(e) => setName(e.detail.value!)} />
                    </IonItem>
                  )}

                  <IonItem className="custom-input">
                    <IonLabel position="floating">Email</IonLabel>
                    <IonInput type="email" value={email} onIonChange={(e) => setEmail(e.detail.value!)} />
                  </IonItem>

                  <IonItem className="custom-input">
                    <IonLabel position="floating">Contraseña</IonLabel>
                    <IonInput type="password" value={password} onIonChange={(e) => setPassword(e.detail.value!)} />
                  </IonItem>

                  <IonButton expand="full" className="main-button" onClick={isLogin ? handleLogin : handleRegister}>
                    {isLogin ? 'Iniciar Sesión' : 'Registrarse'}
                  </IonButton>

                  <IonButton expand="full" fill="outline" className="switch-button" onClick={() => setIsLogin(!isLogin)}>
                    {isLogin ? 'Crear una cuenta' : 'Ya tengo una cuenta'}
                  </IonButton>
                </IonCardContent>
              </IonCard>
              <IonToast isOpen={!!error} message={error} duration={3000} onDidDismiss={() => setError('')} />
            </IonCol>
          </IonRow>
        </IonGrid>
      </IonContent>
    </IonPage>
  );
};

export default Login;