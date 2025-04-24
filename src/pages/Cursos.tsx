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
  IonGrid,
  IonInput,
  IonRow,
  IonCol,
  IonIcon,
  IonAlert,
  IonLabel,
  IonItem
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
  entrega: string;
  horario: string;
}

const Cursos: React.FC = () => {
  const history = useHistory();
  const API_URL = 'http://localhost:5000/api';

  const [searchText, setSearchText] = useState('');
  const [showModalCrearCurso, setShowModalCrearCurso] = useState(false);
  const [cursos, setCursos] = useState<Curso[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showAlert, setShowAlert] = useState(false);
  const [selectedImage, setSelectedImage] = useState<File | null>(null);

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

  useEffect(() => {
    const fetchCursos = async () => {
      try {
        const response = await fetch(`${API_URL}/cursos`);
        if (!response.ok) throw new Error('Error al obtener cursos');
        const data = await response.json();
        setCursos(data);
      } catch (err) {
        setError('No se pudieron cargar los cursos');
        console.error(err);
      } finally {
        setLoading(false);
      }
    };

    fetchCursos();
  }, []);

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) setSelectedImage(file);
  };

  const agregarCurso = async () => {
    if (!nuevoCurso.nombre || !nuevoCurso.descripcion || !nuevoCurso.profesor) {
      setError('Nombre, descripción y profesor son campos requeridos');
      setShowAlert(true);
      return;
    }

    try {
      const token = localStorage.getItem('token');
      if (!token) {
        setError('Debes iniciar sesión para crear un curso');
        setShowAlert(true);
        return;
      }

      const formData = new FormData();
      formData.append('nombre', nuevoCurso.nombre);
      formData.append('descripcion', nuevoCurso.descripcion);
      formData.append('profesor', nuevoCurso.profesor);
      formData.append('categoria', nuevoCurso.categoria);
      formData.append('precio', String(nuevoCurso.precio));
      formData.append('entrega', nuevoCurso.entrega);
      formData.append('horario', nuevoCurso.horario);
      if (selectedImage) formData.append('portada', selectedImage);

      const response = await fetch(`${API_URL}/cursos`, {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${token}` },
        body: formData
      });

      if (!response.ok) throw new Error('Error al crear curso');

      const data = await response.json();
      setCursos(prev => [...prev, { id: data.id, ...nuevoCurso, ranking: 0 }]);
      setShowModalCrearCurso(false);
      setNuevoCurso({ nombre: '', descripcion: '', profesor: '', portada: '', categoria: '', precio: 0, entrega: 'Virtual', horario: 'Flexible' });
      setSelectedImage(null);
    } catch (err) {
      setError('Error al crear el curso');
      setShowAlert(true);
      console.error(err);
    }
  };

  const cursosFiltrados = cursos.filter(curso =>
    (curso.nombre || '').toLowerCase().includes(searchText.toLowerCase()) ||
    (curso.descripcion || '').toLowerCase().includes(searchText.toLowerCase()) ||
    (curso.profesor || '').toLowerCase().includes(searchText.toLowerCase())
  );

  const handleVerCurso = (cursoId: number) => {
    history.push(`/curso/${cursoId}`);
  };

  const isUserLoggedIn = !!localStorage.getItem('token');

  if (loading) {
    return (
      <IonPage className="page-cursos">
        <IonContent className="ion-padding">
          <p>Cargando cursos...</p>
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
            <IonButton slot="end" onClick={() => setShowModalCrearCurso(true)} style={{ marginRight: '16px' }}>
              Nuevo Curso
            </IonButton>
          )}
        </IonToolbar>
      </IonHeader>

      <IonContent>
        <IonSearchbar
          placeholder="Buscar cursos..."
          value={searchText}
          onIonChange={e => setSearchText(e.detail.value!)}
          animated
        />

        <div className="courses-grid">
          {cursosFiltrados.length === 0 ? (
            <div className="no-results">No se encontraron cursos</div>
          ) : (
            cursosFiltrados.map(curso => (
              <IonCard key={curso.id} className="course-card">
                <div className="image-container">
                  <img
                    src={curso.portada || ''}
                    alt={curso.nombre}
                    className="course-image"
                    onError={(e) => (e.currentTarget.src = '')}
                  />
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
                      <span>{curso.ranking || 0}</span>
                    </div>
                    <div className="price">
                      <span>${curso.precio || 'Gratis'}</span>
                    </div>
                  </div>

                  <IonButton expand="block" onClick={() => handleVerCurso(curso.id)} color="primary">
                    Ver Detalles
                  </IonButton>
                </IonCardContent>
              </IonCard>
            ))
          )}
        </div>

        {/* Modal para crear curso */}
        <IonModal isOpen={showModalCrearCurso} onDidDismiss={() => setShowModalCrearCurso(false)}>
          <IonContent className="ion-padding">
            <h2>Crear Nuevo Curso</h2>

            <IonGrid>
              <IonRow>
                <IonCol>
                  <IonItem>
                    <IonLabel position="floating">Nombre del curso</IonLabel>
                    <IonInput value={nuevoCurso.nombre} onIonChange={e => setNuevoCurso({ ...nuevoCurso, nombre: e.detail.value || '' })} />
                  </IonItem>
                </IonCol>
              </IonRow>

              <IonRow>
                <IonCol>
                  <IonItem>
                    <IonLabel position="floating">Descripción</IonLabel>
                    <IonTextarea value={nuevoCurso.descripcion} onIonChange={e => setNuevoCurso({ ...nuevoCurso, descripcion: e.detail.value || '' })} rows={4} />
                  </IonItem>
                </IonCol>
              </IonRow>

              <IonRow>
                <IonCol>
                  <IonItem>
                    <IonLabel position="floating">Profesor</IonLabel>
                    <IonInput value={nuevoCurso.profesor} onIonChange={e => setNuevoCurso({ ...nuevoCurso, profesor: e.detail.value || '' })} />
                  </IonItem>
                </IonCol>
              </IonRow>

              <IonRow>
                <IonCol>
                  <IonLabel>Imagen del Curso</IonLabel>
                  <input type="file" accept="image/*" onChange={handleImageChange} style={{ display: 'none' }} id="uploadFile" />
                  <IonButton expand="block" onClick={() => document.getElementById('uploadFile')?.click()} color="primary">
                    Seleccionar Imagen
                  </IonButton>
                  {selectedImage && <p>{selectedImage.name}</p>}
                </IonCol>
              </IonRow>

              <IonRow>
                <IonCol size="6">
                  <IonItem>
                    <IonLabel position="floating">Categoría</IonLabel>
                    <IonInput value={nuevoCurso.categoria} onIonChange={e => setNuevoCurso({ ...nuevoCurso, categoria: e.detail.value || '' })} />
                  </IonItem>
                </IonCol>
                <IonCol size="6">
                  <IonItem>
                    <IonLabel position="floating">Precio</IonLabel>
                    <IonInput type="number" value={nuevoCurso.precio} disabled />
                  </IonItem>
                </IonCol>
              </IonRow>

              <IonRow>
                <IonCol>
                  <IonButton expand="block" onClick={agregarCurso} color="primary">Publicar Curso</IonButton>
                  <IonButton expand="block" onClick={() => setShowModalCrearCurso(false)} color="medium" fill="outline">Cancelar</IonButton>
                </IonCol>
              </IonRow>
            </IonGrid>
          </IonContent>
        </IonModal>

        <IonAlert isOpen={showAlert} onDidDismiss={() => setShowAlert(false)} header="Error" message={error || ''} buttons={['OK']} />
      </IonContent>
    </IonPage>
  );
};

export default Cursos;
