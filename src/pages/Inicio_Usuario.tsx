import React, { useEffect, useState } from 'react';
import {
  IonPage,
  IonContent,
  IonHeader,
  IonToolbar,
  IonTitle,
  IonToast,
  IonSpinner,
} from '@ionic/react';

const Inicio_Usuario: React.FC = () => {
  const [userName, setUserName] = useState<string>('');
  const [error, setError] = useState<string>('');
  const [isLoading, setIsLoading] = useState<boolean>(true);

  useEffect(() => {
    const fetchUserName = async () => {
      try {
        const token = localStorage.getItem('token'); // Obtener token
        const userId = localStorage.getItem('user_id'); // Obtener ID del usuario

        if (!token || !userId) {
          setError('Faltan credenciales');
          setIsLoading(false);
          return;
        }

        const response = await fetch(`http://localhost:5000/api/usuario?id=${userId}`, {
          method: 'GET',
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
        });

        if (!response.ok) {
          throw new Error('Error al obtener el usuario');
        }

        const data = await response.json();
        setUserName(data.nombre); // Guardar el nombre del usuario
        setIsLoading(false); // Dejar de mostrar el spinner
      } catch (error) {
        setError('Error al obtener el nombre del usuario');
        setIsLoading(false);
      }
    };

    fetchUserName();
  }, []);

  return (
    <IonPage>
      <IonHeader>
        <IonToolbar>
          <IonTitle>Bienvenido al inicio de usuario</IonTitle>
        </IonToolbar>
      </IonHeader>
      <IonContent>
        {isLoading ? (
          <IonSpinner name="crescent" />
        ) : error ? (
          <div>
            <h2>{error}</h2>
          </div>
        ) : (
          <div>
            <h2>¡Hola, {userName || 'usuario'}!</h2>
            <p>Bienvenido a tu panel.</p>
          </div>
        )}

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

export default Inicio_Usuario;
