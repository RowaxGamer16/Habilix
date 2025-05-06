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
  logOut,
  shield,
  statsChart,
  settingsSharp,
  peopleCircle,
  documentText,
  alertCircle
} from 'ionicons/icons';
import { useHistory } from 'react-router-dom';
import './InicioAdmin.css';

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
  status?: string;
};

type UserData = {
  role: string;
  createdCourses: number;
  takenCourses: number;
  rating: number;
  totalUsers?: number;
  pendingApprovals?: number;
  reportedIssues?: number;
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
  adminStats?: {
    totalUsers: number;
    pendingCourses: number;
    reportedIssues: number;
  };
};

const Inicio_Admin: React.FC = () => {
  const [userData, setUserData] = useState<UserData>({
    role: 'Administrador',
    createdCourses: 0,
    takenCourses: 0,
    rating: 0,
    totalUsers: 0,
    pendingApprovals: 0,
    reportedIssues: 0
  });
  const [activeSegment, setActiveSegment] = useState('pending');
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
    const fetchAdminData = async () => {
      try {
        const token = localStorage.getItem('token');
        
        if (!token) {
          setError('No hay sesión activa');
          setIsLoading(false);
          history.push('/login');
          return;
        }

        // Obtener datos del usuario/admin
        const userResponse = await fetch('http://localhost:5000/api/usuario', {
          method: 'GET',
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
        });

        if (!userResponse.ok) {
          const errorData: ApiError = await userResponse.json();
          throw new Error(errorData.error || 'Error al obtener datos del usuario');
        }

        const userData: ApiResponse = await userResponse.json();
        
        if (!userData.usuario || typeof userData.usuario.NOMBRE_USUARIO !== 'string') {
          throw new Error('Estructura de datos del usuario incorrecta');
        }

        setUserName(userData.usuario.NOMBRE_USUARIO);
        
        // Obtener estadísticas de administrador
        const statsResponse = await fetch('http://localhost:5000/api/admin/stats', {
          method: 'GET',
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
        });

        let adminStats = {
          totalUsers: 0,
          pendingCourses: 0,
          reportedIssues: 0
        };

        if (statsResponse.ok) {
          const statsData = await statsResponse.json();
          adminStats = statsData.adminStats || adminStats;
        }

        setUserData({
          role: 'Administrador',
          createdCourses: userData.usuario.CURSOS_CREADOS || 0,
          takenCourses: userData.usuario.CURSOS_TOMADOS || 0,
          rating: userData.usuario.RATING || 0,
          totalUsers: adminStats.totalUsers,
          pendingApprovals: adminStats.pendingCourses,
          reportedIssues: adminStats.reportedIssues
        });

        setIsLoading(false);
      } catch (err) {
        let errorMessage = 'Error al cargar los datos del administrador';
        
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

    fetchAdminData();

    // Simulación de carga de cursos para aprobación
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
          creatorAvatar: 'C',
          status: 'pending'
        },
        {
          id: 2,
          title: 'Programación React Avanzada',
          category: 'Tecnología',
          rating: 4.9,
          students: 892,
          isFree: true,
          creator: 'María García',
          creatorAvatar: 'M',
          status: 'reported'
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
          creatorAvatar: 'L',
          status: 'approved'
        },
        {
          id: 4,
          title: 'Marketing Digital 2023',
          category: 'Negocios',
          rating: 4.6,
          students: 2103,
          isFree: true,
          creator: 'Sofía Ramírez',
          creatorAvatar: 'S',
          status: 'pending'
        }
      ]);
      setLoading(false);
    }, 1500);
  }, [history]);

  const filteredCourses = courses.filter(course => {
    const matchesSearch = course.title.toLowerCase().includes(searchText.toLowerCase()) ||
      course.category.toLowerCase().includes(searchText.toLowerCase());
    const matchesSegment = 
      activeSegment === 'pending' ? course.status === 'pending' :
      activeSegment === 'reported' ? course.status === 'reported' :
      activeSegment === 'approved' ? course.status === 'approved' : true;
    return matchesSearch && matchesSegment;
  });

  if (loading) {
    return (
      <IonPage>
        <IonContent className="loading-content">
          <div className="loading-center">
            <IonSpinner name="crescent" />
            <p>Cargando panel de administración...</p>
          </div>
        </IonContent>
      </IonPage>
    );
  }

  return (
    <IonPage>
      <IonHeader>
        <IonToolbar>
          <IonTitle>Panel de Administración</IonTitle>
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
            <IonCardSubtitle>Panel de Administración</IonCardSubtitle>
            {isLoading ? (
              <div style={{ display: 'flex', alignItems: 'center' }}>
                <IonSpinner name="crescent" style={{ marginRight: '8px' }} />
                <span>Cargando...</span>
              </div>
            ) : (
              <IonCardTitle>Bienvenid@, {userName || 'Admin'}</IonCardTitle>
            )}
          </IonCardHeader>
          <IonCardContent>
            <div className="admin-stats">
              <IonChip color="danger">
                <IonIcon icon={shield} />
                <IonLabel>Administrador</IonLabel>
              </IonChip>
            </div>
          </IonCardContent>
        </IonCard>

        <div className="quick-actions">
          <IonButton expand="block" color="primary" routerLink="/GestionUsuarios">
            <IonIcon slot="start" icon={people} />
            Gestionar Usuarios
          </IonButton>
          <IonButton expand="block" color="secondary" routerLink="/GestionCursos">
            <IonIcon slot="start" icon={settingsSharp} />
            Gestionar Cursos
          </IonButton>
        </div>
      </IonContent>
    </IonPage>
  );

};

export default Inicio_Admin;