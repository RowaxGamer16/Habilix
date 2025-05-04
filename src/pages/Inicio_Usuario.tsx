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
  console.log('Componente Inicio_Usuario montado'); // Debug: Componente montado

  const [userData, setUserData] = useState<UserData>({
    role: 'Usuario',
    createdCourses: 0,
    takenCourses: 0,
    rating: 0
  });
  console.log('Estado inicial userData:', userData); // Debug: Estado inicial

  const [activeSegment, setActiveSegment] = useState('popular');
  console.log('Segmento activo inicial:', activeSegment); // Debug: Segmento inicial

  const [searchText, setSearchText] = useState('');
  const [loading, setLoading] = useState(false);
  const [courses, setCourses] = useState<Course[]>([]);
  const history = useHistory();
  const [userName, setUserName] = useState<string>('');
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  const handleLogout = () => {
    console.log('Ejecutando handleLogout'); // Debug: Función de logout
    localStorage.removeItem('token');
    console.log('Token eliminado del localStorage'); // Debug: Token eliminado
    history.push('/login');
    window.location.reload();
  };

  useEffect(() => {
    console.log('useEffect principal ejecutándose'); // Debug: Efecto principal

    const fetchUserData = async () => {
      console.log('Iniciando fetchUserData'); // Debug: Inicio de fetchUserData
      try {
        const token = localStorage.getItem('token');
        console.log('Token obtenido del localStorage:', token ? 'Presente' : 'Ausente'); // Debug: Token
        
        if (!token) {
          console.warn('No hay token - Redirigiendo a login'); // Debug: Sin token
          setError('No hay sesión activa');
          setIsLoading(false);
          history.push('/login');
          return;
        }

        console.log('Realizando petición a /api/usuario'); // Debug: Petición API
        const response = await fetch('http://localhost:5000/api/usuario', {
          method: 'GET',
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
        });

        console.log('Respuesta recibida, status:', response.status); // Debug: Status respuesta
        if (!response.ok) {
          const errorData: ApiError = await response.json();
          console.error('Error en la respuesta:', errorData); // Debug: Error API
          throw new Error(errorData.error || 'Error al obtener datos del usuario');
        }

        const data: ApiResponse = await response.json();
        console.log('Datos de usuario recibidos:', data); // Debug: Datos usuario
        
        if (!data.usuario || typeof data.usuario.NOMBRE_USUARIO !== 'string') {
          console.error('Estructura de datos incorrecta:', data); // Debug: Estructura incorrecta
          throw new Error('Estructura de datos del usuario incorrecta');
        }

        console.log('Configurando userName:', data.usuario.NOMBRE_USUARIO); // Debug: Set userName
        setUserName(data.usuario.NOMBRE_USUARIO);
        
        const newUserData = {
          role: data.usuario.ROLE === '1' ? 'Estudiante' : 'Instructor',
          createdCourses: data.usuario.CURSOS_CREADOS || 0,
          takenCourses: data.usuario.CURSOS_TOMADOS || 0,
          rating: data.usuario.RATING || 0
        };
        console.log('Configurando userData:', newUserData); // Debug: Set userData
        setUserData(newUserData);

        setIsLoading(false);
        console.log('Carga de datos de usuario completada'); // Debug: Carga completada
      } catch (err) {
        let errorMessage = 'Error al cargar los datos del usuario';
        
        if (err instanceof Error) {
          errorMessage = err.message;
        } else if (typeof err === 'string') {
          errorMessage = err;
        }

        console.error('Error en fetchUserData:', errorMessage); // Debug: Error capturado
        setError(errorMessage);
        setIsLoading(false);
        
        if (errorMessage.toLowerCase().includes('token') || 
            errorMessage.toLowerCase().includes('autenticación')) {
          console.warn('Error de autenticación - Limpiando token'); // Debug: Error auth
          localStorage.removeItem('token');
          history.push('/login');
        }
      }
    };

    fetchUserData();

    // Simulación de carga de cursos
    console.log('Iniciando carga de cursos simulada'); // Debug: Carga cursos
    setLoading(true);
    setTimeout(() => {
      console.log('Cursos simulados cargados'); // Debug: Cursos cargados
      const demoCourses = [
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
      ];
      setCourses(demoCourses);
      setLoading(false);
      console.log('Estado courses actualizado:', demoCourses); // Debug: Cursos seteados
    }, 1500);
  }, [history]);

  const filteredCourses = courses.filter(course => {
    const matchesSearch = course.title.toLowerCase().includes(searchText.toLowerCase()) ||
      course.category.toLowerCase().includes(searchText.toLowerCase());
    const matchesSegment = activeSegment === 'free' ? course.isFree : true;
    return matchesSearch && matchesSegment;
  });
  console.log('Cursos filtrados:', filteredCourses.length); // Debug: Cursos filtrados

  if (loading) {
    console.log('Mostrando estado de carga'); // Debug: Estado loading
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

  console.log('Renderizando componente principal'); // Debug: Render principal
  return (
    <IonPage>
      <IonHeader>
        <IonToolbar>
          <IonSearchbar
            placeholder="Buscar cursos..."
            value={searchText}
            onIonChange={e => {
              console.log('Cambio en búsqueda:', e.detail.value); // Debug: Cambio búsqueda
              setSearchText(e.detail.value!)
            }}
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
          onDidDismiss={() => {
            console.log('Toast de error cerrado'); // Debug: Toast cerrado
            setError(null)
          }}
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
          <IonButton 
            expand="block" 
            color="primary" 
            routerLink="/create-course"
            onClick={() => console.log('Navegando a crear curso')} // Debug: Navegación
          >
            <IonIcon slot="start" icon={addCircle} />
            Crear Nuevo Curso
          </IonButton>
          <IonButton 
            expand="block" 
            color="medium" 
            fill="outline" 
            onClick={() => {
              console.log('Botón cerrar sesión clickeado'); // Debug: Click logout
              handleLogout();
            }}
          >
            <IonIcon slot="start" icon={logOut} />
            Cerrar sesión
          </IonButton>
        </div>

        <IonSegment
          value={activeSegment}
          onIonChange={e => {
            console.log('Cambio de segmento:', e.detail.value); // Debug: Cambio segmento
            setActiveSegment(e.detail.value as string)
          }}
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
          <IonButton 
            fill="clear" 
            size="small" 
            routerLink="/Cursos"
            onClick={() => console.log('Navegando a todos los cursos')} // Debug: Navegación
          >
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
                  <IonCard 
                    className="course-card" 
                    routerLink={`/course/${course.id}`}
                    onClick={() => console.log(`Navegando al curso ${course.id}`)} // Debug: Navegación
                  >
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
          <IonButton 
            fill="clear" 
            size="small" 
            routerLink="/my-courses"
            onClick={() => console.log('Navegando a mis cursos')} // Debug: Navegación
          >
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
            <IonButton 
              slot="end" 
              fill="clear" 
              routerLink="/course/1/continue"
              onClick={() => console.log('Continuando curso 1')} // Debug: Acción
            >
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
            <IonButton 
              slot="end" 
              fill="clear" 
              routerLink="/course/2/continue"
              onClick={() => console.log('Continuando curso 2')} // Debug: Acción
            >
              Continuar
            </IonButton>
          </IonItem>
        </IonList>
      </IonContent>
    </IonPage>
  );
};

export default Inicio_Usuario;