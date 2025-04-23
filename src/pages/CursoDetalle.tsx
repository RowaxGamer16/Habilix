import React, { useEffect, useState } from 'react';
import {
  IonPage, IonHeader, IonToolbar, IonTitle, IonContent,
  IonButton, IonIcon, IonCard, IonCardContent, IonLabel, IonItem,
  IonItemDivider, IonLoading, IonToast
} from '@ionic/react';
import { useParams, useHistory } from 'react-router-dom';
import { star, cloudUpload, trash } from 'ionicons/icons';

const API_URL = 'http://localhost:5000/api';

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
  imagenes_materiales: string[];
  id_usuario: number;
}

const CursoDetalle: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const [curso, setCurso] = useState<Curso | null>(null);
  const [materiales, setMateriales] = useState<string[]>([]);
  const [archivos, setArchivos] = useState<FileList | null>(null);
  const [loading, setLoading] = useState(true);
  const [subiendo, setSubiendo] = useState(false);
  const [toastMsg, setToastMsg] = useState('');
  const [mostrarToast, setMostrarToast] = useState(false);

  const token = localStorage.getItem('token');
  const usuario = JSON.parse(localStorage.getItem('usuario') || '{}');
  
  const esCreador = curso && usuario?.id === curso?.id_usuario;

  const history = useHistory();

  useEffect(() => {
    const fetchCurso = async () => {
      try {
        const response = await fetch(`${API_URL}/cursos/${id}`);
        if (!response.ok) throw new Error('Error al obtener el curso');
        const data = await response.json();
        setCurso(data);
        setMateriales(JSON.parse(data.imagenes_materiales || '[]'));
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };

    fetchCurso();
  }, [id]);

  const subirMateriales = async () => {
    if (!archivos || archivos.length === 0) return;

    setSubiendo(true);
    const formData = new FormData();
    Array.from(archivos).forEach(file => formData.append('materiales', file));

    try {
      const response = await fetch(`${API_URL}/cursos/${id}/materiales`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${token || ''}` },
        body: formData
      });

      const result = await response.json();
      if (result.success) {
        setMateriales(result.nuevosMateriales);
        setToastMsg('Materiales subidos correctamente.');
      } else {
        setToastMsg('Error al subir materiales.');
      }
    } catch (err) {
      console.error(err);
      setToastMsg('Ocurrió un error al subir materiales.');
    } finally {
      setSubiendo(false);
      setArchivos(null);
      setMostrarToast(true);
    }
  };

  const eliminarMaterial = async (nombreArchivo: string) => {
    try {
      const response = await fetch(`${API_URL}/cursos/${id}/materiales`, {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token || ''}`
        },
        body: JSON.stringify({ archivo: nombreArchivo })
      });

      const result = await response.json();
      if (result.success) {
        setMateriales(prev => prev.filter(m => m !== nombreArchivo));
        setToastMsg('Material eliminado correctamente.');
      } else {
        setToastMsg('Error al eliminar material.');
      }
    } catch (err) {
      console.error(err);
      setToastMsg('Ocurrió un error al eliminar material.');
    } finally {
      setMostrarToast(true);
    }
  };

  const eliminarCurso = async () => {
    if (!window.confirm('¿Estás seguro de que deseas eliminar este curso?')) return;

    try {
      const response = await fetch(`${API_URL}/cursos/${id}`, {
        method: 'DELETE',
        headers: {
          Authorization: `Bearer ${token || ''}`
        }
      });

      const result = await response.json();
      if (result.success) {
        setToastMsg('Curso eliminado correctamente.');
        setMostrarToast(true);
        setTimeout(() => {
          history.push('/cursos');
        }, 1500);
      } else {
        setToastMsg('Error al eliminar curso.');
        setMostrarToast(true);
      }
    } catch (err) {
      console.error(err);
      setToastMsg('Ocurrió un error al eliminar curso.');
      setMostrarToast(true);
    }
  };

  if (loading) return <IonPage><IonContent><p>Cargando curso...</p></IonContent></IonPage>;
  if (!curso) return <IonPage><IonContent><p>Curso no encontrado</p></IonContent></IonPage>;

  return (
    <IonPage className="page-cursos">
      <IonHeader>
        <IonToolbar>
          <IonTitle>{curso.nombre}</IonTitle>
        </IonToolbar>
      </IonHeader>

      <IonContent className="ion-padding">
        <img
          src={curso.portada || 'https://via.placeholder.com/600x300'}
          alt="Portada"
          className="course-image"
        />

        <IonCard className="course-card">
          <IonCardContent className="course-content">
            <h2 className="course-title">{curso.nombre}</h2>
            <p><strong>Profesor:</strong> {curso.profesor}</p>
            <p className="course-description">{curso.descripcion}</p>
            <IonItem><IonLabel><strong>Categoría:</strong> {curso.categoria}</IonLabel></IonItem>
            <IonItem><IonLabel><strong>Entrega:</strong> {curso.entrega}</IonLabel></IonItem>
            <IonItem><IonLabel><strong>Horario:</strong> {curso.horario}</IonLabel></IonItem>
            <IonItem><IonIcon icon={star} /><IonLabel>{curso.ranking || 0}</IonLabel></IonItem>
            <IonItem><IonLabel><strong>Precio:</strong> ${curso.precio || 0}</IonLabel></IonItem>

            <IonItemDivider>Materiales</IonItemDivider>
            {materiales.length > 0 ? (
              <ul>
                {materiales.map((mat, i) => (
                  <li key={i}>
                    <a href={`http://localhost:5000${mat}`} target="_blank" rel="noreferrer">
                      {mat.split('/').pop()}
                    </a>
                    {esCreador && (
                      <IonButton
                        size="small"
                        color="danger"
                        onClick={() => eliminarMaterial(mat)}
                      >
                        <IonIcon icon={trash} />
                      </IonButton>
                    )}
                  </li>
                ))}
              </ul>
            ) : (
              <p>No hay materiales disponibles.</p>
            )}

            {esCreador && (
              <>
                <IonItemDivider>Cargar nuevos materiales</IonItemDivider>
                <IonItem>
                  <input
                    type="file"
                    multiple
                    onChange={e => setArchivos(e.target.files)}
                  />
                </IonItem>
                <IonButton expand="block" onClick={subirMateriales}>
                  <IonIcon slot="start" icon={cloudUpload} />
                  Subir materiales
                </IonButton>

                <IonItemDivider>Acciones del curso</IonItemDivider>
                <IonButton expand="block" color="primary" onClick={() => window.location.href = `/editar-curso/${curso.id}`}>
                  Editar curso
                </IonButton>
                <IonButton expand="block" color="danger" onClick={eliminarCurso}>
                  Eliminar curso
                </IonButton>
              </>
            )}
          </IonCardContent>
        </IonCard>

        <IonLoading isOpen={subiendo} message="Subiendo materiales..." />
        <IonToast
          isOpen={mostrarToast}
          onDidDismiss={() => setMostrarToast(false)}
          message={toastMsg}
          duration={2000}
        />

        <IonButton expand="block" color="secondary" onClick={() => history.goBack()}>
          Regresar
        </IonButton>
      </IonContent>
    </IonPage>
  );
};

export default CursoDetalle;
