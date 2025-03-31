import React, { useState, useEffect } from 'react';
import {
  IonPage,
  IonHeader,
  IonToolbar,
  IonTitle,
  IonContent,
  IonCard,
  IonCardContent,
  IonButton,
  IonSearchbar,
  IonModal,
  IonTextarea,
  IonFooter,
  IonGrid,
  IonRow,
  IonCol,
  IonIcon,
} from '@ionic/react';
import { star, starOutline, people } from 'ionicons/icons';
import { useHistory } from 'react-router-dom';
import './Cursos.css';

const Cursos: React.FC = () => {
  const history = useHistory();
  const [searchText, setSearchText] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [showModalCrearCurso, setShowModalCrearCurso] = useState(false);
  const [selectedCurso, setSelectedCurso] = useState<any>(null);
  const [comentarios, setComentarios] = useState<{ [id: number]: string[] }>(() =>
    JSON.parse(localStorage.getItem('comentarios') || '{}')
  );
  const [ranking, setRanking] = useState<{ [id: number]: number }>(() =>
    JSON.parse(localStorage.getItem('ranking') || '{}')
  );
  const [suscripciones, setSuscripciones] = useState<{ [id: number]: boolean }>(() =>
    JSON.parse(localStorage.getItem('suscripciones') || '{}')
  );
  const [nuevoComentario, setNuevoComentario] = useState('');

  const [nuevoCurso, setNuevoCurso] = useState({
    titulo: '',
    descripcion: '',
    profesor: '',
    entrega: '',
    imagen: '',
    categoria: '',
    precio: 0,
    rating: 0,
    students: 0
  });

  const [cursos, setCursos] = useState<any[]>([
    {
      id: 1,
      titulo: 'Introducción a React',
      descripcion: 'Aprende los fundamentos de React y cómo crear aplicaciones interactivas.',
      profesor: 'Jose Rijo',
      imagen: 'react.png',
      categoria: 'Tecnología',
      precio: 29.99,
      rating: 4.5,
      students: 125,
      entrega: 'Miércoles',
      horario: '13:00 – Revisión No. 3'
    },
    {
      id: 2,
      titulo: 'Fotografía Digital',
      descripcion: 'Domina los conceptos básicos de fotografía y edición digital.',
      profesor: 'Ana Torres',
      imagen: 'fotografia.png',
      categoria: 'Fotografía',
      precio: 24.99,
      rating: 4.8,
      students: 89,
      entrega: 'Lunes',
      horario: '10:00 – Clase 4'
    },
    {
      id: 3,
      titulo: 'Cocina Italiana',
      descripcion: 'Aprende las recetas tradicionales de la cocina italiana.',
      profesor: 'Luis Gómez',
      imagen: 'cocina.png',
      categoria: 'Cocina',
      precio: 19.99,
      rating: 4.2,
      students: 64,
      entrega: 'Viernes',
      horario: '15:00 – Proyecto final'
    },
    {
      id: 3,
      titulo: 'Cocina Italiana',
      descripcion: 'Aprende las recetas tradicionales de la cocina italiana.',
      profesor: 'Luis Gómez',
      imagen: 'cocina.png',
      categoria: 'Cocina',
      precio: 19.99,
      rating: 4.2,
      students: 64,
      entrega: 'Viernes',
      horario: '15:00 – Proyecto final'
    }  
  ]);

  const cursosFiltrados = cursos.filter(
    (curso) =>
      curso.titulo.toLowerCase().includes(searchText.toLowerCase()) ||
      curso.descripcion.toLowerCase().includes(searchText.toLowerCase()) ||
      curso.profesor.toLowerCase().includes(searchText.toLowerCase())
  );

  const handleEntrarCurso = (curso: any) => {
    history.push(`/curso/${curso.id}`, { curso });
  };

  useEffect(() => {
    localStorage.setItem('comentarios', JSON.stringify(comentarios));
  }, [comentarios]);

  useEffect(() => {
    localStorage.setItem('ranking', JSON.stringify(ranking));
  }, [ranking]);

  useEffect(() => {
    localStorage.setItem('suscripciones', JSON.stringify(suscripciones));
  }, [suscripciones]);

  const guardarComentario = () => {
    if (nuevoComentario.trim() !== '') {
      setComentarios((prevComentarios) => ({
        ...prevComentarios,
        [selectedCurso.id]: [
          ...(prevComentarios[selectedCurso.id] || []),
          nuevoComentario,
        ],
      }));
      setNuevoComentario('');
    }
  };

  const cambiarRanking = (id: number, estrellas: number) => {
    setRanking((prevRanking) => ({
      ...prevRanking,
      [id]: estrellas,
    }));
  };

  const toggleSuscripcion = (id: number) => {
    const isUserLoggedIn = localStorage.getItem('authToken') !== null;
    if (!isUserLoggedIn) {
      alert('Necesitas loguearte o registrarte primero para suscribirte a un curso.');
      return;
    }
    setSuscripciones((prevSuscripciones) => ({
      ...prevSuscripciones,
      [id]: !prevSuscripciones[id],
    }));
  };

  const agregarCurso = () => {
    if (
      nuevoCurso.titulo &&
      nuevoCurso.descripcion &&
      nuevoCurso.profesor &&
      nuevoCurso.categoria
    ) {
      setCursos((prevCursos) => [
        ...prevCursos,
        {
          ...nuevoCurso,
          id: prevCursos.length + 1,
          students: 0,
          rating: 0,
          entrega: nuevoCurso.entrega || 'Por definir',
          horario: 'Por definir',
          imagen: nuevoCurso.imagen || 'https://via.placeholder.com/300x200'
        },
      ]);
      setNuevoCurso({
        titulo: '',
        descripcion: '',
        profesor: '',
        entrega: '',
        imagen: '',
        categoria: '',
        precio: 0,
        rating: 0,
        students: 0
      });
      setShowModalCrearCurso(false);
    } else {
      alert('Por favor complete todos los campos requeridos');
    }
  };

  const isUserLoggedIn = localStorage.getItem('authToken') !== null;

  return (
    <IonPage>
      <IonHeader>
        <IonToolbar>
          <IonTitle>CURSOS</IonTitle>
          {isUserLoggedIn && (
            <IonButton
              slot="end"
              onClick={() => setShowModalCrearCurso(true)}
              style={{ marginRight: '10px' }}
            >
              Nuevo Curso
            </IonButton>
          )}
        </IonToolbar>
      </IonHeader>
      <IonContent className="page-cursos">
        <IonSearchbar
          placeholder="Buscar cursos..."
          value={searchText}
          onIonInput={(e: any) => setSearchText(e.target.value)}
        />

        <div className="courses-grid">
          {cursosFiltrados.map((curso) => (
            <IonCard key={curso.id} className="course-card">
              <div className="image-container">
                <img
                  src={curso.imagen}
                  alt={curso.titulo}
                  className="course-image"
                />
                {curso.categoria && (
                  <span className={`course-badge ${curso.categoria.toLowerCase().replace(/[áéíóú]/g, 'a')}`}>
                    {curso.categoria}
                  </span>
                )}
              </div>

              <IonCardContent className="course-content">
                <h2 className="course-title">{curso.titulo}</h2>
                <p className="course-description">{curso.descripcion}</p>

                <div className="course-meta">
                  <div className="creator-info">
                    <span className="creator-avatar">
                      {curso.profesor?.charAt(0).toUpperCase()}
                    </span>
                    <span className="creator-name">{curso.profesor}</span>
                  </div>
                  <div className="rating">
                    <IonIcon icon={star} className="star-icon" />
                    <span>{curso.rating || 'Nuevo'}</span>
                  </div>
                </div>

                <div className="course-meta secondary-meta">
                  <div className="students">
                    <IonIcon icon={people} className="people-icon" />
                    <span>{curso.students}</span>
                  </div>
                  <span className="price">${curso.precio.toFixed(2)}</span>
                </div>

                <div className="course-actions">
                  <div className="ranking">
                    {[1, 2, 3, 4, 5].map((estrella) => (
                      <IonIcon
                        key={estrella}
                        icon={estrella <= (ranking[curso.id] || 0) ? star : starOutline}
                        onClick={() => cambiarRanking(curso.id, estrella)}
                        className="star-rating"
                      />
                    ))}
                  </div>

                  <IonButton
                    color="medium"
                    size="small"
                    expand="block"
                    onClick={() => {
                      setSelectedCurso(curso);
                      setShowModal(true);
                    }}
                    className="comments-button"
                  >
                    Ver Comentarios
                  </IonButton>

                  {suscripciones[curso.id] && isUserLoggedIn ? (
                    <IonButton
                      color="success"
                      expand="block"
                      size="small"
                      onClick={() => handleEntrarCurso(curso)}
                      className="enter-button"
                    >
                      Entrar al curso
                    </IonButton>
                  ) : (
                    <IonButton
                      color="primary"
                      expand="block"
                      size="small"
                      onClick={() => toggleSuscripcion(curso.id)}
                      className="subscribe-button"
                    >
                      Suscribirse
                    </IonButton>
                  )}
                </div>
              </IonCardContent>
            </IonCard>
          ))}
          {cursosFiltrados.length === 0 && <p className="no-results">No se encontraron cursos.</p>}
        </div>

        {/* Modal de comentarios */}
        <IonModal isOpen={showModal} onDidDismiss={() => setShowModal(false)}>
          <IonHeader>
            <IonToolbar>
              <IonTitle>Comentarios: {selectedCurso?.titulo}</IonTitle>
              <IonButton slot="end" onClick={() => setShowModal(false)}>
                Cerrar
              </IonButton>
            </IonToolbar>
          </IonHeader>
          <IonContent className="modal-container">
            {comentarios[selectedCurso?.id]?.length ? (
              comentarios[selectedCurso.id].map((comentario, index) => (
                <div key={index} className="comment-item">
                  <p>{comentario}</p>
                </div>
              ))
            ) : (
              <p className="no-comments">No hay comentarios aún.</p>
            )}
            <IonTextarea
              placeholder="Escribe tu comentario..."
              value={nuevoComentario}
              onIonInput={(e: any) => setNuevoComentario(e.target.value)}
              className="comment-input"
            />
          </IonContent>
          <IonFooter>
            <IonToolbar>
              <IonButton
                expand="block"
                onClick={guardarComentario}
                className="save-comment-button"
              >
                Guardar Comentario
              </IonButton>
            </IonToolbar>
          </IonFooter>
        </IonModal>

        {/* Modal para crear nuevo curso */}
        <IonModal isOpen={showModalCrearCurso} onDidDismiss={() => setShowModalCrearCurso(false)}>
          <IonHeader>
            <IonToolbar>
              <IonTitle>Crear Nuevo Curso</IonTitle>
              <IonButton slot="end" onClick={() => setShowModalCrearCurso(false)}>
                Cerrar
              </IonButton>
            </IonToolbar>
          </IonHeader>
          <IonContent>
            <IonGrid>
              <IonRow>
                <IonCol>
                  <IonTextarea
                    value={nuevoCurso.titulo}
                    onIonInput={(e: any) => setNuevoCurso({ ...nuevoCurso, titulo: e.target.value })}
                    placeholder="Título del curso*"
                    className="form-input"
                  />
                </IonCol>
              </IonRow>
              <IonRow>
                <IonCol>
                  <IonTextarea
                    value={nuevoCurso.descripcion}
                    onIonInput={(e: any) => setNuevoCurso({ ...nuevoCurso, descripcion: e.target.value })}
                    placeholder="Descripción*"
                    className="form-input"
                  />
                </IonCol>
              </IonRow>
              <IonRow>
                <IonCol>
                  <IonTextarea
                    value={nuevoCurso.profesor}
                    onIonInput={(e: any) => setNuevoCurso({ ...nuevoCurso, profesor: e.target.value })}
                    placeholder="Instructor*"
                    className="form-input"
                  />
                </IonCol>
              </IonRow>
              <IonRow>
                <IonCol>
                  <IonTextarea
                    value={nuevoCurso.categoria}
                    onIonInput={(e: any) => setNuevoCurso({ ...nuevoCurso, categoria: e.target.value })}
                    placeholder="Categoría* (Tecnología, Fotografía, Cocina, etc.)"
                    className="form-input"
                  />
                </IonCol>
              </IonRow>
              <IonRow>
                <IonCol>
                  <IonTextarea
                    value={nuevoCurso.precio.toString()}
                    onIonInput={(e: any) => setNuevoCurso({ ...nuevoCurso, precio: parseFloat(e.target.value) || 0 })}
                    placeholder="Precio"
                    className="form-input"
                  />
                </IonCol>
              </IonRow>
              <IonRow>
                <IonCol>
                  <IonTextarea
                    value={nuevoCurso.imagen}
                    onIonInput={(e: any) => setNuevoCurso({ ...nuevoCurso, imagen: e.target.value })}
                    placeholder="URL de la imagen (opcional)"
                    className="form-input"
                  />
                </IonCol>
              </IonRow>
            </IonGrid>
            <IonButton
              expand="block"
              onClick={agregarCurso}
              className="create-course-button"
            >
              Crear Curso
            </IonButton>
          </IonContent>
        </IonModal>
      </IonContent>
    </IonPage>
  );
};

export default Cursos;