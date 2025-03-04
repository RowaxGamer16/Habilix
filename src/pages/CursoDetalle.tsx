// CursoDetalles.tsx
import React, { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { IonPage, IonHeader, IonToolbar, IonTitle, IonContent, IonLabel, IonCard, IonCardHeader, IonCardTitle, IonCardContent } from '@ionic/react';

const CursoDetalles: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const [curso, setCurso] = useState<any | null>(null);

  useEffect(() => {
    // Aquí puedes hacer una solicitud a tu backend para obtener los detalles del curso
    // Simulamos la carga de un curso con ID
    setCurso({ id, nombre: 'Curso de React', descripcion: 'Curso detallado de React.', contenido: 'Contenido del curso aquí.' });
  }, [id]);

  if (!curso) {
    return <IonLabel>Cargando curso...</IonLabel>;
  }

  return (
    <IonPage>
      <IonHeader>
        <IonToolbar>
          <IonTitle>{curso.nombre}</IonTitle>
        </IonToolbar>
      </IonHeader>
      <IonContent>
        <IonCard>
          <IonCardHeader>
            <IonCardTitle>{curso.nombre}</IonCardTitle>
          </IonCardHeader>
          <IonCardContent>
            <IonLabel>{curso.descripcion}</IonLabel>
            <IonLabel>{curso.contenido}</IonLabel>
          </IonCardContent>
        </IonCard>
      </IonContent>
    </IonPage>
  );
};

export default CursoDetalles;
