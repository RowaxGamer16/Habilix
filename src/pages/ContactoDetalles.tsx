// ContactoDetalles.tsx
import React, { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { IonPage, IonHeader, IonToolbar, IonTitle, IonContent, IonLabel, IonCard, IonCardHeader, IonCardTitle, IonCardContent } from '@ionic/react';

const ContactoDetalles: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const [contacto, setContacto] = useState<any | null>(null);

  useEffect(() => {
    // Aquí puedes hacer una solicitud a tu backend para obtener los detalles del contacto
    setContacto({ id, nombre: 'Juan Pérez', telefono: '123-456-7890', email: 'juan@example.com', direccion: 'Calle Ficticia 123' });
  }, [id]);

  if (!contacto) {
    return <IonLabel>Cargando detalles del contacto...</IonLabel>;
  }

  return (
    <IonPage>
      <IonHeader>
        <IonToolbar>
          <IonTitle>{contacto.nombre}</IonTitle>
        </IonToolbar>
      </IonHeader>
      <IonContent>
        <IonCard>
          <IonCardHeader>
            <IonCardTitle>{contacto.nombre}</IonCardTitle>
          </IonCardHeader>
          <IonCardContent>
            <IonLabel>Teléfono: {contacto.telefono}</IonLabel>
            <br />
            <IonLabel>Email: {contacto.email}</IonLabel>
            <br />
            <IonLabel>Dirección: {contacto.direccion}</IonLabel>
          </IonCardContent>
        </IonCard>
      </IonContent>
    </IonPage>
  );
};

export default ContactoDetalles;
