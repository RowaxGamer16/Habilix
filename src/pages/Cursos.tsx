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
import { star, starOutline } from 'ionicons/icons';
import './Cursos.css';
import { useHistory } from 'react-router-dom';

const Cursos: React.FC = () => {
  const history = useHistory();
  const [searchText, setSearchText] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [showModalCrearCurso, setShowModalCrearCurso] = useState(false);
  const [selectedCurso, setSelectedCurso] = useState<any>(null);
  const [comentarios, setComentarios] = useState<{ [id: number]: string[] }>(() => JSON.parse(localStorage.getItem('comentarios') || '{}'));
  const [ranking, setRanking] = useState<{ [id: number]: number }>(() => JSON.parse(localStorage.getItem('ranking') || '{}'));
  const [suscripciones, setSuscripciones] = useState<{ [id: number]: boolean }>(() => JSON.parse(localStorage.getItem('suscripciones') || '{}'));

  const [nuevoComentario, setNuevoComentario] = useState('');
  const [nuevoCurso, setNuevoCurso] = useState({
    titulo: '',
    descripcion: '',
    profesor: '',
    entrega: '',
    imagen: '',
  });
  const [cursos, setCursos] = useState<any[]>([
    {
      id: 1,
      titulo: 'Introducción a React',
      descripcion: 'Aprende los fundamentos de React y cómo crear aplicaciones interactivas.',
      entrega: 'Fecha de entrega: miércoles',
      horario: '13:00 – Revisión No. 3',
      profesor: 'Jose Rijo',
      imagen: 'https://via.placeholder.com/150',
    },
    {
      id: 2,
      titulo: 'Desarrollo con Python',
      descripcion: 'Domina Python desde lo básico hasta avanzado, con ejemplos prácticos.',
      entrega: 'Fecha de entrega: lunes',
      horario: '10:00 – Clase 4',
      profesor: 'Ana Torres',
      imagen: 'https://via.placeholder.com/150',
    },
    {
      id: 3,
      titulo: 'Diseño UX/UI',
      descripcion: 'Entiende los principios del diseño centrado en el usuario.',
      entrega: 'Fecha de entrega: viernes',
      horario: '15:00 – Proyecto final',
      profesor: 'Luis Gómez',
      imagen: 'https://via.placeholder.com/150',
    },
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
      nuevoCurso.entrega &&
      nuevoCurso.imagen
    ) {
      setCursos((prevCursos) => [
        ...prevCursos,
        { ...nuevoCurso, id: prevCursos.length + 1 }, // El id debe ser único
      ]);
      setNuevoCurso({
        titulo: '',
        descripcion: '',
        profesor: '',
        entrega: '',
        imagen: '',
      });
      setShowModalCrearCurso(false);
    } else {
      alert('Por favor, complete todos los campos');
    }
  };

  // Verificar si el usuario está logueado
  const isUserLoggedIn = localStorage.getItem('authToken') !== null;

  return (
    <IonPage>
      <IonHeader>
        <IonToolbar>
          <IonTitle>CURSOS</IonTitle>
        </IonToolbar>
      </IonHeader>
      <IonContent>
        <IonSearchbar
          placeholder="Buscar cursos..."
          value={searchText}
          onIonInput={(e: any) => setSearchText(e.target.value)}
        />

        {/* Mostrar el botón de "Crear Nuevo Curso" solo si el usuario está logueado */}
        {isUserLoggedIn && (
          <IonButton
            onClick={() => setShowModalCrearCurso(true)}
            style={{ position: 'absolute', top: '10px', left: '10px' }}
          >
            Crear Nuevo Curso
          </IonButton>
        )}

        <div className="curso-list">
          {cursosFiltrados.map((curso) => (
            <IonCard key={curso.id} className="curso-card">
              <div className="curso-header">
                <img src={curso.imagen} alt={curso.titulo} className="curso-imagen" />
                <div className="curso-info">
                  <h2>{curso.titulo}</h2>
                  <p>{curso.profesor}</p>
                </div>
              </div>
              <IonCardContent>
                <p>{curso.descripcion}</p>
                <p>{curso.entrega}</p>
                <p>{curso.horario}</p>
                <div className="ranking">
                  {[1, 2, 3, 4, 5].map((estrella) => (
                    <IonIcon
                      key={estrella}
                      icon={estrella <= (ranking[curso.id] || 0) ? star : starOutline}
                      onClick={() => cambiarRanking(curso.id, estrella)}
                      style={{ color: 'gold', cursor: 'pointer', fontSize: '20px' }}
                    />
                  ))}
                </div>
                <IonButton
                  color="primary"
                  onClick={() => {
                    setSelectedCurso(curso);
                    setShowModal(true);
                  }}
                >
                  Ver Comentarios
                </IonButton>
                {suscripciones[curso.id] ? (
                  <IonButton
                    color="success"
                    onClick={() => alert(`Entraste al curso: ${curso.titulo}`)}
                  >
                    Entrar al curso
                  </IonButton>
                ) : (
                  <IonButton color="secondary" onClick={() => toggleSuscripcion(curso.id)}>
                    Suscribirse
                  </IonButton>
                )}
              </IonCardContent>
            </IonCard>
          ))}
          {cursosFiltrados.length === 0 && <p className="no-results">No se encontraron cursos.</p>}
        </div>

        <IonModal isOpen={showModal} onDidDismiss={() => setShowModal(false)}>
          <IonHeader>
            <IonToolbar>
              <IonTitle>Comentarios: {selectedCurso?.titulo}</IonTitle>
              <IonButton slot="end" onClick={() => setShowModal(false)}>
                Cerrar
              </IonButton>
            </IonToolbar>
          </IonHeader>
          <IonContent>
            <div className="comentarios-list">
              {comentarios[selectedCurso?.id]?.length ? (
                comentarios[selectedCurso.id].map((comentario, index) => (
                  <p key={index}>&bull; {comentario}</p>
                ))
              ) : (
                <p>No hay comentarios aún.</p>
              )}
            </div>
            <IonTextarea
              placeholder="Escribe tu comentario..."
              value={nuevoComentario}
              onIonInput={(e: any) => setNuevoComentario(e.target.value)}
            />
          </IonContent>
          <IonFooter>
            <IonToolbar>
              <IonButton
                expand="full"
                onClick={() => {
                  guardarComentario();
                  setShowModal(false);
                }}
              >
                Guardar Comentarios
              </IonButton>
            </IonToolbar>
          </IonFooter>
        </IonModal>

        {/* Modal para Crear Curso */}
        <IonModal isOpen={showModalCrearCurso} onDidDismiss={() => setShowModalCrearCurso(false)}>
          <IonHeader>
            <IonToolbar>
              <IonTitle>Crear Curso</IonTitle>
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
                    placeholder="Título del curso"
                  />
                </IonCol>
              </IonRow>
              <IonRow>
                <IonCol>
                  <IonTextarea
                    value={nuevoCurso.descripcion}
                    onIonInput={(e: any) => setNuevoCurso({ ...nuevoCurso, descripcion: e.target.value })}
                    placeholder="Descripción del curso"
                  />
                </IonCol>
              </IonRow>
              <IonRow>
                <IonCol>
                  <IonTextarea
                    value={nuevoCurso.profesor}
                    onIonInput={(e: any) => setNuevoCurso({ ...nuevoCurso, profesor: e.target.value })}
                    placeholder="Profesor"
                  />
                </IonCol>
              </IonRow>
              <IonRow>
                <IonCol>
                  <IonTextarea
                    value={nuevoCurso.entrega}
                    onIonInput={(e: any) => setNuevoCurso({ ...nuevoCurso, entrega: e.target.value })}
                    placeholder="Fecha de entrega"
                  />
                </IonCol>
              </IonRow>
              <IonRow>
                <IonCol>
                  <IonTextarea
                    value={nuevoCurso.imagen}
                    onIonInput={(e: any) => setNuevoCurso({ ...nuevoCurso, imagen: e.target.value })}
                    placeholder="URL de la imagen"
                  />
                </IonCol>
              </IonRow>
            </IonGrid>
            <IonButton expand="full" onClick={agregarCurso}>Agregar Curso</IonButton>
          </IonContent>
        </IonModal>
      </IonContent>
    </IonPage>
  );
};

export default Cursos;
