import React, { useState, useEffect } from 'react';
import {
  IonPage,
  IonContent,
  IonHeader,
  IonToolbar,
  IonTitle,
  IonButtons,
  IonButton,
  IonIcon,
  IonAvatar,
  IonGrid,
  IonRow,
  IonCol,
  IonCard,
  IonCardHeader,
  IonCardTitle,
  IonCardSubtitle,
  IonCardContent,
  IonBadge,
  IonItem,
  IonLabel,
  IonList,
  IonSearchbar,
  IonSegment,
  IonSegmentButton,
  IonSpinner,
  IonToast,
  IonChip
} from '@ionic/react';
import {
  personCircle,
  search,
  star,
  flame,
  time,
  chatbubbles,
  notifications,
  settings,
  school,
  addCircle,
  trendingUp,
  location,
  calendar,
  people,
  videocam,
  logOut
} from 'ionicons/icons';
import { useHistory } from 'react-router-dom';
import './Inicio_Usuario.css';

type Course = {
  id: number;
  title: string;
  category: string;
  rating: number;
  students: number;
  price?: number;
  isFree: boolean;
  creator: string;
  creatorAvatar: string;
};

type UserData = {
  role: string;
  createdCourses: number;
  takenCourses: number;
  rating: number;
};

type ApiError = {
  message: string;
  error?: string;
};

type ApiResponse = {
  usuario: {
    ID: number;
    NOMBRE_USUARIO: string;
    EMAIL: string;
    ROLE: string;
    TELEFONO?: string;
    FECHA_CREACION: string;
    CURSOS_CREADOS?: number;
    CURSOS_TOMADOS?: number;
    RATING?: number;
  };
};

const Inicio_Usuario: React.FC = () => {
  const [userData, setUserData] = useState<UserData>({
    role: 'Usuario',
    createdCourses: 0,
    takenCourses: 0,
    rating: 0
  });
  const [activeSegment, setActiveSegment] = useState('popular');
  const [searchText, setSearchText] = useState('');
  const [loading, setLoading] = useState(false);
  const [courses, setCourses] = useState<Course[]>([]);
  const history = useHistory();
  const [userName, setUserName] = useState<string>('');
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  const handleLogout = () => {
    localStorage.removeItem('token');
    history.push('/login');
    window.location.reload();
  };

  useEffect(() => {
    const fetchUserData = async () => {
      try {
        const token = localStorage.getItem('token');
        
        if (!token) {
          setError('No hay sesión activa');
          setIsLoading(false);
          history.push('/login');
          return;
        }

        const response = await fetch('http://localhost:5000/api/usuario', {
          method: 'GET',
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
        });

        if (!response.ok) {
          const errorData: ApiError = await response.json();
          throw new Error(errorData.error || 'Error al obtener datos del usuario');
        }

        const data: ApiResponse = await response.json();
        
        if (!data.usuario || typeof data.usuario.NOMBRE_USUARIO !== 'string') {
          throw new Error('Estructura de datos del usuario incorrecta');
        }

        setUserName(data.usuario.NOMBRE_USUARIO);
        
        setUserData({
          role: data.usuario.ROLE === '1' ? 'Estudiante' : 'Instructor',
          createdCourses: data.usuario.CURSOS_CREADOS || 0,
          takenCourses: data.usuario.CURSOS_TOMADOS || 0,
          rating: data.usuario.RATING || 0
        });

        setIsLoading(false);
      } catch (err) {
        let errorMessage = 'Error al cargar los datos del usuario';
        
        if (err instanceof Error) {
          errorMessage = err.message;
        } else if (typeof err === 'string') {
          errorMessage = err;
        }

        console.error('Error al obtener datos:', errorMessage);
        setError(errorMessage);
        setIsLoading(false);
        
        if (errorMessage.toLowerCase().includes('token') || 
            errorMessage.toLowerCase().includes('autenticación')) {
          localStorage.removeItem('token');
          history.push('/login');
        }
      }
    };

    fetchUserData();

    // Simulación de carga de cursos
    setLoading(true);
    setTimeout(() => {
      setCourses([
        {
          id: 1,
          title: 'Fotografía Digital desde Cero',
          category: 'Fotografía',
          rating: 4.8,
          students: 1245,
          price: 29.99,
          isFree: false,
          creator: 'Carlos Méndez',
          creatorAvatar: 'C'
        },
        {
          id: 2,
          title: 'Programación React Avanzada',
          category: 'Tecnología',
          rating: 4.9,
          students: 892,
          isFree: true,
          creator: 'María García',
          creatorAvatar: 'M'
        },
        {
          id: 3,
          title: 'Cocina Italiana Profesional',
          category: 'Cocina',
          rating: 4.7,
          students: 567,
          price: 39.99,
          isFree: false,
          creator: 'Luigi Romano',
          creatorAvatar: 'L'
        },
        {
          id: 4,
          title: 'Marketing Digital 2023',
          category: 'Negocios',
          rating: 4.6,
          students: 2103,
          isFree: true,
          creator: 'Sofía Ramírez',
          creatorAvatar: 'S'
        }
      ]);
      setLoading(false);
    }, 1500);
  }, [history]);

  const filteredCourses = courses.filter(course => {
    const matchesSearch = course.title.toLowerCase().includes(searchText.toLowerCase()) ||
      course.category.toLowerCase().includes(searchText.toLowerCase());
    const matchesSegment = activeSegment === 'free' ? course.isFree : true;
    return matchesSearch && matchesSegment;
  });

  if (loading) {
    return (
      <IonPage>
        <IonContent className="loading-content">
          <div className="loading-center">
            <IonSpinner name="crescent" />
            <p>Cargando cursos...</p>
          </div>
        </IonContent>
      </IonPage>
    );
  }

  return (
    <IonPage>
      <IonHeader>
        <IonToolbar>
          <IonSearchbar
            placeholder="Buscar cursos..."
            value={searchText}
            onIonChange={e => setSearchText(e.detail.value!)}
            animated
            className="header-search"
          />
        </IonToolbar>
      </IonHeader>

      <IonContent>
        <IonToast
          isOpen={!!error}
          message={error || ''}
          duration={5000}
          onDidDismiss={() => setError(null)}
          color="danger"
          buttons={[{
            text: 'Cerrar',
            role: 'cancel'
          }]}
        />

        <IonCard className="welcome-card">
          <IonCardHeader>
            <IonCardSubtitle>Bienvenid@ de vuelta</IonCardSubtitle>
            {isLoading ? (
              <div style={{ display: 'flex', alignItems: 'center' }}>
                <IonSpinner name="crescent" style={{ marginRight: '8px' }} />
                <span>Cargando...</span>
              </div>
            ) : (
              <IonCardTitle>{userName || 'Usuario'}</IonCardTitle>
            )}
          </IonCardHeader>
          <IonCardContent>
            <div className="user-stats">
              <IonChip color="primary">
                <IonIcon icon={school} />
                <IonLabel>{userData.role}</IonLabel>
              </IonChip>
              <div className="stats-grid">
                <div className="stat-item">
                  <IonIcon icon={addCircle} color="primary" />
                  <span>{userData.createdCourses} cursos creados</span>
                </div>
                <div className="stat-item">
                  <IonIcon icon={videocam} color="secondary" />
                  <span>{userData.takenCourses} cursos tomados</span>
                </div>
                <div className="stat-item">
                  <IonIcon icon={star} color="warning" />
                  <span>Rating: {userData.rating.toFixed(1)}/5.0</span>
                </div>
              </div>
            </div>
          </IonCardContent>
        </IonCard>

        <div className="quick-actions">
          <IonButton expand="block" color="primary" routerLink="/create-course">
            <IonIcon slot="start" icon={addCircle} />
            Crear Nuevo Curso
          </IonButton>
          <IonButton expand="block" color="medium" fill="outline" onClick={handleLogout}>
            <IonIcon slot="start" icon={logOut} />
            Cerrar sesión
          </IonButton>
        </div>

        <IonSegment
          value={activeSegment}
          onIonChange={e => setActiveSegment(e.detail.value as string)}
          className="courses-segment"
        >
          <IonSegmentButton value="popular">
            <IonIcon icon={flame} />
            <IonLabel>Populares</IonLabel>
          </IonSegmentButton>
          <IonSegmentButton value="new">
            <IonIcon icon={time} />
            <IonLabel>Nuevos</IonLabel>
          </IonSegmentButton>
          <IonSegmentButton value="free">
            <IonIcon icon={star} />
            <IonLabel>Gratis</IonLabel>
          </IonSegmentButton>
        </IonSegment>

        <div className="section-title">
          <h2>Cursos Disponibles</h2>
          <IonButton fill="clear" size="small" routerLink="/Cursos">
            Ver todos
          </IonButton>
        </div>

        {filteredCourses.length === 0 ? (
          <div className="empty-state">
            <IonIcon icon={search} size="large" />
            <p>No se encontraron cursos</p>
          </div>
        ) : (
          <IonGrid className="courses-grid">
            <IonRow>
              {filteredCourses.map(course => (
                <IonCol size="12" sizeMd="6" sizeLg="4" key={course.id}>
                  <IonCard className="course-card" routerLink={`/course/${course.id}`}>
                    <div className={`course-badge ${course.category.toLowerCase()}`}>
                      {course.category}
                    </div>
                    <IonCardHeader>
                      <IonCardTitle>{course.title}</IonCardTitle>
                      <IonCardSubtitle>
                        <IonAvatar className="creator-avatar">
                          {course.creatorAvatar}
                        </IonAvatar>
                        {course.creator}
                      </IonCardSubtitle>
                    </IonCardHeader>
                    <IonCardContent>
                      <div className="course-meta">
                        <span className="rating">
                          <IonIcon icon={star} color="warning" />
                          {course.rating.toFixed(1)}
                        </span>
                        <span className="students">
                          <IonIcon icon={people} color="medium" />
                          {course.students.toLocaleString()}
                        </span>
                        {course.isFree ? (
                          <IonChip color="success">GRATIS</IonChip>
                        ) : (
                          <span className="price">${course.price?.toFixed(2)}</span>
                        )}
                      </div>
                    </IonCardContent>
                  </IonCard>
                </IonCol>
              ))}
            </IonRow>
          </IonGrid>
        )}

        <div className="section-title">
          <h2>Tus Cursos en Progreso</h2>
          <IonButton fill="clear" size="small" routerLink="/my-courses">
            Ver todos
          </IonButton>
        </div>

        <IonList className="progress-list">
          <IonItem>
            <IonAvatar slot="start" className="course-thumbnail">
              <IonIcon icon={videocam} />
            </IonAvatar>
            <IonLabel>
              <h3>Fotografía Digital</h3>
              <p>Progreso: 65% • 3/5 lecciones</p>
              <IonBadge color="primary">En progreso</IonBadge>
            </IonLabel>
            <IonButton slot="end" fill="clear" routerLink="/course/1/continue">
              Continuar
            </IonButton>
          </IonItem>
          <IonItem>
            <IonAvatar slot="start" className="course-thumbnail">
              <IonIcon icon={videocam} />
            </IonAvatar>
            <IonLabel>
              <h3>Programación React</h3>
              <p>Progreso: 30% • 2/10 lecciones</p>
              <IonBadge color="secondary">Recién empezado</IonBadge>
            </IonLabel>
            <IonButton slot="end" fill="clear" routerLink="/course/2/continue">
              Continuar
            </IonButton>
          </IonItem>
        </IonList>
      </IonContent>
    </IonPage>
  );
};

export default Inicio_Usuario;