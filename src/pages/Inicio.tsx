import React, { useEffect, useState } from 'react';
import {
  IonPage, IonHeader, IonToolbar, IonTitle, IonContent, IonButton,
  IonGrid, IonRow, IonCol, IonCard, IonCardHeader, IonCardTitle,
  IonCardContent, IonCardSubtitle, IonText, IonImg, IonFooter,
  IonIcon, IonBadge, IonChip, IonProgressBar, IonItem, IonLabel
} from '@ionic/react';
import { Redirect } from 'react-router-dom';
import { Swiper, SwiperSlide } from 'swiper/react';
import { star, time, people, trophy, flash, school, trendingUp } from 'ionicons/icons';
import 'swiper/swiper-bundle.css';
import { Pagination, Navigation, Autoplay, EffectFade } from 'swiper/modules';
import 'swiper/css';
import 'swiper/css/pagination';
import 'swiper/css/navigation';
import './Inicio.css';



// Interfaces
interface Boton {
  color: 'primary' | 'secondary' | 'tertiary';
  link: string;
  texto: string;
  icon?: string;
}

interface Habilidad {
  titulo: string;
  descripcion: string;
  imagen: string;
  nivel: number;
  rating: number;
  estudiantes: number;
}

interface Testimonio {
  nombre: string;
  habilidad: string;
  comentario: string;
  avatar: string;
  rating: number;
}

interface Servicio {
  titulo: string;
  descripcion: string;
  icono: string;
  destacado?: boolean;
}

interface Instructor {
  nombre: string;
  especialidad: string;
  avatar: string;
  rating: number;
  habilidades: string[];
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

  // Botones principales mejorados
  const botones: Boton[] = [
    { color: 'primary', link: '/Cursos', texto: 'Explorar Habilidades', icon: flash },
    { color: 'secondary', link: '/Login', texto: 'Publicar Habilidad', icon: school },
    { color: 'tertiary', link: '/Login', texto: 'Regístrate Gratis', icon: trendingUp }
  ];

  // Habilidades destacadas mejoradas
  const habilidadesDestacadas: Habilidad[] = [
    {
      titulo: 'Clases de Guitarra',
      descripcion: 'Aprende a tocar guitarra acústica desde cero con un mentor experimentado.',
      imagen: './guitarra.jpg',
      nivel: 80,
      rating: 4.8,
      estudiantes: 124
    },
    {
      titulo: 'Programación Web',
      descripcion: 'Enseña y aprende a desarrollar sitios web modernos con HTML, CSS y JavaScript.',
      imagen: './programacion.jpg',
      nivel: 65,
      rating: 4.9,
      estudiantes: 215
    },
    {
      titulo: 'Fotografía Digital',
      descripcion: 'Domina el arte de la fotografía con técnicas profesionales y edición creativa.',
      imagen: './fotografia.png',
      nivel: 70,
      rating: 4.7,
      estudiantes: 89
    }
  ];

  // Testimonios mejorados
  const testimonios: Testimonio[] = [
    {
      nombre: 'Juan Pérez',
      habilidad: 'Aprendiz de Guitarra',
      comentario: 'Gracias a Habilix, encontré un mentor increíble para aprender guitarra. ¡Mis habilidades mejoraron rápidamente!',
      avatar: './avatar1.jpg',
      rating: 5
    },
    {
      nombre: 'María Gómez',
      habilidad: 'Estudiante de Programación',
      comentario: 'La plataforma es intuitiva y los instructores son muy profesionales. Aprendí más en un mes que en cursos tradicionales.',
      avatar: './avatar2.jpg',
      rating: 4
    }
  ];

  // Servicios mejorados
  const servicios: Servicio[] = [
    {
      titulo: 'Conexión con Mentores',
      descripcion: 'Encuentra expertos apasionados en diversas áreas que te guiarán paso a paso para dominar nuevas habilidades.',
      icono: './mentor.png',
      destacado: true
    },
    {
      titulo: 'Publicación de Habilidades',
      descripcion: 'Comparte tu experiencia y conocimientos con la comunidad. Publica tus habilidades y conviértete en mentor.',
      icono: './share.png'
    },
    {
      titulo: 'Progreso Personalizado',
      descripcion: 'Sistema de seguimiento que mide tu avance y te sugiere rutas de aprendizaje adaptadas a ti.',
      icono: './progress.png'
    }
  ];

  // Instructores destacados
  const instructores: Instructor[] = [
    {
      nombre: 'Carlos Martínez',
      especialidad: 'Música',
      avatar: './instructor1.jpg',
      rating: 4.9,
      habilidades: ['Guitarra', 'Piano', 'Teoría Musical']
    },
    {
      nombre: 'Laura Fernández',
      especialidad: 'Tecnología',
      avatar: './instructor2.jpg',
      rating: 5.0,
      habilidades: ['Programación Web', 'JavaScript', 'React']
    }
  ];

  // Estadísticas
  const estadisticas = [
    { valor: '500+', descripcion: 'Habilidades disponibles' },
    { valor: '10K+', descripcion: 'Usuarios activos' },
    { valor: '95%', descripcion: 'Satisfacción' },
    { valor: '24/7', descripcion: 'Soporte' }
  ];

  return (
    <IonPage>
      <IonContent className="home-page">
        {/* Hero Section */}
        <section className="hero-section">
          <IonGrid>
            <IonRow className="ion-align-items-center">
              <IonCol size="12" sizeMd="6">
                <h1 className="welcome-title">Bienvenido a Habilix</h1>
                <p className="welcome-description">
                  Habilix conecta aprendices con mentores apasionados. Aprende lo que siempre quisiste o comparte tu conocimiento con otros.
                </p>

                <div className="button-row">
                  {botones.map((boton, index) => (
                    <IonButton
                      key={index}
                      color={boton.color}
                      routerLink={boton.link}
                      className="action-button"
                    >
                      <IonIcon slot="start" icon={boton.icon} />
                      {boton.texto}
                    </IonButton>
                  ))}
                </div>

                <div className="trust-badges">
                  <IonChip color="success">
                    <IonIcon icon={star} />
                    <IonLabel>4.9/5 Rating</IonLabel>
                  </IonChip>
                  <IonChip>
                    <IonIcon icon={people} />
                    <IonLabel>10,000+ Usuarios</IonLabel>
                  </IonChip>
                </div>
              </IonCol>
              <IonCol size="12" sizeMd="6">
                <IonImg
                  src="./hero-image.png"
                  className="hero-image"
                  alt="Personas aprendiendo habilidades"
                />
              </IonCol>
            </IonRow>
          </IonGrid>
        </section>

        {/* Stats Section */}
        <section className="stats-section">
          <IonGrid>
            <IonRow>
              {estadisticas.map((stat, index) => (
                <IonCol size="6" sizeMd="3" key={index}>
                  <div className="stat-card">
                    <h3>{stat.valor}</h3>
                    <p>{stat.descripcion}</p>
                  </div>
                </IonCol>
              ))}
            </IonRow>
          </IonGrid>
        </section>

        {/* Featured Skills */}
        <section className="featured-section">
          <IonGrid>
            <IonRow>
              <IonCol>
                <h2 className="section-title">Habilidades Destacadas</h2>
                <p className="section-subtitle">Explora nuestras categorías más populares</p>
              </IonCol>
            </IonRow>
            <IonRow>
              {habilidadesDestacadas.map((habilidad, index) => (
                <IonCol size="12" sizeMd="4" key={index}>
                  <IonCard className="skill-card">
                    <div className="skill-badge">Popular</div>
                    <IonImg src={habilidad.imagen} className="skill-image" />
                    <IonCardHeader>
                      <IonCardTitle>{habilidad.titulo}</IonCardTitle>
                      <div className="skill-meta">
                        <span>
                          <IonIcon icon={star} color="warning" />
                          {habilidad.rating}
                        </span>
                        <span>
                          <IonIcon icon={people} />
                          {habilidad.estudiantes}
                        </span>
                      </div>
                    </IonCardHeader>
                    <IonCardContent>
                      <p>{habilidad.descripcion}</p>
                      <div className="skill-progress">
                        <IonLabel>Nivel: {habilidad.nivel}%</IonLabel>
                        <IonProgressBar value={habilidad.nivel / 100} color="primary"></IonProgressBar>
                      </div>
                      <IonButton expand="block" fill="outline" routerLink="/Cursos">
                        Ver Detalles
                      </IonButton>
                    </IonCardContent>
                  </IonCard>
                </IonCol>
              ))}
            </IonRow>
          </IonGrid>
        </section>

        {/* How It Works */}
        <section className="how-it-works">
          <IonGrid>
            <IonRow>
              <IonCol>
                <h2 className="section-title">¿Cómo funciona?</h2>
                <p className="section-subtitle">Aprende o enseña en 3 simples pasos</p>
              </IonCol>
            </IonRow>
            <IonRow>
              <IonCol size="12" sizeMd="4">
                <div className="step-card">
                  <div className="step-number">1</div>
                  <IonIcon icon={school} className="step-icon" />
                  <h3>Regístrate</h3>
                  <p>Crea tu cuenta gratuita como aprendiz o instructor</p>
                </div>
              </IonCol>
              <IonCol size="12" sizeMd="4">
                <div className="step-card">
                  <div className="step-number">2</div>
                  <IonIcon icon={people} className="step-icon" />
                  <h3>Conecta</h3>
                  <p>Encuentra mentores o estudiantes con intereses similares</p>
                </div>
              </IonCol>
              <IonCol size="12" sizeMd="4">
                <div className="step-card">
                  <div className="step-number">3</div>
                  <IonIcon icon={trophy} className="step-icon" />
                  <h3>Aprende/Enseña</h3>
                  <p>Comienza tu viaje de aprendizaje o comparte tu conocimiento</p>
                </div>
              </IonCol>
            </IonRow>
          </IonGrid>
        </section>

        {/* Testimonials */}
        <section className="testimonials-section">
          <IonGrid>
            <IonRow>
              <IonCol>
                <h2 className="section-title">Lo que dicen nuestros usuarios</h2>
                <p className="section-subtitle">Experiencias reales de nuestra comunidad</p>
              </IonCol>
            </IonRow>
            <IonRow>
              <IonCol>
                <Swiper
                  modules={[Pagination, Navigation, EffectFade]}
                  spaceBetween={30}
                  slidesPerView={1}
                  effect="fade"
                  pagination={{ clickable: true }}
                  navigation
                  loop
                  autoplay={{ delay: 5000 }}
                  className="testimonials-slider"
                >
                  {testimonios.map((testimonio, index) => (
                    <SwiperSlide key={index}>
                      <div className="testimonial-card">
                        <div className="testimonial-header">
                          <IonImg src={testimonio.avatar} className="testimonial-avatar" />
                          <div className="testimonial-author">
                            <h4>{testimonio.nombre}</h4>
                            <p>{testimonio.habilidad}</p>
                            <div className="testimonial-rating">
                              {[...Array(5)].map((_, i) => (
                                <IonIcon
                                  key={i}
                                  icon={star}
                                  color={i < testimonio.rating ? "warning" : "medium"}
                                />
                              ))}
                            </div>
                          </div>
                        </div>
                        <blockquote>"{testimonio.comentario}"</blockquote>
                      </div>
                    </SwiperSlide>
                  ))}
                </Swiper>
              </IonCol>
            </IonRow>
          </IonGrid>
        </section>

        {/* Featured Instructors */}
        <section className="instructors-section">
          <IonGrid>
            <IonRow>
              <IonCol>
                <h2 className="section-title">Nuestros Instructores</h2>
                <p className="section-subtitle">Aprende de los mejores profesionales</p>
              </IonCol>
            </IonRow>
            <IonRow>
              {instructores.map((instructor, index) => (
                <IonCol size="12" sizeMd="6" key={index}>
                  <IonCard className="instructor-card">
                    <IonImg src={instructor.avatar} className="instructor-avatar" />
                    <div className="instructor-info">
                      <h3>{instructor.nombre}</h3>
                      <p className="specialty">{instructor.especialidad}</p>
                      <div className="instructor-rating">
                        <IonIcon icon={star} color="warning" />
                        <span>{instructor.rating}</span>
                      </div>
                      <div className="instructor-skills">
                        {instructor.habilidades.map((skill, i) => (
                          <IonChip key={i} color="primary">{skill}</IonChip>
                        ))}
                      </div>
                      <IonButton fill="outline" size="small" routerLink="/Instructores">
                        Ver Perfil
                      </IonButton>
                    </div>
                  </IonCard>
                </IonCol>
              ))}
            </IonRow>
          </IonGrid>
        </section>

        {/* Services */}
        <section className="services-section">
          <IonGrid>
            <IonRow>
              <IonCol>
                <h2 className="section-title">Nuestros Servicios</h2>
                <p className="section-subtitle">Todo lo que ofrecemos para tu crecimiento</p>
              </IonCol>
            </IonRow>
            <IonRow>
              {servicios.map((servicio, index) => (
                <IonCol size="12" sizeMd="4" key={index}>
                  <IonCard className={`service-card ${servicio.destacado ? 'featured' : ''}`}>
                    <div className="service-icon-container">
                      <IonImg src={servicio.icono} className="service-icon" />
                    </div>
                    <IonCardHeader>
                      <IonCardTitle>{servicio.titulo}</IonCardTitle>
                    </IonCardHeader>
                    <IonCardContent>
                      <p>{servicio.descripcion}</p>
                      {servicio.destacado && (
                        <IonBadge color="danger" className="featured-badge">Más Popular</IonBadge>
                      )}
                    </IonCardContent>
                  </IonCard>
                </IonCol>
              ))}
            </IonRow>
          </IonGrid>
        </section>

        {/* Gallery */}
        <section className="gallery-section">
          <IonGrid>
            <IonRow>
              <IonCol>
                <h2 className="section-title">Galería</h2>
                <p className="section-subtitle">Momentos de nuestra comunidad</p>
              </IonCol>
            </IonRow>
            <IonRow>
              <IonCol>
                <Swiper
                  modules={[Pagination, Navigation, Autoplay]}
                  spaceBetween={20}
                  slidesPerView={1}
                  breakpoints={{
                    640: { slidesPerView: 2 },
                    1024: { slidesPerView: 3 }
                  }}
                  pagination={{ clickable: true }}
                  navigation
                  loop
                  autoplay={{ delay: 3000 }}
                >
                  {[
                    './imagen1.jpg',
                    './imagen2.jpg',
                    './imagen3.jpg',
                    './imagen4.jpg',
                    './imagen5.jpg'
                  ].map((imagen, index) => (
                    <SwiperSlide key={index}>
                      <div className="gallery-item">
                        <IonImg src={imagen} className="gallery-image" />
                        <div className="gallery-overlay">
                          <IonIcon icon={people} />
                          <span>Comunidad Habilix</span>
                        </div>
                      </div>
                    </SwiperSlide>
                  ))}
                </Swiper>
              </IonCol>
            </IonRow>
          </IonGrid>
        </section>

        {/* CTA Section */}
        <section className="cta-section">
          <IonGrid>
            <IonRow className="ion-align-items-center">
              <IonCol size="12" sizeMd="8">
                <h2>¿Listo para comenzar tu viaje de aprendizaje?</h2>
                <p>Únete a miles de personas que ya están mejorando sus habilidades con Habilix</p>
              </IonCol>
              <IonCol size="12" sizeMd="4" className="ion-text-center ion-text-md-end">
                <IonButton size="large" routerLink="/Login">
                  Regístrate Gratis
                </IonButton>
              </IonCol>
            </IonRow>
          </IonGrid>
        </section>
      </IonContent>
    </IonPage>
  );
};

export default Inicio;