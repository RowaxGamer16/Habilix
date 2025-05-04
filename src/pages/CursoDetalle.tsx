import React, { useEffect, useState, useRef, useCallback } from 'react';
import {
  IonPage, IonHeader, IonToolbar, IonTitle, IonContent,
  IonButton, IonIcon, IonCard, IonCardContent, IonLabel, IonItem,
  IonItemDivider, IonLoading, IonToast, IonList, IonThumbnail,
  IonModal, IonAlert, IonGrid, IonRow, IonCol
} from '@ionic/react';
import { useParams, useHistory } from 'react-router-dom';
import { star, cloudUpload, trash, create, arrowBack, document, eye } from 'ionicons/icons';

console.log('Inicializando componente CursoDetalle...');

const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000/api';
console.log('API_URL configurada:', API_URL);

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
  console.log('Renderizando componente CursoDetalle...');
  
  const { id } = useParams<{ id: string }>();
  console.log('ID del curso obtenido de los parámetros:', id);

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

  // Datos del usuario - Solución mejorada
  const token = localStorage.getItem('token');
  console.log('Token obtenido de localStorage:', token ? '*** (presente)' : 'No encontrado');

  // Función robusta para obtener usuario
  const getUsuario = useCallback((): Usuario | null => {
    try {
      const rawUsuario = localStorage.getItem('usuario');
      if (!rawUsuario) {
        console.log('No se encontró usuario en localStorage');
        return null;
      }
      
      const usuario = JSON.parse(rawUsuario);
      
      // Validación estricta del objeto usuario
      if (!usuario || typeof usuario !== 'object' || !usuario.ID || !usuario.NOMBRE_USUARIO) {
        console.error('Datos de usuario inválidos en localStorage:', usuario);
        localStorage.removeItem('usuario');
        return null;
      }
      
      console.log('Usuario obtenido correctamente:', { 
        ID: usuario.ID, 
        NOMBRE_USUARIO: usuario.NOMBRE_USUARIO,
        EMAIL: usuario.EMAIL
      });
      return usuario;
    } catch (error) {
      console.error('Error al parsear usuario:', error);
      localStorage.removeItem('usuario');
      return null;
    }
  }, []);

  const [usuario, setUsuario] = useState<Usuario | null>(null);

  // Efecto para cargar y monitorear cambios en el usuario
  useEffect(() => {
    const loadAndMonitorUser = () => {
      const usuarioActual = getUsuario();
      setUsuario(usuarioActual);

      // Configurar temporizador para verificar cambios (solución temporal)
      const timer = setTimeout(() => {
        const nuevoUsuario = getUsuario();
        if ((nuevoUsuario?.ID !== usuarioActual?.ID) || 
            (nuevoUsuario?.EMAIL !== usuarioActual?.EMAIL)) {
          console.log('Cambio detectado en usuario, actualizando estado...');
          setUsuario(nuevoUsuario);
        }
      }, 1000);

      return () => clearTimeout(timer);
    };

    loadAndMonitorUser();
  }, [getUsuario]);

  // Funciones utilitarias
  const limpiarNombreArchivo = useCallback((nombre: string) => {
    console.log('Limpiando nombre de archivo:', nombre);
    const nombreLimpio = decodeURIComponent(nombre).replace(/^.*[\\\/]/, '');
    console.log('Nombre limpio:', nombreLimpio);
    return nombreLimpio;
  }, []);

  const determinarTipoArchivo = useCallback((nombre: string): TipoArchivo => {
    console.log('Determinando tipo de archivo para:', nombre);
    const extension = nombre.split('.').pop()?.toLowerCase() || '';
    console.log('Extensión detectada:', extension);
    
    if (['pdf'].includes(extension)) return 'pdf';
    if (['jpg', 'jpeg', 'png', 'gif'].includes(extension)) return 'imagen';
    if (['doc', 'docx'].includes(extension)) return 'documento';
    if (['ppt', 'pptx'].includes(extension)) return 'presentacion';
    return 'otro';
  }, []);

  // Manejo de materiales en localStorage
  const cargarMaterialesLocales = useCallback((cursoId: string): MaterialLocal[] => {
    console.log(`Cargando materiales locales para curso ${cursoId}...`);
    const datos = localStorage.getItem(`${LOCAL_STORAGE_KEY}${cursoId}`);
    const materiales = datos ? JSON.parse(datos) : [];
    console.log(`Materiales cargados para curso ${cursoId}:`, materiales);
    return materiales;
  }, []);

  const guardarMaterialesLocales = useCallback((cursoId: string, materiales: MaterialLocal[]) => {
    console.log(`Guardando materiales en localStorage para curso ${cursoId}:`, materiales);
    localStorage.setItem(`${LOCAL_STORAGE_KEY}${cursoId}`, JSON.stringify(materiales));
  }, []);

  const fileToBase64 = (file: File): Promise<string> => {
    console.log('Convirtiendo archivo a Base64:', file.name);
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => {
        console.log('Archivo convertido exitosamente:', file.name);
        resolve(reader.result as string);
      };
      reader.onerror = error => {
        console.error('Error al convertir archivo:', file.name, error);
        reject(error);
      };
      reader.readAsDataURL(file);
    });
  };

  // Cargar datos del curso
  useEffect(() => {
    console.log('Efecto de carga del curso iniciado');
    
    const fetchCurso = async () => {
      console.log('Iniciando fetchCurso...');
      if (isDeleted) {
        console.log('Curso marcado como eliminado, omitiendo carga');
        return;
      }
      
      const usuarioActual = getUsuario();
      if (!usuarioActual) {
        console.log('Usuario no autenticado, redirigiendo a login');
        setLoading(false);
        setToastMsg('Debes iniciar sesión para ver este curso');
        setMostrarToast(true);
        history.push('/login');
        return;
      }

      try {
        console.log(`Realizando petición a ${API_URL}/cursos/${id}`);
        const response = await fetch(`${API_URL}/cursos/${id}`, {
          headers: { 'Authorization': `Bearer ${token}` }
        });
        
        if (!response.ok) {
          if (response.status === 404) {
            console.log('Curso no encontrado (404)');
            setToastMsg('Curso no encontrado');
          } else {
            throw new Error(`HTTP ${response.status}: ${response.statusText}`);
          }
          return;
        }

        const data = await response.json();
        console.log('Datos del curso recibidos:', {
          id: data.id,
          nombre: data.nombre,
          id_usuario: data.id_usuario
        });
        setCurso(data);
        
        const materialesLocales = cargarMaterialesLocales(id);
        console.log('Materiales locales cargados:', materialesLocales);
        setMateriales(materialesLocales);
        
        const esUsuarioCreador = usuarioActual.ID === data.id_usuario;
        console.log(`Verificando si usuario es creador: ${usuarioActual.ID} === ${data.id_usuario} -> ${esUsuarioCreador}`);
        setEsCreador(esUsuarioCreador);

      } catch (err) {
        console.error('Error en fetchCurso:', err);
        setToastMsg(err instanceof Error ? err.message : 'Error desconocido');
        setMostrarToast(true);
      } finally {
        console.log('Finalizando carga del curso');
        setLoading(false);
      }
    };

    if (token) {
      console.log('Token presente, iniciando carga del curso');
      fetchCurso();
    } else {
      console.log('No hay token, redirigiendo a login');
      setLoading(false);
      setToastMsg('Debes iniciar sesión para ver este curso');
      setMostrarToast(true);
      history.push('/login');
    }
  }, [id, token, isDeleted, history, cargarMaterialesLocales, getUsuario]);

  // Operaciones con materiales
  const subirMateriales = async () => {
    console.log('Iniciando subida de materiales...');
    
    const usuarioActual = getUsuario();
    if (!esCreador || !usuarioActual) {
      console.log('Usuario no autorizado para subir materiales');
      setToastMsg('Solo el creador del curso puede subir materiales');
      setMostrarToast(true);
      return;
    }

    if (archivos.length === 0) {
      console.log('No hay archivos seleccionados para subir');
      setToastMsg('No hay archivos seleccionados');
      setMostrarToast(true);
      return;
    }

    console.log(`Preparando para subir ${archivos.length} archivos`);
    setSubiendo(true);
    const nuevosMaterialesLocales: MaterialLocal[] = [];

    const MAX_FILE_SIZE = 10 * 1024 * 1024;
    const tiposPermitidos = [
      'application/pdf',
      'application/msword',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      'image/jpeg',
      'image/png',
      'application/vnd.ms-powerpoint',
      'application/vnd.openxmlformats-officedocument.presentationml.presentation'
    ];

    try {
      console.log('Procesando archivos seleccionados...');
      for (const file of archivos) {
        console.log(`Procesando archivo: ${file.name} (${file.size} bytes, ${file.type})`);
        
        if (file.size > MAX_FILE_SIZE) {
          console.log(`Archivo demasiado grande: ${file.name} (${file.size} bytes)`);
          continue;
        }

        if (!tiposPermitidos.includes(file.type)) {
          console.log(`Tipo de archivo no permitido: ${file.name} (${file.type})`);
          continue;
        }

        try {
          const contenidoBase64 = await fileToBase64(file);
          const extension = file.name.split('.').pop()?.toLowerCase() || '';
          const tipoArchivo = determinarTipoArchivo(file.name);
          
          console.log(`Archivo procesado: ${file.name}, tipo: ${tipoArchivo}, tamaño: ${file.size}, extensión: ${extension}`);
          
          nuevosMaterialesLocales.push({
            nombre: file.name,
            contenido: contenidoBase64,
            tipo: tipoArchivo,
            tamaño: file.size,
            extension,
            fechaSubida: new Date().toISOString(),
            id_usuario: usuarioActual.ID
          });
        } catch (error) {
          console.error(`Error al procesar archivo ${file.name}:`, error);
        }
      }

      if (nuevosMaterialesLocales.length === 0) {
        console.log('No se encontraron archivos válidos para subir');
        throw new Error('No hay archivos válidos para subir (tamaño máximo 10MB)');
      }

      console.log('Archivos válidos procesados:', nuevosMaterialesLocales);
      
      const materialesActualizados = [...materiales, ...nuevosMaterialesLocales];
      console.log('Materiales actualizados:', materialesActualizados);
      
      guardarMaterialesLocales(id, materialesActualizados);
      setMateriales(materialesActualizados);
      setArchivos([]);
      
      console.log('Materiales subidos exitosamente');
      setToastMsg('Materiales subidos correctamente');

    } catch (error) {
      console.error('Error en subirMateriales:', error);
      setToastMsg(error instanceof Error ? error.message : 'Error al subir materiales');
    } finally {
      console.log('Finalizando proceso de subida');
      setSubiendo(false);
      setMostrarToast(true);
    }
  };

  const eliminarMaterial = (material: MaterialLocal) => {
    console.log('Iniciando eliminación de material:', material.nombre);
    
    const usuarioActual = getUsuario();
    if (!esCreador || !usuarioActual) {
      console.log('Usuario no autorizado para eliminar materiales');
      setToastMsg('Solo el creador del curso puede eliminar materiales');
      setMostrarToast(true);
      return;
    }

    try {
      console.log('Filtrando materiales para eliminar:', material.nombre);
      const nuevosMateriales = materiales.filter(m => m.contenido !== material.contenido);
      console.log('Materiales después de filtrar:', nuevosMateriales);
      
      guardarMaterialesLocales(id, nuevosMateriales);
      setMateriales(nuevosMateriales);
      
      console.log('Material eliminado exitosamente');
      setToastMsg('Material eliminado');
    } catch (err) {
      console.error('Error al eliminar material:', err);
      setToastMsg('Error al eliminar material');
    } finally {
      setMostrarToast(true);
    }
  };

  // Operaciones con el curso
  const confirmarEliminarCurso = () => {
    console.log('Confirmando eliminación del curso...');
    
    const usuarioActual = getUsuario();
    if (!esCreador || !usuarioActual) {
      console.log('Usuario no autorizado para eliminar el curso');
      setToastMsg('Solo el creador del curso puede eliminarlo');
      setMostrarToast(true);
      return;
    }
    
    console.log('Mostrando alerta de confirmación');
    setShowDeleteAlert(true);
  };

  const eliminarCurso = async () => {
    console.log('Iniciando eliminación del curso...');
    setShowDeleteAlert(false);
    
    try {
      console.log(`Enviando solicitud DELETE a ${API_URL}/cursos/${id}`);
      const response = await fetch(`${API_URL}/cursos/${id}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${token}` }
      });

      const result = await response.json();
      console.log('Respuesta del servidor:', result);

      if (result.success) {
        console.log(`Eliminando materiales locales para curso ${id}`);
        localStorage.removeItem(`${LOCAL_STORAGE_KEY}${id}`);
        
        console.log('Marcando curso como eliminado');
        setIsDeleted(true);
        
        console.log('Curso eliminado exitosamente');
        setToastMsg('Curso eliminado correctamente');
        
        console.log('Redirigiendo a /cursos');
        history.push('/cursos');
      } else {
        console.log('Error en la respuesta del servidor:', result.error);
        throw new Error(result.error || 'Error al eliminar curso');
      }
    } catch (err) {
      console.error('Error en eliminarCurso:', err);
      setToastMsg(err instanceof Error ? err.message : 'Error de conexión al eliminar curso');
    } finally {
      setMostrarToast(true);
    }
  };

  // Visualización
  const visualizarMaterial = (material: MaterialLocal) => {
    console.log('Visualizando material:', material.nombre);
    setMaterialAVisualizar(material);
    setMostrarVisor(true);
  };

  const getFileIcon = (tipo: TipoArchivo) => {
    console.log(`Obteniendo icono para tipo de archivo: ${tipo}`);
    const iconProps = { size: "large" };
    switch(tipo) {
      case 'imagen': return <IonIcon icon={document} {...iconProps} color="primary" />;
      case 'pdf': return <IonIcon icon={document} {...iconProps} color="danger" />;
      case 'documento': return <IonIcon icon={document} {...iconProps} color="secondary" />;
      case 'presentacion': return <IonIcon icon={document} {...iconProps} color="tertiary" />;
      default: return <IonIcon icon={document} {...iconProps} />;
    }
  };

  // Renderizado condicional
  if (isDeleted) {
    console.log('Curso eliminado, no renderizando componente');
    return null;
  }

  if (loading) {
    console.log('Mostrando estado de carga');
    return (
      <IonPage>
        <IonContent className="ion-padding">
          <IonLoading isOpen={true} message="Cargando curso..." />
        </IonContent>
      </IonPage>
    );
  }

  if (!curso) {
    console.log('Curso no encontrado, mostrando mensaje');
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

  console.log('Renderizando vista del curso:', {
    id: curso.id,
    nombre: curso.nombre,
    id_usuario: curso.id_usuario
  });

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
                console.log('Error al cargar imagen de portada, usando imagen por defecto');
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
            </IonItemDivider>

            {materiales.length > 0 ? (
              <IonList>
                {materiales.map((material, index) => (
                  <IonItem key={`${material.nombre}-${index}`}>
                    <IonThumbnail slot="start">
                      {getFileIcon(material.tipo)}
                    </IonThumbnail>
                    <IonLabel>
                      <div style={{ cursor: 'pointer' }} onClick={() => visualizarMaterial(material)}>
                        {limpiarNombreArchivo(material.nombre)}
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
                        console.log('Archivos seleccionados:', e.target.files);
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
                        
                        console.log('Archivos válidos seleccionados:', archivosValidos);
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
                    onClick={() => {
                      console.log('Clic en botón de seleccionar materiales');
                      fileInputRef.current?.click();
                    }}
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
                          onClick={() => {
                            console.log('Clic en editar curso');
                            history.push(`/editar-curso/${curso.id}`);
                          }}
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
              onClick={() => {
                console.log('Clic en botón de volver');
                history.goBack();
              }}
              style={{ marginTop: '2rem' }}
            >
              <IonIcon slot="start" icon={arrowBack} />
              Volver a los cursos
            </IonButton>
          </IonCardContent>
        </IonCard>

        {/* Modal para visualizar materiales */}
        <IonModal isOpen={mostrarVisor} onDidDismiss={() => {
          console.log('Cerrando visor de materiales');
          setMostrarVisor(false);
        }}>
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
                {materialAVisualizar.tipo === 'pdf' && (
                  <embed 
                    src={materialAVisualizar.contenido} 
                    type="application/pdf" 
                    width="100%" 
                    height="100%"
                  />
                )}
                {materialAVisualizar.tipo === 'imagen' && (
                  <img 
                    src={materialAVisualizar.contenido} 
                    alt={materialAVisualizar.nombre}
                    style={{ maxWidth: '100%', maxHeight: '100%', display: 'block', margin: '0 auto' }}
                  />
                )}
                {(materialAVisualizar.tipo === 'documento' || materialAVisualizar.tipo === 'presentacion') && (
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

        {/* Componentes de UI */}
        <IonLoading isOpen={subiendo} message="Subiendo materiales..." />
        <IonToast
          isOpen={mostrarToast}
          onDidDismiss={() => {
            console.log('Toast cerrado');
            setMostrarToast(false);
          }}
          message={toastMsg}
          duration={3000}
          color={toastMsg.includes('Error') ? 'danger' : 'success'}
        />
        <IonAlert
          isOpen={showDeleteAlert}
          onDidDismiss={() => {
            console.log('Alerta de eliminación cerrada');
            setShowDeleteAlert(false);
          }}
          header={'Confirmar eliminación'}
          message={'¿Estás seguro de que quieres eliminar este curso? Esta acción no se puede deshacer.'}
          buttons={[
            {
              text: 'Cancelar',
              role: 'cancel',
              cssClass: 'secondary',
              handler: () => {
                console.log('Eliminación cancelada por el usuario');
              }
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