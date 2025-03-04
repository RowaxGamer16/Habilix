// Contactos_Usuario.tsx
import React, { useEffect, useState } from 'react';
import { IonPage, IonHeader, IonToolbar, IonButtons, IonButton, IonContent, IonTitle, IonLabel, IonGrid, IonRow, IonCol, IonCard, IonCardHeader, IonCardTitle, IonCardContent, IonList, IonItem, IonLabel as IonLabelItem, IonButton as IonButtonItem } from '@ionic/react';
import { useAuth } from './AuthContext'; // Importamos el contexto de autenticación

const Contactos_Usuario: React.FC = () => {
  const { isLoggedIn } = useAuth(); // Verificamos si el usuario está autenticado
  const [contactos, setContactos] = useState<any[]>([]);

  // Simulamos la carga de contactos de un usuario desde una API o base de datos
  useEffect(() => {
    if (isLoggedIn) {
      // Aquí podrías hacer una solicitud para obtener los contactos del usuario
      setContactos([
        { id: 1, nombre: 'Juan Pérez', telefono: '123-456-7890', email: 'juan@example.com' },
        { id: 2, nombre: 'María López', telefono: '987-654-3210', email: 'maria@example.com' },
        { id: 3, nombre: 'Carlos Gómez', telefono: '555-123-4567', email: 'carlos@example.com' }
      ]);
    }
  }, [isLoggedIn]);

  if (!isLoggedIn) {
    return (
      <IonPage>
        <IonHeader>
          <IonToolbar>
            <IonTitle>Contactos</IonTitle>
          </IonToolbar>
        </IonHeader>
        <IonContent>
          <IonLabel>Debes iniciar sesión para acceder a los contactos.</IonLabel>
        </IonContent>
      </IonPage>
    );
  }

  return (
    <IonPage>
      <IonHeader>
        <IonToolbar>
          <IonTitle>Mis Contactos</IonTitle>
        </IonToolbar>
      </IonHeader>
      <IonContent>
        <IonGrid>
          <IonRow>
            {contactos.map((contacto) => (
              <IonCol key={contacto.id} size="12" size-md="4">
                <IonCard>
                  <IonCardHeader>
                    <IonCardTitle>{contacto.nombre}</IonCardTitle>
                  </IonCardHeader>
                  <IonCardContent>
                    <IonLabel>Teléfono: {contacto.telefono}</IonLabel>
                    <br />
                    <IonLabel>Email: {contacto.email}</IonLabel>
                    <IonButton expand="block" routerLink={`/Contacto/${contacto.id}`}>Ver Detalles</IonButton>
                    <IonButtonItem color="danger" expand="block" onClick={() => eliminarContacto(contacto.id)}>
                      Eliminar
                    </IonButtonItem>
                  </IonCardContent>
                </IonCard>
              </IonCol>
            ))}
          </IonRow>
        </IonGrid>
      </IonContent>
    </IonPage>
  );

  function eliminarContacto(contactoId: number) {
    // Aquí puedes realizar una solicitud para eliminar el contacto
    setContactos(contactos.filter(contacto => contacto.id !== contactoId));
    // Puedes agregar un mensaje de confirmación, o hacer una solicitud HTTP para eliminar el contacto de la base de datos
  }
};

export default Contactos_Usuario;
