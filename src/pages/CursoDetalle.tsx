import React, { useEffect, useState, useRef } from 'react';
import {
  IonPage, IonHeader, IonToolbar, IonTitle, IonContent,
  IonButton, IonIcon, IonCard, IonCardContent, IonLabel, IonItem,
  IonItemDivider, IonLoading, IonToast, IonList, IonThumbnail
} from '@ionic/react';
import { useParams, useHistory } from 'react-router-dom';
import { star, cloudUpload, trash, create, arrowBack, document } from 'ionicons/icons';

const API_URL = 'http://localhost:5000/api';
const LOCAL_STORAGE_KEY = 'curso_materiales_';

interface Curso {
  id: number;
  nombre: string;
  descripcion: string;
  portada: string;
  categoria: string;
  precio: number;
  ranking: number;
  entrega: string;
  horario: string;
  imagenes_materiales: string;
  id_usuario: number;
}

interface Usuario {
  ID: number;
  NOMBRE_USUARIO: string;
  EMAIL: string;
  ROLE: string;
  TELEFONO?: string;
  FECHA_CREACION?: string;
}

interface MaterialLocal {
  nombre: string;
  url: string;
  fechaSubida: string;
  tamaño: number;
  tipo: string;
}

const CursoDetalle: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const [curso, setCurso] = useState<Curso | null>(null);
  const [materiales, setMateriales] = useState<MaterialLocal[]>([]);
  const [materialesServidor, setMaterialesServidor] = useState<string[]>([]);
  const [archivos, setArchivos] = useState<FileList | null>(null);
  const [loading, setLoading] = useState(true);
  const [subiendo, setSubiendo] = useState(false);
  const [toastMsg, setToastMsg] = useState('');
  const [mostrarToast, setMostrarToast] = useState(false);
  const [esCreador, setEsCreador] = useState(false);
  const [isDeleted, setIsDeleted] = useState(false); // Estado para rastrear eliminación
  const fileInputRef = useRef<HTMLInputElement>(null);

  const token = localStorage.getItem('token');
  const rawUsuario = localStorage.getItem('usuario');
  const usuario: Usuario | null = rawUsuario ? JSON.parse(rawUsuario) : null;
  const history = useHistory();

  const cargarMaterialesLocales = (cursoId: string): MaterialLocal[] => {
    const datos = localStorage.getItem(`${LOCAL_STORAGE_KEY}${cursoId}`);
    return datos ? JSON.parse(datos) : [];
  };

  const guardarMaterialesLocales = (cursoId: string, materiales: MaterialLocal[]) => {
    localStorage.setItem(`${LOCAL_STORAGE_KEY}${cursoId}`, JSON.stringify(materiales));
  };

  useEffect(() => {
    const fetchCurso = async () => {
      // Evitar cargar datos si el curso ya fue eliminado
      if (isDeleted) return;

      try {
        const response = await fetch(`${API_URL}/cursos/${id}`, {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        });
        if (!response.ok) throw new Error('Error al obtener el curso');

        const data = await response.json();
        setCurso(data);

        // Cargar materiales del servidor
        const materialesServidor = typeof data.imagenes_materiales === 'string'
          ? JSON.parse(data.imagenes_materiales || '[]')
          : data.imagenes_materiales || [];
        setMaterialesServidor(materialesServidor);

        // Cargar materiales locales
        const materialesLocales = cargarMaterialesLocales(id);
        setMateriales(materialesLocales);

        // Verificar si el usuario actual es el creador
        if (usuario) {
          const esCreadorVerificado = Number(usuario.ID) === Number(data.id_usuario);
          setEsCreador(esCreadorVerificado);
        }
      } catch (err) {
        console.error('Error al cargar el curso:', err);
        setToastMsg('Error al cargar el curso');
        setMostrarToast(true);
      } finally {
        setLoading(false);
      }
    };

    fetchCurso();
  }, [id, usuario, token, isDeleted]);

  const subirMateriales = async () => {
    if (!archivos || archivos.length === 0) {
      setToastMsg('No hay archivos seleccionados');
      setMostrarToast(true);
      return;
    }

    setSubiendo(true);
    const nuevosMaterialesLocales: MaterialLocal[] = [];
    const formData = new FormData();

    Array.from(archivos).forEach(file => {
      formData.append('materiales', file);

      const materialLocal: MaterialLocal = {
        nombre: file.name,
        url: URL.createObjectURL(file),
        fechaSubida: new Date().toISOString(),
        tamaño: file.size,
        tipo: file.type
      };
      nuevosMaterialesLocales.push(materialLocal);
    });

    try {
      const response = await fetch(`${API_URL}/cursos/${id}/materiales`, {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${token}` },
        body: formData
      });

      const result = await response.json();

      if (result.success) {
        setMaterialesServidor(result.nuevosMateriales || []);

        const materialesActuales = cargarMaterialesLocales(id);
        const materialesActualizados = [...materialesActuales, ...nuevosMaterialesLocales];
        guardarMaterialesLocales(id, materialesActualizados);
        setMateriales(materialesActualizados);

        setToastMsg('Materiales subidos correctamente');
      } else {
        setToastMsg(result.error || 'Error al subir materiales al servidor');
      }
    } catch (err) {
      console.error('Error al subir materiales:', err);
      setToastMsg('Error de conexión al subir materiales');
    } finally {
      setSubiendo(false);
      setArchivos(null);
      setMostrarToast(true);
    }
  };

  const eliminarMaterial = async (material: MaterialLocal | string) => {
    if (!window.confirm('¿Eliminar este material?')) return;

    try {
      const esMaterialLocal = typeof material !== 'string';

      if (esMaterialLocal) {
        const materialLocal = material as MaterialLocal;
        const nuevosMateriales = materiales.filter(m => m.url !== materialLocal.url);
        guardarMaterialesLocales(id, nuevosMateriales);
        setMateriales(nuevosMateriales);
        setToastMsg('Material local eliminado');
      } else {
        const nombreArchivo = material as string;
        const response = await fetch(`${API_URL}/cursos/${id}/materiales`, {
          method: 'DELETE',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
          },
          body: JSON.stringify({ archivo: nombreArchivo })
        });

        const result = await response.json();

        if (result.success) {
          setMaterialesServidor(prev => prev.filter(m => m !== nombreArchivo));
          setToastMsg('Material del servidor eliminado');
        } else {
          throw new Error(result.error || 'Error al eliminar');
        }
      }
    } catch (err) {
      console.error('Error al eliminar material:', err);
      setToastMsg('Error al eliminar material');
    } finally {
      setMostrarToast(true);
    }
  };

  const eliminarCurso = async () => {
    if (!window.confirm('¿Estás seguro de eliminar este curso? Esta acción no se puede deshacer.')) return;

    try {
      const response = await fetch(`${API_URL}/cursos/${id}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      const result = await response.json();

      if (result.success) {
        localStorage.removeItem(`${LOCAL_STORAGE_KEY}${id}`);
        setIsDeleted(true); // Marcar el curso como eliminado
        setCurso(null); // Limpiar el estado del curso
        setToastMsg('Curso eliminado correctamente');
        setMostrarToast(true);
        // Redirigir a la lista de cursos y recargar la página
        history.push('/cursos');
        window.location.reload(); // Recargar la página para refrescar la lista de cursos
      } else {
        setToastMsg(result.error || 'Error al eliminar curso');
        setMostrarToast(true);
      }
    } catch (err) {
      console.error('Error al eliminar curso:', err);
      setToastMsg('Error de conexión al eliminar curso');
      setMostrarToast(true);
    }
  };

  const getFileIcon = (tipo: string) => {
    if (tipo.includes('image')) return <IonIcon icon={document} size="large" color="primary" />;
    if (tipo.includes('pdf')) return <IonIcon icon={document} size="large" color="danger" />;
    if (tipo.includes('word')) return <IonIcon icon={document} size="large" color="secondary" />;
    return <IonIcon icon={document} size="large" />;
  };

  if (isDeleted) {
    // Evitar renderizar cualquier cosa si el curso ya fue eliminado
    return null;
  }

  if (loading) {
    return (
      <IonPage>
        <IonContent className="ion-padding">
          <IonLoading isOpen={true} message="Cargando curso..." />
        </IonContent>
      </IonPage>
    );
  }

  if (!curso) {
    return (
      <IonPage>
        <IonHeader>
          <IonToolbar>
            <IonTitle>Curso no encontrado</IonTitle>
          </IonToolbar>
        </IonHeader>
        <IonContent className="ion-padding">
          <p>El curso solicitado no existe o no se pudo cargar.</p>
          <IonButton expand="block" onClick={() => history.goBack()}>
            <IonIcon slot="start" icon={arrowBack} />
            Volver atrás
          </IonButton>
        </IonContent>
      </IonPage>
    );
  }

  return (
    <IonPage>
      <IonHeader>
        <IonToolbar>
          <IonTitle>{curso.nombre}</IonTitle>
        </IonToolbar>
      </IonHeader>

      <IonContent className="ion-padding">
        {curso.portada && (
          <div className="ion-text-center ion-margin-bottom">
            <img
              src={`${API_URL}${curso.portada}`}
              alt={`Portada de ${curso.nombre}`}
              style={{ maxWidth: '100%', maxHeight: '300px', borderRadius: '8px' }}
            />
          </div>
        )}

        <IonCard>
          <IonCardContent>
            <h1 style={{ fontSize: '1.5rem', fontWeight: 'bold', marginBottom: '1rem' }}>
              {curso.nombre}
            </h1>

            <IonItem lines="none">
              <IonLabel>
                <h2 style={{ fontWeight: 'bold' }}>Descripción</h2>
                <p style={{ whiteSpace: 'pre-line' }}>{curso.descripcion}</p>
              </IonLabel>
            </IonItem>

            <IonItem>
              <IonLabel>
                <h2 style={{ fontWeight: 'bold' }}>Categoría</h2>
                <p>{curso.categoria}</p>
              </IonLabel>
            </IonItem>

            <IonItem>
              <IonLabel>
                <h2 style={{ fontWeight: 'bold' }}>Precio</h2>
                <p>${curso.precio}</p>
              </IonLabel>
            </IonItem>

            <IonItem>
              <IonLabel>
                <h2 style={{ fontWeight: 'bold' }}>Horario</h2>
                <p>{curso.horario}</p>
              </IonLabel>
            </IonItem>

            <IonItem>
              <IonLabel>
                <h2 style={{ fontWeight: 'bold' }}>Método de entrega</h2>
                <p>{curso.entrega}</p>
              </IonLabel>
            </IonItem>

            <IonItem>
              <IonIcon icon={star} slot="start" color="warning" />
              <IonLabel>
                <h2 style={{ fontWeight: 'bold' }}>Calificación</h2>
                <p>{curso.ranking || 'Sin calificaciones aún'}</p>
              </IonLabel>
            </IonItem>

            <IonItemDivider>
              <IonLabel>Materiales del curso</IonLabel>
            </IonItemDivider>

            {(materialesServidor.length > 0 || materiales.length > 0) ? (
              <IonList>
                {materialesServidor.map((material, index) => (
                  <IonItem key={`server-${index}`}>
                    <IonThumbnail slot="start">
                      {getFileIcon(material.split('.').pop() || '')}
                    </IonThumbnail>
                    <IonLabel>
                      <a
                        href={`${API_URL}${material}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        style={{ textDecoration: 'none' }}
                      >
                        {material.split('/').pop()}
                      </a>
                    </IonLabel>
                    {esCreador && (
                      <IonButton
                        slot="end"
                        size="small"
                        color="danger"
                        onClick={() => eliminarMaterial(material)}
                      >
                        <IonIcon icon={trash} />
                      </IonButton>
                    )}
                  </IonItem>
                ))}

                {materiales.map((material, index) => (
                  <IonItem key={`local-${index}`}>
                    <IonThumbnail slot="start">
                      {getFileIcon(material.tipo)}
                    </IonThumbnail>
                    <IonLabel>
                      <a
                        href={material.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        style={{ textDecoration: 'none' }}
                      >
                        {material.nombre}
                        <p>Tamaño: {(material.tamaño / 1024).toFixed(2)} KB</p>
                      </a>
                    </IonLabel>
                    {esCreador && (
                      <IonButton
                        slot="end"
                        size="small"
                        color="danger"
                        onClick={() => eliminarMaterial(material)}
                      >
                        <IonIcon icon={trash} />
                      </IonButton>
                    )}
                  </IonItem>
                ))}
              </IonList>
            ) : (
              <IonItem>
                <IonLabel>
                  <p>Este curso no tiene materiales aún.</p>
                </IonLabel>
              </IonItem>
            )}

            {esCreador && (
              <>
                <IonItemDivider>
                  <IonLabel>Gestionar curso</IonLabel>
                </IonItemDivider>

                <div style={{ marginTop: '1rem' }}>
                  <input
                    type="file"
                    multiple
                    onChange={(e) => e.target.files && setArchivos(e.target.files)}
                    style={{ display: 'none' }}
                    id="file-upload"
                    accept=".pdf,.doc,.docx,.jpg,.jpeg,.png,.ppt,.pptx"
                    ref={fileInputRef}
                  />
                  <IonButton
                    expand="block"
                    onClick={() => fileInputRef.current?.click()}
                  >
                    <IonIcon slot="start" icon={cloudUpload} />
                    Seleccionar materiales
                  </IonButton>

                  {archivos && archivos.length > 0 && (
                    <div style={{ margin: '1rem 0' }}>
                      <p>Archivos seleccionados: {archivos.length}</p>
                      <IonButton
                        expand="block"
                        color="success"
                        onClick={subirMateriales}
                      >
                        Subir {archivos.length} archivo(s)
                      </IonButton>
                    </div>
                  )}

                  <IonButton
                    expand="block"
                    color="primary"
                    onClick={() => history.push(`/editar-curso/${curso.id}`)}
                    style={{ marginTop: '1rem' }}
                  >
                    <IonIcon slot="start" icon={create} />
                    Editar curso
                  </IonButton>

                  <IonButton
                    expand="block"
                    color="danger"
                    onClick={eliminarCurso}
                    style={{ marginTop: '1rem' }}
                  >
                    <IonIcon slot="start" icon={trash} />
                    Eliminar curso
                  </IonButton>
                </div>
              </>
            )}

            <IonButton
              expand="block"
              color="medium"
              onClick={() => history.goBack()}
              style={{ marginTop: '2rem' }}
            >
              <IonIcon slot="start" icon={arrowBack} />
              Volver a los cursos
            </IonButton>
          </IonCardContent>
        </IonCard>

        <IonLoading isOpen={subiendo} message="Subiendo materiales..." />
        <IonToast
          isOpen={mostrarToast}
          onDidDismiss={() => setMostrarToast(false)}
          message={toastMsg}
          duration={3000} // Aumentado para mayor visibilidad
          color={toastMsg.includes('Error') ? 'danger' : 'success'}
        />
      </IonContent>
    </IonPage>
  );
};

export default CursoDetalle;