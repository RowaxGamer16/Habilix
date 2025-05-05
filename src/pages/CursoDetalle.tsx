import React, { useEffect, useState, useRef, useCallback } from 'react';
import {
  IonPage, IonHeader, IonToolbar, IonTitle, IonContent,
  IonButton, IonIcon, IonCard, IonCardContent, IonLabel, IonItem,
  IonItemDivider, IonLoading, IonToast, IonList, IonThumbnail,
  IonModal, IonAlert, IonGrid, IonRow, IonCol
} from '@ionic/react';
import { useParams, useHistory } from 'react-router-dom';
import { star, cloudUpload, trash, create, arrowBack, document, eye } from 'ionicons/icons';

const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000/api';
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
  id_usuario: number;
  profesor: string;
}

interface Usuario {
  ID: number;
  NOMBRE_USUARIO: string;
  EMAIL: string;
  ROLE: string;
  TELEFONO?: string;
  FECHA_CREACION?: string;
}

type TipoArchivo = 'pdf' | 'imagen' | 'documento' | 'presentacion' | 'otro';

interface MaterialLocal {
  nombre: string;
  contenido: string;
  tipo: TipoArchivo;
  tamaño: number;
  extension: string;
  fechaSubida: string;
  id_usuario: number;
}

const CursoDetalle: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const history = useHistory();
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Estados
  const [curso, setCurso] = useState<Curso | null>(null);
  const [materiales, setMateriales] = useState<MaterialLocal[]>([]);
  const [archivos, setArchivos] = useState<File[]>([]);
  const [loading, setLoading] = useState(true);
  const [subiendo, setSubiendo] = useState(false);
  const [toastMsg, setToastMsg] = useState('');
  const [mostrarToast, setMostrarToast] = useState(false);
  const [esCreador, setEsCreador] = useState(false);
  const [isDeleted, setIsDeleted] = useState(false);
  const [materialAVisualizar, setMaterialAVisualizar] = useState<MaterialLocal | null>(null);
  const [mostrarVisor, setMostrarVisor] = useState(false);
  const [showDeleteAlert, setShowDeleteAlert] = useState(false);
  const [usuario, setUsuario] = useState<Usuario | null>(null);
  const token = localStorage.getItem('token');

  // Obtener usuario del localStorage con validación
  const getUsuario = useCallback((): Usuario | null => {
    try {
      const rawUsuario = localStorage.getItem('usuario');
      if (!rawUsuario) return null;
      
      const usuario = JSON.parse(rawUsuario);
      
      if (!usuario || typeof usuario !== 'object' || 
          !usuario.ID || !usuario.NOMBRE_USUARIO || !usuario.EMAIL) {
        console.error('Datos de usuario inválidos:', usuario);
        localStorage.removeItem('usuario');
        return null;
      }
      
      console.log('Usuario obtenido:', {
        id: usuario.ID,
        nombre: usuario.NOMBRE_USUARIO,
        email: usuario.EMAIL
      });
      
      return usuario;
    } catch (error) {
      console.error('Error al parsear usuario:', error);
      localStorage.removeItem('usuario');
      return null;
    }
  }, []);

  // Cargar usuario al iniciar
  useEffect(() => {
    const usuarioActual = getUsuario();
    setUsuario(usuarioActual);
  }, [getUsuario]);

  // Cargar materiales locales
  const cargarMaterialesLocales = useCallback((cursoId: string): MaterialLocal[] => {
    const datos = localStorage.getItem(`${LOCAL_STORAGE_KEY}${cursoId}`);
    return datos ? JSON.parse(datos) : [];
  }, []);

  const guardarMaterialesLocales = useCallback((cursoId: string, materiales: MaterialLocal[]) => {
    localStorage.setItem(`${LOCAL_STORAGE_KEY}${cursoId}`, JSON.stringify(materiales));
  }, []);

  // Convertir archivo a Base64
  const fileToBase64 = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(reader.result as string);
      reader.onerror = error => reject(error);
      reader.readAsDataURL(file);
    });
  };

  // Cargar datos del curso con verificación mejorada
  useEffect(() => {
    const fetchCurso = async () => {
      if (isDeleted) return;
      
      const usuarioActual = getUsuario();
      if (!usuarioActual) {
        setToastMsg('Debes iniciar sesión para ver este curso');
        setMostrarToast(true);
        history.push('/login');
        return;
      }

      try {
        const response = await fetch(`${API_URL}/cursos/${id}`, {
          headers: { 'Authorization': `Bearer ${token}` }
        });
        
        if (!response.ok) {
          if (response.status === 404) {
            setToastMsg('Curso no encontrado');
          } else {
            throw new Error(`Error ${response.status}: ${response.statusText}`);
          }
          return;
        }

        const data = await response.json();
        
        // Validación estricta de los datos del curso
        if (!data || typeof data.id_usuario !== 'number') {
          throw new Error('Datos del curso inválidos');
        }

        console.log('Datos del curso:', {
          id: data.id,
          nombre: data.nombre,
          creador_id: data.id_usuario,
          profesor: data.profesor
        });

        setCurso(data);
        setMateriales(cargarMaterialesLocales(id));
        
        // Verificación mejorada del creador
        const esCreador = usuarioActual.ID === data.id_usuario;
        console.log(`Verificación creador: Usuario ${usuarioActual.ID} vs Curso ${data.id_usuario} -> ${esCreador}`);
        setEsCreador(esCreador);

      } catch (err) {
        console.error('Error al cargar curso:', err);
        setToastMsg(err instanceof Error ? err.message : 'Error desconocido');
        setMostrarToast(true);
      } finally {
        setLoading(false);
      }
    };

    if (token) {
      fetchCurso();
    } else {
      setToastMsg('Debes iniciar sesión para ver este curso');
      setMostrarToast(true);
      history.push('/login');
    }
  }, [id, token, isDeleted, history, getUsuario, cargarMaterialesLocales]);

  // Subir materiales (solo para creadores)
  const subirMateriales = async () => {
    if (!esCreador || !usuario) {
      setToastMsg('Solo el creador del curso puede subir materiales');
      setMostrarToast(true);
      return;
    }

    if (archivos.length === 0) {
      setToastMsg('No hay archivos seleccionados');
      setMostrarToast(true);
      return;
    }

    setSubiendo(true);
    const nuevosMateriales: MaterialLocal[] = [];

    try {
      for (const file of archivos) {
        const contenido = await fileToBase64(file);
        const extension = file.name.split('.').pop()?.toLowerCase() || '';
        
        nuevosMateriales.push({
          nombre: file.name,
          contenido,
          tipo: determinarTipoArchivo(file.name),
          tamaño: file.size,
          extension,
          fechaSubida: new Date().toISOString(),
          id_usuario: usuario.ID
        });
      }

      const materialesActualizados = [...materiales, ...nuevosMateriales];
      guardarMaterialesLocales(id, materialesActualizados);
      setMateriales(materialesActualizados);
      setArchivos([]);
      setToastMsg('Materiales subidos correctamente');
    } catch (error) {
      setToastMsg('Error al subir materiales');
    } finally {
      setSubiendo(false);
      setMostrarToast(true);
    }
  };

  // Determinar tipo de archivo
  const determinarTipoArchivo = (nombre: string): TipoArchivo => {
    const extension = nombre.split('.').pop()?.toLowerCase() || '';
    if (['pdf'].includes(extension)) return 'pdf';
    if (['jpg', 'jpeg', 'png', 'gif'].includes(extension)) return 'imagen';
    if (['doc', 'docx'].includes(extension)) return 'documento';
    if (['ppt', 'pptx'].includes(extension)) return 'presentacion';
    return 'otro';
  };

  // Eliminar material (solo para creadores)
  const eliminarMaterial = (material: MaterialLocal) => {
    if (!esCreador) {
      setToastMsg('Solo el creador puede eliminar materiales');
      setMostrarToast(true);
      return;
    }

    const nuevosMateriales = materiales.filter(m => m.contenido !== material.contenido);
    guardarMaterialesLocales(id, nuevosMateriales);
    setMateriales(nuevosMateriales);
    setToastMsg('Material eliminado');
    setMostrarToast(true);
  };

  // Eliminar curso (solo para creadores)
  const confirmarEliminarCurso = () => {
    if (!esCreador) {
      setToastMsg('Solo el creador puede eliminar el curso');
      setMostrarToast(true);
      return;
    }
    setShowDeleteAlert(true);
  };

  const eliminarCurso = async () => {
    setShowDeleteAlert(false);
    
    try {
      const response = await fetch(`${API_URL}/cursos/${id}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${token}` }
      });

      const result = await response.json();

      if (result.success) {
        localStorage.removeItem(`${LOCAL_STORAGE_KEY}${id}`);
        setIsDeleted(true);
        setToastMsg('Curso eliminado correctamente');
        history.push('/cursos');
      } else {
        throw new Error(result.error || 'Error al eliminar curso');
      }
    } catch (err) {
      setToastMsg(err instanceof Error ? err.message : 'Error de conexión');
    } finally {
      setMostrarToast(true);
    }
  };

  // Visualizar material
  const visualizarMaterial = (material: MaterialLocal) => {
    setMaterialAVisualizar(material);
    setMostrarVisor(true);
  };

  // Renderizado condicional
  if (isDeleted) return null;

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
        {/* Portada del curso */}
        {curso.portada && (
          <div className="ion-text-center ion-margin-bottom">
            <img
              src={`${API_URL}${curso.portada.startsWith('/') ? '' : '/'}${curso.portada}`}
              alt={`Portada de ${curso.nombre}`}
              style={{ maxWidth: '100%', maxHeight: '300px', borderRadius: '8px' }}
              onError={(e) => {
                (e.target as HTMLImageElement).src = '/assets/default-course.png';
              }}
            />
          </div>
        )}

        {/* Detalles del curso */}
        <IonCard>
          <IonCardContent>
            <h1 style={{ fontSize: '1.5rem', fontWeight: 'bold', marginBottom: '1rem' }}>
              {curso.nombre}
            </h1>

            <IonGrid>
              <IonRow>
                <IonCol size="12" sizeMd="6">
                  <IonItem lines="none">
                    <IonLabel>
                      <h2 style={{ fontWeight: 'bold' }}>Descripción</h2>
                      <p style={{ whiteSpace: 'pre-line' }}>{curso.descripcion}</p>
                    </IonLabel>
                  </IonItem>

                  <IonItem>
                    <IonLabel>
                      <h2 style={{ fontWeight: 'bold' }}>Profesor</h2>
                      <p>{curso.profesor}</p>
                    </IonLabel>
                  </IonItem>

                  <IonItem>
                    <IonLabel>
                      <h2 style={{ fontWeight: 'bold' }}>Categoría</h2>
                      <p>{curso.categoria}</p>
                    </IonLabel>
                  </IonItem>
                </IonCol>

                <IonCol size="12" sizeMd="6">
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
                </IonCol>
              </IonRow>
            </IonGrid>

            {/* Materiales del curso */}
            <IonItemDivider>
              <IonLabel>Materiales del curso</IonLabel>
              {esCreador && <IonLabel slot="end" color="primary">Eres el creador</IonLabel>}
            </IonItemDivider>

            {materiales.length > 0 ? (
              <IonList>
                {materiales.map((material, index) => (
                  <IonItem key={`${material.nombre}-${index}`}>
                    <IonThumbnail slot="start">
                      <IonIcon 
                        icon={document} 
                        size="large" 
                        color={
                          material.tipo === 'pdf' ? 'danger' : 
                          material.tipo === 'imagen' ? 'primary' : 
                          material.tipo === 'documento' ? 'secondary' : 'tertiary'
                        } 
                      />
                    </IonThumbnail>
                    <IonLabel>
                      <div onClick={() => visualizarMaterial(material)}>
                        {material.nombre}
                        <p>Tamaño: {(material.tamaño / 1024).toFixed(2)} KB</p>
                      </div>
                    </IonLabel>
                    <IonButton
                      slot="end"
                      size="small"
                      color="primary"
                      onClick={() => visualizarMaterial(material)}
                    >
                      <IonIcon icon={eye} />
                    </IonButton>
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

            {/* Gestión del curso (solo para creadores) */}
            {esCreador && (
              <>
                <IonItemDivider>
                  <IonLabel>Gestionar curso</IonLabel>
                </IonItemDivider>

                <div style={{ marginTop: '1rem' }}>
                  <input
                    type="file"
                    multiple
                    onChange={(e) => {
                      if (e.target.files) {
                        const archivosValidos = Array.from(e.target.files).filter(file => 
                          file.size > 0 && file.name
                        );
                        setArchivos(archivosValidos);
                      }
                    }}
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

                  {archivos.length > 0 && (
                    <div style={{ margin: '1rem 0' }}>
                      <p>Archivos seleccionados: {archivos.length}</p>
                      <IonButton
                        expand="block"
                        color="success"
                        onClick={subirMateriales}
                        disabled={subiendo}
                      >
                        {subiendo ? 'Subiendo...' : `Subir ${archivos.length} archivo(s)`}
                      </IonButton>
                    </div>
                  )}

                  <IonGrid>
                    <IonRow>
                      <IonCol>
                        <IonButton
                          expand="block"
                          color="primary"
                          onClick={() => history.push(`/editar-curso/${curso.id}`)}
                          style={{ marginTop: '1rem' }}
                        >
                          <IonIcon slot="start" icon={create} />
                          Editar curso
                        </IonButton>
                      </IonCol>
                      <IonCol>
                        <IonButton
                          expand="block"
                          color="danger"
                          onClick={confirmarEliminarCurso}
                          style={{ marginTop: '1rem' }}
                        >
                          <IonIcon slot="start" icon={trash} />
                          Eliminar curso
                        </IonButton>
                      </IonCol>
                    </IonRow>
                  </IonGrid>
                </div>
              </>
            )}

            {/* Botón para volver */}
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

        {/* Modal para visualizar materiales */}
        <IonModal isOpen={mostrarVisor} onDidDismiss={() => setMostrarVisor(false)}>
          {materialAVisualizar && (
            <>
              <IonHeader>
                <IonToolbar>
                  <IonTitle>{materialAVisualizar.nombre}</IonTitle>
                  <IonButton slot="end" onClick={() => setMostrarVisor(false)}>
                    Cerrar
                  </IonButton>
                </IonToolbar>
              </IonHeader>
              <IonContent className="ion-padding">
                {materialAVisualizar.tipo === 'pdf' && (
                  <embed 
                    src={materialAVisualizar.contenido} 
                    type="application/pdf" 
                    width="100%" 
                    height="500px"
                  />
                )}
                {materialAVisualizar.tipo === 'imagen' && (
                  <img 
                    src={materialAVisualizar.contenido} 
                    alt={materialAVisualizar.nombre}
                    style={{ maxWidth: '100%', maxHeight: '500px', display: 'block', margin: '0 auto' }}
                  />
                )}
                {(materialAVisualizar.tipo !== 'pdf' && materialAVisualizar.tipo !== 'imagen') && (
                  <div style={{ textAlign: 'center', padding: '20px' }}>
                    <p>Este tipo de archivo no se puede previsualizar</p>
                  </div>
                )}
                <div style={{ marginTop: '20px' }}>
                  <IonButton 
                    expand="block" 
                    href={materialAVisualizar.contenido}
                    download={materialAVisualizar.nombre}
                  >
                    Descargar
                  </IonButton>
                </div>
              </IonContent>
            </>
          )}
        </IonModal>

        {/* Componentes de UI */}
        <IonLoading isOpen={subiendo} message="Subiendo materiales..." />
        <IonToast
          isOpen={mostrarToast}
          onDidDismiss={() => setMostrarToast(false)}
          message={toastMsg}
          duration={3000}
          color={toastMsg.includes('Error') ? 'danger' : 'success'}
        />
        <IonAlert
          isOpen={showDeleteAlert}
          onDidDismiss={() => setShowDeleteAlert(false)}
          header={'Confirmar eliminación'}
          message={'¿Estás seguro de que quieres eliminar este curso? Esta acción no se puede deshacer.'}
          buttons={[
            {
              text: 'Cancelar',
              role: 'cancel',
              cssClass: 'secondary'
            },
            {
              text: 'Eliminar',
              handler: eliminarCurso
            }
          ]}
        />
      </IonContent>
    </IonPage>
  );
};

export default CursoDetalle;
