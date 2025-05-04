import React, { useState, useEffect } from 'react';
import {
  IonPage, IonHeader, IonToolbar, IonTitle, IonContent,
  IonCard, IonCardContent, IonButton, IonSearchbar,
  IonModal, IonGrid, IonRow, IonCol, IonItem,
  IonLabel, IonInput, IonTextarea, IonIcon,
  IonAlert, IonButtons, IonLoading
} from '@ionic/react';
import { star } from 'ionicons/icons';
import { useHistory } from 'react-router-dom';
import './Cursos.css';

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

const Cursos: React.FC = () => {
  const history = useHistory();
  const API_URL = 'http://localhost:5000/api';
  console.log('API_URL:', API_URL); // Debug: URL de la API

  // Función para generar colores aleatorios
  const generarColorAleatorio = () => {
    const colores = [
      '#4285F4', '#DB4437', '#F4B400', '#0F9D58', '#AB47BC',
      '#00ACC1', '#FF7043', '#5C6BC0', '#EC407A', '#26A69A'
    ];
    const color = colores[Math.floor(Math.random() * colores.length)];
    console.log('Color aleatorio generado:', color); // Debug: Color generado
    return color;
  };

  // Función para obtener iniciales del nombre del curso
  const obtenerIniciales = (nombre: string) => {
    const iniciales = nombre.split(' ')
      .map(word => word[0])
      .join('')
      .toUpperCase()
      .substring(0, 2);
    console.log('Iniciales generadas para', nombre, ':', iniciales); // Debug: Iniciales
    return iniciales;
  };

  // Estados mejor organizados
  const [state, setState] = useState({
    searchText: '',
    showModalCrearCurso: false,
    showLoginModal: false,
    cursos: [] as Curso[],
    loading: true,
    error: null as string | null,
    showAlert: false,
    selectedImage: null as File | null
  });
  console.log('Estado actual:', state); // Debug: Estado completo

  const [nuevoCurso, setNuevoCurso] = useState({
    nombre: '',
    descripcion: '',
    profesor: '',
    portada: '',
    categoria: '',
    precio: 0,
    entrega: 'Virtual',
    horario: 'Flexible'
  });
  console.log('Estado nuevoCurso:', nuevoCurso); // Debug: Formulario nuevo curso

  const isUserLoggedIn = !!localStorage.getItem('token');
  console.log('Usuario logueado:', isUserLoggedIn); // Debug: Estado de autenticación

  // Efecto para cargar cursos con manejo de errores mejorado
  useEffect(() => {
    console.log('useEffect ejecutándose - Cargando cursos'); // Debug: Inicio de efecto
    const fetchCursos = async () => {
      try {
        console.log('Iniciando fetch a:', `${API_URL}/cursos`); // Debug: Inicio de fetch
        const response = await fetch(`${API_URL}/cursos`);
        
        console.log('Respuesta recibida, status:', response.status); // Debug: Status de respuesta
        if (!response.ok) {
          throw new Error(`Error ${response.status}: ${response.statusText}`);
        }

        const data = await response.json();
        console.log('Datos recibidos:', data); // Debug: Datos de cursos
        setState(prev => ({ ...prev, cursos: data, loading: false }));
      } catch (err) {
        console.error('Error en fetchCursos:', err); // Debug: Error capturado
        const errorMsg = err instanceof Error ? err.message : 'Error al cargar cursos';
        setState(prev => ({ 
          ...prev, 
          loading: false, 
          error: errorMsg,
          showAlert: true 
        }));
      }
    };

    fetchCursos();
  }, []);

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    console.log('Evento de cambio de imagen detectado'); // Debug: Evento de imagen
    const file = e.target.files?.[0];
    if (file) {
      console.log('Archivo seleccionado:', file.name, 'tamaño:', file.size); // Debug: Info de archivo
      setState(prev => ({ ...prev, selectedImage: file }));
    } else {
      console.log('No se seleccionó ningún archivo'); // Debug: Sin archivo
    }
  };

  const agregarCurso = async () => {
    console.log('Iniciando agregarCurso con datos:', nuevoCurso); // Debug: Datos del formulario
    
    // Validación mejorada
    if (!nuevoCurso.nombre || !nuevoCurso.descripcion || !nuevoCurso.profesor) {
      console.log('Validación fallida - Campos requeridos faltantes'); // Debug: Validación fallida
      setState(prev => ({
        ...prev,
        error: 'Nombre, descripción y profesor son campos requeridos',
        showAlert: true
      }));
      return;
    }

    try {
      const token = localStorage.getItem('token');
      console.log('Token encontrado:', !!token); // Debug: Verificación de token
      if (!token) {
        console.log('No hay token - Usuario no autenticado'); // Debug: No autenticado
        setState(prev => ({
          ...prev,
          error: 'Debes iniciar sesión para crear un curso',
          showAlert: true
        }));
        return;
      }

      const formData = new FormData();
      formData.append('nombre', nuevoCurso.nombre);
      formData.append('descripcion', nuevoCurso.descripcion);
      formData.append('profesor', nuevoCurso.profesor);
      formData.append('categoria', nuevoCurso.categoria);
      formData.append('entrega', nuevoCurso.entrega);
      formData.append('horario', nuevoCurso.horario);
      
      if (state.selectedImage) {
        console.log('Adjuntando imagen al FormData'); // Debug: Imagen adjuntada
        formData.append('portada', state.selectedImage);
      }

      console.log('FormData preparado para enviar'); // Debug: FormData listo
      setState(prev => ({ ...prev, loading: true }));

      const response = await fetch(`${API_URL}/cursos`, {
        method: 'POST',
        headers: { 
          'Authorization': `Bearer ${token}`,
        },
        body: formData
      });

      console.log('Respuesta del servidor recibida, status:', response.status); // Debug: Status de respuesta
      if (!response.ok) {
        const errorData = await response.json();
        console.log('Error del servidor:', errorData); // Debug: Error del servidor
        throw new Error(errorData.error || 'Error al crear curso');
      }

      const data = await response.json();
      console.log('Curso creado exitosamente:', data); // Debug: Respuesta exitosa
      
      // Actualización optimizada del estado
      setState(prev => ({
        ...prev,
        cursos: [...prev.cursos, { 
          id: data.id, 
          ...nuevoCurso, 
          ranking: 0,
          id_usuario: data.id_usuario,
          portada: data.portada
        }],
        loading: false,
        showModalCrearCurso: false
      }));

      // Reset del formulario
      console.log('Reseteando formulario nuevoCurso'); // Debug: Reset de formulario
      setNuevoCurso({
        nombre: '',
        descripcion: '',
        profesor: '',
        portada: '',
        categoria: '',
        precio: 0,
        entrega: 'Virtual',
        horario: 'Flexible'
      });
      setState(prev => ({ ...prev, selectedImage: null }));

    } catch (err) {
      console.error('Error en agregarCurso:', err); // Debug: Error capturado
      const errorMsg = err instanceof Error ? err.message : 'Error al crear el curso';
      setState(prev => ({
        ...prev,
        loading: false,
        error: errorMsg,
        showAlert: true
      }));
    }
  };

  // Filtrado memoizado
  const cursosFiltrados = state.cursos.filter(curso =>
    curso.nombre.toLowerCase().includes(state.searchText.toLowerCase()) ||
    curso.descripcion.toLowerCase().includes(state.searchText.toLowerCase()) ||
    curso.profesor.toLowerCase().includes(state.searchText.toLowerCase())
  );
  console.log('Cursos filtrados:', cursosFiltrados.length); // Debug: Resultados de filtrado

  const handleVerCurso = (cursoId: number) => {
    console.log('Intentando ver curso ID:', cursoId); // Debug: Intento de ver curso
    if (isUserLoggedIn) {
      console.log('Usuario autenticado, redirigiendo...'); // Debug: Redirección
      history.push(`/curso/${cursoId}`);
    } else {
      console.log('Usuario no autenticado, mostrando modal'); // Debug: Mostrar modal
      setState(prev => ({ ...prev, showLoginModal: true }));
    }
  };

  if (state.loading) {
    console.log('Mostrando spinner de carga'); // Debug: Estado de carga
    return (
      <IonPage className="page-cursos">
        <IonContent className="ion-padding">
          <IonLoading isOpen={true} message="Cargando cursos..." />
        </IonContent>
      </IonPage>
    );
  }

  return (
    <IonPage className="page-cursos">
      <IonHeader>
        <IonToolbar>
          <IonTitle>Cursos Disponibles</IonTitle>
          {isUserLoggedIn && (
            <IonButton 
              slot="end" 
              onClick={() => {
                console.log('Botón Nuevo Curso clickeado'); // Debug: Click en botón
                setState(prev => ({ ...prev, showModalCrearCurso: true }))
              }}
              style={{ marginRight: '16px' }}
            >
              Nuevo Curso
            </IonButton>
          )}
        </IonToolbar>
      </IonHeader>

      <IonContent>
        <IonSearchbar
          placeholder="Buscar cursos..."
          value={state.searchText}
          onIonChange={e => {
            console.log('Búsqueda cambiada:', e.detail.value); // Debug: Cambio en búsqueda
            setState(prev => ({ ...prev, searchText: e.detail.value! }))
          }}
          animated
          debounce={300}
        />

        <div className="courses-grid">
          {cursosFiltrados.length === 0 ? (
            <div className="no-results">
              {state.searchText ? 'No se encontraron cursos que coincidan' : 'No hay cursos disponibles'}
            </div>
          ) : (
            cursosFiltrados.map(curso => (
              <IonCard 
                key={curso.id} 
                className="course-card" 
                button 
                onClick={() => {
                  console.log('Card de curso clickeada:', curso.id); // Debug: Click en card
                  handleVerCurso(curso.id)
                }}
              >
                <div className="image-container">
                  {curso.portada ? (
                    <img
                      src={`${API_URL}${curso.portada}`}
                      alt={curso.nombre}
                      className="course-image"
                      onError={(e) => {
                        console.log('Error cargando imagen, usando placeholder'); // Debug: Fallo de imagen
                        e.currentTarget.src = '/assets/default-course.png'
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
                  {curso.categoria && (
                    <span className={`course-badge ${curso.categoria.toLowerCase().replace(/\s+/g, '-')}`}>
                      {curso.categoria}
                    </span>
                  )}
                </div>

                <IonCardContent className="course-content">
                  <h2 className="course-title">{curso.nombre}</h2>
                  <p className="course-description">{curso.descripcion}</p>

                  <div className="course-meta">
                    <span className="creator-name">{curso.profesor}</span>
                    <div className="rating">
                      <IonIcon icon={star} className="star-icon" />
                      <span>{curso.ranking?.toFixed(1) || 'Nuevo'}</span>
                    </div>
                    <div className="price">
                      <span>{curso.precio > 0 ? `$${curso.precio}` : 'Gratis'}</span>
                    </div>
                  </div>
                </IonCardContent>
              </IonCard>
            ))
          )}
        </div>

        {/* Modal para crear curso */}
        <IonModal 
          isOpen={state.showModalCrearCurso} 
          onDidDismiss={() => {
            console.log('Modal de crear curso cerrado'); // Debug: Cierre de modal
            setState(prev => ({ ...prev, showModalCrearCurso: false }))
          }}
        >
          <IonContent className="ion-padding">
            <IonHeader>
              <IonToolbar>
                <IonTitle>Crear Nuevo Curso</IonTitle>
                <IonButtons slot="end">
                  <IonButton onClick={() => {
                    console.log('Botón cerrar modal clickeado'); // Debug: Cierre de modal
                    setState(prev => ({ ...prev, showModalCrearCurso: false }))
                  }}>
                    Cerrar
                  </IonButton>
                </IonButtons>
              </IonToolbar>
            </IonHeader>

            <IonGrid>
              <IonRow>
                <IonCol>
                  <IonItem>
                    <IonLabel position="floating">Nombre del curso*</IonLabel>
                    <IonInput 
                      value={nuevoCurso.nombre} 
                      onIonChange={e => {
                        console.log('Campo nombre cambiado:', e.detail.value); // Debug: Cambio en input
                        setNuevoCurso(prev => ({ ...prev, nombre: e.detail.value || '' }))
                      }} 
                      required
                    />
                  </IonItem>
                </IonCol>
              </IonRow>

              <IonRow>
                <IonCol>
                  <IonItem>
                    <IonLabel position="floating">Descripción*</IonLabel>
                    <IonTextarea 
                      value={nuevoCurso.descripcion} 
                      onIonChange={e => {
                        console.log('Campo descripción cambiado:', e.detail.value); // Debug: Cambio en textarea
                        setNuevoCurso(prev => ({ ...prev, descripcion: e.detail.value || '' }))
                      }}
                      rows={4}
                      required
                    />
                  </IonItem>
                </IonCol>
              </IonRow>

              <IonRow>
                <IonCol>
                  <IonItem>
                    <IonLabel position="floating">Profesor*</IonLabel>
                    <IonInput 
                      value={nuevoCurso.profesor} 
                      onIonChange={e => {
                        console.log('Campo profesor cambiado:', e.detail.value); // Debug: Cambio en input
                        setNuevoCurso(prev => ({ ...prev, profesor: e.detail.value || '' }))
                      }}
                      required
                    />
                  </IonItem>
                </IonCol>
              </IonRow>

              <IonRow>
                <IonCol size="6">
                  <IonItem>
                    <IonLabel position="floating">Categoría</IonLabel>
                    <IonInput 
                      value={nuevoCurso.categoria} 
                      onIonChange={e => {
                        console.log('Campo categoría cambiado:', e.detail.value); // Debug: Cambio en input
                        setNuevoCurso(prev => ({ ...prev, categoria: e.detail.value || '' }))
                      }}
                    />
                  </IonItem>
                </IonCol>
              </IonRow>

              <IonRow>
                <IonCol>
                  <IonButton 
                    expand="block" 
                    onClick={() => {
                      console.log('Botón Publicar Curso clickeado'); // Debug: Click en botón
                      agregarCurso()
                    }} 
                    color="primary"
                    disabled={state.loading}
                  >
                    {state.loading ? 'Publicando...' : 'Publicar Curso'}
                  </IonButton>
                  <IonButton 
                    expand="block" 
                    onClick={() => {
                      console.log('Botón Cancelar clickeado'); // Debug: Click en botón
                      setState(prev => ({ ...prev, showModalCrearCurso: false }))
                    }} 
                    color="medium" 
                    fill="outline"
                  >
                    Cancelar
                  </IonButton>
                </IonCol>
              </IonRow>
            </IonGrid>
          </IonContent>
        </IonModal>

        {/* Modal de login requerido */}
        <IonModal 
          isOpen={state.showLoginModal} 
          onDidDismiss={() => {
            console.log('Modal de login cerrado'); // Debug: Cierre de modal
            setState(prev => ({ ...prev, showLoginModal: false }))
          }}
        >
          <IonContent className="ion-padding">
            <IonHeader>
              <IonToolbar>
                <IonTitle>Acceso Requerido</IonTitle>
                <IonButtons slot="start">
                  <IonButton onClick={() => {
                    console.log('Botón cerrar modal de login clickeado'); // Debug: Cierre de modal
                    setState(prev => ({ ...prev, showLoginModal: false }))
                  }}>
                    Cerrar
                  </IonButton>
                </IonButtons>
              </IonToolbar>
            </IonHeader>
            
            <div className="ion-text-center ion-padding">
              <h2>Debes iniciar sesión para ver los detalles del curso</h2>
              <p>Por favor inicia sesión o regístrate para acceder a todos los contenidos.</p>
              
              <IonButton 
                expand="block" 
                onClick={() => {
                  console.log('Botón Iniciar Sesión clickeado'); // Debug: Click en botón
                  setState(prev => ({ ...prev, showLoginModal: false }));
                  history.push('/login');
                }}
                color="primary"
                className="ion-margin-top"
              >
                Iniciar Sesión
              </IonButton>
              
              <IonButton 
                expand="block" 
                onClick={() => {
                  console.log('Botón Registrarse clickeado'); // Debug: Click en botón
                  setState(prev => ({ ...prev, showLoginModal: false }));
                  history.push('/register');
                }}
                color="secondary"
                fill="outline"
                className="ion-margin-top"
              >
                Registrarse
              </IonButton>
            </div>
          </IonContent>
        </IonModal>

        <IonAlert 
          isOpen={state.showAlert} 
          onDidDismiss={() => {
            console.log('Alerta cerrada'); // Debug: Cierre de alerta
            setState(prev => ({ ...prev, showAlert: false }))
          }} 
          header="Error" 
          message={state.error || ''} 
          buttons={['OK']} 
        />
      </IonContent>
    </IonPage>
  );
};

export default Cursos;