import React from 'react';
import {
  IonPage,
  IonHeader,
  IonToolbar,
  IonTitle,
  IonContent,
  IonList,
  IonItem,
  IonLabel,
  IonAccordion,
  IonAccordionGroup,
  IonText,
} from '@ionic/react';
import './Ayuda.css'; // Asegúrate de personalizar este archivo CSS para estilos adicionales

const Ayuda: React.FC = () => {
  return (
    <IonPage>
      <IonHeader>
        <IonToolbar>
          <IonTitle>AYUDA</IonTitle>
        </IonToolbar>
      </IonHeader>
      <IonContent className="content-center">
        <IonList>
          <IonAccordionGroup>
            {/* Pregunta 1 */}
            <IonAccordion value="1">
              <IonItem slot="header">
                <IonLabel>¿Cómo puedo crear una cuenta?</IonLabel>
              </IonItem>
              <div className="ion-padding" slot="content">
                <IonText>
                  <p>
                    Para crear una cuenta, simplemente ve a la pantalla de registro y completa tus datos personales. 
                    Asegúrate de proporcionar una dirección de correo válida y crear una contraseña segura.
                  </p>
                </IonText>
              </div>
            </IonAccordion>

            {/* Pregunta 2 */}
            <IonAccordion value="2">
              <IonItem slot="header">
                <IonLabel>¿Cómo publicar una habilidad?</IonLabel>
              </IonItem>
              <div className="ion-padding" slot="content">
                <IonText>
                  <p>
                    Para publicar una habilidad, ve a la sección de "Publicar habilidad" y rellena la información 
                    necesaria, como el título, la descripción y tus tarifas (si aplica). También puedes agregar imágenes
                    o videos para mostrar tu trabajo.
                  </p>
                </IonText>
              </div>
            </IonAccordion>

            {/* Pregunta 3 */}
            <IonAccordion value="3">
              <IonItem slot="header">
                <IonLabel>¿Cómo contactar a otros usuarios?</IonLabel>
              </IonItem>
              <div className="ion-padding" slot="content">
                <IonText>
                  <p>
                    Para contactar a otros usuarios, simplemente ve a su perfil y utiliza la opción de mensaje directo. 
                    También puedes revisar sus habilidades publicadas y enviar solicitudes personalizadas si deseas
                    trabajar con ellos.
                  </p>
                </IonText>
              </div>
            </IonAccordion>

            {/* Pregunta 4 */}
            <IonAccordion value="4">
              <IonItem slot="header">
                <IonLabel>¿Cómo puedo cambiar mi contraseña?</IonLabel>
              </IonItem>
              <div className="ion-padding" slot="content">
                <IonText>
                  <p>
                    Para cambiar tu contraseña, dirígete a la sección de configuración de tu cuenta, selecciona
                    "Seguridad" y sigue las instrucciones para restablecer tu contraseña.
                  </p>
                </IonText>
              </div>
            </IonAccordion>

            {/* Pregunta 5 */}
            <IonAccordion value="5">
              <IonItem slot="header">
                <IonLabel>¿Qué hacer si encuentro un problema?</IonLabel>
              </IonItem>
              <div className="ion-padding" slot="content">
                <IonText>
                  <p>
                    Si encuentras un problema, puedes reportarlo a nuestro equipo de soporte técnico. Ve a la sección
                    "Ayuda y soporte" en el menú principal y completa el formulario de contacto. Intentaremos resolver
                    tu problema lo más rápido posible.
                  </p>
                </IonText>
              </div>
            </IonAccordion>

            {/* Más preguntas (6 a 20) */}
            <IonAccordion value="6">
              <IonItem slot="header">
                <IonLabel>¿Cómo agregar una foto de perfil?</IonLabel>
              </IonItem>
              <div className="ion-padding" slot="content">
                <IonText>
                  <p>
                    Puedes agregar una foto de perfil desde la sección de configuración de tu cuenta. 
                    Asegúrate de que la imagen tenga una buena resolución y sea apropiada para el perfil.
                  </p>
                </IonText>
              </div>
            </IonAccordion>

            <IonAccordion value="7">
              <IonItem slot="header">
                <IonLabel>¿Cómo cambiar mi nombre de usuario?</IonLabel>
              </IonItem>
              <div className="ion-padding" slot="content">
                <IonText>
                  <p>
                    Si deseas cambiar tu nombre de usuario, ve a la sección de "Configuración" y selecciona "Perfil". 
                    Ahí podrás modificar tu nombre de usuario.
                  </p>
                </IonText>
              </div>
            </IonAccordion>

            <IonAccordion value="8">
              <IonItem slot="header">
                <IonLabel>¿Cómo añadir una habilidad a mi perfil?</IonLabel>
              </IonItem>
              <div className="ion-padding" slot="content">
                <IonText>
                  <p>
                    Para añadir una habilidad, ve a tu perfil y haz clic en la opción "Agregar habilidad". 
                    Luego, completa los detalles correspondientes y guarda los cambios.
                  </p>
                </IonText>
              </div>
            </IonAccordion>

            <IonAccordion value="9">
              <IonItem slot="header">
                <IonLabel>¿Puedo editar mis publicaciones?</IonLabel>
              </IonItem>
              <div className="ion-padding" slot="content">
                <IonText>
                  <p>
                    Sí, puedes editar cualquier publicación que hayas realizado. Solo debes ir a la publicación y hacer 
                    clic en la opción de "Editar".
                  </p>
                </IonText>
              </div>
            </IonAccordion>

            <IonAccordion value="10">
              <IonItem slot="header">
                <IonLabel>¿Cómo cambiar mi dirección de correo electrónico?</IonLabel>
              </IonItem>
              <div className="ion-padding" slot="content">
                <IonText>
                  <p>
                    Puedes cambiar tu dirección de correo electrónico en la sección "Configuración" de tu cuenta. 
                    Ve a "Información personal" y actualiza tu dirección de correo.
                  </p>
                </IonText>
              </div>
            </IonAccordion>

            <IonAccordion value="11">
              <IonItem slot="header">
                <IonLabel>¿Cómo puedo eliminar mi cuenta?</IonLabel>
              </IonItem>
              <div className="ion-padding" slot="content">
                <IonText>
                  <p>
                    Si deseas eliminar tu cuenta, ve a "Configuración" y selecciona la opción "Eliminar cuenta". 
                    Ten en cuenta que esta acción es irreversible.
                  </p>
                </IonText>
              </div>
            </IonAccordion>

            <IonAccordion value="12">
              <IonItem slot="header">
                <IonLabel>¿Cómo dejar de recibir notificaciones?</IonLabel>
              </IonItem>
              <div className="ion-padding" slot="content">
                <IonText>
                  <p>
                    Puedes ajustar tus preferencias de notificaciones en la sección "Configuración" de tu cuenta. 
                    Ahí podrás activar o desactivar las notificaciones que desees.
                  </p>
                </IonText>
              </div>
            </IonAccordion>

            <IonAccordion value="13">
              <IonItem slot="header">
                <IonLabel>¿Cómo puedo cambiar el idioma de la aplicación?</IonLabel>
              </IonItem>
              <div className="ion-padding" slot="content">
                <IonText>
                  <p>
                    Puedes cambiar el idioma de la aplicación en la sección "Configuración"  "Idioma". 
                    Selecciona el idioma de tu preferencia.
                  </p>
                </IonText>
              </div>
            </IonAccordion>

            <IonAccordion value="14">
              <IonItem slot="header">
                <IonLabel>¿Cómo ver el historial de mis actividades?</IonLabel>
              </IonItem>
              <div className="ion-padding" slot="content">
                <IonText>
                  <p>
                    El historial de tus actividades lo encontrarás en tu perfil, en la sección "Actividad". 
                    Ahí podrás ver todas las interacciones que has tenido en la plataforma.
                  </p>
                </IonText>
              </div>
            </IonAccordion>

            <IonAccordion value="15">
              <IonItem slot="header">
                <IonLabel>¿Cómo contactar con soporte técnico?</IonLabel>
              </IonItem>
              <div className="ion-padding" slot="content">
                <IonText>
                  <p>
                    Si necesitas ayuda con algún problema técnico, puedes contactar con nuestro equipo de soporte desde 
                    la sección "Ayuda y soporte" en el menú principal.
                  </p>
                </IonText>
              </div>
            </IonAccordion>

            <IonAccordion value="16">
              <IonItem slot="header">
                <IonLabel>¿Cómo puedo mejorar la visibilidad de mis habilidades?</IonLabel>
              </IonItem>
              <div className="ion-padding" slot="content">
                <IonText>
                  <p>
                    Puedes mejorar la visibilidad de tus habilidades completando tu perfil, agregando ejemplos de tu trabajo 
                    y participando activamente en la comunidad.
                  </p>
                </IonText>
              </div>
            </IonAccordion>

            <IonAccordion value="17">
              <IonItem slot="header">
                <IonLabel>¿Cómo desactivar mi cuenta temporalmente?</IonLabel>
              </IonItem>
              <div className="ion-padding" slot="content">
                <IonText>
                  <p>
                    Para desactivar tu cuenta temporalmente, ve a "Configuración" y selecciona "Desactivar cuenta". 
                    Puedes reactivarla en cualquier momento.
                  </p>
                </IonText>
              </div>
            </IonAccordion>

            <IonAccordion value="18">
              <IonItem slot="header">
                <IonLabel>¿Cómo eliminar mis publicaciones?</IonLabel>
              </IonItem>
              <div className="ion-padding" slot="content">
                <IonText>
                  <p>
                    Para eliminar una publicación, ve a la publicación en cuestión y selecciona la opción "Eliminar".
                  </p>
                </IonText>
              </div>
            </IonAccordion>

            <IonAccordion value="19">
              <IonItem slot="header">
                <IonLabel>¿Cómo reportar un contenido inapropiado?</IonLabel>
              </IonItem>
              <div className="ion-padding" slot="content">
                <IonText>
                  <p>
                    Si encuentras un contenido inapropiado, puedes reportarlo utilizando la opción de "Reportar" que aparece 
                    junto a las publicaciones.
                  </p>
                </IonText>
              </div>
            </IonAccordion>

            <IonAccordion value="20">
              <IonItem slot="header">
                <IonLabel>¿Cómo crear un portafolio?</IonLabel>
              </IonItem>
              <div className="ion-padding" slot="content">
                <IonText>
                  <p>
                    Para crear un portafolio, ve a tu perfil y selecciona "Agregar portafolio". Puedes añadir tus mejores proyectos
                    y organizarlos por categorías.
                  </p>
                </IonText>
              </div>
            </IonAccordion>

          </IonAccordionGroup>
        </IonList>
      </IonContent>
    </IonPage>
  );
};

export default Ayuda;
