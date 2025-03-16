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
  IonToast,
} from '@ionic/react';
import { useHistory } from 'react-router-dom';
import './Perfil.css';

const Perfil: React.FC = () => {
  const [userData, setUserData] = useState({ id: '', name: '', email: '' });
  const [error, setError] = useState<string>('');
  const history = useHistory();

  useEffect(() => {
    const token = localStorage.getItem('token');
    
    // Si no hay token, redirigir al login
    if (!token) {
      history.push('/login');
      return;
    }

    const fetchUserData = async () => {
      try {
        const decodedToken = JSON.parse(atob(token.split('.')[1])); // Decodificar JWT
        const userId = decodedToken.id;
        localStorage.setItem('userId', userId); // Guardar el ID en localStorage

        const response = await fetch(`http://localhost:5000/api/usuario/${userId}`, {
          method: 'GET',
          headers: { 'Authorization': `Bearer ${token}` },
        });

        if (!response.ok) {
          throw new Error('No autorizado');
        }

        const data = await response.json();
        setUserData({ id: userId, name: data.name, email: data.email });
      } catch (error) {
        console.error('Error al obtener los datos:', error);
        setError('Error al obtener los datos del usuario');
        history.push('/login'); // Redirigir si no se puede obtener datos
      }
    };

    fetchUserData();
  }, [history]);

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('userId');
    history.push('/login');
    window.location.reload(); // Recargar la página después de cerrar sesión
  };

  return (
    <IonPage>
      <IonHeader>
        <IonToolbar>
          <IonTitle>Perfil</IonTitle>
        </IonToolbar>
      </IonHeader>
      <IonContent className="ion-padding">
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
                    <p>ID: {userData.id || 'No disponible'}</p>
                    <p>{userData.email || 'Correo electrónico no disponible'}</p>
                  </IonText>
                </IonCol>
              </IonRow>
            </IonGrid>
          </IonCardHeader>
        </IonCard>

        <IonCard>
          <IonCardHeader>
            <IonText color="danger">
              <h3>Sesión</h3>
            </IonText>
          </IonCardHeader>
          <IonCardContent>
            <IonButton expand="block" color="danger" onClick={handleLogout}>
              Cerrar sesión
            </IonButton>
          </IonCardContent>
        </IonCard>

        {/* Muestra el Toast si hay un error */}
        <IonToast
          isOpen={!!error}
          message={error}
          duration={3000}
          onDidDismiss={() => setError('')}
        />
      </IonContent>
    </IonPage>
  );
};

export default Perfil;