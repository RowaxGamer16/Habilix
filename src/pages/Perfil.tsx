import React, { useState, useEffect } from 'react';
import {
  IonPage, IonHeader, IonToolbar, IonTitle, IonContent, IonCard, IonCardHeader,
  IonCardContent, IonText, IonButton, IonAvatar, IonToast, IonLoading,
  IonIcon, IonItem, IonLabel, IonBadge
} from '@ionic/react';
import { useHistory } from 'react-router-dom';
import { jwtDecode } from 'jwt-decode';
import {
  logOutOutline, personCircleOutline, mailOutline, callOutline, settingsOutline,
  schoolOutline, calendarOutline, starOutline
} from 'ionicons/icons';
import './Perfil.css';

interface UserProfile {
  ID: number;
  NOMBRE_USUARIO: string;
  EMAIL: string;
  ROLE: string | number;
  TELEFONO?: string;
  FECHA_CREACION: string;
  CURSOS_CREADOS?: number;
  CURSOS_TOMADOS?: number;
  RATING?: number;
}

const Perfil: React.FC = () => {
  const [userData, setUserData] = useState<UserProfile>({
    ID: 0,
    NOMBRE_USUARIO: '',
    EMAIL: '',
    ROLE: '1',
    TELEFONO: '',
    FECHA_CREACION: new Date().toISOString()
  });
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [showLogoutToast, setShowLogoutToast] = useState(false);
  const history = useHistory();

  useEffect(() => {
    const fetchUserProfile = async () => {
      const token = localStorage.getItem('token');
      if (!token) {
        history.push('/login');
        return;
      }

      setIsLoading(true);
      try {
        const response = await fetch('http://localhost:5000/api/usuario', {
          method: 'GET',
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        });

        if (!response.ok) {
          const errorData = await response.json().catch(() => ({}));
          throw new Error(errorData.error || 'Error al obtener perfil');
        }

        const data = await response.json();
        console.log('Datos del usuario recibidos:', data); // Depuración
        
        if (!data.usuario) {
          throw new Error('Datos de usuario no encontrados');
        }

        setUserData({
          ID: data.usuario.ID,
          NOMBRE_USUARIO: data.usuario.NOMBRE_USUARIO,
          EMAIL: data.usuario.EMAIL,
          ROLE: data.usuario.ROLE,
          TELEFONO: data.usuario.TELEFONO || '',
          FECHA_CREACION: data.usuario.FECHA_CREACION,
          CURSOS_CREADOS: data.usuario.CURSOS_CREADOS || 0,
          CURSOS_TOMADOS: data.usuario.CURSOS_TOMADOS || 0,
          RATING: data.usuario.RATING || 0
        });

      } catch (err) {
        console.error('Error fetching profile:', err);
        const message = err instanceof Error ? err.message : 'Error desconocido';
        setError(message);
        
        if (message.includes('token') || message.includes('autenticación')) {
          localStorage.removeItem('token');
          history.push('/login');
        }
      } finally {
        setIsLoading(false);
      }
    };

    fetchUserProfile();
  }, [history]);

  const handleLogout = () => {
    localStorage.removeItem('token');
    setShowLogoutToast(true);
    setTimeout(() => {
      window.location.assign('/login');
    }, 1500);
  };

  const handleEditProfile = () => {
    history.push('/EditarPerfil', { 
      userData: {
        ID: userData.ID,
        NOMBRE_USUARIO: userData.NOMBRE_USUARIO,
        EMAIL: userData.EMAIL,
        TELEFONO: userData.TELEFONO
      }
    });
  };

  const formatDate = (dateString: string) => {
    const options: Intl.DateTimeFormatOptions = {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    };
    return new Date(dateString).toLocaleDateString('es-ES', options);
  };

  const getRoleName = (role: string | number) => {
    // Convertir a string si es número y eliminar decimales si los hay
    const roleStr = typeof role === 'number' ? role.toString() : role;
    const normalizedRole = roleStr.includes('.') ? roleStr.split('.')[0] : roleStr;
    
    switch(normalizedRole) {
      case '1':
        return 'Instructor';
      case '2':
        return 'Administrador';
      case '3':
        return 'Estudiante';
      default:
        return `Rol desconocido (${role})`;
    }
  };

  return (
    <IonPage>
      <IonHeader>
        <IonToolbar color="primary">
          <IonTitle>Mi Perfil</IonTitle>
        </IonToolbar>
      </IonHeader>

      <IonContent className="ion-padding">
        <IonLoading isOpen={isLoading} message="Cargando perfil..." />

        <div className="profile-header ion-text-center ion-padding">
          <IonAvatar className="profile-avatar">
            <img 
              src={`https://ui-avatars.com/api/?name=${userData.NOMBRE_USUARIO}&background=random`} 
              alt="Avatar" 
            />
          </IonAvatar>
          <h1>{userData.NOMBRE_USUARIO}</h1>
          <IonBadge color="primary">
            {getRoleName(userData.ROLE)}  {/* Muestra el ID del rol para depuración */}
          </IonBadge>
        </div>

        <IonCard className="profile-card">
          <IonCardHeader>
            <IonText color="primary"><h2>Información Básica</h2></IonText>
          </IonCardHeader>
          <IonCardContent>
            <IonItem lines="none">
              <IonIcon icon={mailOutline} slot="start" color="medium" />
              <IonLabel>
                <p>Correo electrónico</p>
                <h3>{userData.EMAIL}</h3>
              </IonLabel>
            </IonItem>

            <IonItem lines="none">
              <IonIcon icon={callOutline} slot="start" color="medium" />
              <IonLabel>
                <p>Teléfono</p>
                <h3>{userData.TELEFONO || 'No especificado'}</h3>
              </IonLabel>
            </IonItem>

            <IonItem lines="none">
              <IonIcon icon={calendarOutline} slot="start" color="medium" />
              <IonLabel>
                <p>Miembro desde</p>
                <h3>{formatDate(userData.FECHA_CREACION)}</h3>
              </IonLabel>
            </IonItem>
          </IonCardContent>
        </IonCard>

        <div className="ion-padding profile-actions">
          <IonButton expand="block" onClick={handleEditProfile}>
            Editar Perfil
          </IonButton>
          <IonButton 
            expand="block" 
            fill="outline" 
            color="danger" 
            onClick={handleLogout}
          >
            <IonIcon icon={logOutOutline} slot="start" />
            Cerrar Sesión
          </IonButton>
        </div>

        <IonToast
          isOpen={!!error}
          message={error}
          duration={4000}
          color="danger"
          onDidDismiss={() => setError('')}
          buttons={[{ text: 'OK', role: 'cancel' }]}
        />

        <IonToast
          isOpen={showLogoutToast}
          message="Sesión cerrada correctamente"
          duration={1500}
          color="success"
          onDidDismiss={() => setShowLogoutToast(false)}
        />
      </IonContent>
    </IonPage>
  );
};

export default Perfil;