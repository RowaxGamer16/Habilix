// Contacto_Soporte.tsx
import React, { useState } from 'react';
import { IonPage, IonHeader, IonToolbar, IonTitle, IonContent, IonLabel, IonInput, IonButton, IonTextarea } from '@ionic/react';

const Contacto_Soporte: React.FC = () => {
  const [mensaje, setMensaje] = useState<string>('');

  const handleSubmit = () => {
    // Aquí podrías hacer una solicitud para enviar el mensaje al soporte
    console.log('Mensaje enviado:', mensaje);
    alert('Tu mensaje ha sido enviado al soporte.');
  };

  return (
    <IonPage>
      <IonHeader>
        <IonToolbar>
          <IonTitle>Contactar Soporte</IonTitle>
        </IonToolbar>
      </IonHeader>
      <IonContent>
        <IonLabel>
          <h3>Escribe tu mensaje</h3>
        </IonLabel>
        <IonTextarea value={mensaje} onIonChange={(e) => setMensaje(e.detail.value!)} placeholder="Escribe aquí tu mensaje para el soporte." rows={6}></IonTextarea>
        <IonButton expand="block" onClick={handleSubmit}>
          Enviar Mensaje
        </IonButton>
      </IonContent>
    </IonPage>
  );
};

export default Contacto_Soporte;
