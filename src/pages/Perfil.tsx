import React, { useState, useEffect } from 'react';
import {
  IonPage, IonHeader, IonToolbar, IonTitle, IonContent, IonCard, IonCardHeader,
  IonCardContent, IonText, IonButton, IonAvatar, IonToast, IonLoading,
  IonIcon, IonItem, IonLabel
} from '@ionic/react';
import { useHistory } from 'react-router-dom';
import { jwtDecode } from 'jwt-decode';
import {
  logOutOutline, personCircleOutline, mailOutline, callOutline, settingsOutline
} from 'ionicons/icons';
import './Perfil.css';

interface UserData {
  id: number;
  nombre_usuario: string;
  email: string;
  role: number;
  telefono?: string;
  fecha_creacion?: string;
}

const Perfil: React.FC = () => {
  const [userData, setUserData] = useState<UserData>({
    id: 0, nombre_usuario: '', email: '', role: 1
  });
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [showLogoutToast, setShowLogoutToast] = useState(false);
  const history = useHistory();

  const BASE_URL = 'http://localhost:5000';

  useEffect(() => {
    const token = localStorage.getItem('token');
    if (!token) {
      history.push('/login');
      return;
    }

    const fetchUserData = async () => {
      setIsLoading(true);
      try {
        const decoded = jwtDecode<{ ID: number }>(token);

        const response = await fetch(`${BASE_URL}/api/usuario/perfil`, {

          method: 'GET',
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        });

        if (!response.ok) {
          const errorData = await response.json().catch(() => ({}));
          throw new Error(errorData.error || 'Error al obtener datos del usuario');
        }

        const data = await response.json();

        setUserData({
          id: data.id,
          nombre_usuario: data.nombre_usuario,
          email: data.email,
          role: data.role,
          telefono: data.telefono || '',
          fecha_creacion: data.fecha_creacion || new Date().toISOString()
        });

        localStorage.setItem('userBasicData', JSON.stringify({
          id: data.id,
          nombre_usuario: data.nombre_usuario,
          email: data.email
        }));

      } catch (err) {
        console.error('Error al obtener perfil:', err);
        const msg = err instanceof Error ? err.message : 'Error desconocido';
        const isAuthError = msg.includes('Token') || msg.includes('autorizado');
        setError(msg);
        if (isAuthError) {
          localStorage.removeItem('token');
          history.push('/login');
        }
      } finally {
        setIsLoading(false);
      }
    };

    fetchUserData();
  }, [history]);

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('userBasicData');
    setShowLogoutToast(true);
    setTimeout(() => history.push('/login'), 1500);
  };

  const handleEditProfile = () => {
    history.push('/editar-perfil');
  };

  const formatDate = (fecha?: string) => {
    if (!fecha) return 'No disponible';
    return new Date(fecha).toLocaleDateString('es-ES', {
      year: 'numeric', month: 'long', day: 'numeric'
    });
  };

  const getRoleName = (role: number) => role === 1 ? 'Usuario estándar' : 'Administrador';

  return (
    <IonPage>
      <IonHeader>
        <IonToolbar color="primary">
          <IonTitle>Mi Perfil</IonTitle>
        </IonToolbar>
      </IonHeader>

      <IonContent className="ion-padding profile-content">
        <IonLoading isOpen={isLoading} message="Cargando tus datos..." spinner="crescent" />

        <div className="profile-header">
          <IonAvatar className="profile-avatar">
            <img src="" alt="Avatar" onError={(e) => (e.target as HTMLImageElement).src = ''} />
          </IonAvatar>
          <h1 className="profile-name">{userData.nombre_usuario || 'Usuario'}</h1>
          <p className="profile-role">{getRoleName(userData.role)}</p>
        </div>

        <IonCard className="profile-info-card">
          <IonCardHeader>
            <IonText color="primary"><h2>Información Personal</h2></IonText>
          </IonCardHeader>
          <IonCardContent>
            <IonItem lines="none">
              <IonIcon icon={personCircleOutline} slot="start" color="primary" />
              <IonLabel>
                <h3>Nombre de usuario</h3>
                <p>{userData.nombre_usuario || 'No disponible'}</p>
              </IonLabel>
            </IonItem>
            <IonItem lines="none">
              <IonIcon icon={mailOutline} slot="start" color="primary" />
              <IonLabel>
                <h3>Correo electrónico</h3>
                <p>{userData.email || 'No disponible'}</p>
              </IonLabel>
            </IonItem>
            {userData.telefono && (
              <IonItem lines="none">
                <IonIcon icon={callOutline} slot="start" color="primary" />
                <IonLabel>
                  <h3>Teléfono</h3>
                  <p>{userData.telefono}</p>
                </IonLabel>
              </IonItem>
            )}
            <IonItem lines="none">
              <IonIcon icon={settingsOutline} slot="start" color="primary" />
              <IonLabel>
                <h3>Miembro desde</h3>
                <p>{formatDate(userData.fecha_creacion)}</p>
              </IonLabel>
            </IonItem>
          </IonCardContent>
        </IonCard>

        <div className="profile-actions">
          <IonButton expand="block" fill="solid" color="primary" onClick={handleEditProfile}>
            Editar Perfil
          </IonButton>
          <IonButton expand="block" fill="outline" color="danger" onClick={handleLogout}>
            <IonIcon icon={logOutOutline} slot="start" />
            Cerrar Sesión
          </IonButton>
        </div>

        <IonToast
          isOpen={!!error}
          message={error}
          duration={4000}
          color="danger"
          position="top"
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
