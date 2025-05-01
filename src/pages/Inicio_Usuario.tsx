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

const Inicio_Usuario: React.FC = () => {
  const [userData, setUserData] = useState({
    role: 'Instructor',
    createdCourses: 5,
    takenCourses: 12,
    rating: 4.7
  });
  const [activeSegment, setActiveSegment] = useState('popular');
  const [error, setError] = useState<string | undefined>(undefined);
  const [searchText, setSearchText] = useState('');
  const [loading, setLoading] = useState(false);
  const [courses, setCourses] = useState<Course[]>([]);
  const [notificationsCount] = useState(2);
  const history = useHistory();
  const [userName, setUserName] = useState<string>('');
  const [userId, setUserId] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('userId');
    localStorage.removeItem('usuario');
    
    // Redirigir al login y forzar recarga completa
    window.location.href = '/login';
    // O alternativamente:
    // window.location.replace('/login');
  };

  useEffect(() => {

    const fetchUserData = async () => {
      try {
        const token = localStorage.getItem('token'); // Obtener token
        const storedUserId = localStorage.getItem('userId'); // Obtener ID del usuario

        if (!token || !storedUserId) {
          setError('Faltan credenciales');
          setIsLoading(false);
          return;
        }

        setUserId(storedUserId); // Guardar el ID en el estado

        const response = await fetch(`http://localhost:5000/api/usuario/${storedUserId}`, {
          method: 'GET',
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
        });

        if (!response.ok) {
          throw new Error('Error al obtener el usuario');
        }

        const data = await response.json();
        console.log('Datos del usuario:', data); // Verifica la respuesta del backend

        // Asegúrate de que el backend devuelva el nombre en la propiedad correcta
        if (data.NOMBRE_USUARIO) {
          setUserName(data.NOMBRE_USUARIO); // Guardar el nombre del usuario
        } else {
          setError('Nombre de usuario no encontrado en la respuesta');
        }

        setIsLoading(false); // Dejar de mostrar el spinner
      } catch (error) {
        setError('Error al obtener los datos del usuario');
        setIsLoading(false);
      }
    };

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
  }, []);

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
        <IonCard className="welcome-card">
          <IonCardHeader>
            <IonCardSubtitle>Bienvenid@ de vuelta</IonCardSubtitle>
            {isLoading ? (
              <IonSpinner name="crescent" />
            ) : error ? (
              <div>
                <h2>{error}</h2>
              </div>
            ) : (
              <IonCardTitle>{userName}</IonCardTitle>
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
                  <span>Rating: {userData.rating}/5.0</span>
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
                          {course.rating}
                        </span>
                        <span className="students">
                          <IonIcon icon={people} color="medium" />
                          {course.students}
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

        <IonToast
          isOpen={!!error}
          message={error}
          duration={3000}
          onDidDismiss={() => setError('')}
          color="danger"
        />
      </IonContent>
    </IonPage>
  );
};

export default Inicio_Usuario;