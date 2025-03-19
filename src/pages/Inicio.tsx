import React, { useEffect, useState } from 'react';
import { IonPage, IonHeader, IonToolbar, IonTitle, IonContent, IonButton, IonGrid, IonRow, IonCol, IonCard, IonCardHeader, IonCardTitle, IonCardContent, IonCardSubtitle, IonText, IonImg, IonFooter } from '@ionic/react';
import { Redirect } from 'react-router-dom';
import './Inicio.css';

// Interfaces
interface Boton {
  color: 'primary' | 'secondary';
  link: string;
  texto: string;
}

interface Habilidad {
  titulo: string;
  descripcion: string;
}

interface Testimonio {
  nombre: string;
  habilidad: string;
  comentario: string;
}

interface Servicio {
  titulo: string;
  descripcion: string;
  icono?: string;
}

const Inicio: React.FC = () => {
  const [isLoggedIn, setIsLoggedIn] = useState(false);

  useEffect(() => {
    const token = localStorage.getItem('token');
    if (token) {
      setIsLoggedIn(true);
    }
  }, []);

  if (isLoggedIn) {
    return <Redirect to="/Inicio_Usuario" />;
  }

  // Botones principales
  const botones: Boton[] = [
    { color: 'primary', link: '/Cursos', texto: 'Explorar Habilidades' },
    { color: 'secondary', link: '/Login', texto: 'Publicar Habilidad' }
  ];

  // Habilidades destacadas
  const habilidadesDestacadas: Habilidad[] = [
    { titulo: 'Clases de Guitarra', descripcion: 'Aprende a tocar guitarra acústica desde cero con un mentor experimentado.' },
    { titulo: 'Programación Web', descripcion: 'Enseña y aprende a desarrollar sitios web modernos con HTML, CSS y JavaScript.' }
  ];

  // Testimonios
  const testimonios: Testimonio[] = [
    { nombre: 'Juan Pérez', habilidad: 'Aprendiz de Guitarra', comentario: 'Gracias a Habilix, encontré un mentor increíble para aprender guitarra. ¡Mis habilidades mejoraron rápidamente!' }
  ];

  // Servicios
  const servicios: Servicio[] = [
    {
      titulo: 'Conexión con Mentores',
      descripcion: 'Encuentra expertos apasionados en diversas áreas que te guiarán paso a paso para dominar nuevas habilidades, desde música hasta tecnología.',
      icono: '/mentor.png' // Ruta desde la carpeta public
    },
    {
      titulo: 'Publicación de Habilidades',
      descripcion: 'Comparte tu experiencia y conocimientos con la comunidad. Publica tus habilidades y conviértete en mentor para ayudar a otros a crecer.',
      icono: '/share.png' // Ruta desde la carpeta public
    }
  ];

  return (
    <IonPage>
      <IonHeader>
        <IonToolbar>
          <IonTitle>INICIO</IonTitle>
        </IonToolbar>
      </IonHeader>
      <IonContent className="content-center">
        <IonGrid>
          {/* Sección de bienvenida */}
          <IonRow>
            <IonCol>
              <h1 className="welcome-title">¡Bienvenido a Habilix!</h1>
              <p className="welcome-description">
                Conecta con personas para intercambiar habilidades, aprender algo nuevo o enseñar lo que sabes.
              </p>
            </IonCol>
          </IonRow>

          {/* Botones principales */}
          <IonRow className="button-row">
            {botones.map((boton, index) => (
              <IonCol size="auto" key={index}>
                <IonButton
                  expand="block"
                  color={boton.color === 'primary' ? 'moonstone' : 'picton-blue'} // Usa los nombres de los colores definidos
                  routerLink={boton.link}
                  style={{ fontWeight: '500' }}
                >
                  {boton.texto}
                </IonButton>
              </IonCol>
            ))}
          </IonRow>

          {/* Ejemplo de habilidades destacadas */}
          <IonRow>
            <IonCol>
              <h2 className="featured-title">Habilidades Destacadas</h2>
            </IonCol>
          </IonRow>
          <IonRow>
            {habilidadesDestacadas.map((habilidad, index) => (
              <IonCol size="12" sizeMd="6" key={index}>
                <IonCard className="highlight-card">
                  <IonCardHeader>
                    <IonCardTitle>{habilidad.titulo}</IonCardTitle>
                  </IonCardHeader>
                  <IonCardContent>
                    {habilidad.descripcion}
                  </IonCardContent>
                </IonCard>
              </IonCol>
            ))}
          </IonRow>

          {/* Sección de Testimonios */}
          <IonRow>
            <IonCol>
              <h2 className="testimonials-title">Comentarios</h2>
              {testimonios.map((testimonio, index) => (
                <IonCard key={index} className="testimonials-card">
                  <IonCardHeader>
                    <IonCardTitle>{testimonio.nombre}</IonCardTitle>
                    <IonCardSubtitle>{testimonio.habilidad}</IonCardSubtitle>
                  </IonCardHeader>
                  <IonCardContent>
                    "{testimonio.comentario}"
                  </IonCardContent>
                </IonCard>
              ))}
            </IonCol>
          </IonRow>

          {/* Sección de Galería de Imágenes */}
          <IonRow>
            <IonCol>
              <h2 className="gallery-title">Galería</h2>
            </IonCol>
          </IonRow>
          <IonRow>
            {[
              '/imagen1.jpg',
              '/imagen2.jpg',
              '/imagen3.jpg'
            ].map((imagen, index) => (
              <IonCol size="12" sizeMd="4" key={index}>
                <IonImg src={imagen} className="gallery-image" />
              </IonCol>
            ))}
          </IonRow>

          {/* Sección de Servicios mejorada */}
          <IonRow>
            <IonCol>
              <h2 className="services-title">Nuestros Servicios</h2>
            </IonCol>
          </IonRow>
          <IonRow className="services-row">
            {servicios.map((servicio, index) => (
              <IonCol size="12" sizeMd="6" key={index} className="service-col">
                <IonCard className="service-card">
                  <IonCardHeader className="service-header">
                    {servicio.icono && (
                      <IonImg src={servicio.icono} alt={servicio.titulo} className="service-icon" />
                    )}
                    <IonCardTitle className="service-title">{servicio.titulo}</IonCardTitle>
                  </IonCardHeader>
                  <IonCardContent className="service-content">
                    <IonText>{servicio.descripcion}</IonText>
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

export default Inicio;