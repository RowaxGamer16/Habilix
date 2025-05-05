import React, { useEffect, useState, useRef, useCallback } from 'react';
import {
  IonPage,
  IonHeader,
  IonToolbar,
  IonTitle,
  IonContent,
  IonButton,
  IonIcon,
  IonItem,
  IonLabel,
  IonInput,
  IonTextarea,
  IonSelect,
  IonSelectOption,
  IonLoading,
  IonToast,
  IonAlert,
} from '@ionic/react';
import { arrowBack, save } from 'ionicons/icons';
import { useParams, useHistory } from 'react-router-dom';

const API_URL = 'http://localhost:5000/api';

// Tipos para la API
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
};

interface Curso {
  id: number;
  nombre: string;
  descripcion: string;
  portada: string;
  categoria: string;
  precio: number;
  entrega: string;
  horario: string;
  profesor: string;
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

const EditarCurso: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const history = useHistory();
  const [curso, setCurso] = useState<Curso | null>(null);
  const [formData, setFormData] = useState({
    nombre: '',
    descripcion: '',
    categoria: '',
    precio: 0,
    entrega: 'Virtual',
    horario: 'Flexible',
    profesor: '',
  });
  const [selectedImage, setSelectedImage] = useState<File | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [toastMsg, setToastMsg] = useState('');
  const [mostrarToast, setMostrarToast] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [esCreador, setEsCreador] = useState(false);
  const [usuario, setUsuario] = useState<Usuario | null>(null);
  const [authChecked, setAuthChecked] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Función para obtener usuario desde la API
  const fetchUserData = useCallback(async (): Promise<Usuario | null> => {
    const token = localStorage.getItem('token');
    console.log('Token obtenido del localStorage:', token ? 'Presente' : 'Ausente');
    
    if (!token) {
      console.warn('No hay token - Redirigiendo a login');
      setError('No hay sesión activa');
      history.push('/login');
      return null;
    }

    try {
      console.log('Realizando petición a /api/usuario');
      const response = await fetch(`${API_URL}/usuario`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });

      console.log('Respuesta recibida, status:', response.status);
      if (!response.ok) {
        const errorData: ApiError = await response.json();
        console.error('Error en la respuesta:', errorData);
        throw new Error(errorData.error || 'Error al obtener datos del usuario');
      }

      const data: ApiResponse = await response.json();
      console.log('Datos de usuario recibidos:', data);
      
      if (!data.usuario || typeof data.usuario.NOMBRE_USUARIO !== 'string') {
        console.error('Estructura de datos incorrecta:', data);
        throw new Error('Estructura de datos del usuario incorrecta');
      }

      const usuarioData = {
        ID: data.usuario.ID,
        NOMBRE_USUARIO: data.usuario.NOMBRE_USUARIO,
        EMAIL: data.usuario.EMAIL,
        ROLE: data.usuario.ROLE,
        TELEFONO: data.usuario.TELEFONO,
        FECHA_CREACION: data.usuario.FECHA_CREACION
      };

      console.log('Usuario configurado:', usuarioData);
      return usuarioData;
    } catch (err) {
      console.error('Error en fetchUserData:', err);
      localStorage.removeItem('token');
      history.push('/login');
      return null;
    }
  }, [history]);

  // Cargar usuario y curso al iniciar
  useEffect(() => {
    const loadUserAndCourse = async () => {
      const usuarioActual = await fetchUserData();
      setUsuario(usuarioActual);
      setAuthChecked(true);

      if (!usuarioActual) return;

      try {
        // Cargar datos del curso
        const response = await fetch(`${API_URL}/cursos/${id}`, {
          headers: { 
            'Authorization': `Bearer ${localStorage.getItem('token')}` 
          }
        });
        
        if (!response.ok) {
          if (response.status === 404) {
            setError('Curso no encontrado');
          } else {
            throw new Error(`Error ${response.status}: ${response.statusText}`);
          }
          return;
        }

        const data = await response.json();
        
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
        
        // Usar los valores reales del curso desde la API
        setFormData({
          nombre: data.nombre,
          descripcion: data.descripcion,
          categoria: data.categoria,
          precio: data.precio,
          entrega: data.entrega || 'Virtual',
          horario: data.horario || 'Flexible',
          profesor: data.profesor,
        });

        // Verificar si el usuario es el creador
        const esCreadorVerificado = Number(usuarioActual.ID) === Number(data.id_usuario);
        setEsCreador(esCreadorVerificado);
        if (!esCreadorVerificado) {
          setError('No tienes permiso para editar este curso');
        }
      } catch (err) {
        console.error('Error al cargar el curso:', err);
        setError('Error al cargar el curso');
      } finally {
        setLoading(false);
      }
    };

    loadUserAndCourse();
  }, [id, fetchUserData]);

  // Manejar cambios en los campos del formulario
  const handleInputChange = (field: keyof typeof formData, value: string | number) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  // Manejar cambio de imagen
  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setSelectedImage(file);
    }
  };

  // Guardar cambios
  const guardarCambios = async () => {
    if (!esCreador || !usuario) {
      setError('No tienes permiso para editar este curso');
      return;
    }

    if (!formData.nombre || !formData.descripcion || !formData.profesor) {
      setError('Nombre, descripción y profesor son campos requeridos');
      return;
    }

    setSaving(true);
    try {
      const formDataToSend = new FormData();
      formDataToSend.append('nombre', formData.nombre);
      formDataToSend.append('descripcion', formData.descripcion);
      formDataToSend.append('categoria', formData.categoria);
      formDataToSend.append('precio', String(formData.precio));
      formDataToSend.append('entrega', formData.entrega);
      formDataToSend.append('horario', formData.horario);
      formDataToSend.append('profesor', formData.profesor);
      if (selectedImage) {
        formDataToSend.append('portada', selectedImage);
      }

      const response = await fetch(`${API_URL}/cursos/${id}`, {
        method: 'PUT',
        headers: {
          Authorization: `Bearer ${localStorage.getItem('token')}`,
        },
        body: formDataToSend,
      });

      const result = await response.json();

      if (result.success) {
        setToastMsg('Curso actualizado correctamente');
        setMostrarToast(true);
        history.push(`/curso/${id}`);
      } else {
        throw new Error(result.error || 'Error al actualizar el curso');
      }
    } catch (err) {
      console.error('Error al guardar cambios:', err);
      setError('Error al guardar los cambios');
    } finally {
      setSaving(false);
    }
  };

  if (!authChecked || loading) {
    return (
      <IonPage>
        <IonContent className="ion-padding">
          <IonLoading isOpen={true} message="Cargando..." />
        </IonContent>
      </IonPage>
    );
  }

  if (!curso || !esCreador) {
    return (
      <IonPage>
        <IonHeader>
          <IonToolbar>
            <IonTitle>Error</IonTitle>
          </IonToolbar>
        </IonHeader>
        <IonContent className="ion-padding">
          <p>{error || 'No tienes permiso para editar este curso o el curso no existe.'}</p>
          <IonButton expand="block" onClick={() => history.push('/cursos')}>
            <IonIcon slot="start" icon={arrowBack} />
            Volver a Cursos
          </IonButton>
        </IonContent>
      </IonPage>
    );
  }

  return (
    <IonPage>
      <IonHeader>
        <IonToolbar>
          <IonTitle>Editar Curso</IonTitle>
        </IonToolbar>
      </IonHeader>
      <IonContent className="ion-padding">
        <IonItem>
          <IonLabel position="floating">Nombre del curso</IonLabel>
          <IonInput
            value={formData.nombre}
            onIonChange={(e) => handleInputChange('nombre', e.detail.value || '')}
          />
        </IonItem>

        <IonItem>
          <IonLabel position="floating">Descripción</IonLabel>
          <IonTextarea
            value={formData.descripcion}
            onIonChange={(e) => handleInputChange('descripcion', e.detail.value || '')}
            rows={4}
          />
        </IonItem>

        <IonItem>
          <IonLabel position="floating">Profesor</IonLabel>
          <IonInput
            value={formData.profesor}
            onIonChange={(e) => handleInputChange('profesor', e.detail.value || '')}
          />
        </IonItem>

        <IonItem>
          <IonLabel position="floating">Categoría</IonLabel>
          <IonInput
            value={formData.categoria}
            onIonChange={(e) => handleInputChange('categoria', e.detail.value || '')}
          />
        </IonItem>

        <IonItem>
          <IonLabel position="floating">Precio</IonLabel>
          <IonInput
            type="number"
            value={formData.precio}
            onIonChange={(e) => handleInputChange('precio', Number(e.detail.value) || 0)}
          />
        </IonItem>

        <IonItem>
          <IonLabel>Método de entrega</IonLabel>
          <IonSelect
            value={formData.entrega}
            onIonChange={(e) => handleInputChange('entrega', e.detail.value)}
          >
            <IonSelectOption value="Virtual">Virtual</IonSelectOption>
            <IonSelectOption value="Presencial">Presencial</IonSelectOption>
            <IonSelectOption value="Híbrido">Híbrido</IonSelectOption>
          </IonSelect>
        </IonItem>

        <IonItem>
          <IonLabel>Horario</IonLabel>
          <IonSelect
            value={formData.horario}
            onIonChange={(e) => handleInputChange('horario', e.detail.value)}
          >
            <IonSelectOption value="Flexible">Flexible</IonSelectOption>
            <IonSelectOption value="Fijo">Fijo</IonSelectOption>
            <IonSelectOption value="Fines de semana">Fines de semana</IonSelectOption>
          </IonSelect>
        </IonItem>

        <IonItem>
          <IonLabel>Imagen del curso</IonLabel>
          <input
            type="file"
            accept="image/*"
            onChange={handleImageChange}
            style={{ display: 'none' }}
            id="uploadFile"
            ref={fileInputRef}
          />
          <IonButton
            expand="block"
            onClick={() => fileInputRef.current?.click()}
            color="primary"
          >
            Seleccionar Imagen
          </IonButton>
          {selectedImage && <p>{selectedImage.name}</p>}
          {curso.portada && !selectedImage && (
            <img
              src={`${API_URL}${curso.portada.startsWith('/') ? '' : '/'}${curso.portada}`}
              alt="Portada actual"
              style={{ maxWidth: '100%', maxHeight: '150px', marginTop: '10px' }}
              onError={(e) => {
                (e.target as HTMLImageElement).src = '/assets/default-course.png';
              }}
            />
          )}
        </IonItem>

        <IonButton
          expand="block"
          color="success"
          onClick={guardarCambios}
          disabled={saving}
          style={{ marginTop: '1rem' }}
        >
          <IonIcon slot="start" icon={save} />
          Guardar Cambios
        </IonButton>

        <IonButton
          expand="block"
          color="medium"
          onClick={() => history.push(`/curso/${id}`)}
          style={{ marginTop: '1rem' }}
        >
          <IonIcon slot="start" icon={arrowBack} />
          Cancelar
        </IonButton>

        <IonLoading isOpen={saving} message="Guardando cambios..." />
        <IonToast
          isOpen={mostrarToast}
          onDidDismiss={() => setMostrarToast(false)}
          message={toastMsg}
          duration={3000}
          color={toastMsg.includes('Error') ? 'danger' : 'success'}
        />
        <IonAlert
          isOpen={!!error}
          onDidDismiss={() => setError(null)}
          header="Error"
          message={error || ''}
          buttons={['OK']}
        />
      </IonContent>
    </IonPage>
  );
};

export default EditarCurso;