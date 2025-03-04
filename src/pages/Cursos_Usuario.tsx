// Cursos_Usuario.tsx
import React, { useEffect, useState } from 'react';
import { IonPage, IonHeader, IonToolbar, IonButtons, IonButton, IonContent, IonTitle, IonLabel, IonGrid, IonRow, IonCol, IonCard, IonCardHeader, IonCardTitle, IonCardContent, IonImg } from '@ionic/react';
import { useAuth } from './AuthContext'; // Importamos el contexto de autenticación

const Cursos_Usuario: React.FC = () => {
  const { isLoggedIn } = useAuth(); // Usamos el contexto de autenticación para verificar si el usuario está logueado
  const [cursos, setCursos] = useState<any[]>([]);

  // Simulamos la carga de cursos desde una API o base de datos
  useEffect(() => {
    if (isLoggedIn) {
      // Aquí podrías hacer una solicitud a tu backend para obtener los cursos
      // Por ejemplo, usando fetch o Axios
      setCursos([
        { id: 1, nombre: 'Curso de React', descripcion: 'Aprende React de manera interactiva.', imagen: '/curso-react.jpg' },
        { id: 2, nombre: 'Curso de Ionic', descripcion: 'Desarrolla aplicaciones móviles con Ionic.', imagen: '/curso-ionic.jpg' },
        { id: 3, nombre: 'Curso de Node.js', descripcion: 'Desarrollo backend con Node.js y Express.', imagen: '/curso-node.jpg' }
      ]);
    }
  }, [isLoggedIn]);

  if (!isLoggedIn) {
    return (
      <IonPage>
        <IonHeader>
          <IonToolbar>
            <IonTitle>Cursos</IonTitle>
          </IonToolbar>
        </IonHeader>
        <IonContent>
          <IonLabel>Debes iniciar sesión para acceder a los cursos.</IonLabel>
        </IonContent>
      </IonPage>
    );
  }

  return (
    <IonPage>
      <IonHeader>
        <IonToolbar>
          <IonTitle>Cursos Disponibles</IonTitle>
        </IonToolbar>
      </IonHeader>
      <IonContent>
        <IonGrid>
          <IonRow>
            {cursos.map((curso) => (
              <IonCol key={curso.id} size="12" size-md="4">
                <IonCard>
                  <IonImg src={curso.imagen} alt={curso.nombre} />
                  <IonCardHeader>
                    <IonCardTitle>{curso.nombre}</IonCardTitle>
                  </IonCardHeader>
                  <IonCardContent>
                    <IonLabel>{curso.descripcion}</IonLabel>
                    <IonButton expand="block" routerLink={`/Curso/${curso.id}`}>Ver Más</IonButton>
                  </IonCardContent>
                </IonCard>
              </IonCol>
            ))}
          </IonRow>
        </IonGrid>
      </IonContent>
    </IonPage>
  );
};

export default Cursos_Usuario;
