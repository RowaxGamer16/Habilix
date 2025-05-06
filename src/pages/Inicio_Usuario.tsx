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

interface Curso {
  id: number;
  nombre: string;
  descripcion: string;
  profesor: string;
  portada: string;
  categoria: string;
  precio: number;
  ranking: number;
  id_usuario: number;
  entrega: string;
  horario: string;
}

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
  const API_URL = 'http://localhost:5000/api';
  const [userData, setUserData] = useState<UserData>({
    role: 'Usuario',
    createdCourses: 0,
    takenCourses: 0,
    rating: 0
  });
  const [activeSegment, setActiveSegment] = useState('popular');
  const [searchText, setSearchText] = useState('');
  const [loading, setLoading] = useState(false);
  const [cursos, setCursos] = useState<Curso[]>([]);
  const history = useHistory();
  const [userName, setUserName] = useState<string>('');
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  const handleLogout = () => {
    localStorage.removeItem('token');
    history.push('/login');
    window.location.reload();
  };

  const fetchUserData = async () => {
    try {
      const token = localStorage.getItem('token');
      
      if (!token) {
        setError('No hay sesión activa');
        setIsLoading(false);
        history.push('/login');
        return;
      }

      const response = await fetch(`${API_URL}/usuario`, {
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
      
      const newUserData = {
        role: data.usuario.ROLE === '1' ? 'Estudiante' : 'Instructor',
        createdCourses: data.usuario.CURSOS_CREADOS || 0,
        takenCourses: data.usuario.CURSOS_TOMADOS || 0,
        rating: data.usuario.RATING || 0
      };
      setUserData(newUserData);
      setIsLoading(false);
    } catch (err) {
      let errorMessage = 'Error al cargar los datos del usuario';
      
      if (err instanceof Error) {
        errorMessage = err.message;
      } else if (typeof err === 'string') {
        errorMessage = err;
      }

      setError(errorMessage);
      setIsLoading(false);
      
      if (errorMessage.toLowerCase().includes('token') || 
          errorMessage.toLowerCase().includes('autenticación')) {
        localStorage.removeItem('token');
        history.push('/login');
      }
    }
  };

  const fetchCursos = async () => {
    try {
      const token = localStorage.getItem('token');
      if (!token) {
        console.warn('No hay token - No se pueden cargar cursos');
        return;
      }

      const response = await fetch(`${API_URL}/cursos`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (!response.ok) {
        throw new Error(`Error ${response.status}: ${response.statusText}`);
      }

      const data = await response.json();
      setCursos(data);
      setLoading(false);
    } catch (err) {
      console.error('Error al cargar cursos:', err);
      setError('Error al cargar los cursos');
      setLoading(false);
    }
  };

  const generarColorAleatorio = () => {
    const colores = [
      '#4285F4', '#DB4437', '#F4B400', '#0F9D58', '#AB47BC',
      '#00ACC1', '#FF7043', '#5C6BC0', '#EC407A', '#26A69A'
    ];
    return colores[Math.floor(Math.random() * colores.length)];
  };

  const obtenerIniciales = (nombre: string) => {
    return nombre.split(' ')
      .map(word => word[0])
      .join('')
      .toUpperCase()
      .substring(0, 2);
  };

  useEffect(() => {
    const fetchData = async () => {
      await fetchUserData();
      await fetchCursos();
    };

    fetchData();
  }, [history]);

  const filteredCourses = cursos.filter(curso => {
    const matchesSearch = curso.nombre.toLowerCase().includes(searchText.toLowerCase()) ||
      curso.categoria.toLowerCase().includes(searchText.toLowerCase());
    const matchesSegment = activeSegment === 'free' ? curso.precio === 0 : true;
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
              <IonIcon icon={school} style={{ color: 'white' }} />
              <IonLabel style={{ color: 'white' }}>{userData.role}</IonLabel>
            </IonChip>
          </div>
        </IonCardContent>
        </IonCard>

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
  
        </IonSegment>

        <div className="section-title">
          <h2>Cursos Disponibles</h2>
          <IonButton 
            fill="clear" 
            size="small" 
            routerLink="/Cursos"
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
              {filteredCourses.map(curso => (
                <IonCol size="12" sizeMd="6" sizeLg="4" key={curso.id}>
                  <IonCard 
                    className="course-card" 
                    routerLink={`/curso/${curso.id}`}
                  >
                    <div className={`course-badge ${curso.categoria.toLowerCase().replace(/\s+/g, '-')}`}>
                      {curso.categoria}
                    </div>
                    
                    <div className="image-container">
                      {curso.portada ? (
                        <img
                          src={`${API_URL}${curso.portada}`}
                          alt={curso.nombre}
                          className="course-image"
                          onError={(e) => {
                            e.currentTarget.src = '/assets/default-course.png';
                          }}
                        />
                      ) : (
                        <div 
                          className="course-image-placeholder"
                          style={{ backgroundColor: generarColorAleatorio() }}
                        >
                          <span className="course-initials">
                            {obtenerIniciales(curso.nombre)}
                          </span>
                        </div>
                      )}
                    </div>
                    
                    <IonCardHeader>
                      <IonCardTitle>{curso.nombre}</IonCardTitle>
                      <IonCardSubtitle>
                        <IonAvatar className="creator-avatar">
                          {obtenerIniciales(curso.profesor)}
                        </IonAvatar>
                        {curso.profesor}
                      </IonCardSubtitle>
                    </IonCardHeader>
                    
                    <IonCardContent>
                      <p className="course-description">{curso.descripcion.substring(0, 100)}...</p>
                      <div className="course-meta">
                        <span className="rating">
                          <IonIcon icon={star} color="warning" />
                          {curso.ranking?.toFixed(1) || 'Nuevo'}
                        </span>
                        <span className="delivery-method">
                          <IonIcon icon={curso.entrega === 'Virtual' ? videocam : location} />
                          {curso.entrega}
                        </span>
                        {Number(curso.precio) === 0 ? (
                        <IonChip color="success">GRATIS</IonChip>
                      ) : (
                        <span className="price">${Number(curso.precio)?.toFixed(2)}</span>
                      )}
                      </div>
                    </IonCardContent>
                  </IonCard>
                </IonCol>
              ))}
            </IonRow>
          </IonGrid>
        )}
      </IonContent>
    </IonPage>
  );
};

export default Inicio_Usuario;