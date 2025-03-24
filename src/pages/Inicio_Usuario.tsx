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
  const [userId, setUserId] = useState<string | null>(null);
  const [error, setError] = useState<string>('');
  const [isLoading, setIsLoading] = useState<boolean>(true);

  useEffect(() => {
    const fetchUserData = async () => {
      try {
        const token = localStorage.getItem('token'); // Obtener token
        const storedUserId = localStorage.getItem('userId'); // Obtener ID del usuario

        if (!token || !storedUserId) {
          setError('Faltan credenciales');
          setIsLoading(false);
          return;
        }

        setUserId(storedUserId); // Guardar el ID en el estado

        const response = await fetch(`http://localhost:5000/api/usuario/${storedUserId}`, {
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
        console.log('Datos del usuario:', data); // Verifica la respuesta del backend

        // Asegúrate de que el backend devuelva el nombre en la propiedad correcta
        if (data.NOMBRE_USUARIO) {
          setUserName(data.NOMBRE_USUARIO); // Guardar el nombre del usuario
        } else {
          setError('Nombre de usuario no encontrado en la respuesta');
        }

        setIsLoading(false); // Dejar de mostrar el spinner
      } catch (error) {
        setError('Error al obtener los datos del usuario');
        setIsLoading(false);
      }
    };

    fetchUserData();
  }, []);

  return (
    <IonPage>
      <IonHeader>
        <IonToolbar>
          <IonTitle>Bienvenido al inicio de usuario</IonTitle>
        </IonToolbar>
      </IonHeader>
      <IonContent className="ion-padding">
        {isLoading ? (
          <IonSpinner name="crescent" />
        ) : error ? (
          <div>
            <h2>{error}</h2>
          </div>
        ) : (
          <div>
            <h2>¡Hola, {userName}!</h2>
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