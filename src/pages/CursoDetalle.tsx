import React, { useEffect, useState, useRef } from 'react';
import {
  IonPage, IonHeader, IonToolbar, IonTitle, IonContent,
  IonButton, IonIcon, IonCard, IonCardContent, IonLabel, IonItem,
  IonItemDivider, IonLoading, IonToast, IonList, IonThumbnail,
  IonModal
} from '@ionic/react';
import { useParams, useHistory } from 'react-router-dom';
import { star, cloudUpload, trash, create, arrowBack, document, eye } from 'ionicons/icons';

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
  contenido: string;
  fechaSubida: string;
  tamaño: number;
  tipo: string;
  url?: string;
}

const CursoDetalle: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const [curso, setCurso] = useState<Curso | null>(null);
  const [materiales, setMateriales] = useState<MaterialLocal[]>([]);
  const [archivos, setArchivos] = useState<FileList | null>(null);
  const [loading, setLoading] = useState(true);
  const [subiendo, setSubiendo] = useState(false);
  const [toastMsg, setToastMsg] = useState('');
  const [mostrarToast, setMostrarToast] = useState(false);
  const [esCreador, setEsCreador] = useState(false);
  const [isDeleted, setIsDeleted] = useState(false);
  const [materialAVisualizar, setMaterialAVisualizar] = useState<MaterialLocal | null>(null);
  const [mostrarVisor, setMostrarVisor] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const token = localStorage.getItem('token');
  const rawUsuario = localStorage.getItem('usuario');
  const usuario: Usuario | null = rawUsuario ? JSON.parse(rawUsuario) : null;
  const history = useHistory();

  // Función para limpiar nombres de archivo
  const limpiarNombreArchivo = (nombre: string) => {
    return nombre.replace(/^materials-\d+-\d+-/, '').replace(/^\d+-/, '');
  };

  // Función auxiliar para crear FileList
  const crearFileList = (files: File[]): FileList => {
    const dataTransfer = new DataTransfer();
    files.forEach(file => dataTransfer.items.add(file));
    return dataTransfer.files;
  };

  const fileToBase64 = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onload = () => resolve(reader.result as string);
      reader.onerror = error => reject(error);
    });
  };

  const base64ToBlob = (base64: string, contentType: string) => {
    const byteCharacters = atob(base64.split(',')[1]);
    const byteNumbers = new Array(byteCharacters.length);
    for (let i = 0; i < byteCharacters.length; i++) {
      byteNumbers[i] = byteCharacters.charCodeAt(i);
    }
    const byteArray = new Uint8Array(byteNumbers);
    return new Blob([byteArray], { type: contentType });
  };

  const cargarMaterialesLocales = (cursoId: string): MaterialLocal[] => {
    const datos = localStorage.getItem(`${LOCAL_STORAGE_KEY}${cursoId}`);
    return datos ? JSON.parse(datos) : [];
  };

  const guardarMaterialesLocales = (cursoId: string, materiales: MaterialLocal[]) => {
    localStorage.setItem(`${LOCAL_STORAGE_KEY}${cursoId}`, JSON.stringify(materiales));
  };

  const visualizarMaterial = (material: MaterialLocal) => {
    const blob = base64ToBlob(material.contenido, material.tipo);
    const url = URL.createObjectURL(blob);
    setMaterialAVisualizar({ ...material, url });
    setMostrarVisor(true);
  };

  useEffect(() => {
    return () => {
      if (materialAVisualizar?.url) {
        URL.revokeObjectURL(materialAVisualizar.url);
      }
    };
  }, [materialAVisualizar]);

  useEffect(() => {
    const fetchCurso = async () => {
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

        const materialesLocales = cargarMaterialesLocales(id);
        setMateriales(materialesLocales);

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
      setToastMsg('No hay archivos seleccionados válidos');
      setMostrarToast(true);
      return;
    }

    setSubiendo(true);
    const nuevosMaterialesLocales: MaterialLocal[] = [];
    const formData = new FormData();

    const tiposPermitidos = [
      'application/pdf',
      'application/msword',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      'image/jpeg',
      'image/png',
      'application/vnd.ms-powerpoint',
      'application/vnd.openxmlformats-officedocument.presentationml.presentation'
    ];

    const archivosArray = Array.from(archivos).filter(file => 
      file.size > 0 && 
      file.name && 
      tiposPermitidos.includes(file.type)
    );

    if (archivosArray.length === 0) {
      setToastMsg('No hay archivos válidos para subir');
      setMostrarToast(true);
      setSubiendo(false);
      return;
    }

    for (const file of archivosArray) {
      formData.append('materiales', file);

      try {
        const contenidoBase64 = await fileToBase64(file);
        
        const materialLocal: MaterialLocal = {
          nombre: file.name,
          contenido: contenidoBase64,
          fechaSubida: new Date().toISOString(),
          tamaño: file.size,
          tipo: file.type
        };
        nuevosMaterialesLocales.push(materialLocal);
      } catch (error) {
        console.error('Error al convertir archivo:', error);
        continue;
      }
    }

    try {
      const response = await fetch(`${API_URL}/cursos/${id}/materiales`, {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${token}` },
        body: formData
      });

      const result = await response.json();

      if (result.success) {
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

  const eliminarMaterial = async (material: MaterialLocal) => {
    if (!window.confirm('¿Eliminar este material?')) return;

    try {
      const nuevosMateriales = materiales.filter(m => m.nombre !== material.nombre);
      guardarMaterialesLocales(id, nuevosMateriales);
      setMateriales(nuevosMateriales);
      setToastMsg('Material eliminado');
      setMostrarToast(true);
    } catch (err) {
      console.error('Error al eliminar material:', err);
      setToastMsg('Error al eliminar material');
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
        setIsDeleted(true);
        setCurso(null);
        setToastMsg('Curso eliminado correctamente');
        setMostrarToast(true);
        history.push('/cursos');
        window.location.reload();
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

            {materiales.length > 0 ? (
              <IonList>
                {materiales.map((material, index) => {
                  const nombreLimpio = limpiarNombreArchivo(material.nombre);
                  
                  return (
                    <IonItem key={`local-${index}`}>
                      <IonThumbnail slot="start">
                        {getFileIcon(material.tipo)}
                      </IonThumbnail>
                      <IonLabel>
                        <div onClick={() => visualizarMaterial(material)} style={{ cursor: 'pointer' }}>
                          {nombreLimpio}
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
                  );
                })}
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
                    onChange={(e) => {
                      if (e.target.files) {
                        const tiposPermitidos = [
                          'application/pdf',
                          'application/msword',
                          'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
                          'image/jpeg',
                          'image/png',
                          'application/vnd.ms-powerpoint',
                          'application/vnd.openxmlformats-officedocument.presentationml.presentation'
                        ];
                        
                        const archivosValidos = Array.from(e.target.files).filter(file => 
                          file.size > 0 && 
                          file.name && 
                          tiposPermitidos.includes(file.type)
                        );
                        
                        setArchivos(crearFileList(archivosValidos));
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
              onClick={() => history.push('/cursos')}
              style={{ marginTop: '2rem' }}
            >
              <IonIcon slot="start" icon={arrowBack} />
              Volver a los cursos
            </IonButton>
          </IonCardContent>
        </IonCard>

        {/* Visor de Materiales */}
        <IonModal isOpen={mostrarVisor} onDidDismiss={() => setMostrarVisor(false)}>
          <IonHeader>
            <IonToolbar>
              <IonTitle>{materialAVisualizar?.nombre}</IonTitle>
              <IonButton slot="end" onClick={() => setMostrarVisor(false)}>
                Cerrar
              </IonButton>
            </IonToolbar>
          </IonHeader>
          <IonContent className="ion-padding">
            {materialAVisualizar && (
              <div style={{ height: '100%', width: '100%' }}>
                {materialAVisualizar.tipo.includes('pdf') && (
                  <embed 
                    src={materialAVisualizar.url} 
                    type="application/pdf" 
                    width="100%" 
                    height="100%"
                  />
                )}
                {materialAVisualizar.tipo.includes('image') && (
                  <img 
                    src={materialAVisualizar.url} 
                    alt={materialAVisualizar.nombre}
                    style={{ maxWidth: '100%', maxHeight: '100%' }}
                  />
                )}
                {(materialAVisualizar.tipo.includes('word') || 
                  materialAVisualizar.tipo.includes('powerpoint')) && (
                  <div style={{ textAlign: 'center', padding: '20px' }}>
                    <p>Este tipo de archivo no se puede previsualizar directamente</p>
                    <IonButton 
                      href={materialAVisualizar.contenido}
                      download={materialAVisualizar.nombre}
                    >
                      Descargar para ver
                    </IonButton>
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
              </div>
            )}
          </IonContent>
        </IonModal>

        <IonLoading isOpen={subiendo} message="Subiendo materiales..." />
        <IonToast
          isOpen={mostrarToast}
          onDidDismiss={() => setMostrarToast(false)}
          message={toastMsg}
          duration={3000}
          color={toastMsg.includes('Error') ? 'danger' : 'success'}
        />
      </IonContent>
    </IonPage>
  );
};

export default CursoDetalle;