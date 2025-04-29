import React, { useState, useEffect } from 'react';
import {
  IonPage, IonHeader, IonToolbar, IonTitle, IonContent, IonCard,
  IonCardHeader, IonCardContent, IonText, IonButton, IonAvatar,
  IonToast, IonLoading, IonIcon, IonItem, IonLabel, IonBadge
} from '@ionic/react';
import { useHistory } from 'react-router-dom';
import { jwtDecode } from 'jwt-decode';
import {
  logOutOutline, personCircleOutline, mailOutline, callOutline,
  settingsOutline, calendarOutline, shieldCheckmarkOutline
} from 'ionicons/icons';
import './Perfil.css';

interface UserData {
  id: number;
  nombre_usuario: string;
  email: string;
  role: number;
  telefono?: string;
  fecha_creacion?: string;
  ultimo_acceso?: string;
  estado_cuenta?: string;
}

const Perfil: React.FC = () => {
  const [userData, setUserData] = useState<UserData>({
    id: 0,
    nombre_usuario: '',
    email: '',
    role: 1,
    telefono: '',
    fecha_creacion: '',
    ultimo_acceso: '',
    estado_cuenta: 'Activa'
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
          fecha_creacion: data.fecha_creacion || new Date().toISOString(),
          ultimo_acceso: data.ultimo_acceso || new Date().toISOString(),
          estado_cuenta: data.estado_cuenta || 'Activa'
        });

      } catch (err) {
        console.error('Error al obtener perfil:', err);
        const msg = err instanceof Error ? err.message : 'Error desconocido';
        setError(msg);
        if (msg.includes('Token') || msg.includes('autorizado')) {
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
    setShowLogoutToast(true);
    setTimeout(() => history.push('/login'), 1500);
  };

  const handleEditProfile = () => {
    history.push('/editar-perfil');
  };

  const formatDate = (fecha?: string) => {
    if (!fecha) return 'No disponible';
    return new Date(fecha).toLocaleDateString('es-ES', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const getRoleName = (role: number) => {
    switch (role) {
      case 1: return 'Usuario Estándar';
      case 2: return 'Administrador';
      case 3: return 'Super Administrador';
      default: return 'Usuario';
    }
  };

  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map(word => word.charAt(0))
      .join('')
      .toUpperCase()
      .slice(0, 2);
  };

  return (
    <IonPage>
      <IonHeader>
        <IonToolbar color="primary" className="profile-toolbar">
          <IonTitle>Perfil de Usuario</IonTitle>
        </IonToolbar>
      </IonHeader>

      <IonContent className="ion-padding profile-content">
        <IonLoading
          isOpen={isLoading}
          message="Cargando perfil..."
          spinner="crescent"
          cssClass="custom-loading"
        />

        <div className="profile-header">
          <IonAvatar className="profile-avatar">
            <div className="avatar-fallback">
              {getInitials(userData.nombre_usuario || 'Usuario')}
            </div>
            <img
              src={`https://api.dicebear.com/7.x/initials/svg?seed=${userData.nombre_usuario}`}
              alt="Avatar"
              onError={(e) => (e.target as HTMLImageElement).style.display = 'none'}
            />
          </IonAvatar>
          <h1 className="profile-name">{userData.nombre_usuario || 'Usuario'}</h1>
          <p className="profile-role">
            {getRoleName(userData.role)}
            <IonBadge color={userData.estado_cuenta === 'Activa' ? 'success' : 'danger'} className="status-badge">
              {userData.estado_cuenta}
            </IonBadge>
          </p>
        </div>

        <IonCard className="profile-info-card">
          <IonCardHeader className="profile-info-header">
            <IonText color="primary"><h2>Información Personal</h2></IonText>
          </IonCardHeader>
          <IonCardContent>
            <IonItem lines="none" className="profile-item">
              <IonIcon icon={personCircleOutline} slot="start" color="primary" />
              <IonLabel>
                <h3>Nombre de usuario</h3>
                <p>{userData.nombre_usuario || 'No disponible'}</p>
              </IonLabel>
            </IonItem>
            <IonItem lines="none" className="profile-item">
              <IonIcon icon={mailOutline} slot="start" color="primary" />
              <IonLabel>
                <h3>Correo electrónico</h3>
                <p>{userData.email || 'No disponible'}</p>
              </IonLabel>
            </IonItem>
            {userData.telefono && (
              <IonItem lines="none" className="profile-item">
                <IonIcon icon={callOutline} slot="start" color="primary" />
                <IonLabel>
                  <h3>Teléfono</h3>
                  <p>{userData.telefono}</p>
                </IonLabel>
              </IonItem>
            )}
            <IonItem lines="none" className="profile-item">
              <IonIcon icon={calendarOutline} slot="start" color="primary" />
              <IonLabel>
                <h3>Miembro desde</h3>
                <p>{formatDate(userData.fecha_creacion)}</p>
              </IonLabel>
            </IonItem>
            <IonItem lines="none" className="profile-item">
              <IonIcon icon={settingsOutline} slot="start" color="primary" />
              <IonLabel>
                <h3>Último acceso</h3>
                <p>{formatDate(userData.ultimo_acceso)}</p>
              </IonLabel>
            </IonItem>
            <IonItem lines="none" className="profile-item">
              <IonIcon icon={shieldCheckmarkOutline} slot="start" color="primary" />
              <IonLabel>
                <h3>Estado de la cuenta</h3>
                <p>{userData.estado_cuenta}</p>
              </IonLabel>
            </IonItem>
          </IonCardContent>
        </IonCard>

        <div className="profile-actions">
          <IonButton
            expand="block"
            className="edit-button"
            onClick={handleEditProfile}
          >
            <IonIcon icon={settingsOutline} slot="start" />
            Editar Perfil
          </IonButton>
          <IonButton
            expand="block"
            className="logout-button"
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
          position="top"
          onDidDismiss={() => setError('')}
          buttons={[{ text: 'OK', role: 'cancel' }]}
        />

        <IonToast
          isOpen={showLogoutToast}
          message="Sesión cerrada correctamente"
          duration={1500}
          color="success"
          position="top"
          onDidDismiss={() => setShowLogoutToast(false)}
        />
      </IonContent>
    </IonPage>
  );
};

export default Perfil;