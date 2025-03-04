import React, { useState, useEffect } from 'react';
import {
  IonPage,
  IonHeader,
  IonToolbar,
  IonTitle,
  IonContent,
  IonCard,
  IonCardHeader,
  IonCardContent,
  IonText,
  IonGrid,
  IonRow,
  IonCol,
  IonButton,
  IonAvatar,
  IonToggle,
} from '@ionic/react';
import { useHistory } from 'react-router-dom'; // Para la redirección
import './Perfil.css';

const Perfil: React.FC = () => {
  const [darkMode, setDarkMode] = useState(false);
  const [notificationsEnabled, setNotificationsEnabled] = useState(false);
  const [userData, setUserData] = useState({ name: '', email: '' });
  const history = useHistory(); // Redirección

  useEffect(() => {
    // Obtener el token del localStorage
    const token = localStorage.getItem('token');
    if (token) {
      // Decodificar el token para obtener el ID del usuario (si el token está en formato JWT, por ejemplo)
      const decodedToken = JSON.parse(atob(token.split('.')[1])); // Esto asume que el token es un JWT
      const userId = decodedToken.id;

      // Realizar solicitud para obtener los datos del usuario desde el backend
      fetch(`/api/usuario/${userId}`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      })
        .then((response) => {
          if (response.ok) {
            return response.json();
          } else {
            throw new Error('No autorizado o sesión expirada');
          }
        })
        .then((data) => {
          setUserData({
            name: data.name, // Suponiendo que la respuesta tiene un campo 'name'
            email: data.email, // Suponiendo que la respuesta tiene un campo 'email'
          });
        })
        .catch((error) => {
          console.error('Error al obtener los datos del usuario:', error);
          // Si hay error (por ejemplo, sesión expirada), redirigir a la página de login
          history.push('/login');
        });
    } else {
      // Si no hay token, redirigir a login
      history.push('/login');
    }

    // Verificar preferencia de modo oscuro
    const savedDarkMode = localStorage.getItem('darkMode') === 'true';
    setDarkMode(savedDarkMode);
    if (savedDarkMode) {
      document.body.classList.add('dark');
    }
  }, [history]);

  const toggleDarkMode = (e: any) => {
    const isDarkModeEnabled = e.detail.checked;
    setDarkMode(isDarkModeEnabled);
    if (isDarkModeEnabled) {
      document.body.classList.add('dark');
      localStorage.setItem('darkMode', 'true'); // Guardar preferencia
    } else {
      document.body.classList.remove('dark');
      localStorage.setItem('darkMode', 'false'); // Guardar preferencia
    }
  };

  const toggleNotifications = async (e: any) => {
    const isEnabled = e.detail.checked;

    if (isEnabled) {
      if (!("Notification" in window)) {
        alert("Este navegador no soporta notificaciones.");
        return;
      }

      const permission = await Notification.requestPermission();
      if (permission === "granted") {
        setNotificationsEnabled(true);
        new Notification("Notificaciones habilitadas", {
          body: "Las notificaciones ahora están activas.",
          icon: "/assets/icon/icon.png",
        });
      } else {
        setNotificationsEnabled(false);
        alert("Permiso para notificaciones denegado.");
      }
    } else {
      setNotificationsEnabled(false);
    }
  };

  // Función para cerrar sesión
  const handleLogout = () => {
    // Eliminar el token de localStorage
    localStorage.removeItem('token');
    // Redirigir a la página de login y recargar la página
    history.push('/login');
    window.location.reload(); // Recargar la página
  };

  return (
    <IonPage>
      <IonHeader>
        <IonToolbar>
          <IonTitle>Perfil</IonTitle>
        </IonToolbar>
      </IonHeader>
      <IonContent className="ion-padding">
        {/* Sección de perfil */}
        <IonCard>
          <IonCardHeader>
            <IonGrid>
              <IonRow className="ion-align-items-center">
                <IonCol size="3">
                  <IonAvatar>
                    <img src="/assets/avatar-placeholder.png" alt="Avatar" />
                  </IonAvatar>
                </IonCol>
                <IonCol>
                  <IonText>
                    <h2>{userData.name || 'Nombre no disponible'}</h2>
                    <p>{userData.email || 'Correo electrónico no disponible'}</p>
                  </IonText>
                </IonCol>
              </IonRow>
            </IonGrid>
          </IonCardHeader>
        </IonCard>

        {/* Sección de actividad reciente, intercambios, mensajes y notificaciones */}

        {/* Sección de cerrar sesión */} 
        <IonCard>
          <IonCardHeader>
            <IonText color="danger">
              <h3>Sesión</h3>
            </IonText>
          </IonCardHeader>
          <IonCardContent>
            <IonButton
              expand="block"
              color="danger"
              style={{ marginTop: '15px' }}
              onClick={handleLogout} // Llamada a la función para cerrar sesión
            >
              Cerrar sesión
            </IonButton>
          </IonCardContent>
        </IonCard>
      </IonContent>
    </IonPage>
  );
};

export default Perfil;
