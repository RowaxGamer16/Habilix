// Ayuda_Usuario.tsx
import React, { useEffect, useState } from 'react';
import { IonPage, IonHeader, IonToolbar, IonTitle, IonContent, IonLabel, IonButton, IonList, IonItem, IonText, IonIcon } from '@ionic/react';
import { useAuth } from './AuthContext'; // Importamos el contexto de autenticación
import { helpCircleOutline } from 'ionicons/icons'; // Ícono de ayuda

const Ayuda_Usuario: React.FC = () => {
  const { isLoggedIn } = useAuth(); // Verificamos si el usuario está autenticado
  const [faq, setFaq] = useState<any[]>([]);

  // Simulamos la carga de preguntas frecuentes (FAQ) desde una API o base de datos
  useEffect(() => {
    if (isLoggedIn) {
      // Aquí podrías hacer una solicitud para obtener las preguntas frecuentes (FAQ)
      setFaq([
        { id: 1, pregunta: '¿Cómo puedo cambiar mi contraseña?', respuesta: 'Para cambiar tu contraseña, ve a la sección de "Mi perfil" y haz clic en "Cambiar contraseña".' },
        { id: 2, pregunta: '¿Cómo agregar un nuevo contacto?', respuesta: 'Para agregar un contacto, ve a la sección "Contactos" y haz clic en "Agregar nuevo".' },
        { id: 3, pregunta: '¿Cómo eliminar un contacto?', respuesta: 'Para eliminar un contacto, ve a la sección "Contactos", selecciona el contacto y haz clic en "Eliminar".' }
      ]);
    }
  }, [isLoggedIn]);

  if (!isLoggedIn) {
    return (
      <IonPage>
        <IonHeader>
          <IonToolbar>
            <IonTitle>Ayuda</IonTitle>
          </IonToolbar>
        </IonHeader>
        <IonContent>
          <IonLabel>Debes iniciar sesión para acceder a la sección de ayuda.</IonLabel>
        </IonContent>
      </IonPage>
    );
  }

  return (
    <IonPage>
      <IonHeader>
        <IonToolbar>
          <IonTitle>Ayuda</IonTitle>
        </IonToolbar>
      </IonHeader>
      <IonContent>
        <IonText color="primary">
          <h2>Preguntas Frecuentes (FAQ)</h2>
        </IonText>
        <IonList>
          {faq.map((item) => (
            <IonItem key={item.id}>
              <IonLabel>
                <h3>{item.pregunta}</h3>
                <p>{item.respuesta}</p>
              </IonLabel>
            </IonItem>
          ))}
        </IonList>

        <IonButton expand="block" routerLink="/contacto_soporte">
          <IonIcon slot="start" icon={helpCircleOutline} />
          Contactar Soporte
        </IonButton>
      </IonContent>
    </IonPage>
  );
};

export default Ayuda_Usuario;
