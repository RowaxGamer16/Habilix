import React from 'react';
import {
  IonPage,
  IonHeader,
  IonToolbar,
  IonTitle,
  IonContent,
  IonList,
  IonItem,
  IonAvatar,
  IonLabel,
  IonButton,
  IonButtons,
  IonIcon,
} from '@ionic/react';
import './Contactos.css';
import { mailOutline, callOutline, copyOutline } from 'ionicons/icons';

const Contactos: React.FC = () => {
  const contactos = [
    {
      id: 1,
      nombre: 'Daurys Heredia',
      correo: 'daurisyjoniken@gmail.com',
      telefono: '849-410-1686',
      foto: 'https://via.placeholder.com/150',
    },
    {
      id: 2,
      nombre: 'Eury Caraballo',
      correo: 'maria.lopez@example.com',
      telefono: '555-987-6543',
      foto: 'https://via.placeholder.com/150',
    },
    {
      id: 3,
      nombre: 'Juan Miguel',
      correo: 'juanmiguel63908@gmail.com',
      telefono: '829-728-0208',
      foto: 'https://via.placeholder.com/150',
    },
    {
      id: 4,
      nombre: 'Brainel Ramirez',
      correo: 'carlos.gomez@example.com',
      telefono: '555-654-7890',
      foto: 'https://via.placeholder.com/150',
    },
  ];

  const copiarAlPortapapeles = (texto: string) => {
    navigator.clipboard.writeText(texto);
    alert('Información copiada al portapapeles');
  };

  return (
    <IonPage>
      <IonHeader>
        <IonToolbar>
          <IonTitle>CONTACTOS</IonTitle>
        </IonToolbar>
      </IonHeader>
      <IonContent>
        <IonList>
          {contactos.map((contacto) => (
            <IonItem key={contacto.id}>
              <IonAvatar slot="start">
                <img src={contacto.foto} alt={contacto.nombre} />
              </IonAvatar>
              <IonLabel>
                <h2>{contacto.nombre}</h2>
                <p>Correo: {contacto.correo}</p>
                <p>Teléfono: {contacto.telefono}</p>
              </IonLabel>
              <IonButtons slot="end">
                <IonButton
                  color="primary"
                  href={`mailto:${contacto.correo}`}
                >
                  <IonIcon slot="icon-only" icon={mailOutline} />
                </IonButton>
                <IonButton
                  color="success"
                  href={`tel:${contacto.telefono}`}
                >
                  <IonIcon slot="icon-only" icon={callOutline} />
                </IonButton>
                <IonButton
                  color="secondary"
                  onClick={() => copiarAlPortapapeles(`${contacto.nombre} - ${contacto.correo} - ${contacto.telefono}`)}
                >
                  <IonIcon slot="icon-only" icon={copyOutline} />
                </IonButton>
              </IonButtons>
            </IonItem>
          ))}
        </IonList>
      </IonContent>
    </IonPage>
  );
};

export default Contactos;
