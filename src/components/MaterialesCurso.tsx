import React from 'react';
import {
  IonPage,
  IonHeader,
  IonToolbar,
  IonTitle,
  IonContent,
  IonButton,
  IonCard,
  IonCardContent,
} from '@ionic/react';
import { useParams } from 'react-router-dom';

interface MaterialesProps {
  materiales: { [id: number]: string[] };
}

const MaterialesCurso: React.FC<MaterialesProps> = ({ materiales }) => {
  const { id } = useParams<{ id: string }>();
  const cursoId = parseInt(id, 10);
  const materialesDelCurso = materiales[cursoId] || [];

  return (
    <IonPage>
      <IonHeader>
        <IonToolbar>
          <IonTitle>Materiales del Curso</IonTitle>
        </IonToolbar>
      </IonHeader>
      <IonContent>
        {materialesDelCurso.length > 0 ? (
          materialesDelCurso.map((material, index) => (
            <IonCard key={index}>
              <IonCardContent>{material}</IonCardContent>
            </IonCard>
          ))
        ) : (
          <p>No hay materiales disponibles para este curso.</p>
        )}
        <IonButton routerLink="/cursos" expand="full" color="primary">
          Volver a Cursos
        </IonButton>
      </IonContent>
    </IonPage>
  );
};

export default MaterialesCurso;
