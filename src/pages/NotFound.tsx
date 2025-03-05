import React from 'react';
import {
  IonPage,
  IonHeader,
  IonToolbar,
  IonTitle,
  IonContent,
  IonButton,
} from '@ionic/react';
import { useHistory } from 'react-router-dom';

const NotFound: React.FC = () => {
  const history = useHistory();

  return (
    <IonPage>
      <IonHeader>
        <IonToolbar>
          <IonTitle>Página No Encontrada</IonTitle>
        </IonToolbar>
      </IonHeader>
      <IonContent className="ion-padding">
        <h2>404 - ¡Oops! No encontramos lo que buscas</h2>
        <p>Parece que te has perdido. La página que intentaste visitar no existe.</p>
        <IonButton expand="block" onClick={() => history.push('/Inicio')}>
          Volver al Inicio
        </IonButton>
      </IonContent>
    </IonPage>
  );
};

export default NotFound;